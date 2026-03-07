import {
    addProjectToWorkspace,
    addServiceToWorkspace,
    newWorkspace as engineNewWorkspace,
    removeProjectFromWorkspace,
    removeServiceFromWorkspace,
    saveCustomWorkspaceComposeFile,
    updateProjectToWorkspace,
    updateServiceToWorkspace
} from '@igrp/igrp-studio-nextjs-engine'
import type {
    ProjectWorkspace,
    ServiceWorkspace,
    WorkspaceService
} from '@igrp/igrp-studio-nextjs-engine/types'
import { app } from 'electron'
import fs from 'fs'
import { mkdir, readFile, writeFile } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { EngineFactory } from '../engines/EngineFactory'
import type { FrameworkType, HandlerResponse, IWorkspace, ProjectData } from '../types'

const WORKSPACE_FILE = path.join(app.getPath('userData'), 'igrpstudio.workspaces.json')
const BACKUP_DIR = path.join(app.getPath('userData'), 'backups')

export class WorkspaceRepository {
    private async ensureFileExists(filePath: string, defaultContent: string): Promise<void> {
        if (!fs.existsSync(filePath)) {
            await writeFile(filePath, defaultContent)
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
        workspace: Omit<IWorkspace, 'id' | 'createdAt' | 'projects'>
    ): Promise<IWorkspace> {
        const data = await this.loadData()
        const newWorkspace: IWorkspace = {
            ...workspace,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            projects: []
        }

        const { path, createdAt, ...baseConfigWorkspace } = newWorkspace

        data.workspaces.push(newWorkspace)

        try {
            await engineNewWorkspace({ ...baseConfigWorkspace }, workspace.path)
        } catch (error) {
            throw error
        }
        await this.saveData(data)

        return newWorkspace
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
            //call engine
            await addProjectToWorkspace(workspaceConfig, workspacePath)
        } else {
            console.log(`Project "${config.name}" already exists in workspace. Skipping addition.`)
        }

        if (move) {
            const result = await this.validateAndMoveProject(newProject, workspacePath)
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

            await this.addProjectToStudioWorkspace(workspace, updatedProject, true)

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
        return (
            workspace?.projects?.sort((a, b) => {
                const dateA = new Date(a.updatedAt || a.createdAt || '1970-01-01T00:00:00Z')
                const dateB = new Date(b.updatedAt || b.createdAt || '1970-01-01T00:00:00Z')
                return dateB.getTime() - dateA.getTime()
            }) || []
        )
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

    async validateAndMoveProject(
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

        // Move the project
        try {
            await fs.promises.cp(project.path, expectedPath, {
                recursive: true
            })
            await fs.promises.rm(project.path, {
                recursive: true,
                force: true
            })
            project.path = expectedPath
            project.updatedAt = new Date().toISOString()
        } catch (error: any) {
            throw new Error(`Failed to move project: ${error.message}`)
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
