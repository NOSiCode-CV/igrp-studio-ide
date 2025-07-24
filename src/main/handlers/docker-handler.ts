import { ipcMain } from "electron";
import { ServiceInfo } from "../types";
import { dockerService } from "../services/docker-service";
import { ERROR_CODES, EVENTS } from "../constants/events";

// IPC Handlers
ipcMain.handle('docker-up', async (event, projectPath: string): Promise<void> => {
    try {
        await dockerService.up(projectPath);
    } catch (error: any) {
        event.sender.send(EVENTS.LOG, {
            code: ERROR_CODES.ERROR,
            message: error.message
        });
        throw error
    }
});

ipcMain.handle('docker-down', async (event, projectPath: string, options: { dropVolume: boolean }): Promise<void> => {
    try {
        const { dropVolume } = options || {}
        await dockerService.down(projectPath, dropVolume);
    } catch (error: any) {
        event.sender.send(EVENTS.LOG, {
            code: ERROR_CODES.ERROR,
            message: error.message
        });
        throw error
    }
});

ipcMain.handle('docker-status', async (event, projectPath: string): Promise<ServiceInfo[]> => {
    try {
        return await dockerService.status(projectPath);
    } catch (error: any) {
        event.sender.send(EVENTS.LOG, {
            code: ERROR_CODES.ERROR,
            message: error.message
        });
        throw error
    }
});

ipcMain.handle('docker-stop', async (event, projectPath: string, options: { services: string[]; timeout?: number }): Promise<void> => {
    try {
        const { services } = options || {}
        await dockerService.stop(projectPath, services);

    } catch (error: any) {
        event.sender.send(EVENTS.LOG, {
            code: ERROR_CODES.ERROR,
            message: error.message
        });
        throw error
    }
});

ipcMain.handle('docker-restart', async (event, projectPath: string, options: { services: string[]; timeout?: number }): Promise<void> => {
    try {
        const { services, timeout } = options || {}
        await dockerService.restart(projectPath, services, timeout);

    } catch (error: any) {
        event.sender.send(EVENTS.LOG, {
            code: ERROR_CODES.ERROR,
            message: error.message
        });
        throw error
    }
});

ipcMain.handle('docker-check', async () => {
    try {
        const check = await dockerService.checkDockerDaemon();
        return check.isRunning;
    } catch (err) {
        return false;
    }
});

ipcMain.handle('docker-daemon-status', async () => {
    try {
        return await dockerService.checkDockerDaemon();
    } catch (err) {
        return {
            isRunning: false,
            error: 'Failed to check Docker daemon status',
            details: err instanceof Error ? err.message : 'Unknown error'
        };
    }
});
