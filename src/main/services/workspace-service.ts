import {
    addProjectToWorkspace,
    addServiceToWorkspace,
    newWorkspace as engineNewWorkspace,
    removeProjectFromWorkspace,
    removeServiceFromWorkspace,
    saveCustomWorkspaceComposeFile,
    updateProjectToWorkspace,
    updateServiceToWorkspace
} from '@igrp/igrp-studio-workspace-engine'
import type {
    ProjectWorkspace,
    ServiceWorkspace,
    WorkspaceService
} from '@igrp/igrp-studio-workspace-engine/dist/interfaces/types'
import { app } from 'electron'
import fs from 'fs'
import { mkdir, readFile, writeFile } from 'fs/promises'
import net from 'net'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { EngineFactory } from '../engines/EngineFactory'
import { dockerService } from './docker-service'
import type {
    FrameworkType,
    HandlerResponse,
    IWorkspace,
    OptionalStacksStatus,
    ProjectData,
    WorkspaceBootstrapOptions,
    WorkspaceBootstrapResult
} from '../types'

const WORKSPACE_FILE = path.join(app.getPath('userData'), 'igrpstudio.workspaces.json')
const BACKUP_DIR = path.join(app.getPath('userData'), 'backups')
const DEFAULT_DEMO_WORKSPACE_DIRS = ['demoworkspace', 'demoworkspace-main']
const DEFAULT_MAIN_COMPOSE = 'igrp-compose.yaml'
const DEFAULT_NGINX_CONF = 'nginx.conf'
const DEFAULT_MONITORING_COMPOSE = path.join('monitoring', 'igrp-monitoring-compose.yaml')
const DEFAULT_PROCESS_COMPOSE = path.join('process', 'igrp-process-compose.yaml')
const DEFAULT_MONITORING_SOURCE_COMPOSE = path.join(
    DEFAULT_DEMO_WORKSPACE_DIRS[0],
    'monitoring',
    'igrp-monitoring-compose.yaml'
)
const DEFAULT_PROCESS_SOURCE_COMPOSE = path.join(
    DEFAULT_DEMO_WORKSPACE_DIRS[0],
    'process',
    'igrp-process-compose.yaml'
)

export class WorkspaceRepository {
    private readonly defaultNginxHostPort = 2575

    private normalizeNginxServicePortMapping(composeContent: string): string {
        const lines = composeContent.split('\n')
        let inNginxService = false
        let inPortsBlock = false
        let portLineReplaced = false

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]

            if (/^\s{2}[a-zA-Z0-9_-]+:\s*$/.test(line)) {
                inNginxService = line.toLowerCase().includes('nginx:')
                inPortsBlock = false
            }

            if (!inNginxService) continue

            if (/^\s{4}ports:\s*$/.test(line)) {
                inPortsBlock = true
                portLineReplaced = false
                continue
            }

            if (inPortsBlock && !portLineReplaced && /^\s*-\s*['"]?[^'"]+['"]?\s*$/.test(line)) {
                const indent = line.match(/^(\s*)/)?.[1] ?? '      '
                lines[i] =
                    `${indent}- "${'${HOST_NGINX_HTTP_PORT:-2575}:${NGINX_HTTP_PORT:-2575}'}"`
                portLineReplaced = true
                continue
            }

            if (inPortsBlock && /^\s{4}[a-zA-Z0-9_-]+:\s*$/.test(line)) {
                inPortsBlock = false
            }
        }

        return lines.join('\n')
    }

    private async alignMainNginxPortArtifacts(
        workspacePath: string,
        nginxPort: number
    ): Promise<void> {
        const composePath = path.join(workspacePath, DEFAULT_MAIN_COMPOSE)
        if (fs.existsSync(composePath)) {
            let composeRaw = await readFile(composePath, 'utf8')
            let composeNext = composeRaw

            // Keep host and container nginx ports aligned through env variables.
            composeNext = composeNext.replace(
                /"\$\{HOST_NGINX_HTTP_PORT:-\d+\}:\d+"/g,
                '"${HOST_NGINX_HTTP_PORT:-2575}:${NGINX_HTTP_PORT:-2575}"'
            )
            composeNext = this.normalizeNginxServicePortMapping(composeNext)

            // Keep nginx healthcheck aligned with the container listen port.
            composeNext = composeNext.replace(
                /http:\/\/127\.0\.0\.1:\d+\/health/g,
                'http://127.0.0.1:${NGINX_HTTP_PORT:-2575}/health'
            )

            if (composeNext !== composeRaw) {
                await writeFile(composePath, composeNext, 'utf8')
            }
        }

        const nginxConfPath = path.join(workspacePath, DEFAULT_NGINX_CONF)
        if (fs.existsSync(nginxConfPath)) {
            const confRaw = await readFile(nginxConfPath, 'utf8')
            const confNext = confRaw.replace(
                /listen\s+\d+\s+default_server;/,
                `listen   ${nginxPort} default_server;`
            )
            if (confNext !== confRaw) {
                await writeFile(nginxConfPath, confNext, 'utf8')
            }
        }
    }

    private async wait(ms: number): Promise<void> {
        await new Promise((resolve) => setTimeout(resolve, ms))
    }

    private async waitForMainStackReadiness(
        workspacePath: string,
        timeoutMs = 180000
    ): Promise<void> {
        const start = Date.now()
        const required = ['keycloak', 'access-management', 'gateway', 'eureka', 'database-postgres']

        while (Date.now() - start < timeoutMs) {
            const services = await dockerService.status(workspacePath)
            const mainServices = services.filter((service) => service.stack === 'main')

            const allReady = required.every((needle) =>
                mainServices.some((service) => {
                    const name = (service.name || '').toLowerCase()
                    const status = (service.status || '').toLowerCase()
                    const msg = (service.statusMessage || '').toLowerCase()
                    return (
                        name.includes(needle) &&
                        (status === 'running' || status === 'healthy') &&
                        !msg.includes('unhealthy')
                    )
                })
            )

            if (allReady) return
            await this.wait(5000)
        }

        throw new Error(
            'Main stack is not healthy yet (keycloak/access-management/gateway/eureka/database).'
        )
    }

    private async isMainStackReady(workspacePath: string): Promise<boolean> {
        const required = ['keycloak', 'access-management', 'gateway', 'eureka', 'database-postgres']
        const services = await dockerService.status(workspacePath)
        const mainServices = services.filter((service) => service.stack === 'main')

        return required.every((needle) =>
            mainServices.some((service) => {
                const name = (service.name || '').toLowerCase()
                const status = (service.status || '').toLowerCase()
                const msg = (service.statusMessage || '').toLowerCase()
                return (
                    name.includes(needle) &&
                    (status === 'running' || status === 'healthy') &&
                    !msg.includes('unhealthy')
                )
            })
        )
    }

    private async isPortAvailable(port: number): Promise<boolean> {
        return await new Promise((resolve) => {
            const server = net.createServer()
            server.once('error', () => resolve(false))
            server.once('listening', () => {
                server.close(() => resolve(true))
            })
            server.listen(port, '0.0.0.0')
        })
    }

    private async findNextAvailableNginxHostPort(
        startPort = this.defaultNginxHostPort
    ): Promise<number> {
        let candidate = startPort
        for (let i = 0; i < 300; i++) {
            // eslint-disable-next-line no-await-in-loop
            const free = await this.isPortAvailable(candidate)
            if (free) return candidate
            candidate += 1
        }
        return startPort
    }

    private async findNextIncrementalNginxHostPort(): Promise<number> {
        const data = await this.loadData()
        const usedPorts = new Set<number>()

        for (const ws of data.workspaces || []) {
            const envPath = path.join(ws.path, '.env')
            if (!fs.existsSync(envPath)) continue
            const raw = await readFile(envPath, 'utf8')
            const line = raw
                .split('\n')
                .find(
                    (l) => l.startsWith('HOST_NGINX_HTTP_PORT=') || l.startsWith('NGINX_HTTP_PORT=')
                )
            if (!line) continue
            const parsed = Number.parseInt(line.split('=')[1]?.trim() || '', 10)
            if (!Number.isNaN(parsed) && parsed > 0 && parsed <= 65535) {
                usedPorts.add(parsed)
            }
        }

        // Always pick the smallest available port starting from 2575:
        // 1st workspace -> 2575
        // 2nd workspace -> 2576
        // 3rd workspace -> 2577
        // ...
        let candidate = this.defaultNginxHostPort
        for (let i = 0; i < 300; i++) {
            if (usedPorts.has(candidate)) {
                candidate += 1
                continue
            }
            // eslint-disable-next-line no-await-in-loop
            const free = await this.isPortAvailable(candidate)
            if (free) return candidate
            candidate += 1
        }

        return this.findNextAvailableNginxHostPort(this.defaultNginxHostPort)
    }

    private getDefaultBootstrapOptions(
        options?: WorkspaceBootstrapOptions
    ): Required<WorkspaceBootstrapOptions> {
        return {
            autoStartStack: options?.autoStartStack ?? true,
            installMonitoringStack: options?.installMonitoringStack ?? false,
            installProcessStack: options?.installProcessStack ?? false
        }
    }

    private resolveDemoWorkspacePath(): string | null {
        for (const demoDir of DEFAULT_DEMO_WORKSPACE_DIRS) {
            const candidates = [
                path.join(app.getAppPath(), demoDir),
                path.join(process.cwd(), demoDir),
                path.join(process.cwd(), 'studio', 'igrp-studio-ide', demoDir)
            ]

            for (const candidate of candidates) {
                if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
                    return candidate
                }
            }
        }

        return null
    }

    private async replaceTokenInTextFile(
        filePath: string,
        replacements: Array<{ from: string; to: string }>
    ): Promise<void> {
        const allowedTextExtensions = new Set([
            '.yaml',
            '.yml',
            '.env',
            '.json',
            '.conf',
            '.sh',
            '.md',
            '.txt'
        ])
        const ext = path.extname(filePath).toLowerCase()
        if (!allowedTextExtensions.has(ext) && path.basename(filePath).toLowerCase() !== '.env') {
            return
        }

        const raw = await readFile(filePath, 'utf8')
        let next = raw
        for (const { from, to } of replacements) {
            next = next.split(from).join(to)
        }

        if (next !== raw) {
            await writeFile(filePath, next, 'utf8')
        }
    }

    private async walkAndReplaceTokens(
        targetDir: string,
        replacements: Array<{ from: string; to: string }>
    ): Promise<void> {
        const entries = await fs.promises.readdir(targetDir, { withFileTypes: true })
        for (const entry of entries) {
            const fullPath = path.join(targetDir, entry.name)
            if (entry.isDirectory()) {
                await this.walkAndReplaceTokens(fullPath, replacements)
                continue
            }
            if (entry.isFile()) {
                await this.replaceTokenInTextFile(fullPath, replacements)
            }
        }
    }

    private async ensureHostGatewayAliasesForSlug(filePath: string, slug: string): Promise<void> {
        if (!fs.existsSync(filePath)) return
        const raw = await readFile(filePath, 'utf8')
        const normalized = raw.replace(/\r\n/g, '\n')
        const lines = normalized.split('\n')
        const next: string[] = []
        const longAlias = `${slug}-igrp:host-gateway`
        const shortAlias = `${slug}:host-gateway`

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            next.push(line)
            if (!line.includes(longAlias)) continue

            const nextLine = lines[i + 1] || ''
            if (nextLine.includes(shortAlias)) continue

            const indentMatch = line.match(/^(\s*)-/)
            const indent = indentMatch ? indentMatch[1] : '      '
            next.push(`${indent}- "${shortAlias}"`)
        }

        const updated = next.join('\n')
        if (updated !== normalized) {
            await writeFile(filePath, updated, 'utf8')
        }
    }

    private async ensureEnvVariable(
        envPath: string,
        variableName: string,
        value: string
    ): Promise<void> {
        if (!fs.existsSync(envPath)) return
        const raw = await readFile(envPath, 'utf8')
        const lines = raw.split('\n')
        let found = false
        const updated = lines.map((line) => {
            if (line.startsWith(`${variableName}=`)) {
                found = true
                return `${variableName}=${value}`
            }
            return line
        })
        if (!found) {
            updated.push(`${variableName}=${value}`)
        }
        await writeFile(envPath, updated.join('\n'), 'utf8')
    }

    private async normalizeOptionalStackEnvFiles(workspace: IWorkspace): Promise<void> {
        const mainEnv = path.join(workspace.path, '.env')
        let mainNginxPort: string | undefined
        if (fs.existsSync(mainEnv)) {
            const rawMain = await readFile(mainEnv, 'utf8')
            mainNginxPort = rawMain
                .split('\n')
                .find((line) => line.startsWith('NGINX_HTTP_PORT='))
                ?.split('=')[1]
                ?.trim()
        }

        const monitoringEnv = path.join(workspace.path, 'monitoring', '.env_monitoring')
        if (fs.existsSync(monitoringEnv)) {
            await this.ensureEnvVariable(monitoringEnv, 'DOCKER_IP', workspace.slug)
            await this.ensureEnvVariable(monitoringEnv, 'WORKSPACE_SLUG', workspace.slug)
            if (mainNginxPort) {
                await this.ensureEnvVariable(monitoringEnv, 'NGINX_HTTP_PORT', mainNginxPort)
            }
        }

        const processEnv = path.join(workspace.path, 'process', '.env_process')
        if (fs.existsSync(processEnv)) {
            await this.replaceTokenInTextFile(processEnv, [
                { from: 'demoteste', to: workspace.slug }
            ])
            await this.ensureEnvVariable(processEnv, 'DOCKER_IP', workspace.slug)
            await this.ensureEnvVariable(processEnv, 'WORKSPACE_SLUG', workspace.slug)
            await this.ensureEnvVariable(
                processEnv,
                'IGRP_LOCAL_DATABASE_HOSTNAME',
                `${workspace.slug}-database-postgres`
            )
            await this.ensureEnvVariable(
                processEnv,
                'EUREKA_SERVICE_URL',
                `http://${workspace.slug}-eureka:8761/eureka/`
            )
            if (mainNginxPort) {
                await this.ensureEnvVariable(processEnv, 'NGINX_HTTP_PORT', mainNginxPort)
            }
        }
    }

    private async copyOptionalStacksFromDemoWorkspace(
        workspace: IWorkspace,
        options: Required<WorkspaceBootstrapOptions>,
        bootstrapResult: WorkspaceBootstrapResult
    ): Promise<void> {
        const demoWorkspacePath = this.resolveDemoWorkspacePath()
        if (!demoWorkspacePath) {
            if (options.installMonitoringStack || options.installProcessStack) {
                bootstrapResult.errors.push(
                    'Could not find local demoworkspace template (demoworkspace or demoworkspace-main).'
                )
            }
            return
        }

        const replacements = [{ from: 'demoteste', to: workspace.slug }]

        if (options.installMonitoringStack) {
            const sourceDir = path.join(demoWorkspacePath, 'monitoring')
            const targetDir = path.join(workspace.path, 'monitoring')
            if (fs.existsSync(sourceDir)) {
                await fs.promises.cp(sourceDir, targetDir, { recursive: true, force: true })
                await this.walkAndReplaceTokens(targetDir, replacements)
                await this.ensureHostGatewayAliasesForSlug(
                    path.join(targetDir, 'igrp-monitoring-compose.yaml'),
                    workspace.slug
                )
                await this.normalizeOptionalStackEnvFiles(workspace)

                bootstrapResult.optionalStacksInstalled.monitoring = true
            } else {
                bootstrapResult.errors.push(
                    `Monitoring template not found: ${DEFAULT_MONITORING_SOURCE_COMPOSE}`
                )
            }
        }

        if (options.installProcessStack) {
            const sourceDir = path.join(demoWorkspacePath, 'process')
            const targetDir = path.join(workspace.path, 'process')
            if (fs.existsSync(sourceDir)) {
                await fs.promises.cp(sourceDir, targetDir, { recursive: true, force: true })
                await this.walkAndReplaceTokens(targetDir, replacements)
                await this.ensureHostGatewayAliasesForSlug(
                    path.join(targetDir, 'igrp-process-compose.yaml'),
                    workspace.slug
                )
                await this.ensureHostGatewayAliasesForSlug(
                    path.join(targetDir, 'igrp-process-autentika-compose.yaml'),
                    workspace.slug
                )
                await this.normalizeOptionalStackEnvFiles(workspace)

                bootstrapResult.optionalStacksInstalled.process = true
            } else {
                bootstrapResult.errors.push(
                    `Process template not found: ${DEFAULT_PROCESS_SOURCE_COMPOSE}`
                )
            }
        }
    }

    private async ensureMainStackFromDemoWorkspace(
        workspace: IWorkspace,
        bootstrapResult: WorkspaceBootstrapResult
    ): Promise<void> {
        const targetCompose = path.join(workspace.path, DEFAULT_MAIN_COMPOSE)

        const demoWorkspacePath = this.resolveDemoWorkspacePath()
        if (!demoWorkspacePath) {
            bootstrapResult.errors.push(
                'Could not find local demoworkspace template (demoworkspace or demoworkspace-main) to copy igrp-compose.yaml.'
            )
            return
        }

        const sourceCompose = path.join(demoWorkspacePath, DEFAULT_MAIN_COMPOSE)
        if (!fs.existsSync(sourceCompose)) {
            bootstrapResult.errors.push(
                'Main compose template not found: demoworkspace/igrp-compose.yaml (or fallback demoworkspace-main/igrp-compose.yaml)'
            )
            return
        }

        if (!fs.existsSync(targetCompose)) {
            await fs.promises.copyFile(sourceCompose, targetCompose)
            await this.replaceTokenInTextFile(targetCompose, [
                { from: 'demoteste', to: workspace.slug }
            ])
        }
        await this.ensureHostGatewayAliasesForSlug(targetCompose, workspace.slug)

        const sourceEnv = path.join(demoWorkspacePath, '.env')
        const targetEnv = path.join(workspace.path, '.env')
        if (!fs.existsSync(targetEnv) && fs.existsSync(sourceEnv)) {
            await fs.promises.copyFile(sourceEnv, targetEnv)
            await this.replaceTokenInTextFile(targetEnv, [
                { from: 'demoteste', to: workspace.slug }
            ])
        }
        await this.ensureEnvVariable(targetEnv, 'WORKSPACE_SLUG', workspace.slug)
        await this.ensureEnvVariable(targetEnv, 'DOCKER_IP', workspace.slug)
        const nginxPort = await this.findNextIncrementalNginxHostPort()
        await this.ensureEnvVariable(targetEnv, 'HOST_NGINX_HTTP_PORT', String(nginxPort))
        await this.ensureEnvVariable(targetEnv, 'NGINX_HTTP_PORT', String(nginxPort))

        const sourceNginxConf = path.join(demoWorkspacePath, DEFAULT_NGINX_CONF)
        const targetNginxConf = path.join(workspace.path, DEFAULT_NGINX_CONF)
        if (!fs.existsSync(targetNginxConf) && fs.existsSync(sourceNginxConf)) {
            await fs.promises.copyFile(sourceNginxConf, targetNginxConf)
            await this.replaceTokenInTextFile(targetNginxConf, [
                { from: 'demoteste', to: workspace.slug }
            ])
        }

        await this.alignMainNginxPortArtifacts(workspace.path, nginxPort)

        const sourceIgrpStudioDir = path.join(demoWorkspacePath, '.igrpstudio')
        const targetIgrpStudioDir = path.join(workspace.path, '.igrpstudio')
        if (!fs.existsSync(targetIgrpStudioDir) && fs.existsSync(sourceIgrpStudioDir)) {
            await fs.promises.cp(sourceIgrpStudioDir, targetIgrpStudioDir, {
                recursive: true,
                force: true
            })
            await this.walkAndReplaceTokens(targetIgrpStudioDir, [
                { from: 'demoteste', to: workspace.slug }
            ])
        }
    }

    private async ensureFileExists(filePath: string, defaultContent: string): Promise<void> {
        if (!fs.existsSync(filePath)) {
            await writeFile(filePath, defaultContent)
        }
    }

    private async removeOptionalStackArtifactsIfDisabled(
        workspacePath: string,
        options: Required<WorkspaceBootstrapOptions>
    ): Promise<void> {
        if (!options.installMonitoringStack) {
            await fs.promises.rm(path.join(workspacePath, DEFAULT_MONITORING_COMPOSE), {
                force: true
            })
            await fs.promises.rm(path.join(workspacePath, 'monitoring'), {
                recursive: true,
                force: true
            })
        }

        if (!options.installProcessStack) {
            await fs.promises.rm(path.join(workspacePath, DEFAULT_PROCESS_COMPOSE), {
                force: true
            })
            await fs.promises.rm(path.join(workspacePath, 'process'), {
                recursive: true,
                force: true
            })
        }
    }

    async getOptionalStacksStatus(workspacePath: string): Promise<OptionalStacksStatus> {
        return {
            monitoringInstalled: fs.existsSync(
                path.join(workspacePath, DEFAULT_MONITORING_COMPOSE)
            ),
            processInstalled: fs.existsSync(path.join(workspacePath, DEFAULT_PROCESS_COMPOSE))
        }
    }

    private async loadData(): Promise<{ workspaces: IWorkspace[] }> {
        await this.ensureFileExists(WORKSPACE_FILE, JSON.stringify({ workspaces: [] }, null, 2))
        const raw = await readFile(WORKSPACE_FILE, 'utf-8')
        if (!raw) return { workspaces: [] }
        try {
            return JSON.parse(raw)
        } catch (err) {
            // If JSON is corrupted (e.g., trailing characters), back it up and reset to a safe default
            try {
                if (!fs.existsSync(BACKUP_DIR)) {
                    await mkdir(BACKUP_DIR, { recursive: true })
                }
                const safeTime = new Date().toISOString().replace(/:/g, '-')
                const backupPath = path.join(BACKUP_DIR, `corrupt-workspaces-${safeTime}.json`)
                await writeFile(backupPath, raw)
            } catch (backupErr) {
                // ignore backup errors to avoid blocking app startup
            }
            await writeFile(WORKSPACE_FILE, JSON.stringify({ workspaces: [] }, null, 2))
            return { workspaces: [] }
        }
    }

    private async saveData(data: { workspaces: IWorkspace[] }): Promise<void> {
        await writeFile(WORKSPACE_FILE, JSON.stringify(data, null, 2))
    }

    async initialize(): Promise<void> {
        await this.ensureFileExists(WORKSPACE_FILE, JSON.stringify({ workspaces: [] }, null, 2))
        if (!fs.existsSync(BACKUP_DIR)) {
            await mkdir(BACKUP_DIR, { recursive: true })
        }
    }

    // Workspace CRUD Operations
    async createWorkspace(
        workspace: Omit<IWorkspace, 'id' | 'createdAt' | 'projects'>,
        options?: WorkspaceBootstrapOptions
    ): Promise<IWorkspace & { bootstrap?: WorkspaceBootstrapResult }> {
        const normalizedOptions = this.getDefaultBootstrapOptions(options)
        const bootstrapResult: WorkspaceBootstrapResult = {
            stackStarted: false,
            optionalStacksInstalled: {
                monitoring: false,
                process: false
            },
            errors: []
        }

        const data = await this.loadData()
        const newWorkspace: IWorkspace = {
            ...workspace,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            projects: []
        }

        const { path: _workspacePath, createdAt, ...baseConfigWorkspace } = newWorkspace

        data.workspaces.push(newWorkspace)

        try {
            await engineNewWorkspace({ ...baseConfigWorkspace }, workspace.path)
        } catch (error) {
            throw error
        }

        await this.ensureMainStackFromDemoWorkspace(newWorkspace, bootstrapResult)
        await this.removeOptionalStackArtifactsIfDisabled(newWorkspace.path, normalizedOptions)

        try {
            await this.copyOptionalStacksFromDemoWorkspace(
                newWorkspace,
                normalizedOptions,
                bootstrapResult
            )
        } catch (error) {
            bootstrapResult.errors.push(
                error instanceof Error
                    ? error.message
                    : 'Failed to install optional compose stacks in workspace.'
            )
        }

        if (normalizedOptions.autoStartStack) {
            try {
                await dockerService.upMainStack(newWorkspace.path)
                bootstrapResult.stackStarted = true
            } catch (error) {
                bootstrapResult.errors.push(
                    error instanceof Error
                        ? error.message
                        : 'Failed to start igrp stack automatically.'
                )
            }
        }

        await this.saveData(data)

        return {
            ...newWorkspace,
            bootstrap: bootstrapResult
        }
    }

    async installOptionalStacks(
        workspaceId: string,
        options: WorkspaceBootstrapOptions
    ): Promise<WorkspaceBootstrapResult> {
        const normalizedOptions = this.getDefaultBootstrapOptions({
            autoStartStack: false,
            installMonitoringStack: options.installMonitoringStack,
            installProcessStack: options.installProcessStack
        })
        const bootstrapResult: WorkspaceBootstrapResult = {
            stackStarted: false,
            optionalStacksInstalled: {
                monitoring: false,
                process: false
            },
            errors: []
        }

        const data = await this.loadData()
        const workspace = data.workspaces.find((w) => w.id === workspaceId)
        if (!workspace) {
            throw new Error(`Workspace ${workspaceId} not found`)
        }

        await this.copyOptionalStacksFromDemoWorkspace(
            workspace,
            normalizedOptions,
            bootstrapResult
        )

        if (
            normalizedOptions.installMonitoringStack &&
            bootstrapResult.optionalStacksInstalled.monitoring
        ) {
            try {
                await dockerService.upMonitoringStack(workspace.path)
                bootstrapResult.stackStarted = true
            } catch (error) {
                bootstrapResult.errors.push(
                    error instanceof Error
                        ? error.message
                        : 'Failed to start monitoring stack automatically.'
                )
            }
        }

        if (
            normalizedOptions.installProcessStack &&
            bootstrapResult.optionalStacksInstalled.process
        ) {
            // Process services depend on main stack readiness (db/eureka/keycloak/gateway).
            // Bring main stack up only when needed to avoid recreating/rattling an already healthy main stack.
            try {
                const mainReady = await this.isMainStackReady(workspace.path)
                if (!mainReady) {
                    await dockerService.upMainStack(workspace.path)
                }
                await this.waitForMainStackReadiness(workspace.path)
            } catch {
                // Non-blocking: process startup below still attempts to proceed.
            }

            const maxAttempts = 3
            let started = false
            let lastError: unknown
            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                try {
                    if (attempt > 1) {
                        await this.wait(6000)
                    }
                    await dockerService.upProcessStack(workspace.path)
                    bootstrapResult.stackStarted = true
                    started = true
                    break
                } catch (error) {
                    lastError = error
                }
            }

            if (!started) {
                bootstrapResult.errors.push(
                    lastError instanceof Error
                        ? lastError.message
                        : 'Failed to start process stack automatically.'
                )
            }
        }

        workspace.updatedAt = new Date().toISOString()
        await this.saveData(data)

        return bootstrapResult
    }

    async updateWorkspace(id: string, updates: Partial<IWorkspace>): Promise<IWorkspace | null> {
        const data = await this.loadData()
        const workspace = data.workspaces.find((w) => w.id === id)

        if (!workspace) {
            return null
        }

        const updatedWorkspace = {
            ...workspace,
            ...updates,
            updatedAt: new Date().toISOString()
        }

        const index = data.workspaces.indexOf(workspace)
        data.workspaces[index] = updatedWorkspace

        await this.saveData(data)
        return updatedWorkspace
    }

    async deleteWorkspace(id: string): Promise<void> {
        const data = await this.loadData()
        const initialLength = data.workspaces.length
        data.workspaces = data.workspaces.filter((w) => w.id !== id)

        if (data.workspaces.length === initialLength) {
            throw new Error(`Workspace ${id} not found`)
        }

        await this.saveData(data)
    }

    // Método para obter o workspace ativo baseado na data
    async getLastAccessedWorkspace(): Promise<IWorkspace | null> {
        const workspaces = await this.listWorkspaces()
        if (workspaces.length === 0) return null

        // Ordena por: 1. último acesso, 2. data de modificação, 3. data de criação
        return [...workspaces].sort((a, b) => {
            const aLastAccess = new Date(a.updatedAt || a.createdAt)
            const bLastAccess = new Date(b.updatedAt || b.createdAt)
            return bLastAccess.getTime() - aLastAccess.getTime()
        })[0]
    }

    // Project CRUD Operations
    async addProject(
        workspaceId: string,
        project: Omit<ProjectData, 'id' | 'createdAt' | 'workspaceId'>
    ): Promise<ProjectData> {
        const data = await this.loadData()
        const workspace = data.workspaces.find((w) => w.id === workspaceId)

        if (!workspace) {
            throw new Error(`Workspace ${workspaceId} not found`)
        }

        const existingProjects = workspace.projects || []
        const nextProjectName = project?.config?.name?.trim()?.toLowerCase()
        const nextProjectPath = (project.path || '').trim()

        const duplicateByName = existingProjects.find(
            (p) => (p?.config?.name || '').trim().toLowerCase() === nextProjectName
        )
        if (duplicateByName) {
            throw new Error(
                `A project named "${project.config.name}" already exists in this workspace.`
            )
        }

        const duplicateByPath = existingProjects.find(
            (p) => (p.path || '').trim() === nextProjectPath
        )
        if (duplicateByPath) {
            throw new Error(`A project already exists at path: ${nextProjectPath}`)
        }

        if (nextProjectPath && fs.existsSync(nextProjectPath)) {
            const dirEntries = fs.readdirSync(nextProjectPath)
            if (dirEntries.length > 0) {
                throw new Error(
                    `Target directory already exists and is not empty: ${nextProjectPath}. Choose another project name/path.`
                )
            }
        }

        const newProject: ProjectData = {
            ...project,
            id: uuidv4(),
            workspaceId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }

        await this.addProjectToStudioWorkspace(workspace, newProject, false)

        const engine = EngineFactory.getEngine(project.framework)
        await engine.createProject(newProject, project.path)

        workspace.projects = workspace.projects || []
        workspace.projects.push(newProject)
        workspace.updatedAt = new Date().toISOString()

        await this.saveData(data)
        return newProject
    }

    async addProjectToStudioWorkspace(
        workspace: IWorkspace,
        newProject: ProjectData,
        move: boolean
    ): Promise<void> {
        const { config, id: projectId, framework } = newProject

        const { path: workspacePath, id: workspaceId } = workspace

        // Check if project already exists in workspace
        const existingProjects = await this.listProjects(workspaceId)
        const existingProject = existingProjects.find(
            (project) => project.config.name === config.name
        )

        const workspaceConfig: ProjectWorkspace = {
            config: { ...config, id: projectId, type: framework },
            id: workspaceId
        }

        if (!existingProject) {
            // Specification projects manage their own folder structure via
            // SpecificationEngine (docs/, kb/, vectors/, chats/, prototype/).
            // The third-party workspace engine doesn't know the 'specification'
            // type and would crash on a lookup. Skip its registration here —
            // metadata is still persisted via this.saveData below.
            if (framework !== 'specification') {
                //call engine
                await addProjectToWorkspace(workspaceConfig, workspacePath)
            }
        } else {
            console.log(`Project "${config.name}" already exists in workspace. Skipping addition.`)
        }

        if (move) {
            const result = await this.validateAndImportProject(newProject, workspacePath)
            if (result.nameChanged) {
                console.log(
                    `Project name changed from "${result.originalName}" to "${newProject.config.name}" due to existing directory`
                )
            }
        }
    }

    async updateProject(projectId: string, updates: Partial<ProjectData>): Promise<ProjectData> {
        const data = await this.loadData()
        let foundProject: ProjectData | undefined
        const { config: project, workspaceId, framework, path: projectPath, type, icon } = updates

        for (const workspace of data.workspaces) {
            const projectIndex = workspace.projects?.findIndex((p) => p.id === projectId) ?? -1
            if (projectIndex !== -1 && workspace.projects) {
                const oldProject = workspace.projects[projectIndex]

                // Clean up old icon file if icon is being updated
                if (icon && icon !== oldProject.icon && oldProject.icon) {
                    try {
                        if (oldProject.icon.startsWith('icons/')) {
                            // New centralized icons directory
                            const oldIconPath = path.join(workspace.path, oldProject.icon)
                            if (fs.existsSync(oldIconPath)) {
                                fs.unlinkSync(oldIconPath)
                            }
                        } else if (oldProject.icon.startsWith('assets/')) {
                            // Legacy project-specific assets directory
                            const oldIconPath = path.join(oldProject.path || '', oldProject.icon)
                            if (fs.existsSync(oldIconPath)) {
                                fs.unlinkSync(oldIconPath)
                            }
                        }
                    } catch (error) {
                        console.warn('Failed to clean up old project icon file:', error)
                    }
                }

                const updatedProject = {
                    ...oldProject,
                    ...updates,
                    updatedAt: new Date().toISOString()
                }
                workspace.projects[projectIndex] = updatedProject
                workspace.updatedAt = new Date().toISOString()
                foundProject = updatedProject
                break
            }
        }

        if (!foundProject) {
            const workspace = data.workspaces.find((w) => w.id === workspaceId)

            if (!workspace) {
                throw new Error(`Workspace ${workspaceId} not found`)
            }

            if (!framework || !project.name) {
                throw new Error(`Invalid project configuration`)
            }

            const updatedProject: ProjectData = {
                name: project.name || 'Unnamed Project',
                path: projectPath as string,
                type,
                workspaceId: workspaceId as string,
                framework: framework as FrameworkType,
                updatedAt: new Date().toISOString(),
                id: uuidv4(),
                config: project || {}
            }

            workspace.projects?.push(updatedProject as ProjectData)

            workspace.updatedAt = new Date().toISOString()

            const storageMode = updates.storageMode ?? 'managed'
            updatedProject.storageMode = storageMode

            await this.addProjectToStudioWorkspace(
                workspace,
                updatedProject,
                storageMode === 'managed'
            )

            foundProject = updatedProject
        }

        await this.saveData(data)

        return foundProject
    }

    async configureService(config: ProjectWorkspace, basePath: string): Promise<void> {
        const { id: workspaceId, service, config: projectData } = config

        const { config: projectDataConfig, id: projectId, framework } = projectData

        const data = await this.loadData()

        const workspace = data.workspaces.find((w) => w.id === workspaceId)

        if (!workspace) {
            throw new Error(`Workspace ${workspaceId} not found`)
        }

        const projectConfig: ProjectWorkspace = {
            config: { ...projectDataConfig, id: projectId, type: framework },
            service,
            id: workspaceId
        }

        await updateProjectToWorkspace(projectConfig, basePath)

        const projectIndex = workspace.projects?.findIndex((p) => p.id === projectId) ?? -1
        workspace.projects = workspace.projects ?? []
        workspace.projects[projectIndex] = {
            ...workspace.projects[projectIndex],
            id: projectId,
            config: projectDataConfig,
            service,
            updatedAt: new Date().toISOString()
        }

        await this.updateWorkspace(workspaceId, workspace)
    }

    async deleteProject(projectId: string, basePath: string): Promise<void> {
        const data = await this.loadData()
        let deleted = false
        let projectToDelete: ProjectData | undefined

        for (const workspace of data.workspaces) {
            if (workspace.projects) {
                const projectIndex = workspace.projects.findIndex((p) => p.id === projectId)
                if (projectIndex !== -1) {
                    projectToDelete = workspace.projects[projectIndex]
                    workspace.projects.splice(projectIndex, 1)
                    workspace.updatedAt = new Date().toISOString()
                    deleted = true
                    break
                }
            }
        }

        await removeProjectFromWorkspace(projectId, basePath)

        // Clean up project icon files
        if (projectToDelete && projectToDelete.icon) {
            try {
                if (projectToDelete.icon.startsWith('icons/')) {
                    // New centralized icons directory
                    const iconPath = path.join(basePath, projectToDelete.icon)
                    if (fs.existsSync(iconPath)) {
                        fs.unlinkSync(iconPath)
                    }
                } else if (projectToDelete.icon.startsWith('assets/')) {
                    // Legacy project-specific assets directory
                    const iconPath = path.join(basePath, projectToDelete.icon)
                    if (fs.existsSync(iconPath)) {
                        fs.unlinkSync(iconPath)
                    }
                    // Also try to remove the assets directory if it's empty
                    const assetsDir = path.dirname(iconPath)
                    if (fs.existsSync(assetsDir) && fs.readdirSync(assetsDir).length === 0) {
                        fs.rmdirSync(assetsDir)
                    }
                }
            } catch (error) {
                console.warn('Failed to clean up project icon files:', error)
            }
        }

        if (!deleted) {
            throw new Error(`Project ${projectId} not found`)
        }

        await this.saveData(data)
    }

    async saveCustomCompose(yaml: object, basePath: string) {
        await saveCustomWorkspaceComposeFile(yaml, basePath)
    }

    async addService(serviceWorkspace: ServiceWorkspace, basePath: string) {
        const data = await this.loadData()
        const workspace = data.workspaces.find((w) => w.id === serviceWorkspace.id)

        if (!workspace) {
            throw new Error(`Workspace ${serviceWorkspace.id} not found`)
        }

        const serviceId = uuidv4()
        const newService = {
            ...serviceWorkspace.service,
            id: serviceId,
            properties: {
                ...serviceWorkspace.service.properties,
                labels:
                    serviceWorkspace.service.properties?.labels?.map((label) =>
                        label.key === 'uuid' ? { ...label, value: serviceId } : label
                    ) || []
            }
        }
        workspace.services = workspace?.services || []
        workspace.services.push(newService)

        await addServiceToWorkspace({ ...serviceWorkspace, service: newService }, basePath)

        await this.saveData(data)
    }

    async deleteService(serviceId: string, basePath: string) {
        const data = await this.loadData()
        let deleted = false

        for (const workspace of data.workspaces) {
            if (workspace.services) {
                const initialLength = workspace.services.length
                workspace.services = workspace.services.filter((p) => p.id !== serviceId)
                if (workspace.services.length !== initialLength) {
                    workspace.updatedAt = new Date().toISOString()
                    deleted = true
                    break
                }
            }
        }

        await removeServiceFromWorkspace(serviceId, basePath)

        if (!deleted) {
            throw new Error(`Project ${serviceId} not found`)
        }

        await this.saveData(data)
    }

    async updateService(config: ServiceWorkspace, basePath: string) {
        const data = await this.loadData()
        let foundService: WorkspaceService | undefined
        const { service } = config

        for (const workspace of data.workspaces) {
            const serviceIndex = workspace.services?.findIndex((p) => p.id === service.id) ?? -1
            if (serviceIndex !== -1 && workspace.services) {
                const updatedService = {
                    ...workspace.services[serviceIndex],
                    ...service,
                    updatedAt: new Date().toISOString()
                }
                workspace.services[serviceIndex] = updatedService
                workspace.updatedAt = new Date().toISOString()
                foundService = updatedService
                break
            }
        }

        await updateServiceToWorkspace(config, basePath)

        await this.saveData(data)

        return foundService
    }

    async listServices(workspaceId: string): Promise<WorkspaceService[]> {
        const data = await this.loadData()
        const workspace = data.workspaces.find((w) => w.id === workspaceId)
        return workspace?.services || []
    }

    // Query Methods
    async getWorkspace(id: string): Promise<IWorkspace | undefined> {
        const data = await this.loadData()
        return data.workspaces.find((w) => w.id === id)
    }

    async getProject(id: string): Promise<ProjectData | undefined> {
        const data = await this.loadData()
        for (const workspace of data.workspaces) {
            const project = workspace.projects?.find((p) => p.id === id)
            if (project) return project
        }
        return undefined
    }

    async listWorkspaces(): Promise<IWorkspace[]> {
        const { workspaces } = await this.loadData()
        return workspaces
    }

    async listProjects(workspaceId: string): Promise<ProjectData[]> {
        const data = await this.loadData()
        const workspace = data.workspaces.find((w) => w.id === workspaceId)
        const projects = (workspace?.projects || []).map((p) => ({
            ...p,
            storageMode: p.storageMode ?? 'managed'
        }))

        return projects.sort((a, b) => {
            const dateA = new Date(a.updatedAt || a.createdAt || '1970-01-01T00:00:00Z')
            const dateB = new Date(b.updatedAt || b.createdAt || '1970-01-01T00:00:00Z')
            return dateB.getTime() - dateA.getTime()
        })
    }

    async getRecentWorkspaces(limit = 15): Promise<IWorkspace[]> {
        const workspaces = await this.listWorkspaces()
        return workspaces
            .sort((a, b) => {
                const dateA = new Date(a.updatedAt || a.createdAt)
                const dateB = new Date(b.updatedAt || b.createdAt)
                return dateB.getTime() - dateA.getTime()
            })
            .slice(0, limit)
    }

    async openWorkspace(workspacePath: string): Promise<IWorkspace> {
        // Check if the workspace path exists
        if (!fs.existsSync(workspacePath)) {
            throw new Error('Workspace path does not exist')
        }

        // Validate that .igrpstudio/workspace.json exists
        const workspaceConfigPath = path.join(workspacePath, '.igrpstudio', 'workspace.json')
        if (!fs.existsSync(workspaceConfigPath)) {
            throw new Error('Invalid workspace: .igrpstudio/workspace.json not found')
        }

        // Check if this workspace is already in our database
        const existingWorkspaces = await this.listWorkspaces()
        const existingWorkspace = existingWorkspaces.find((w) => w.path === workspacePath)

        if (existingWorkspace) {
            // Update the last accessed time
            return (
                (await this.updateWorkspace(existingWorkspace.id, {
                    updatedAt: new Date().toISOString()
                })) || existingWorkspace
            )
        }

        try {
            // Load workspace configuration from .igrpstudio/workspace.json
            const workspaceConfigContent = await readFile(workspaceConfigPath, 'utf-8')
            const workspaceConfig = JSON.parse(workspaceConfigContent)

            // Create workspace from the configuration
            const newWorkspace: IWorkspace = {
                id: uuidv4(),
                name: workspaceConfig.name || path.basename(workspacePath),
                slug:
                    workspaceConfig.workspace ||
                    path
                        .basename(workspacePath)
                        .toLowerCase()
                        .replace(/[^a-z0-9]/g, '-'),
                path: workspacePath,
                description:
                    workspaceConfig.description || `Opened workspace from ${workspacePath}`,
                createdAt: workspaceConfig.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                services: workspaceConfig.services || [],
                projects: []
            }

            // Load projects from workspace configuration
            if (workspaceConfig.projects && Array.isArray(workspaceConfig.projects)) {
                for (const projectConfig of workspaceConfig.projects) {
                    try {
                        const updatedProject: ProjectData = {
                            id: uuidv4(),
                            name: projectConfig?.config?.name || 'Unnamed Project',
                            path: `${workspacePath}/projects/${projectConfig?.config?.name}`,
                            type:
                                projectConfig.config?.type === 'frontend' ? 'frontend' : 'backend',
                            framework: projectConfig.config?.type || 'nextjs',
                            workspaceId: newWorkspace.id,
                            config: projectConfig.config || {},
                            themeColor: projectConfig.config?.themeColor || '#000000',
                            icon: projectConfig.config?.icon || '',
                            createdAt: projectConfig.createdAt || new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        }
                        // Push project to workspace
                        newWorkspace.projects?.push(updatedProject as ProjectData)
                    } catch (error) {
                        console.warn(`Failed to load project ${projectConfig.name}:`, error)
                    }
                }
            }

            // Save the new workspace to app data
            const data = await this.loadData()
            data.workspaces.push(newWorkspace)
            await this.saveData(data)

            return newWorkspace
        } catch (error) {
            console.error('Failed to parse workspace configuration:', error)
            throw new Error('Invalid workspace configuration file')
        }
    }

    async addProjectToWorkspace(
        workspaceId: string,
        project: ProjectData
    ): Promise<HandlerResponse> {
        try {
            const workspace = await this.getWorkspace(workspaceId)
            if (!workspace) {
                return { error: 'Workspace not found' }
            }

            // Check if project already exists
            const existingProject = workspace.projects?.find((p) => p.path === project.path)
            if (existingProject) {
                return { error: 'Project already exists in this workspace' }
            }

            // Add project to workspace
            if (!workspace.projects) {
                workspace.projects = []
            }

            workspace.projects.push(project)

            // Update workspace in database
            await this.updateWorkspace(workspaceId, {
                ...workspace,
                updatedAt: new Date().toISOString()
            })

            return { result: project }
        } catch (error) {
            console.error('Failed to add project to workspace:', error)
            return {
                error: error instanceof Error ? error.message : 'Failed to add project to workspace'
            }
        }
    }

    async getRecentProjects(workspaceId: string, limit = 5): Promise<ProjectData[]> {
        const projects: any = await this.listProjects(workspaceId)
        return projects
            .sort((a, b) => {
                const dateA = new Date(a.updatedAt || a.createdAt)
                const dateB = new Date(b.updatedAt || b.createdAt)
                return dateB.getTime() - dateA.getTime()
            })
            .slice(0, limit)
    }

    async validateAndImportProject(
        project: ProjectData,
        workspacePath: string
    ): Promise<{ nameChanged: boolean; originalName?: string }> {
        // Expected project path pattern: <workspacePath>/projects/<projectName>
        let expectedPath = path.join(workspacePath, 'projects', project.config.name)

        // If project is already in correct location, do nothing
        if (project.path === expectedPath) {
            return { nameChanged: false }
        }

        // Create projects directory if it doesn't exist
        const projectsDir = path.join(workspacePath, 'projects')
        if (!fs.existsSync(projectsDir)) {
            await fs.promises.mkdir(projectsDir, { recursive: true })
        }

        // If target directory already exists, generate a unique name
        let nameChanged = false
        const originalName = project.config.name

        if (fs.existsSync(expectedPath)) {
            let counter = 1
            const baseName = project.config.name
            const basePath = path.join(workspacePath, 'projects')

            do {
                const newName = `${baseName}-${counter}`
                expectedPath = path.join(basePath, newName)
                counter++
            } while (fs.existsSync(expectedPath))

            // Update the project name to match the new directory name
            project.config.name = path.basename(expectedPath)
            nameChanged = true
        }

        // Import (copy) the project into the workspace structure
        try {
            await fs.promises.cp(project.path, expectedPath, {
                recursive: true
            })
            project.path = expectedPath
            project.updatedAt = new Date().toISOString()
        } catch (error: any) {
            throw new Error(`Failed to import project: ${error.message}`)
        }

        return { nameChanged, originalName }
    }

    // Backup Methods
    async backupData(backupPath?: string): Promise<void> {
        const targetPath =
            backupPath || path.join(BACKUP_DIR, `backup-${new Date().toISOString()}.json`)
        const data = await this.loadData()
        await writeFile(targetPath, JSON.stringify(data, null, 2))
    }

    async restoreData(backupPath: string): Promise<void> {
        const backupData = await readFile(backupPath, 'utf-8')
        await writeFile(WORKSPACE_FILE, backupData)
    }
}
