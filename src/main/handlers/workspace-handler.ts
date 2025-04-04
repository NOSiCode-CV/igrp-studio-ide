import { ipcMain } from 'electron';
import { IWorkspace, ProjectData } from '../types';
import { WorkspaceRepository } from '../repo/workspace-repository';
import { ERROR_CODES, EVENTS } from '../constants/events';

const repo = new WorkspaceRepository();


// Initialize repository
ipcMain.handle(EVENTS.REPOSITORY.INITIALIZE, async () => {
    try {
        await repo.initialize();
    } catch (error) {
        console.error('Repository initialization failed:', error);
        throw error;
    }
});

// Workspace Handlers

ipcMain.handle(EVENTS.REPOSITORY.WORKSPACE.GET_CURRENT, async (event) => {
    try {
        return await repo.getLastAccessedWorkspace();
    } catch (error) {
        console.error('Workspace get last access failed:', error);

        event.sender.send(EVENTS.ERROR, {
            code: ERROR_CODES.WORKSPACE.CREATE_FAILED,
            message: error instanceof Error ? error.message : 'Failed to get last access failed:'
        });
        throw error;
    }
});

ipcMain.handle(EVENTS.REPOSITORY.WORKSPACE.CREATE, async (event, workspace: Omit<IWorkspace, 'id' | 'createdAt'>) => {
    try {
        return await repo.createWorkspace(workspace);
    } catch (error) {
        console.error('Workspace creation failed:', error);
        event.sender.send(EVENTS.ERROR, {
            code: ERROR_CODES.WORKSPACE.CREATE_FAILED,
            message: error instanceof Error ? error.message : 'Failed to create workspace'
        });
        throw error;
    }
});

ipcMain.handle(EVENTS.REPOSITORY.WORKSPACE.UPDATE, async (event, id: string, updates: Partial<IWorkspace>) => {
    try {
        return await repo.updateWorkspace(id, updates);
    } catch (error) {
        console.error('Workspace update failed:', error);
        event.sender.send(EVENTS.ERROR, {
            code: ERROR_CODES.WORKSPACE.UPDATE_FAILED,
            message: error instanceof Error ? error.message : 'Failed to update workspace'
        });
        throw error;
    }
});

ipcMain.handle(EVENTS.REPOSITORY.WORKSPACE.DELETE, async (event, id: string) => {
    try {
        await repo.deleteWorkspace(id);
    } catch (error) {
        console.error('Workspace deletion failed:', error);
        event.sender.send(EVENTS.ERROR, {
            code: ERROR_CODES.WORKSPACE.DELETE_FAILED,
            message: error instanceof Error ? error.message : 'Failed to delete workspace'
        });
        throw error;
    }
});

ipcMain.handle(EVENTS.REPOSITORY.WORKSPACE.GET, async (event, id: string) => {
    try {
        return await repo.getWorkspace(id);
    } catch (error) {
        console.error('Workspace fetch failed:', error);
        event.sender.send(EVENTS.ERROR, {
            code: ERROR_CODES.WORKSPACE.NOT_FOUND,
            message: error instanceof Error ? error.message : 'Workspace not found'
        });
        return null;
    }
});

ipcMain.handle(EVENTS.REPOSITORY.WORKSPACE.FIND_ALL, async () => {
    try {
        return await repo.listWorkspaces();
    } catch (error) {
        console.error('Failed to fetch workspaces:', error);
        return [];
    }
});

ipcMain.handle(EVENTS.REPOSITORY.WORKSPACE.FIND_RECENT, async (_, limit = 5) => {
    try {
        return await repo.getRecentWorkspaces(limit);
    } catch (error) {
        console.error('Failed to fetch recent workspaces:', error);
        return [];
    }
});

// Project Handlers
ipcMain.handle(EVENTS.REPOSITORY.PROJECT.CREATE, async (event, workspaceId: string, project: Omit<ProjectData, 'id' | 'createdAt'>) => {
    try {
        return await repo.addProject(workspaceId, project);
    } catch (error) {
        console.error('Project creation failed:', error);
        event.sender.send(EVENTS.ERROR, {
            code: ERROR_CODES.PROJECT.CREATE_FAILED,
            message: error instanceof Error ? error.message : 'Failed to create project'
        });
        throw error;
    }
});

ipcMain.handle(EVENTS.REPOSITORY.PROJECT.UPDATE, async (event, projectId: string, updates: Partial<ProjectData>) => {
    try {
        return await repo.updateProject(projectId, updates);
    } catch (error) {
        console.error('Project update failed:', error);
        event.sender.send(EVENTS.ERROR, {
            code: ERROR_CODES.PROJECT.UPDATE_FAILED,
            message: error instanceof Error ? error.message : 'Failed to update project'
        });
        throw error;
    }
});

ipcMain.handle(EVENTS.REPOSITORY.PROJECT.DELETE, async (event, projectId: string) => {
    try {
        await repo.deleteProject(projectId);
    } catch (error) {
        console.error('Project deletion failed:', error);
        event.sender.send(EVENTS.ERROR, {
            code: ERROR_CODES.PROJECT.DELETE_FAILED,
            message: error instanceof Error ? error.message : 'Failed to delete project'
        });
        throw error;
    }
});

ipcMain.handle(EVENTS.REPOSITORY.PROJECT.GET, async (event, projectId: string) => {
    try {
        return await repo.getProject(projectId);
    } catch (error) {
        console.error('Project fetch failed:', error);
        event.sender.send(EVENTS.ERROR, {
            code: ERROR_CODES.PROJECT.NOT_FOUND,
            message: error instanceof Error ? error.message : 'Project not found'
        });
        return null;
    }
});

ipcMain.handle(EVENTS.REPOSITORY.PROJECT.FIND_ALL, async (_, workspaceId?: string) => {
    try {
        return workspaceId ? await repo.listProjects(workspaceId) : []
    } catch (error) {
        console.error('Failed to fetch projects:', error);
        return [];
    }
});

ipcMain.handle(EVENTS.REPOSITORY.PROJECT.FIND_RECENT, async (_, limit = 5) => {
    try {
        return await repo.getRecentProjects(limit);
    } catch (error) {
        console.error('Failed to fetch recent projects:', error);
        return [];
    }
});

// Backup Handlers
ipcMain.handle(EVENTS.REPOSITORY.BACKUP.CREATE, async (event, backupPath?: string) => {
    try {
        await repo.backupData(backupPath);
    } catch (error) {
        console.error('Backup failed:', error);
        event.sender.send(EVENTS.ERROR, {
            code: ERROR_CODES.BACKUP.FAILED,
            message: error instanceof Error ? error.message : 'Failed to create backup'
        });
        throw error;
    }
});

ipcMain.handle(EVENTS.REPOSITORY.BACKUP.RESTORE, async (event, backupPath: string) => {
    try {
        await repo.restoreData(backupPath);
    } catch (error) {
        console.error('Restore failed:', error);
        event.sender.send(EVENTS.ERROR, {
            code: ERROR_CODES.BACKUP.RESTORE_FAILED,
            message: error instanceof Error ? error.message : 'Failed to restore backup'
        });
        throw error;
    }
});