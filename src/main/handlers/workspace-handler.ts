import { ipcMain } from 'electron';
import { IWorkspace, ProjectData } from '../types';
import { WorkspaceRepository } from '../repo/workspace-repository';
import { ERROR_CODES, EVENTS } from '../constants/events';
import { handleWithCustomErrors } from '../helpers';

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

ipcMain.handle(EVENTS.REPOSITORY.WORKSPACE.CREATE, async (_event, workspace: Omit<IWorkspace, 'id' | 'createdAt'>) => {
    try {
        return await repo.createWorkspace(workspace);
    } catch (error) {
        console.error('Workspace creation failed:', error);
        /*  event.sender.send(EVENTS.ERROR, {
             code: ERROR_CODES.WORKSPACE.CREATE_FAILED,
             message: error instanceof Error ? error.message : 'Failed to create workspace'
         }); */
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
handleWithCustomErrors(EVENTS.REPOSITORY.PROJECT.CREATE, async (_event, workspaceId: string, project: Omit<ProjectData, 'id' | 'createdAt'>) => {
    return await repo.addProject(workspaceId, project);
});

ipcMain.handle(EVENTS.REPOSITORY.PROJECT.UPDATE, async (_, projectId: string, updates: Partial<ProjectData>) => {
    return await repo.updateProject(projectId, updates);
});

ipcMain.handle(EVENTS.REPOSITORY.PROJECT.DELETE, async (_, projectId: string, basePath: string) => {
    await repo.deleteProject(projectId, basePath);
});

ipcMain.handle(EVENTS.REPOSITORY.PROJECT.GET, async (_, projectId: string) => {
    return await repo.getProject(projectId);
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
    return await repo.getRecentProjects(limit);
});

// Backup Handlers
ipcMain.handle(EVENTS.REPOSITORY.BACKUP.CREATE, async (event, backupPath?: string) => {
    try {
        await repo.backupData(backupPath);
    } catch (error: any) {
        console.error('Backup failed:', error);
        event.sender.send(EVENTS.ERROR, {
            code: ERROR_CODES.BACKUP.FAILED,
            message: error
        });
        throw error;
    }
});

ipcMain.handle(EVENTS.REPOSITORY.BACKUP.RESTORE, async (event, backupPath: string) => {
    try {
        await repo.restoreData(backupPath);
    } catch (error: any) {
        console.error('Restore failed:', error);
        event.sender.send(EVENTS.ERROR, {
            code: ERROR_CODES.BACKUP.RESTORE_FAILED,
            message: error
        });
        throw error;
    }
});