import { exec, execSync } from 'child_process'
import { app, BrowserWindow } from 'electron'
import fs from 'fs'
import yaml from 'js-yaml'
import net from 'net'
import path from 'path'
import { promisify } from 'util'
import { EVENTS } from '../constants/events'
import { escapePath } from '../helpers/utils'
import type { DockerComposeConfig, ServiceInfo } from '../types'

const execAsync = promisify(exec)
type ComposeStack = 'main' | 'monitoring' | 'process' | 'project'

type ComposeDescriptor = {
    key: ComposeStack
    path: string
    envFilePath?: string
}
type ComposeHostPortBinding = {
    port: number
    variableName?: string
}
type DockerDaemonCheck = {
    isRunning: boolean
    error?: string
    details?: string
}

type WorkspaceRegistry = {
    workspaces?: Array<{
        id: string
        path: string
        slug?: string
        projects?: Array<{
            id: string
            path: string
            name?: string
        }>
    }>
}

export class DockerService {
    private composeCache: Record<string, DockerComposeConfig> = {}
    private readonly composeRetryAttempts = 3
    private readonly composeRetryDelayMs = 2500
    private readonly logDedupWindowMs = 2000
    private readonly dockerDaemonCacheTtlMs = 15000
    private dockerDaemonCache: { expiresAt: number; result: DockerDaemonCheck } | null = null
    private dockerDaemonCheckInFlight: Promise<DockerDaemonCheck> | null = null
    private lastLogKey: string | null = null
    private lastLogAt = 0

    private getWorkspaceRegistryPath(): string {
        return path.join(app.getPath('userData'), 'igrpstudio.workspaces.json')
    }

    private loadWorkspaceRegistry(): WorkspaceRegistry {
        try {
            const filePath = this.getWorkspaceRegistryPath()
            if (!fs.existsSync(filePath)) return { workspaces: [] }
            const raw = fs.readFileSync(filePath, 'utf8')
            const parsed = JSON.parse(raw) as WorkspaceRegistry
            return parsed || { workspaces: [] }
        } catch {
            return { workspaces: [] }
        }
    }

    private findWorkspaceByProjectPath(projectPath: string): {
        workspacePath: string
        projectId?: string
        projectName?: string
    } | null {
        const normalizedProjectPath = path.resolve(projectPath)
        const registry = this.loadWorkspaceRegistry()
        for (const workspace of registry.workspaces || []) {
            for (const project of workspace.projects || []) {
                if (path.resolve(project.path) === normalizedProjectPath) {
                    return {
                        workspacePath: workspace.path,
                        projectId: project.id,
                        projectName: project.name
                    }
                }
            }
        }
        return null
    }

    private extractLabelValue(labels: unknown, key: string): string | undefined {
        if (!labels) return undefined
        if (Array.isArray(labels)) {
            for (const item of labels) {
                if (typeof item !== 'string') continue
                const [k, ...rest] = item.split('=')
                if (k?.trim() === key) return rest.join('=').trim()
            }
            return undefined
        }
        if (typeof labels === 'object') {
            const value = (labels as Record<string, unknown>)[key]
            return typeof value === 'string' ? value : undefined
        }
        return undefined
    }

    private findWorkspaceServiceNameByProjectId(
        workspaceComposePath: string,
        projectId?: string
    ): string | null {
        if (!projectId || !fs.existsSync(workspaceComposePath)) return null
        const compose =
            this.composeCache[workspaceComposePath] ||
            (yaml.load(fs.readFileSync(workspaceComposePath, 'utf8')) as DockerComposeConfig)
        this.composeCache[workspaceComposePath] = compose
        const services = compose?.services || {}
        for (const [serviceName, serviceDef] of Object.entries(services)) {
            const labels = (serviceDef as any)?.labels
            const uuid = this.extractLabelValue(labels, 'uuid')
            if (uuid && uuid === projectId) {
                return serviceName
            }
        }
        return null
    }

    private findWorkspaceServiceNameByProjectMetadata(
        workspaceComposePath: string,
        projectName?: string,
        projectPath?: string
    ): string | null {
        if (!fs.existsSync(workspaceComposePath)) return null
        const compose =
            this.composeCache[workspaceComposePath] ||
            (yaml.load(fs.readFileSync(workspaceComposePath, 'utf8')) as DockerComposeConfig)
        this.composeCache[workspaceComposePath] = compose
        const services = compose?.services || {}
        const normalizedName = (projectName || path.basename(projectPath || ''))
            .toLowerCase()
            .trim()
        if (!normalizedName) return null

        const slugLike = normalizedName.replace(/[^a-z0-9-]/gi, '-')
        const infraKeywords = [
            'nginx',
            'database',
            'postgres',
            'eureka',
            'gateway',
            'keycloak',
            'minio',
            'pgadmin',
            'redis',
            'access-management',
            'application-center',
            'db-prepare',
            'init'
        ]

        const isInfraService = (serviceName: string): boolean =>
            infraKeywords.some((keyword) => serviceName.includes(keyword))

        // 1) Strict project service match first (safe)
        for (const [serviceName] of Object.entries(services)) {
            const lowerService = serviceName.toLowerCase()
            if (isInfraService(lowerService)) continue
            if (
                lowerService === normalizedName ||
                lowerService.endsWith(`-${slugLike}`) ||
                lowerService.includes(`-${slugLike}-`) ||
                lowerService === slugLike
            ) {
                return serviceName
            }
        }

        // 2) Label-based relaxed match for non-infra services only
        for (const [serviceName, serviceDef] of Object.entries(services)) {
            const lowerService = serviceName.toLowerCase()
            if (isInfraService(lowerService)) continue
            const labels = (serviceDef as any)?.labels
            const labelName = (this.extractLabelValue(labels, 'name') || '').toLowerCase()
            if (
                labelName === normalizedName ||
                labelName === slugLike ||
                labelName.endsWith(`-${slugLike}`) ||
                labelName.includes(`-${slugLike}-`)
            ) {
                return serviceName
            }
        }
        return null
    }

    private findProjectServiceInProjectCompose(
        projectComposePath: string,
        projectName?: string,
        projectPath?: string
    ): string | null {
        if (!fs.existsSync(projectComposePath)) return null
        const compose =
            this.composeCache[projectComposePath] ||
            (yaml.load(fs.readFileSync(projectComposePath, 'utf8')) as DockerComposeConfig)
        this.composeCache[projectComposePath] = compose
        const services = compose?.services || {}
        const keys = Object.keys(services)
        if (keys.length === 0) return null

        const normalizedName = (projectName || path.basename(projectPath || ''))
            .toLowerCase()
            .trim()
        const slugLike = normalizedName.replace(/[^a-z0-9-]/gi, '-')

        for (const serviceName of keys) {
            const lower = serviceName.toLowerCase()
            if (
                lower === normalizedName ||
                lower === slugLike ||
                lower.endsWith(`-${slugLike}`) ||
                lower.includes(`-${slugLike}-`)
            ) {
                return serviceName
            }
        }

        // fallback: when there is a single service, it's usually the project service
        return keys.length === 1 ? keys[0] : null
    }

    private ensureProjectServiceJdbcEnv(
        workspacePath: string,
        workspaceComposePath: string,
        serviceName: string
    ): void {
        if (!fs.existsSync(workspaceComposePath)) return

        const workspaceEnvPath = path.join(workspacePath, '.env')
        const envVars = this.parseEnvFile(workspaceEnvPath)
        const workspaceSlug =
            envVars.WORKSPACE_SLUG || envVars.DOCKER_IP || path.basename(workspacePath).trim()
        const dbHost = envVars.IGRP_LOCAL_DATABASE_HOSTNAME || `${workspaceSlug}-database-postgres`
        const dbName = envVars.IGRP_DATABASE_NAME || 'postgres'
        const dbUser = envVars.IGRP_DATABASE_USER || 'igrp'
        const dbPassword = envVars.IGRP_DATABASE_PASSWORD || 'igrp'
        const jdbcUrl = `jdbc:postgresql://${dbHost}:5432/${dbName}`

        const compose =
            this.composeCache[workspaceComposePath] ||
            (yaml.load(fs.readFileSync(workspaceComposePath, 'utf8')) as DockerComposeConfig)
        const services = compose?.services || {}
        const serviceDef = services[serviceName] as any
        if (!serviceDef) return
        const servicePort = (() => {
            const ports = serviceDef.ports
            if (Array.isArray(ports) && ports.length > 0) {
                for (const entry of ports) {
                    if (typeof entry !== 'string') continue
                    const cleaned = entry.trim().replace(/^['"]|['"]$/g, '')
                    const protoStripped = cleaned.split('/')[0]
                    const parts = protoStripped.split(':')
                    const targetCandidate = parts[parts.length - 1]
                    const parsed = Number.parseInt(targetCandidate, 10)
                    if (!Number.isNaN(parsed) && parsed > 0 && parsed < 65536) {
                        return String(parsed)
                    }
                }
            }
            return '8080'
        })()

        const envMap = new Map<string, string>()
        const existingEnvironment = serviceDef.environment

        if (Array.isArray(existingEnvironment)) {
            for (const entry of existingEnvironment) {
                if (typeof entry !== 'string') continue
                const [k, ...rest] = entry.split('=')
                if (!k) continue
                envMap.set(k.trim(), rest.join('=').trim())
            }
        } else if (existingEnvironment && typeof existingEnvironment === 'object') {
            for (const [k, v] of Object.entries(existingEnvironment)) {
                if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
                    envMap.set(k, String(v))
                }
            }
        }

        // Some generated projects may carry invalid Hikari keys like
        // SPRING_DATASOURCE_HIKARI_CONNECTION=<host>, which Spring tries to bind
        // as a java.sql.Connection and fails at startup.
        envMap.delete('SPRING_DATASOURCE_HIKARI_CONNECTION')
        envMap.delete('spring.datasource.hikari.connection')

        const setIfMissing = (key: string, value: string): void => {
            const current = envMap.get(key)
            if (!current || current.trim() === '') {
                envMap.set(key, value)
            }
        }
        const setOverride = (key: string, value: string): void => {
            envMap.set(key, value)
        }

        const normalizeJdbcUrl = (value: string): string => {
            const trimmed = value.trim()
            const jdbcPrefix = 'jdbc:postgresql://'
            if (!trimmed.startsWith(jdbcPrefix)) return trimmed
            const rest = trimmed.slice(jdbcPrefix.length)
            const slashIdx = rest.indexOf('/')
            if (slashIdx < 0) return trimmed
            const hostPort = rest.slice(0, slashIdx)
            const dbPath = rest.slice(slashIdx)
            const hostOnly = hostPort.split(':')[0]?.toLowerCase() || ''
            const invalidHosts = new Set(['postgres', 'localhost', '127.0.0.1'])
            if (!invalidHosts.has(hostOnly)) return trimmed
            return `jdbc:postgresql://${dbHost}:5432${dbPath}`
        }

        setIfMissing('SPRING_DATASOURCE_URL', jdbcUrl)
        setIfMissing('SPRING_DATASOURCE_USERNAME', dbUser)
        setIfMissing('SPRING_DATASOURCE_PASSWORD', dbPassword)
        setIfMissing('SPRING_DATASOURCE_DRIVER_CLASS_NAME', 'org.postgresql.Driver')
        setIfMissing(
            'SPRING_JPA_PROPERTIES_HIBERNATE_DIALECT',
            'org.hibernate.dialect.PostgreSQLDialect'
        )

        // If project template already has a JDBC URL but points to an invalid host
        // in workspace context (e.g. "postgres"), force it to the workspace DB host.
        const currentJdbcUrl = envMap.get('SPRING_DATASOURCE_URL')
        if (currentJdbcUrl) {
            envMap.set('SPRING_DATASOURCE_URL', normalizeJdbcUrl(currentJdbcUrl))
        } else {
            envMap.set('SPRING_DATASOURCE_URL', jdbcUrl)
        }

        // Force common database aliases to avoid internal app fallbacks to "postgres".
        const normalizedJdbcUrl = envMap.get('SPRING_DATASOURCE_URL') || jdbcUrl
        setOverride('JDBC_DATABASE_URL', normalizedJdbcUrl)
        setOverride('DATABASE_URL', normalizedJdbcUrl)
        setOverride('JAKARTA_PERSISTENCE_JDBC_URL', normalizedJdbcUrl)
        setOverride('POSTGRES_HOST', dbHost)
        setOverride('DB_HOST', dbHost)
        setOverride('DATABASE_HOST', dbHost)
        setOverride('POSTGRESQL_HOST', dbHost)
        setOverride('PGHOST', dbHost)
        setOverride('POSTGRES_SERVER', dbHost)
        setOverride('SPRING_DATASOURCE_HOST', dbHost)
        setOverride('SPRING_FLYWAY_URL', normalizedJdbcUrl)
        setOverride('SPRING_LIQUIBASE_URL', normalizedJdbcUrl)
        setOverride('SPRING_R2DBC_URL', `r2dbc:postgresql://${dbHost}:5432/${dbName}`)
        setOverride('SPRING_DATASOURCE_USERNAME', dbUser)
        setOverride('SPRING_DATASOURCE_PASSWORD', dbPassword)
        setOverride('PGUSER', dbUser)
        setOverride('PGPASSWORD', dbPassword)
        setOverride('SERVICE_PORT', servicePort)
        setOverride('SERVER_PORT', servicePort)

        serviceDef.environment = Array.from(envMap.entries()).map(([k, v]) => `${k}=${v}`)
        this.ensureProjectServiceLabels(serviceDef, serviceName)
        services[serviceName] = serviceDef
        compose.services = services

        fs.writeFileSync(workspaceComposePath, yaml.dump(compose, { lineWidth: -1 }), 'utf8')
        this.composeCache[workspaceComposePath] = compose
        this.logInfo(`Ensured JDBC environment for project service "${serviceName}".`)
    }

    private getDependsOnServiceNames(dependsOn: unknown): string[] {
        if (!dependsOn) return []
        if (Array.isArray(dependsOn)) {
            return dependsOn.map((item) => (typeof item === 'string' ? item : '')).filter(Boolean)
        }
        if (typeof dependsOn === 'object') {
            return Object.keys(dependsOn as Record<string, unknown>)
        }
        return []
    }

    private removeHostPortBindingFromProjectDatabases(
        workspaceComposePath: string,
        serviceName: string
    ): void {
        if (!fs.existsSync(workspaceComposePath)) return

        const compose =
            this.composeCache[workspaceComposePath] ||
            (yaml.load(fs.readFileSync(workspaceComposePath, 'utf8')) as DockerComposeConfig)
        const services = compose?.services || {}
        const appService = services[serviceName] as any
        if (!appService) return

        const dependencyNames = this.getDependsOnServiceNames(appService.depends_on)
        if (dependencyNames.length === 0) return

        let changed = false

        for (const depName of dependencyNames) {
            const dep = services[depName] as any
            if (!dep) continue
            const depNameLower = depName.toLowerCase()
            const looksLikeDb =
                depNameLower.includes('postgres') ||
                depNameLower.includes('database') ||
                depNameLower.includes('-db')
            if (!looksLikeDb) continue

            const ports = dep.ports
            if (!Array.isArray(ports) || ports.length === 0) continue

            const normalizedPorts = ports.map((entry: unknown) => {
                if (typeof entry !== 'string') return entry
                const trimmed = entry.trim().replace(/^['"]|['"]$/g, '')
                const parts = trimmed.split(':')
                if (parts.length < 2) return entry
                const containerPortRaw = parts[parts.length - 1]
                const containerPort = Number.parseInt(containerPortRaw, 10)
                if (Number.isNaN(containerPort)) return entry

                // Remove host binding for DB dependencies so they don't conflict with stack postgres.
                if (containerPort === 5432) {
                    changed = true
                    return `${containerPort}`
                }
                return entry
            })

            dep.ports = normalizedPorts
            services[depName] = dep
        }

        if (changed) {
            compose.services = services
            fs.writeFileSync(workspaceComposePath, yaml.dump(compose, { lineWidth: -1 }), 'utf8')
            this.composeCache[workspaceComposePath] = compose
            this.logInfo(
                `Removed host DB port bindings for dependencies of "${serviceName}" to avoid conflicts with IGRP stack.`
            )
        }
    }

    private ensureProjectComposeIntegration(
        workspacePath: string,
        composePath: string,
        serviceName: string,
        projectPath?: string
    ): void {
        if (!fs.existsSync(composePath)) return

        const workspaceEnvPath = path.join(workspacePath, '.env')
        const envVars = this.parseEnvFile(workspaceEnvPath)
        const workspaceSlug =
            envVars.WORKSPACE_SLUG || envVars.DOCKER_IP || path.basename(workspacePath).trim()
        const dbHost = envVars.IGRP_LOCAL_DATABASE_HOSTNAME || `${workspaceSlug}-database-postgres`
        const dbName = envVars.IGRP_DATABASE_NAME || 'postgres'
        const dbUser = envVars.IGRP_DATABASE_USER || 'igrp'
        const dbPassword = envVars.IGRP_DATABASE_PASSWORD || 'igrp'
        const jdbcUrl = `jdbc:postgresql://${dbHost}:5432/${dbName}`
        const eurekaUrl =
            envVars.EUREKA_SERVICE_URL || `http://${workspaceSlug}-eureka:8761/eureka/`
        const composeProjectName = envVars.COMPOSE_PROJECT_NAME || `${workspaceSlug}-igrp`
        const networkName = `${composeProjectName}_default`
        const nginxPort = envVars.NGINX_HTTP_PORT || envVars.HOST_NGINX_HTTP_PORT || '2575'
        const tenant = envVars.IGRP_IAM_TENANT || 'igrp'
        const authJwtIssuer = `http://${workspaceSlug}:${nginxPort}/auth/realms/${tenant}`
        const accessApiBaseUrl = `http://${workspaceSlug}:${nginxPort}/gateway-api/${workspaceSlug}-access-management`
        const eurekaUrlPublic = `http://${workspaceSlug}:${nginxPort}/eureka/`
        const processSyncAccess = envVars.PROCESS_MANAGEMENT_SYNC_ACCESS || 'true'
        const m2mServiceId =
            envVars.PROCESS_MANAGEMENT_M2M_SERVICE_ID ||
            envVars.APP_CENTER_M2M_SERVICE_ID ||
            `igrp-stack-${workspaceSlug}`
        const m2mToken =
            envVars.PROCESS_MANAGEMENT_M2M_TOKEN ||
            envVars.APP_CENTER_M2M_TOKEN ||
            envVars.ACCESS_MANAGEMENT_M2M_SYNC_TOKEN ||
            ''

        const compose =
            this.composeCache[composePath] ||
            (yaml.load(fs.readFileSync(composePath, 'utf8')) as DockerComposeConfig)
        const services = compose?.services || {}
        const serviceDef = services[serviceName] as any
        if (!serviceDef) return
        const discoveryServiceName = serviceName.toLowerCase()
        const eurekaAppName = discoveryServiceName.toUpperCase()
        const servicePort = (() => {
            const ports = serviceDef.ports
            if (Array.isArray(ports) && ports.length > 0) {
                for (const entry of ports) {
                    if (typeof entry !== 'string') continue
                    const cleaned = entry.trim().replace(/^['"]|['"]$/g, '')
                    const protoStripped = cleaned.split('/')[0]
                    const parts = protoStripped.split(':')
                    const targetCandidate = parts[parts.length - 1]
                    const parsed = Number.parseInt(targetCandidate, 10)
                    if (!Number.isNaN(parsed) && parsed > 0 && parsed < 65536) {
                        return String(parsed)
                    }
                }
            }
            return '8080'
        })()
        const appCode = serviceName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()
        const appBasePath = `/apps/${serviceName}`
        const appHomeSlug = '/'

        const envMap = new Map<string, string>()
        const existingEnvironment = serviceDef.environment
        if (Array.isArray(existingEnvironment)) {
            for (const entry of existingEnvironment) {
                if (typeof entry !== 'string') continue
                const [k, ...rest] = entry.split('=')
                if (!k) continue
                envMap.set(k.trim(), rest.join('=').trim())
            }
        } else if (existingEnvironment && typeof existingEnvironment === 'object') {
            for (const [k, v] of Object.entries(existingEnvironment)) {
                if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
                    envMap.set(k, String(v))
                }
            }
        }

        // Remove previously injected problematic Hikari keys that can be interpreted
        // as spring.datasource.hikari.connection.* and break datasource binding.
        envMap.delete('SPRING_DATASOURCE_HIKARI_CONNECTION')
        envMap.delete('SPRING_DATASOURCE_HIKARI_CONNECTION_TIMEOUT')
        envMap.delete('SPRING_DATASOURCE_HIKARI_CONNECTION_TEST_QUERY')
        envMap.delete('spring.datasource.hikari.connection')
        envMap.delete('spring.datasource.hikari.connection-timeout')
        envMap.delete('spring.datasource.hikari.connection-test-query')

        envMap.set('SPRING_DATASOURCE_URL', jdbcUrl)
        envMap.set('SPRING_DATASOURCE_USERNAME', dbUser)
        envMap.set('SPRING_DATASOURCE_PASSWORD', dbPassword)
        envMap.set('SPRING_DATASOURCE_DRIVER_CLASS_NAME', 'org.postgresql.Driver')
        envMap.set(
            'SPRING_JPA_PROPERTIES_HIBERNATE_DIALECT',
            'org.hibernate.dialect.PostgreSQLDialect'
        )
        envMap.set('SPRING_DATASOURCE_HIKARI_INITIALIZATION_FAIL_TIMEOUT', '0')
        envMap.set('SPRING_DATASOURCE_HIKARI_VALIDATION_TIMEOUT', '5000')
        envMap.set('JDBC_DATABASE_URL', jdbcUrl)
        envMap.set('DATABASE_URL', jdbcUrl)
        envMap.set('POSTGRES_HOST', dbHost)
        envMap.set('DB_HOST', dbHost)
        envMap.set('DATABASE_HOST', dbHost)
        // .NET appsettings.json connection string uses ${POSTGRES_DATABASE}, ${POSTGRES_USER},
        // ${POSTGRES_PASSWORD}, and ${POSTGRES_EXTERNAL_PORT} — none of which the workspace
        // .env exposes (it uses IGRP_DATABASE_NAME / IGRP_DATABASE_USER etc.). Derive the
        // project-specific DB name from the project's .env or baseApi.json; fall back to the
        // workspace shared DB only if neither source is available.
        const projectDbName = this.resolveProjectDatabaseName(projectPath, dbName)
        envMap.set('POSTGRES_DATABASE', projectDbName)
        envMap.set('POSTGRES_DB', projectDbName)
        envMap.set('POSTGRES_USER', dbUser)
        envMap.set('POSTGRES_PASSWORD', dbPassword)
        envMap.set('POSTGRES_EXTERNAL_PORT', '5432')
        envMap.set('POSTGRES_INTERNAL_PORT', '5432')
        // Use internal Eureka service URL for container-to-container communication.
        // Public nginx URL can refuse connections from inside project containers.
        envMap.set('EUREKA_SERVICE_URL', eurekaUrl)
        envMap.set('EUREKA_CLIENT_SERVICE_URL_DEFAULTZONE', eurekaUrl)
        envMap.set('EUREKA_CLIENT_SERVICEURL_DEFAULTZONE', eurekaUrl)
        envMap.set('EUREKA_CLIENT_SERVICE_URL_DEFAULT_ZONE', eurekaUrl)
        envMap.set('EUREKA_CLIENT_SERVICEURL_DEFAULT_ZONE', eurekaUrl)
        envMap.set('EUREKA_CLIENT_SERVICE-URL_DEFAULTZONE', eurekaUrl)
        envMap.set('EUREKA_CLIENT_SERVICE-URL_DEFAULT-ZONE', eurekaUrl)
        envMap.set('EUREKA_CLIENT_AVAILABILITYZONES_DEFAULT', 'defaultZone')
        envMap.set('EUREKA_CLIENT_REGION', 'default')
        envMap.set('IGRP_EUREKA_PUBLIC_URL', eurekaUrlPublic)
        envMap.set('EUREKA_CLIENT_ENABLED', 'true')
        envMap.set('SPRING_CLOUD_DISCOVERY_ENABLED', 'true')
        envMap.set('EUREKA_INSTANCE_PREFER_IP_ADDRESS', 'true')
        envMap.set('EUREKA_INSTANCE_NON_SECURE_PORT', servicePort)
        envMap.set('SPRING_APPLICATION_NAME', discoveryServiceName)
        envMap.set('EUREKA_INSTANCE_APPNAME', eurekaAppName)
        envMap.set(
            'EUREKA_INSTANCE_INSTANCE_ID',
            `${eurekaAppName}:${workspaceSlug}:${servicePort}`
        )
        envMap.set('AUTH_JWT_ISSUER', authJwtIssuer)
        envMap.set('auth.jwt.issuer', authJwtIssuer)
        envMap.set('IGRP_ACCESS_API_BASE_URL', accessApiBaseUrl)
        envMap.set('IGRP_ACCESS_MANAGEMENT_API', accessApiBaseUrl)
        envMap.set('IGRP_APP_CENTER_URL', `http://${workspaceSlug}:${nginxPort}`)
        envMap.set('IGRP_SYNC_ACCESS', processSyncAccess)
        envMap.set('IGRP_APP_CODE', appCode)
        envMap.set('IGRP_APP_NAME_DESCRIPTION', serviceName)
        envMap.set('IGRP_APP_HOME_SLUG', appHomeSlug)
        envMap.set('IGRP_APP_BASE_PATH', appBasePath)
        envMap.set('NEXT_PUBLIC_APP_BASE_RUNTIME_URL', `http://${workspaceSlug}:${nginxPort}`)
        envMap.set('IGRP_M2M_SERVICE_ID', m2mServiceId)
        if (m2mToken.trim()) envMap.set('IGRP_M2M_TOKEN', m2mToken)
        envMap.set('SERVICE_PORT', servicePort)
        envMap.set('SERVER_PORT', servicePort)

        serviceDef.environment = Array.from(envMap.entries()).map(([k, v]) => `${k}=${v}`)

        // Remove depends_on entries that are not declared in this compose file.
        const existingServiceNames = new Set(Object.keys(services))
        const dependsOn = serviceDef.depends_on
        if (Array.isArray(dependsOn)) {
            const filtered = dependsOn.filter(
                (dep: unknown) => typeof dep === 'string' && existingServiceNames.has(dep)
            )
            if (filtered.length > 0) {
                serviceDef.depends_on = filtered
            } else {
                delete serviceDef.depends_on
            }
        } else if (dependsOn && typeof dependsOn === 'object') {
            const filteredObject: Record<string, unknown> = {}
            for (const [depName, depConfig] of Object.entries(
                dependsOn as Record<string, unknown>
            )) {
                if (existingServiceNames.has(depName)) {
                    filteredObject[depName] = depConfig
                }
            }
            if (Object.keys(filteredObject).length > 0) {
                serviceDef.depends_on = filteredObject
            } else {
                delete serviceDef.depends_on
            }
        }

        const currentNetworks = Array.isArray(serviceDef.networks) ? serviceDef.networks : []
        if (!currentNetworks.includes(networkName)) {
            serviceDef.networks = [...currentNetworks, networkName]
        }
        this.ensureProjectServiceLabels(serviceDef, serviceName)
        services[serviceName] = serviceDef
        compose.services = services

        if (!compose.networks) compose.networks = {}
        ;(compose.networks as Record<string, any>)[networkName] = { external: true }

        fs.writeFileSync(composePath, yaml.dump(compose, { lineWidth: -1 }), 'utf8')
        this.composeCache[composePath] = compose
        this.logInfo(
            `Integrated project compose service "${serviceName}" with workspace network ${networkName}.`
        )
    }

    private ensureProjectServiceLabels(serviceDef: any, serviceName: string): void {
        const currentLabels = serviceDef?.labels
        if (Array.isArray(currentLabels)) {
            const clean = currentLabels.filter((entry: unknown) => {
                if (typeof entry !== 'string') return true
                return (
                    !entry.startsWith('type=') &&
                    !entry.startsWith('name=') &&
                    !entry.startsWith('is_project=')
                )
            })
            serviceDef.labels = [...clean, 'type=web', `name=${serviceName}`, 'is_project=true']
            return
        }

        if (currentLabels && typeof currentLabels === 'object') {
            serviceDef.labels = {
                ...(currentLabels as Record<string, unknown>),
                type: 'web',
                name: serviceName,
                is_project: 'true'
            }
            return
        }

        serviceDef.labels = {
            type: 'web',
            name: serviceName,
            is_project: 'true'
        }
    }

    private async ensureDockerNetworkExists(networkName: string): Promise<void> {
        if (!networkName || !networkName.trim()) return
        try {
            await execAsync(`docker network inspect ${networkName}`, { maxBuffer: 1024 * 1024 })
            return
        } catch {
            // network does not exist; create it
        }

        await execAsync(`docker network create ${networkName}`, { maxBuffer: 1024 * 1024 })
        this.logInfo(`Created missing Docker network: ${networkName}`)
    }

    private sanitizeProjectSpringDatasourceConfig(projectPath: string): void {
        const resourcesDir = path.join(projectPath, 'src', 'main', 'resources')
        if (!fs.existsSync(resourcesDir)) return

        const entries = fs.readdirSync(resourcesDir, { withFileTypes: true })
        for (const entry of entries) {
            if (!entry.isFile()) continue
            const fileName = entry.name.toLowerCase()
            if (
                !fileName.startsWith('application') ||
                !(
                    fileName.endsWith('.properties') ||
                    fileName.endsWith('.yml') ||
                    fileName.endsWith('.yaml')
                )
            ) {
                continue
            }

            const filePath = path.join(resourcesDir, entry.name)
            const original = fs.readFileSync(filePath, 'utf8')
            const sanitized = original
                .replace(/^\s*spring\.datasource\.hikari\.connection\s*=.*(?:\r?\n)?/gim, '')
                .replace(/^\s*spring\.datasource\.hikari\.connection\s*:.*(?:\r?\n)?/gim, '')

            if (sanitized !== original) {
                fs.writeFileSync(filePath, sanitized, 'utf8')
                this.logInfo(`Removed invalid spring.datasource.hikari.connection from ${filePath}`)
            }
        }

        const projectEnvPath = path.join(projectPath, '.env')
        if (fs.existsSync(projectEnvPath)) {
            const envOriginal = fs.readFileSync(projectEnvPath, 'utf8')
            const envSanitized = envOriginal
                .replace(/^\s*SPRING_DATASOURCE_HIKARI_CONNECTION\s*=.*(?:\r?\n)?/gim, '')
                .replace(/^\s*spring\.datasource\.hikari\.connection\s*=.*(?:\r?\n)?/gim, '')
            if (envSanitized !== envOriginal) {
                fs.writeFileSync(projectEnvPath, envSanitized, 'utf8')
                this.logInfo(`Removed invalid Hikari connection key from ${projectEnvPath}`)
            }
        }
    }

    private getComposeDescriptors(projectPath: string): ComposeDescriptor[] {
        const perStackCandidates: Record<ComposeStack, string[]> = {
            main: [
                path.join(projectPath, 'igrp-compose.yaml'),
                path.join(projectPath, 'docker-compose.yml'),
                path.join(projectPath, 'docker-compose.yaml'),
                path.join(projectPath, 'compose.yml'),
                path.join(projectPath, 'compose.yaml')
            ],
            monitoring: [
                path.join(projectPath, 'monitoring', 'igrp-monitoring-compose.yaml'),
                path.join(projectPath, 'compose-monitoring.yaml')
            ],
            process: [
                path.join(projectPath, 'process', 'igrp-process-compose.yaml'),
                path.join(projectPath, 'compose-process.yaml')
            ],
            project: [
                path.join(projectPath, 'projects', 'igrp-projects-compose.yml'),
                path.join(projectPath, 'projects', 'igrp-projects-compose.yaml')
            ]
        }

        const descriptors: ComposeDescriptor[] = []

        for (const key of Object.keys(perStackCandidates) as ComposeStack[]) {
            const found = perStackCandidates[key].find((candidatePath) =>
                fs.existsSync(candidatePath)
            )
            if (found) {
                let envFilePath: string | undefined
                if (key === 'main') {
                    const candidate = path.join(projectPath, '.env')
                    envFilePath = fs.existsSync(candidate) ? candidate : undefined
                } else if (key === 'monitoring') {
                    const candidate = path.join(projectPath, 'monitoring', '.env_monitoring')
                    envFilePath = fs.existsSync(candidate) ? candidate : undefined
                } else if (key === 'process') {
                    const candidate = path.join(projectPath, 'process', '.env_process')
                    envFilePath = fs.existsSync(candidate) ? candidate : undefined
                } else if (key === 'project') {
                    const candidate = path.join(projectPath, '.env')
                    envFilePath = fs.existsSync(candidate) ? candidate : undefined
                }

                descriptors.push({ key, path: found, envFilePath })
            }
        }

        return descriptors
    }

    /**
     * Test logging functionality
     */
    testLogging(): void {
        this.logInfo('Testing Docker service logging...')
        this.logSuccess('Docker service logging is working!')
        this.logWarn('This is a warning message')
        this.logDebug('This is a debug message')
        this.logError('This is an error message (for testing)')
    }

    /**
     * Send log message to renderer process
     */
    private log(
        level: 'info' | 'warn' | 'error' | 'debug' | 'success',
        message: string,
        progress?: { current: number; total: number; label?: string }
    ): void {
        const now = Date.now()
        const dedupKey = `${level}:${message}`
        const isDedupCandidate = !progress && (level === 'debug' || level === 'info')
        if (
            isDedupCandidate &&
            this.lastLogKey === dedupKey &&
            now - this.lastLogAt < this.logDedupWindowMs
        ) {
            return
        }
        this.lastLogKey = dedupKey
        this.lastLogAt = now

        const logMessage = {
            code: 'docker-service',
            message,
            level,
            timestamp: new Date().toISOString(),
            progress
        }

        // Also log to console for debugging
        console.log(`[DockerService ${level.toUpperCase()}] ${message}`)

        // Send to all renderer processes
        const windows = BrowserWindow.getAllWindows()
        windows.forEach((window) => {
            if (!window.isDestroyed()) {
                window.webContents.send(EVENTS.LOG, logMessage)
            }
        })
    }

    /**
     * Log info message
     */
    private logInfo(message: string): void {
        this.log('info', message)
    }

    /**
     * Log warning message
     */
    private logWarn(message: string): void {
        this.log('warn', message)
    }

    /**
     * Log error message
     */
    private logError(message: string): void {
        this.log('error', message)
    }

    /**
     * Log debug message
     */
    private logDebug(message: string): void {
        this.log('debug', message)
    }

    /**
     * Log success message
     */
    private logSuccess(message: string): void {
        this.log('success', message)
    }

    /**
     * Log progress update
     */
    private logProgress(current: number, total: number, label: string): void {
        this.log('info', `${label}: ${current}/${total}`, {
            current,
            total,
            label
        })
    }

    private isTransientNetworkError(message: string): boolean {
        const lower = message.toLowerCase()
        return (
            lower.includes('tls handshake timeout') ||
            lower.includes('i/o timeout') ||
            lower.includes('context deadline exceeded') ||
            lower.includes('temporary failure in name resolution') ||
            lower.includes('connection reset by peer') ||
            lower.includes('net/http: timeout')
        )
    }

    private async wait(ms: number): Promise<void> {
        await new Promise((resolve) => setTimeout(resolve, ms))
    }

    private resolveProjectDatabaseName(projectPath: string | undefined, fallback: string): string {
        if (!projectPath) return fallback
        // Prefer the value already written in the project .env (e.g. mytest_db)
        const envVars = this.parseEnvFile(path.join(projectPath, '.env'))
        if (envVars.POSTGRES_DATABASE && envVars.POSTGRES_DATABASE !== '_db') {
            return envVars.POSTGRES_DATABASE
        }
        // Fall back to deriving from apiName in .igrpstudio/baseApi.json
        try {
            const baseApiPath = path.join(projectPath, '.igrpstudio', 'baseApi.json')
            if (fs.existsSync(baseApiPath)) {
                const baseApi = JSON.parse(fs.readFileSync(baseApiPath, 'utf8'))
                if (typeof baseApi.apiName === 'string' && baseApi.apiName) {
                    return `${baseApi.apiName.toLowerCase()}_db`
                }
            }
        } catch {
            // ignore — non-critical
        }
        return fallback
    }

    private parseEnvFile(envFilePath?: string): Record<string, string> {
        if (!envFilePath || !fs.existsSync(envFilePath)) return {}
        const content = fs.readFileSync(envFilePath, 'utf8')
        const env: Record<string, string> = {}
        for (const rawLine of content.split('\n')) {
            const line = rawLine.trim()
            if (!line || line.startsWith('#')) continue
            const idx = line.indexOf('=')
            if (idx <= 0) continue
            const key = line.slice(0, idx).trim()
            const value = line
                .slice(idx + 1)
                .trim()
                .replace(/^['"]|['"]$/g, '')
            env[key] = value
        }
        return env
    }

    private resolveHttpPort(envVars: Record<string, string>, fallback = '2575'): string {
        const raw = envVars.NGINX_HTTP_PORT || envVars.HOST_NGINX_HTTP_PORT || fallback
        const parsed = Number.parseInt(String(raw), 10)
        if (Number.isNaN(parsed) || parsed <= 0 || parsed > 65535) return fallback
        return String(parsed)
    }

    private syncKeycloakRealmFrontendUrl(projectPath: string, envFilePath?: string): void {
        try {
            const realmPath = path.join(
                projectPath,
                '.igrpstudio',
                'auth',
                'data',
                'igrp-realm.json'
            )
            if (!fs.existsSync(realmPath)) return

            const envVars = this.parseEnvFile(envFilePath)
            const workspaceHost = path.basename(projectPath).trim() || 'localhost'
            const host = envVars.DOCKER_IP || envVars.WORKSPACE_SLUG || workspaceHost || 'localhost'
            const port = this.resolveHttpPort(envVars)

            const expectedFrontendUrl = `http://${host}:${port}/auth`
            const expectedAdminRedirect = `http://${host}:${port}/auth/admin/igrp/console/*`
            const hostWithPort = `${host}:${port}`

            const raw = fs.readFileSync(realmPath, 'utf8')
            let next = raw

            // Keep realm frontend URL aligned with the current workspace host/port.
            // Keycloak exports may place this either at root "frontendUrl"
            // and/or inside "attributes.frontendUrl". We normalize both.
            next = next.replace(
                /"frontendUrl"\s*:\s*"[^"]*"/g,
                `"frontendUrl": "${expectedFrontendUrl}"`
            )

            // Normalize old localhost admin redirect to workspace host.
            next = next.replace(
                /"http:\/\/localhost\/auth\/admin\/igrp\/console\/\*"/g,
                `"${expectedAdminRedirect}"`
            )

            // Replace stale workspace hosts like "tst-igrp:2575" across realm URLs.
            next = next.replace(/http:\/\/[a-zA-Z0-9-]+-igrp:\d+/g, `http://${hostWithPort}`)
            next = next.replace(/https:\/\/[a-zA-Z0-9-]+-igrp:\d+/g, `http://${hostWithPort}`)

            // Replace stale plain workspace host with wrong port (e.g. teste:2575 -> teste:2579).
            next = next.replace(
                /http:\/\/([a-zA-Z0-9-]+):\d+\/auth/g,
                (_m, h: string) => `http://${h === host ? host : h}:${port}/auth`
            )

            if (next !== raw) {
                fs.writeFileSync(realmPath, next, 'utf8')
                this.logInfo(`Synchronized Keycloak realm frontend URL to ${expectedFrontendUrl}`)
            }
        } catch (error: unknown) {
            this.logWarn(
                `Could not synchronize Keycloak realm frontend URL: ${(error as Error).message}`
            )
        }
    }

    private syncAccessManagementJwtIssuer(projectPath: string, envFilePath?: string): void {
        try {
            const composePath = path.join(projectPath, 'igrp-compose.yaml')
            if (!fs.existsSync(composePath)) return

            const envVars = this.parseEnvFile(envFilePath)
            const workspaceHost = path.basename(projectPath).trim() || 'localhost'
            const host = envVars.WORKSPACE_SLUG || envVars.DOCKER_IP || workspaceHost || 'localhost'

            const raw = fs.readFileSync(composePath, 'utf8')
            const fixed = `- AUTH_JWT_ISSUER=http://${host}:\${NGINX_HTTP_PORT}/auth/realms/\${IGRP_IAM_TENANT}`
            const next = raw.replace(/^\s*-\s*AUTH_JWT_ISSUER=.*$/m, `      ${fixed}`)

            if (next !== raw) {
                fs.writeFileSync(composePath, next, 'utf8')
                this.logInfo(
                    `Synchronized AUTH_JWT_ISSUER to ${host}:\${NGINX_HTTP_PORT} in compose.`
                )
            }
        } catch (error: unknown) {
            this.logWarn(
                `Could not synchronize AUTH_JWT_ISSUER in compose: ${(error as Error).message}`
            )
        }
    }

    private ensureWorkspaceHostInEnv(projectPath: string, envFilePath?: string): void {
        if (!envFilePath || !fs.existsSync(envFilePath)) return
        const envVars = this.parseEnvFile(envFilePath)
        const workspaceHost = envVars.WORKSPACE_SLUG || path.basename(projectPath).trim()
        if (!workspaceHost) return
        this.updateEnvFileVariable(envFilePath, 'DOCKER_IP', workspaceHost)
        this.updateEnvFileVariable(envFilePath, 'WORKSPACE_SLUG', workspaceHost)
    }

    private ensureProcessEnvConsistency(projectPath: string, envFilePath?: string): void {
        if (!envFilePath || !fs.existsSync(envFilePath)) return
        if (!envFilePath.endsWith('.env_process')) return

        const workspaceSlug = path.basename(projectPath).trim()
        if (!workspaceSlug) return

        const mainEnvPath = path.join(projectPath, '.env')
        const mainEnv = this.parseEnvFile(mainEnvPath)
        const processEnv = this.parseEnvFile(envFilePath)
        const resolvedNginxPort = this.resolveHttpPort({
            ...processEnv,
            ...mainEnv
        })

        this.updateEnvFileVariable(envFilePath, 'DOCKER_IP', workspaceSlug)
        this.updateEnvFileVariable(envFilePath, 'WORKSPACE_SLUG', workspaceSlug)
        this.updateEnvFileVariable(
            envFilePath,
            'IGRP_LOCAL_DATABASE_HOSTNAME',
            `${workspaceSlug}-database-postgres`
        )
        this.updateEnvFileVariable(
            envFilePath,
            'EUREKA_SERVICE_URL',
            `http://${workspaceSlug}-eureka:8761/eureka/`
        )
        this.updateEnvFileVariable(envFilePath, 'NGINX_HTTP_PORT', resolvedNginxPort)
    }

    private resolveTemplateValue(raw: string, envVars: Record<string, string>): string | null {
        const value = raw.trim()
        const direct = Number.parseInt(value, 10)
        if (!Number.isNaN(direct)) return String(direct)

        const fallbackMatch = value.match(/^\$\{([A-Z0-9_]+):-([0-9]+)\}$/i)
        if (fallbackMatch) {
            const [, varName, fallback] = fallbackMatch
            return envVars[varName] || process.env[varName] || fallback
        }

        const simpleMatch = value.match(/^\$\{([A-Z0-9_]+)\}$/i)
        if (simpleMatch) {
            const [, varName] = simpleMatch
            const resolved = envVars[varName] || process.env[varName]
            return resolved || null
        }

        return null
    }

    private extractHostPortBindingsFromCompose(
        composePath: string,
        envFilePath?: string
    ): ComposeHostPortBinding[] {
        if (!fs.existsSync(composePath)) return []
        const compose =
            this.composeCache[composePath] ||
            (yaml.load(fs.readFileSync(composePath, 'utf8')) as DockerComposeConfig)
        this.composeCache[composePath] = compose

        const envVars = this.parseEnvFile(envFilePath)
        const bindings: ComposeHostPortBinding[] = []
        const dedupe = new Set<string>()
        const services = compose.services || {}

        for (const serviceDef of Object.values(services)) {
            const servicePorts = (serviceDef as any)?.ports
            if (!Array.isArray(servicePorts)) continue
            for (const entry of servicePorts) {
                if (typeof entry !== 'string') continue
                const hostPart = this.extractHostPortToken(entry)
                if (!hostPart) continue
                const resolved = this.resolveTemplateValue(hostPart, envVars)
                if (!resolved) continue
                const parsed = Number.parseInt(resolved, 10)
                if (Number.isNaN(parsed)) continue

                const variableMatch = hostPart.trim().match(/^\$\{([A-Z0-9_]+)(?::-[0-9]+)?\}$/i)
                const variableName = variableMatch ? variableMatch[1] : undefined
                const key = `${parsed}:${variableName || ''}`
                if (dedupe.has(key)) continue
                dedupe.add(key)
                bindings.push({ port: parsed, variableName })
            }
        }

        return bindings
    }

    private extractHostPortToken(portMapping: string): string | null {
        const value = portMapping.trim()
        if (!value) return null

        // Supports forms:
        // - "2575:2575"
        // - "${HOST_NGINX_HTTP_PORT:-2575}:2575"
        // - "127.0.0.1:2575:2575"
        // We capture everything before the final ":<containerPort>" segment.
        const match = value.match(/^(.+):\d+(?:\/[a-z]+)?$/i)
        if (!match) return null
        const hostExpr = match[1]
        const trimmedHostExpr = hostExpr.trim()

        // Keep variable expressions intact, including fallback form "${VAR:-2575}".
        if (trimmedHostExpr.startsWith('${') && trimmedHostExpr.endsWith('}')) {
            return trimmedHostExpr
        }

        // For "ip:hostPort" form, keep only hostPort.
        const parts = trimmedHostExpr.split(':')
        return parts[parts.length - 1]?.trim() || null
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

    private async findNextAvailablePort(startPort: number, maxAttempts = 50): Promise<number> {
        for (let offset = 1; offset <= maxAttempts; offset++) {
            const candidate = startPort + offset
            // eslint-disable-next-line no-await-in-loop
            const free = await this.isPortAvailable(candidate)
            if (free) return candidate
        }
        return startPort + 1
    }

    private updateEnvFileVariable(
        envFilePath: string,
        variableName: string,
        value: number | string
    ): void {
        if (!fs.existsSync(envFilePath)) return
        const raw = fs.readFileSync(envFilePath, 'utf8')
        const lines = raw.split('\n')
        let found = false
        const updated = lines.map((line) => {
            if (line.startsWith(`${variableName}=`)) {
                found = true
                return `${variableName}=${String(value)}`
            }
            return line
        })
        if (!found) {
            updated.push(`${variableName}=${String(value)}`)
        }
        fs.writeFileSync(envFilePath, updated.join('\n'), 'utf8')
    }

    private updateComposeNginxHostPortLiteral(
        composePath: string,
        oldPort: number,
        nextPort: number
    ): void {
        if (!fs.existsSync(composePath)) return
        const compose =
            this.composeCache[composePath] ||
            (yaml.load(fs.readFileSync(composePath, 'utf8')) as DockerComposeConfig)
        const services = compose?.services || {}
        let changed = false

        for (const [serviceName, serviceDef] of Object.entries(services)) {
            if (!serviceName.toLowerCase().includes('nginx')) continue
            const ports = (serviceDef as any)?.ports
            if (!Array.isArray(ports)) continue

            const updatedPorts = ports.map((entry: unknown) => {
                if (typeof entry !== 'string') return entry
                const trimmed = entry.trim()
                const protoMatch = trimmed.match(/^(.*?)(\/[a-z]+)$/i)
                const base = protoMatch ? protoMatch[1] : trimmed
                const proto = protoMatch ? protoMatch[2] : ''
                const parts = base.split(':')
                if (parts.length < 2) return entry

                const hostPortIndex = parts.length - 2
                const containerPortIndex = parts.length - 1
                const hostPortValue = Number.parseInt(parts[hostPortIndex] || '', 10)
                if (Number.isNaN(hostPortValue) || hostPortValue !== oldPort) return entry

                parts[hostPortIndex] = String(nextPort)
                const containerPortValue = Number.parseInt(parts[containerPortIndex] || '', 10)
                if (!Number.isNaN(containerPortValue)) {
                    parts[containerPortIndex] = String(nextPort)
                }
                changed = true
                return `${parts.join(':')}${proto}`
            })

            ;(serviceDef as any).ports = updatedPorts
        }

        if (changed) {
            fs.writeFileSync(composePath, yaml.dump(compose, { lineWidth: -1 }), 'utf8')
            this.composeCache[composePath] = compose
        }
    }

    private updateWorkspaceNginxListenPort(projectPath: string, nextPort: number): void {
        try {
            const nginxConfPath = path.join(projectPath, 'nginx.conf')
            if (!fs.existsSync(nginxConfPath)) return
            const raw = fs.readFileSync(nginxConfPath, 'utf8')
            const next = raw.replace(
                /listen\s+\d+\s+default_server;/,
                `listen   ${nextPort} default_server;`
            )
            if (next !== raw) {
                fs.writeFileSync(nginxConfPath, next, 'utf8')
            }
        } catch (error: unknown) {
            this.logWarn(
                `Could not align nginx.conf listen port to ${nextPort}: ${(error as Error).message}`
            )
        }
    }

    private hasNginxHostPortLiteralBinding(composePath: string, hostPort: number): boolean {
        if (!fs.existsSync(composePath)) return false
        const compose =
            this.composeCache[composePath] ||
            (yaml.load(fs.readFileSync(composePath, 'utf8')) as DockerComposeConfig)
        this.composeCache[composePath] = compose
        const services = compose?.services || {}

        for (const [serviceName, serviceDef] of Object.entries(services)) {
            if (!serviceName.toLowerCase().includes('nginx')) continue
            const ports = (serviceDef as any)?.ports
            if (!Array.isArray(ports)) continue
            for (const entry of ports) {
                if (typeof entry !== 'string') continue
                const hostToken = this.extractHostPortToken(entry)
                if (!hostToken) continue
                const parsed = Number.parseInt(hostToken, 10)
                if (!Number.isNaN(parsed) && parsed === hostPort) {
                    return true
                }
            }
        }

        return false
    }

    private async validateComposePortsBeforeUp(
        composePath: string,
        envFilePath?: string
    ): Promise<void> {
        const envVars = this.parseEnvFile(envFilePath)
        const resolvedNginxPort = Number.parseInt(this.resolveHttpPort(envVars), 10)
        const hostPortBindings = this.extractHostPortBindingsFromCompose(composePath, envFilePath)
        for (const binding of hostPortBindings) {
            const { port, variableName } = binding
            // eslint-disable-next-line no-await-in-loop
            const free = await this.isPortAvailable(port)
            if (!free) {
                const isNginxPortVariable =
                    variableName === 'HOST_NGINX_HTTP_PORT' || variableName === 'NGINX_HTTP_PORT'
                const isResolvedNginxPort =
                    !Number.isNaN(resolvedNginxPort) && port === resolvedNginxPort
                const isNginxLiteralBinding = this.hasNginxHostPortLiteralBinding(composePath, port)
                if (
                    envFilePath &&
                    (isNginxPortVariable || isResolvedNginxPort || isNginxLiteralBinding)
                ) {
                    // Auto-switch nginx host port for this workspace when Start is pressed.
                    // eslint-disable-next-line no-await-in-loop
                    const nextPort = await this.findNextAvailablePort(port)
                    this.updateEnvFileVariable(envFilePath, 'HOST_NGINX_HTTP_PORT', nextPort)
                    this.updateEnvFileVariable(envFilePath, 'NGINX_HTTP_PORT', nextPort)
                    this.updateComposeNginxHostPortLiteral(composePath, port, nextPort)
                    this.updateWorkspaceNginxListenPort(path.dirname(composePath), nextPort)
                    this.logWarn(
                        `Detected allocated host port. Auto-switched NGINX ports to ${nextPort} in ${envFilePath} and retrying...`
                    )
                    continue
                }
                // eslint-disable-next-line no-await-in-loop
                const suggestion = await this.findNextAvailablePort(port)
                throw new Error(
                    `Host port ${port} is already in use. Update your .env (for example HOST_NGINX_HTTP_PORT=${suggestion}, NGINX_HTTP_PORT=${suggestion}) and retry.`
                )
            }
        }
    }

    /**
     * Simulate progress for long-running operations
     */
    private async simulateProgress<T>(
        operation: () => Promise<T>,
        label: string,
        totalSteps: number = 10
    ): Promise<T> {
        let currentStep = 0
        const stepInterval = 1000 // 1 second per step

        // Start progress simulation
        const progressInterval = setInterval(() => {
            if (currentStep < totalSteps) {
                currentStep += 1
                this.logProgress(currentStep, totalSteps, label)
            }
        }, stepInterval)

        try {
            const result = await operation()

            // Complete progress
            clearInterval(progressInterval)
            this.logProgress(totalSteps, totalSteps, `${label} completed`)

            return result
        } catch (error) {
            clearInterval(progressInterval)
            this.logError(`${label} failed at step ${currentStep}/${totalSteps}`)
            throw error
        }
    }

    /**
     * Check if Docker daemon is running and accessible
     * @returns Promise<{isRunning: boolean, error?: string, details?: string}>
     */
    async checkDockerDaemon(signal?: AbortSignal): Promise<DockerDaemonCheck> {
        if (!signal) {
            if (this.dockerDaemonCache && this.dockerDaemonCache.expiresAt > Date.now()) {
                return this.dockerDaemonCache.result
            }
            if (this.dockerDaemonCheckInFlight) return this.dockerDaemonCheckInFlight
        }

        const request = this.checkDockerDaemonUncached(signal)
        if (signal) return request

        this.dockerDaemonCheckInFlight = request
        try {
            const result = await request
            this.dockerDaemonCache = {
                expiresAt: Date.now() + this.dockerDaemonCacheTtlMs,
                result
            }
            return result
        } finally {
            this.dockerDaemonCheckInFlight = null
        }
    }

    private async checkDockerDaemonUncached(signal?: AbortSignal): Promise<DockerDaemonCheck> {
        this.logInfo('Checking Docker daemon status...')

        try {
            // Try to get Docker info
            const { stdout } = await execAsync('docker info', {
                timeout: 10000, // 10 second timeout
                maxBuffer: 1024 * 1024, // 1MB buffer
                signal
            })

            this.logSuccess('Docker daemon is running and accessible')
            this.logDebug(`Docker info: ${stdout.substring(0, 200)}...`)

            // If we get here, Docker daemon is running
            return { isRunning: true, details: stdout }
        } catch (error: unknown) {
            const errorMessage = String(
                (error as any).stderr || (error as any).stdout || (error as any).message || error
            )
            this.logError(`Docker daemon check failed: ${errorMessage}`)

            // Check for specific Docker daemon connection errors
            if (
                errorMessage.includes('Cannot connect to the Docker daemon') ||
                errorMessage.includes('docker.sock') ||
                errorMessage.includes('Connection refused')
            ) {
                if (errorMessage.toLowerCase().includes('permission denied')) {
                    this.logError('Docker daemon socket permission denied')
                    return {
                        isRunning: false,
                        error: 'Docker permission denied',
                        details:
                            'Current user cannot access /var/run/docker.sock. Add your user to the docker group or run with elevated privileges.'
                    }
                }
                this.logError('Docker daemon is not running')
                return {
                    isRunning: false,
                    error: 'Docker daemon is not running',
                    details: 'Please start Docker Desktop or the Docker daemon service'
                }
            }

            // Check for Docker not installed
            if (
                errorMessage.includes('command not found') ||
                errorMessage.includes('docker: not found')
            ) {
                this.logError('Docker is not installed')
                return {
                    isRunning: false,
                    error: 'Docker is not installed',
                    details: 'Please install Docker Desktop or Docker Engine'
                }
            }

            // Other errors
            this.logError(`Docker daemon check failed: ${errorMessage}`)
            return {
                isRunning: false,
                error: 'Docker daemon check failed',
                details: errorMessage
            }
        }
    }

    /**
     * Check if Docker is available and running before executing commands
     * @throws Error if Docker daemon is not running
     */
    private async ensureDockerRunning(signal?: AbortSignal): Promise<void> {
        this.logDebug('Ensuring Docker daemon is running...')
        const check = await this.checkDockerDaemon(signal)
        if (!check.isRunning) {
            this.logError(`Docker daemon is not running: ${check.error}. ${check.details}`)
            throw new Error(`Docker daemon is not running: ${check.error}. ${check.details}`)
        }
        this.logDebug('Docker daemon is confirmed to be running')
    }

    async loadComposeFile(composePath: string): Promise<DockerComposeConfig> {
        this.logInfo(`Loading Docker Compose file from: ${composePath}`)

        try {
            const fileContents = fs.readFileSync(composePath, 'utf8')
            this.logDebug(`Compose file size: ${fileContents.length} characters`)

            this.composeCache[composePath] = yaml.load(fileContents) as DockerComposeConfig

            const serviceCount = Object.keys(this.composeCache[composePath].services || {}).length
            this.logSuccess(`Successfully loaded compose file with ${serviceCount} services`)

            return this.composeCache[composePath]
        } catch (error: unknown) {
            this.logError(`Failed to load compose file: ${(error as any).message}`)
            throw error
        }
    }

    private prepareInitScript(projectPath: string): void {
        this.logInfo('Preparing initialization scripts...')
        const igrpStudioPath = path.join(projectPath, '.igrpstudio')

        try {
            // Find all .sh files recursively
            const shFiles = this.findShFilesRecursively(igrpStudioPath)
            this.logDebug(`Found ${shFiles.length} shell scripts to prepare`)

            if (shFiles.length === 0) {
                this.logWarn('No shell scripts found in .igrpstudio directory')
                return
            }

            for (let i = 0; i < shFiles.length; i++) {
                const scriptPath = shFiles[i]
                this.logProgress(
                    i + 1,
                    shFiles.length,
                    `Preparing script: ${path.basename(scriptPath)}`
                )

                // Read and normalize line endings
                let content = fs.readFileSync(scriptPath, 'utf8')
                content = content.replace(/\r\n/g, '\n')

                // Change shebang to #!/bin/sh for Alpine compatibility
                content = content.replace(/^#!\/bin\/bash/, '#!/bin/sh')

                fs.writeFileSync(scriptPath, content)

                // Set executable permissions
                if (process.platform !== 'win32') {
                    execSync(`chmod +x "${scriptPath}"`)
                }

                this.logDebug(`Prepared script: ${scriptPath}`)
            }

            this.logSuccess(`Successfully prepared ${shFiles.length} initialization scripts`)
        } catch (error: unknown) {
            this.logError(`Error preparing init scripts: ${error}`)
            throw error
        }
    }

    private findShFilesRecursively(directory: string): string[] {
        const shFiles: string[] = []

        const files = fs.readdirSync(directory)
        for (const file of files) {
            const fullPath = path.join(directory, file)
            const stat = fs.statSync(fullPath)

            if (stat.isDirectory()) {
                shFiles.push(...this.findShFilesRecursively(fullPath))
            } else if (file.endsWith('.sh')) {
                shFiles.push(fullPath)
            }
        }

        return shFiles
    }

    async executeComposeCommand(
        projectPath: string,
        command: string,
        service?: string,
        composeFilePath?: string,
        options?: { envFilePath?: string; signal?: AbortSignal }
    ): Promise<string> {
        this.logInfo(
            `Executing Docker Compose command: ${command}${service ? ` for service: ${service}` : ''}`
        )

        // Check if Docker daemon is running first
        await this.ensureDockerRunning(options?.signal)

        const composeFile = composeFilePath || path.join(projectPath, 'igrp-compose.yaml')
        const escapedComposeFile = escapePath(composeFile)
        const envFilePath = options?.envFilePath
        const escapedEnvFile = envFilePath ? escapePath(envFilePath) : null
        const serviceParam = service || ''

        this.logDebug(`Compose file: ${composeFile}`)
        this.logDebug(`Service parameter: ${serviceParam || 'all services'}`)

        if (command.trim().startsWith('up')) {
            await this.validateComposePortsBeforeUp(composeFile, envFilePath)
        }

        // Prepare the init script first
        this.prepareInitScript(projectPath)
        this.ensureWorkspaceHostInEnv(projectPath, envFilePath)
        this.ensureProcessEnvConsistency(projectPath, envFilePath)
        this.syncAccessManagementJwtIssuer(projectPath, envFilePath)
        this.syncKeycloakRealmFrontendUrl(projectPath, envFilePath)

        const fullCommand = [
            'docker compose',
            escapedEnvFile ? `--env-file ${escapedEnvFile}` : '',
            `-f ${escapedComposeFile}`,
            command,
            serviceParam
        ]
            .filter(Boolean)
            .join(' ')
            .trim()
        this.logDebug(`Full command: ${fullCommand}`)

        // Check if this is a pull command for progress tracking
        const isPullCommand = command.includes('pull') || command.includes('up')
        const isBuildCommand = command.includes('build')

        const tryExecute = async (): Promise<string> => {
            this.logInfo('Starting Docker Compose execution...')
            const startTime = Date.now()

            if (isPullCommand) {
                this.logInfo('Pulling Docker images...')
                this.logProgress(0, 100, 'Pulling images')
            } else if (isBuildCommand) {
                this.logInfo('Building Docker images...')
                this.logProgress(0, 100, 'Building images')
            }

            let stdout = ''
            let lastError: unknown
            const attempts = isPullCommand ? this.composeRetryAttempts : 1

            for (let attempt = 1; attempt <= attempts; attempt++) {
                try {
                    const result = await execAsync(fullCommand, {
                        maxBuffer: 1024 * 1024 * 10,
                        signal: options?.signal
                    })
                    stdout = result.stdout
                    lastError = undefined
                    break
                } catch (error: unknown) {
                    lastError = error
                    const stderr = (error as any).stderr || ''
                    const out = (error as any).stdout || ''
                    const raw = (error as any).message || ''
                    const combined = [stderr, out, raw].filter(Boolean).join('\n')

                    if (attempt < attempts && this.isTransientNetworkError(combined)) {
                        this.logWarn(
                            `Transient network error while pulling images (attempt ${attempt}/${attempts}). Retrying in ${this.composeRetryDelayMs}ms...`
                        )
                        await this.wait(this.composeRetryDelayMs)
                        continue
                    }

                    throw error
                }
            }

            if (lastError) {
                throw lastError
            }

            const duration = Date.now() - startTime

            if (isPullCommand) {
                this.logProgress(100, 100, 'Images pulled successfully')
                this.logSuccess(`Docker images pulled successfully in ${duration}ms`)
            } else if (isBuildCommand) {
                this.logProgress(100, 100, 'Images built successfully')
                this.logSuccess(`Docker images built successfully in ${duration}ms`)
            } else {
                this.logSuccess(`Docker Compose command completed successfully in ${duration}ms`)
            }

            this.logDebug(`Command output length: ${stdout.length} characters`)

            return stdout
        }

        try {
            return await tryExecute()
        } catch (error: unknown) {
            const duration = Date.now() - (Date.now() - 1000) // Approximate duration
            const stderr = (error as any).stderr || ''
            const stdout = (error as any).stdout || ''
            const rawMessage = (error as any).message || ''
            const errorMessage = [stderr, stdout, rawMessage].filter(Boolean).join('\n')

            if (isPullCommand) {
                this.logError(`Docker pull failed after ${duration}ms: ${errorMessage}`)
            } else if (isBuildCommand) {
                this.logError(`Docker build failed after ${duration}ms: ${errorMessage}`)
            } else {
                this.logError(`Docker Compose command failed after ${duration}ms: ${errorMessage}`)
            }

            // Check if the error is related to Docker daemon connection
            if (
                errorMessage.includes('Cannot connect to the Docker daemon') ||
                errorMessage.includes('docker.sock') ||
                errorMessage.includes('Connection refused')
            ) {
                if (errorMessage.toLowerCase().includes('permission denied')) {
                    this.logError('Docker daemon socket permission denied during command execution')
                    throw new Error(
                        'Docker permission denied: current user cannot access /var/run/docker.sock. Add your user to docker group or run with elevated privileges.'
                    )
                }
                this.logError('Docker daemon connection lost during command execution')
                throw new Error(
                    `Docker daemon is not running. Please start Docker Desktop or the Docker daemon service.`
                )
            }

            const lower = errorMessage.toLowerCase()
            if (
                lower.includes('unauthorized') ||
                lower.includes('authentication required') ||
                lower.includes('access denied') ||
                lower.includes('denied: requested access to the resource is denied') ||
                lower.includes('no basic auth credentials')
            ) {
                throw new Error(
                    'Docker registry authentication failed. Run `docker login registry.nosi.cv` in terminal and retry starting services.'
                )
            }

            this.logError(`Docker compose command failed: ${errorMessage}`)
            const compact = errorMessage
                .split('\n')
                .map((line) => line.trim())
                .filter(Boolean)
                .slice(-12)
                .join('\n')
            throw new Error(`Docker compose command failed:\n${compact}`)
        }
    }

    async up(projectPath: string): Promise<void> {
        this.logInfo('Starting Docker Compose services...')
        try {
            const composeFiles = this.getComposeDescriptors(projectPath)
            if (composeFiles.length === 0) {
                throw new Error('No compose file found (igrp-compose.yaml).')
            }

            for (const compose of composeFiles) {
                try {
                    await this.simulateProgress(
                        () =>
                            this.executeComposeCommand(
                                projectPath,
                                `up -d --quiet-pull`,
                                undefined,
                                compose.path,
                                { envFilePath: compose.envFilePath }
                            ),
                        `Starting ${compose.key} services and pulling images`,
                        15
                    )
                } catch (error: unknown) {
                    const errMsg = error instanceof Error ? error.message : String(error)
                    if (this.isTransientNetworkError(errMsg)) {
                        this.logWarn(
                            `Network timeout while pulling images for ${compose.key}. Trying to start with locally cached images (--no-build).`
                        )
                        await this.executeComposeCommand(
                            projectPath,
                            'up -d --no-build',
                            undefined,
                            compose.path,
                            { envFilePath: compose.envFilePath }
                        )
                        continue
                    }
                    throw error
                }
            }

            this.logSuccess('Docker Compose services started successfully')
            this.logInfo('Checking service status...')
            await this.status(projectPath)
        } catch (error: unknown) {
            this.logError(`Failed to start containers: ${(error as any).message}`)
            throw new Error(`Failed to start containers: ${(error as any).message}`)
        }
    }

    async upMainStack(projectPath: string, signal?: AbortSignal): Promise<void> {
        this.logInfo('Starting main stack from igrp-compose.yaml...')
        const composePath = path.join(projectPath, 'igrp-compose.yaml')
        const envPath = path.join(projectPath, '.env')
        if (!fs.existsSync(composePath)) {
            throw new Error('Main compose file not found: igrp-compose.yaml')
        }

        await this.executeComposeCommand(projectPath, 'up -d', undefined, composePath, {
            envFilePath: envPath,
            signal
        })
        await this.status(projectPath)
    }

    async deployProject(projectPath: string): Promise<void> {
        this.logInfo(`Deploying project Docker stack from: ${projectPath}`)
        this.sanitizeProjectSpringDatasourceConfig(projectPath)

        const workspaceProject = this.findWorkspaceByProjectPath(projectPath)
        if (workspaceProject?.workspacePath) {
            const workspaceComposePath = path.join(
                workspaceProject.workspacePath,
                'igrp-compose.yaml'
            )
            const workspaceEnvPath = path.join(workspaceProject.workspacePath, '.env')
            const workspaceProjectComposePath = path.join(
                workspaceProject.workspacePath,
                'projects',
                'igrp-projects-compose.yml'
            )
            if (fs.existsSync(workspaceComposePath)) {
                let serviceName = this.findWorkspaceServiceNameByProjectId(
                    workspaceComposePath,
                    workspaceProject.projectId
                )
                if (!serviceName) {
                    serviceName = this.findWorkspaceServiceNameByProjectMetadata(
                        workspaceComposePath,
                        workspaceProject.projectName,
                        projectPath
                    )
                }

                if (serviceName) {
                    this.logInfo(
                        `Deploying project via workspace compose service "${serviceName}" to keep it connected with IGRP stack.`
                    )
                    this.ensureProjectServiceJdbcEnv(
                        workspaceProject.workspacePath,
                        workspaceComposePath,
                        serviceName
                    )
                    this.removeHostPortBindingFromProjectDatabases(
                        workspaceComposePath,
                        serviceName
                    )
                    await this.executeComposeCommand(
                        workspaceProject.workspacePath,
                        `up -d --build ${serviceName}`,
                        undefined,
                        workspaceComposePath,
                        {
                            envFilePath: fs.existsSync(workspaceEnvPath)
                                ? workspaceEnvPath
                                : undefined
                        }
                    )
                    await this.status(workspaceProject.workspacePath)
                    return
                }
            }

            if (fs.existsSync(workspaceProjectComposePath)) {
                const projectComposeService = this.findProjectServiceInProjectCompose(
                    workspaceProjectComposePath,
                    workspaceProject.projectName,
                    projectPath
                )
                if (projectComposeService) {
                    this.logInfo(
                        `Deploying project via workspace projects compose service "${projectComposeService}".`
                    )
                    this.ensureProjectComposeIntegration(
                        workspaceProject.workspacePath,
                        workspaceProjectComposePath,
                        projectComposeService,
                        projectPath
                    )
                    const workspaceEnv = this.parseEnvFile(workspaceEnvPath)
                    const workspaceSlug =
                        workspaceEnv.WORKSPACE_SLUG ||
                        workspaceEnv.DOCKER_IP ||
                        path.basename(workspaceProject.workspacePath).trim()
                    const composeProjectName =
                        workspaceEnv.COMPOSE_PROJECT_NAME || `${workspaceSlug}-igrp`
                    await this.ensureDockerNetworkExists(`${composeProjectName}_default`)
                    await this.executeComposeCommand(
                        workspaceProject.workspacePath,
                        `up -d --build ${projectComposeService}`,
                        undefined,
                        workspaceProjectComposePath,
                        {
                            envFilePath: fs.existsSync(workspaceEnvPath)
                                ? workspaceEnvPath
                                : undefined
                        }
                    )
                    await this.status(workspaceProject.workspacePath)
                    return
                }
            }

            throw new Error(
                'Project service not found in workspace compose files (igrp-compose.yaml / projects/igrp-projects-compose.yml). Configure/add the project service first.'
            )
        }

        const composeCandidates = [
            path.join(projectPath, 'docker-compose.yml'),
            path.join(projectPath, 'docker-compose.yaml'),
            path.join(projectPath, 'compose.yml'),
            path.join(projectPath, 'compose.yaml'),
            path.join(projectPath, 'igrp-compose.yaml')
        ]

        const composePath = composeCandidates.find((candidate) => fs.existsSync(candidate))
        if (!composePath) {
            throw new Error(
                'No docker compose file found in project. Expected one of: docker-compose.yml, docker-compose.yaml, compose.yml, compose.yaml, igrp-compose.yaml'
            )
        }

        const envPath = path.join(projectPath, '.env')
        const envFilePath = fs.existsSync(envPath) ? envPath : undefined

        await this.executeComposeCommand(projectPath, 'up -d', undefined, composePath, {
            envFilePath
        })
    }

    async upMonitoringStack(projectPath: string): Promise<void> {
        this.logInfo('Starting monitoring stack from monitoring/igrp-monitoring-compose.yaml...')
        const composePath = path.join(projectPath, 'monitoring', 'igrp-monitoring-compose.yaml')
        const envPath = path.join(projectPath, 'monitoring', '.env_monitoring')
        if (!fs.existsSync(composePath)) {
            throw new Error(
                'Monitoring compose file not found: monitoring/igrp-monitoring-compose.yaml'
            )
        }

        await this.executeComposeCommand(projectPath, 'up -d', undefined, composePath, {
            envFilePath: envPath
        })
        await this.status(projectPath)
    }

    async upProcessStack(projectPath: string): Promise<void> {
        this.logInfo('Starting process stack from process/igrp-process-compose.yaml...')
        const composePath = path.join(projectPath, 'process', 'igrp-process-compose.yaml')
        const envPath = path.join(projectPath, 'process', '.env_process')
        if (!fs.existsSync(composePath)) {
            throw new Error('Process compose file not found: process/igrp-process-compose.yaml')
        }

        await this.executeComposeCommand(projectPath, 'up -d', undefined, composePath, {
            envFilePath: envPath
        })
        await this.status(projectPath)
    }

    async down(projectPath: string, dropVolume: boolean): Promise<void> {
        this.logInfo(
            `Stopping Docker Compose services${dropVolume ? ' and removing volumes' : ''}...`
        )
        try {
            const composeFiles = this.getComposeDescriptors(projectPath)
            if (composeFiles.length === 0) {
                throw new Error('No compose file found (igrp-compose.yaml).')
            }

            for (const compose of composeFiles) {
                const downArgs = dropVolume ? 'down --remove-orphans -v' : 'down --remove-orphans'
                await this.executeComposeCommand(projectPath, downArgs, undefined, compose.path, {
                    envFilePath: compose.envFilePath
                })
            }
            this.logSuccess(
                `Docker Compose services stopped successfully${dropVolume ? ' and volumes removed' : ''}`
            )
        } catch (error: unknown) {
            this.logError(`Failed to stop containers: ${(error as any).message}`)
            throw new Error(`Failed to stop containers: ${(error as any).message}`)
        }
    }

    async status(projectPath: string): Promise<ServiceInfo[]> {
        this.logInfo('Checking Docker Compose service status...')
        try {
            const dockerCheck = await this.checkDockerDaemon()
            if (!dockerCheck.isRunning) {
                // When Docker is offline, scanning every compose file and
                // emitting one warning per service on every 5-second refresh
                // can overwhelm the renderer. The UI already has the daemon
                // error; returning no live services is enough until Docker
                // becomes reachable again.
                this.logWarn(
                    `Docker daemon unavailable; skipping compose status: ${dockerCheck.error}`
                )
                return []
            }

            const composeFiles = this.getComposeDescriptors(projectPath)
            if (composeFiles.length === 0) {
                this.logWarn('No compose file found in workspace.')
                return []
            }

            const mergedServices = new Map<string, ServiceInfo>()

            for (const composeDescriptor of composeFiles) {
                const compose = await this.loadComposeFile(composeDescriptor.path)
                const allServices = compose.services || {}
                const volumes = compose.volumes
                const serviceNames = Object.keys(allServices)
                this.logDebug(
                    `Found ${serviceNames.length} services in ${composeDescriptor.key} compose: ${serviceNames.join(', ')}`
                )

                let runningServicesMap = new Map<string, any>()
                if (dockerCheck.isRunning) {
                    try {
                        const stdout = await this.executeComposeCommand(
                            projectPath,
                            'ps --format json',
                            undefined,
                            composeDescriptor.path,
                            { envFilePath: composeDescriptor.envFilePath }
                        )
                        const runningContainers = stdout
                            .trim()
                            .split('\n')
                            .filter((line) => line.trim())
                            .map((line) => JSON.parse(line))

                        runningServicesMap = new Map(
                            runningContainers.map((container) => [container.Service, container])
                        )
                    } catch (parseError) {
                        this.logError(
                            `Error parsing container info for ${composeDescriptor.key}: ${parseError}`
                        )
                    }
                }
                for (const serviceName of serviceNames) {
                    const serviceDef = allServices[serviceName]
                    const containerInfo = runningServicesMap.get(serviceName)
                    const { environment, depends_on, env_file, ...rest } = serviceDef
                    const processedVolumes = (serviceDef.volumes || []).map((volume) => {
                        if (typeof volume === 'string') {
                            const [volumeName] = volume.split(':')
                            const volumeConfig = volumes?.[volumeName]
                            if (volumeConfig?.driver) {
                                return `${volume}:${volumeConfig.driver}`
                            }
                        }
                        return volume
                    })

                    const baseInfo: ServiceInfo = {
                        ...rest,
                        name: serviceName,
                        dependsOn:
                            depends_on && !Array.isArray(depends_on)
                                ? [depends_on]
                                : depends_on || [],
                        environments: this.parseEnvironmentToArray(environment),
                        env_file: this.parseEnvFileToArray(env_file),
                        volumes: processedVolumes,
                        composeFile: composeDescriptor.path,
                        stack: composeDescriptor.key
                    }

                    if (containerInfo) {
                        mergedServices.set(serviceName, {
                            ...baseInfo,
                            status: containerInfo.State,
                            ports:
                                containerInfo.Publishers?.map(
                                    (p: any) => `${p.PublishedPort}:${p.TargetPort}`
                                ) || [],
                            createdAt: containerInfo.CreatedAt,
                            statusMessage: containerInfo.Status
                        })
                    } else {
                        mergedServices.set(serviceName, {
                            ...baseInfo,
                            status: 'stopped'
                        })
                    }
                }
            }

            this.logSuccess(`Status check completed for ${mergedServices.size} services`)
            return Array.from(mergedServices.values())
        } catch (error: unknown) {
            this.logError(`Error getting status: ${(error as any).message}`)
            return []
        }
    }

    /**
     * Stop specific services (containers remain but are stopped)
     * @param projectPath Path to the project
     * @param services Array of service names to stop
     */
    async stop(projectPath: string, services: string[]): Promise<void> {
        this.logInfo(`Stopping services: ${services.join(', ')}`)
        try {
            const composeFiles = this.getComposeDescriptors(projectPath)
            for (const composeDescriptor of composeFiles) {
                const compose = await this.loadComposeFile(composeDescriptor.path)
                const composeServiceNames = Object.keys(compose.services || {})
                const scopedServices = services.filter((name) => composeServiceNames.includes(name))
                if (scopedServices.length === 0) {
                    continue
                }
                await this.executeComposeCommand(
                    projectPath,
                    `stop ${scopedServices.join(' ')}`,
                    undefined,
                    composeDescriptor.path,
                    { envFilePath: composeDescriptor.envFilePath }
                )
            }
            this.logSuccess(`Successfully stopped services: ${services.join(', ')}`)
        } catch (error: unknown) {
            this.logError(`Failed to stop services: ${(error as any).message}`)
            throw new Error(`Failed to stop services: ${(error as any).message}`)
        }
    }

    /**
     * Restart specific services
     * @param projectPath Path to the project
     * @param services Array of service names to restart
     * @param timeout Optional timeout in seconds for shutdown
     */
    async restart(projectPath: string, services: string[], timeout?: number): Promise<void> {
        this.logInfo(
            `Restarting services: ${services.join(', ')}${timeout ? ` with ${timeout}s timeout` : ''}`
        )
        try {
            const composeFiles = this.getComposeDescriptors(projectPath)
            for (const composeDescriptor of composeFiles) {
                const compose = await this.loadComposeFile(composeDescriptor.path)
                const composeServiceNames = Object.keys(compose.services || {})
                const scopedServices = services.filter((name) => composeServiceNames.includes(name))
                if (scopedServices.length === 0) {
                    continue
                }
                await this.executeComposeCommand(
                    projectPath,
                    `up -d ${scopedServices.join(' ')}`,
                    undefined,
                    composeDescriptor.path,
                    { envFilePath: composeDescriptor.envFilePath }
                )
            }
            this.logSuccess(`Successfully restarted services: ${services.join(', ')}`)
        } catch (error: unknown) {
            this.logError(`Failed to restart services: ${(error as any).message}`)
            throw new Error(`Failed to restart services: ${(error as any).message}`)
        }
    }

    private parseEnvFileToArray(envFile?: string | string[]): { file: string }[] {
        // Fallback para um array vazio
        if (!envFile) {
            return []
        }
        // Se for uma string, converte para um array
        const files = Array.isArray(envFile) ? envFile : [envFile]
        // Mapeia as entradas garantindo o formato correto
        return files.map((file) => ({ file: file.trim() }))
    }

    private parseEnvironmentToArray(
        env?: string[] | Array<{ key: string; value: string }>
    ): Array<{ key: string; value: string }> {
        if (!env) return []

        // Case 1: Already in correct format (array of {name, value} objects)
        if (env.length > 0 && typeof env[0] === 'object' && 'name' in env[0]) {
            return env as Array<{ key: string; value: string }>
        }

        // Case 2: Array of strings in "KEY=VALUE" format (including ${VARIABLE} syntax)
        if (env.length > 0 && typeof env[0] === 'string') {
            return (env as string[]).map((item) => {
                const [name, ...valueParts] = item.split('=')
                const value = valueParts.join('=') // Handle values containing '='

                // Preserve the ${VARIABLE} syntax in the value
                return {
                    key: name.trim(),
                    value: value.trim()
                }
            })
        }

        return []
    }

    async logs(projectPath: string, service?: string): Promise<string> {
        this.logInfo(`Retrieving logs${service ? ` for service: ${service}` : ' for all services'}`)
        try {
            const logs = await this.executeComposeCommand(projectPath, 'logs --no-color', service)
            this.logSuccess(`Successfully retrieved logs${service ? ` for ${service}` : ''}`)
            return logs
        } catch (error: unknown) {
            this.logError(`Failed to retrieve logs: ${(error as any).message}`)
            throw error
        }
    }

    async build(projectPath: string): Promise<void> {
        this.logInfo('Building Docker Compose services...')
        try {
            // Use progress simulation for build operations
            await this.simulateProgress(
                () => this.executeComposeCommand(projectPath, 'build'),
                'Building Docker images',
                20 // 20 steps for a typical build operation
            )

            this.logSuccess('Docker Compose services built successfully')
        } catch (error: unknown) {
            this.logError(`Failed to build services: ${(error as any).message}`)
            throw error
        }
    }

    /**
     * Pull Docker images with progress tracking
     */
    async pull(projectPath: string): Promise<void> {
        this.logInfo('Pulling Docker images...')
        try {
            // Use progress simulation for pull operations
            await this.simulateProgress(
                () => this.executeComposeCommand(projectPath, 'pull'),
                'Pulling Docker images',
                25 // 25 steps for a typical pull operation
            )

            this.logSuccess('Docker images pulled successfully')
        } catch (error: unknown) {
            this.logError(`Failed to pull images: ${(error as any).message}`)
            throw error
        }
    }
}

export const dockerService = new DockerService()
