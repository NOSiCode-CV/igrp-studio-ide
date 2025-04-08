import { app } from 'electron';
import fs from 'fs';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { IWorkspace, ProjectData } from '../types';
import { newWorkspace as engineNewWorkspace } from '@igrp/igrp-studio-nextjs-engine';
import { EngineFactory } from '../engines/EngineFactory';

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
            await engineNewWorkspace({ ...baseConfigWorkspace, id: Math.random().toString(36).slice(2, 12) }, workspace.path)
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

        const engine = EngineFactory.getEngine(project.framework);
        
        await engine.createProject(newProject, project.path);

        workspace.projects = workspace.projects || [];
        workspace.projects.push(newProject);
        workspace.updatedAt = new Date().toISOString();

        await this.saveData(data);
        return newProject;
    }

    async updateProject(projectId: string, updates: Partial<ProjectData>): Promise<ProjectData> {
        const data = await this.loadData();
        let foundProject: ProjectData | undefined;

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
            throw new Error(`Project ${projectId} not found`);
        }

        await this.saveData(data);
        return foundProject;
    }

    async deleteProject(projectId: string): Promise<void> {
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

        if (!deleted) {
            throw new Error(`Project ${projectId} not found`);
        }

        await this.saveData(data);
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
        return workspace?.projects || [];
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