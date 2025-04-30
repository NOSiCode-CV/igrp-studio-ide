import { app } from 'electron';
import fs from 'fs';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { FrameworkType, IWorkspace, ProjectData } from '../types';
import { addProjectToWorkspace, addServiceToWorkspace, newWorkspace as engineNewWorkspace, removeProjectFromWorkspace, removeServiceFromWorkspace, saveCustomWorkspaceComposeFile, updateProjectToWorkspace, updateServiceToWorkspace } from '@igrp/igrp-studio-nextjs-engine';
import { EngineFactory } from '../engines/EngineFactory';
import { ProjectWorkspace, ServiceWorkspace, WorkspaceService } from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';

const WORKSPACE_FILE = path.join(app.getPath('userData'), 'igrpstudio.workspaces.json');
const BACKUP_DIR = path.join(app.getPath('userData'), 'backups');

export class WorkspaceRepository {

    private async ensureFileExists(filePath: string, defaultContent: string): Promise<void> {
        if (!fs.existsSync(filePath)) {
            await writeFile(filePath, defaultContent);
        }
    }

    private async loadData(): Promise<{ workspaces: IWorkspace[] }> {
        await this.ensureFileExists(WORKSPACE_FILE, JSON.stringify({ workspaces: [] }, null, 2));
        const data = await readFile(WORKSPACE_FILE, 'utf-8');
        return data ? JSON.parse(data) : { workspaces: [] }
    }

    private async saveData(data: { workspaces: IWorkspace[] }): Promise<void> {
        await writeFile(WORKSPACE_FILE, JSON.stringify(data, null, 2));
    }

    async initialize(): Promise<void> {
        await this.ensureFileExists(WORKSPACE_FILE, JSON.stringify({ workspaces: [] }, null, 2));
        if (!fs.existsSync(BACKUP_DIR)) {
            await mkdir(BACKUP_DIR, { recursive: true });
        }
    }

    // Workspace CRUD Operations
    async createWorkspace(workspace: Omit<IWorkspace, 'id' | 'createdAt' | 'projects'>): Promise<IWorkspace> {
        const data = await this.loadData();
        const newWorkspace: IWorkspace = {
            ...workspace,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            projects: []
        };

        const { path, createdAt, ...baseConfigWorkspace } = newWorkspace;

        data.workspaces.push(newWorkspace);

        try {
            await engineNewWorkspace({ ...baseConfigWorkspace }, workspace.path)
        } catch (error) {
            throw error
        }
        await this.saveData(data);

        return newWorkspace;
    }

    async updateWorkspace(id: string, updates: Partial<IWorkspace>): Promise<IWorkspace | null> {
        const data = await this.loadData();
        const workspace = data.workspaces.find(w => w.id === id);

        if (!workspace) {
            return null
        }

        const updatedWorkspace = {
            ...workspace,
            ...updates,
            updatedAt: new Date().toISOString()
        };

        const index = data.workspaces.indexOf(workspace);
        data.workspaces[index] = updatedWorkspace;

        await this.saveData(data);
        return updatedWorkspace;
    }

    async deleteWorkspace(id: string): Promise<void> {
        const data = await this.loadData();
        const initialLength = data.workspaces.length;
        data.workspaces = data.workspaces.filter(w => w.id !== id);

        if (data.workspaces.length === initialLength) {
            throw new Error(`Workspace ${id} not found`);
        }

        await this.saveData(data);
    }

    // Método para obter o workspace ativo baseado na data
    async getLastAccessedWorkspace(): Promise<IWorkspace | null> {
        const workspaces = await this.listWorkspaces();
        if (workspaces.length === 0) return null;

        // Ordena por: 1. último acesso, 2. data de modificação, 3. data de criação
        return [...workspaces].sort((a, b) => {
            const aLastAccess = new Date(a.updatedAt || a.createdAt);
            const bLastAccess = new Date(b.updatedAt || b.createdAt);
            return bLastAccess.getTime() - aLastAccess.getTime();
        })[0];
    }

    // Project CRUD Operations
    async addProject(workspaceId: string, project: Omit<ProjectData, 'id' | 'createdAt' | 'workspaceId'>): Promise<ProjectData> {

        const data = await this.loadData();
        const workspace = data.workspaces.find(w => w.id === workspaceId);

        if (!workspace) {
            throw new Error(`Workspace ${workspaceId} not found`);
        }

        const newProject: ProjectData = {
            ...project,
            id: uuidv4(),
            workspaceId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await this.addProjectToStudioWorkspace(workspace, newProject, false);

        const engine = EngineFactory.getEngine(project.framework);
        await engine.createProject(newProject, project.path);

        workspace.projects = workspace.projects || [];
        workspace.projects.push(newProject);
        workspace.updatedAt = new Date().toISOString();

        await this.saveData(data);
        return newProject;
    }

    async addProjectToStudioWorkspace(workspace: IWorkspace, newProject: ProjectData, move: boolean) {

        const { config, id: projectId, framework } = newProject

        const { path: workspacePath, id: workspaceId } = workspace

        const workspaceConfig: ProjectWorkspace = {
            config: { ...config, id: projectId, type: framework },
            id: workspaceId,
        }

        //call engine
        await addProjectToWorkspace(workspaceConfig, workspacePath);

        if (move)
            await this.validateAndMoveProject(newProject, workspacePath)

    }

    async updateProject(projectId: string, updates: Partial<ProjectData>): Promise<ProjectData> {
        const data = await this.loadData();
        let foundProject: ProjectData | undefined;
        const { config: project, workspaceId, framework, path, type } = updates;

        for (const workspace of data.workspaces) {
            const projectIndex = workspace.projects?.findIndex(p => p.id === projectId) ?? -1;
            if (projectIndex !== -1 && workspace.projects) {
                const updatedProject = {
                    ...workspace.projects[projectIndex],
                    ...updates,
                    updatedAt: new Date().toISOString()
                };
                workspace.projects[projectIndex] = updatedProject;
                workspace.updatedAt = new Date().toISOString();
                foundProject = updatedProject;
                break;
            }
        }

        if (!foundProject) {
            const workspace = data.workspaces.find(w => w.id === workspaceId);

            if (!workspace) {
                throw new Error(`Workspace ${workspaceId} not found`);
            }

            if ((!framework || !project.name)) {
                throw new Error(`Invalid project configuration`);
            }

            const updatedProject: ProjectData = {
                name: project.name || 'Unnamed Project',
                path: path as string,
                type,
                workspaceId: workspaceId as string,
                framework: framework as FrameworkType,
                updatedAt: new Date().toISOString(),
                id: uuidv4(),
                config: project || {},
            };

            workspace.projects?.push(updatedProject as ProjectData);

            workspace.updatedAt = new Date().toISOString();

            console.log(updatedProject)

            await this.addProjectToStudioWorkspace(workspace, updatedProject, true);

            foundProject = updatedProject;

        }

        await this.saveData(data);

        return foundProject;
    }

    async configureService(config: ProjectWorkspace, basePath: string): Promise<void> {

        const { id: workspaceId, service, config: projectData } = config

        const { config: projectDataConfig, id: projectId, framework } = projectData

        const data = await this.loadData();

        const workspace = data.workspaces.find(w => w.id === workspaceId);

        if (!workspace) {
            throw new Error(`Workspace ${workspaceId} not found`);
        }

        const projectConfig: ProjectWorkspace = {
            config: { ...projectDataConfig, id: projectId, type: framework },
            service,
            id: workspaceId,
        }

        await updateProjectToWorkspace(projectConfig, basePath);

        const projectIndex = workspace.projects?.findIndex(p => p.id === projectId) ?? -1;
        workspace.projects = workspace.projects ?? [];
        workspace.projects[projectIndex] = {
            ...workspace.projects[projectIndex],
            id: projectId,
            config: projectDataConfig,
            service,
            updatedAt: new Date().toISOString()
        };

        this.updateWorkspace(workspaceId, workspace)
    }

    async deleteProject(projectId: string, basePath: string): Promise<void> {
        const data = await this.loadData();
        let deleted = false;

        for (const workspace of data.workspaces) {
            if (workspace.projects) {
                const initialLength = workspace.projects.length;
                workspace.projects = workspace.projects.filter(p => p.id !== projectId);
                if (workspace.projects.length !== initialLength) {
                    workspace.updatedAt = new Date().toISOString();
                    deleted = true;
                    break;
                }
            }
        }

        await removeProjectFromWorkspace(projectId, basePath);

        if (!deleted) {
            throw new Error(`Project ${projectId} not found`);
        }

        await this.saveData(data);
    }

    async saveCustomCompose(yaml: object, basePath: string) {
        await saveCustomWorkspaceComposeFile(yaml, basePath)
    }

    async addService(serviceWorkspace: ServiceWorkspace, basePath: string) {
        const data = await this.loadData();
        const workspace = data.workspaces.find(w => w.id === serviceWorkspace.id);

        if (!workspace) {
            throw new Error(`Workspace ${serviceWorkspace.id} not found`);
        }

        const serviceId = uuidv4();
        const newService = {
            ...serviceWorkspace.service,
            id: serviceId,
            properties: {
                ...serviceWorkspace.service.properties,
                labels: serviceWorkspace.service.properties?.labels?.map(label =>
                    label.key === "uuid"
                        ? { ...label, value: serviceId }
                        : label
                ) || []
            }
        };
        workspace.services = workspace?.services || [];
        workspace.services.push(newService);

        await addServiceToWorkspace({ ...serviceWorkspace, service: newService }, basePath)

        await this.saveData(data);

    }

    async deleteService(serviceId: string, basePath: string) {

        const data = await this.loadData();
        let deleted = false;

        for (const workspace of data.workspaces) {
            if (workspace.services) {
                const initialLength = workspace.services.length;
                workspace.services = workspace.services.filter(p => p.id !== serviceId);
                if (workspace.services.length !== initialLength) {
                    workspace.updatedAt = new Date().toISOString();
                    deleted = true;
                    break;
                }
            }
        }

        await removeServiceFromWorkspace(serviceId, basePath)

        if (!deleted) {
            throw new Error(`Project ${serviceId} not found`);
        }

        await this.saveData(data);
    }

    async updateService(config: ServiceWorkspace, basePath: string) {

        const data = await this.loadData();
        let foundService: WorkspaceService | undefined;
        const { service } = config

        for (const workspace of data.workspaces) {
            const serviceIndex = workspace.services?.findIndex(p => p.id === service.id) ?? -1;
            if (serviceIndex !== -1 && workspace.services) {
                const updatedService = {
                    ...workspace.services[serviceIndex],
                    ...service,
                    updatedAt: new Date().toISOString()
                };
                workspace.services[serviceIndex] = updatedService;
                workspace.updatedAt = new Date().toISOString();
                foundService = updatedService;
                break;
            }
        }

        await updateServiceToWorkspace(config, basePath)

        await this.saveData(data);

        return foundService;
    }

    async listServices(workspaceId: string): Promise<WorkspaceService[]> {
        const data = await this.loadData();
        const workspace = data.workspaces.find(w => w.id === workspaceId);
        return workspace?.services || [];
    }

    // Query Methods
    async getWorkspace(id: string): Promise<IWorkspace | undefined> {
        const data = await this.loadData();
        return data.workspaces.find(w => w.id === id);
    }

    async getProject(id: string): Promise<ProjectData | undefined> {
        const data = await this.loadData();
        for (const workspace of data.workspaces) {
            const project = workspace.projects?.find(p => p.id === id);
            if (project) return project;
        }
        return undefined;
    }

    async listWorkspaces(): Promise<IWorkspace[]> {
        const { workspaces } = await this.loadData();
        return workspaces;
    }

    async listProjects(workspaceId: string): Promise<ProjectData[]> {
        const data = await this.loadData();
        const workspace = data.workspaces.find(w => w.id === workspaceId);
        return workspace?.projects?.sort((a, b) => {
            const dateA = new Date(a.updatedAt || a.createdAt || '1970-01-01T00:00:00Z');
            const dateB = new Date(b.updatedAt || b.createdAt || '1970-01-01T00:00:00Z');
            return dateB.getTime() - dateA.getTime();
        }) || [];
    }

    async getRecentWorkspaces(limit = 5): Promise<IWorkspace[]> {
        const workspaces = await this.listWorkspaces();
        return workspaces
            .sort((a, b) => {
                const dateA = new Date(a.updatedAt || a.createdAt);
                const dateB = new Date(b.updatedAt || b.createdAt);
                return dateB.getTime() - dateA.getTime();
            })
            .slice(0, limit);
    }

    async getRecentProjects(workspaceId: string, limit = 5): Promise<ProjectData[]> {
        const projects: any = await this.listProjects(workspaceId);
        return projects
            .sort((a, b) => {
                const dateA = new Date(a.updatedAt || a.createdAt);
                const dateB = new Date(b.updatedAt || b.createdAt);
                return dateB.getTime() - dateA.getTime();
            })
            .slice(0, limit);
    }

    async validateAndMoveProject(project: ProjectData, workspacePath: string): Promise<void> {
        // Expected project path pattern: <workspacePath>/projects/<projectName>
        const expectedPath = path.join(workspacePath, 'projects', project.config.name);

        // If project is already in correct location, do nothing
        if (project.path === expectedPath) {
            return;
        }

        // Create projects directory if it doesn't exist
        const projectsDir = path.join(workspacePath, 'projects');
        if (!fs.existsSync(projectsDir)) {
            await fs.promises.mkdir(projectsDir, { recursive: true });
        }

        // Check if target directory already exists
        if (fs.existsSync(expectedPath)) {
            throw new Error(`Target directory ${expectedPath} already exists`);
        }

        // Move the project
        try {
            await fs.promises.cp(project.path, expectedPath, { recursive: true });
            await fs.promises.rm(project.path, { recursive: true, force: true });
            project.path = expectedPath;
            project.updatedAt = new Date().toISOString();
        } catch (error: any) {
            throw new Error(`Failed to move project: ${error.message}`);
        }
    }

    // Backup Methods
    async backupData(backupPath?: string): Promise<void> {
        const targetPath = backupPath || path.join(BACKUP_DIR, `backup-${new Date().toISOString()}.json`);
        const data = await this.loadData();
        await writeFile(targetPath, JSON.stringify(data, null, 2));
    }

    async restoreData(backupPath: string): Promise<void> {
        const backupData = await readFile(backupPath, 'utf-8');
        await writeFile(WORKSPACE_FILE, backupData);
    }
}