import { ipcMain } from "electron";
import Docker from 'dockerode';
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

ipcMain.handle('docker-down', async (event, projectPath: string): Promise<void> => {
    try {
        await dockerService.down(projectPath);
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

ipcMain.handle('docker-stop', async (event, projectPath: string, services: string[]): Promise<void> => {
    try {
        await dockerService.stop(projectPath, services);

    } catch (error: any) {
        event.sender.send(EVENTS.LOG, {
            code: ERROR_CODES.ERROR,
            message: error.message
        });
        throw error
    }
});

ipcMain.handle('docker-restart', async (event, projectPath: string, services: string[],
    timeout?: number): Promise<void> => {
    try {
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
        const docker = new Docker();
        await docker.ping();
        return true;
    } catch (err) {
        return false;
    }
});
