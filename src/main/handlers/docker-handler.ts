import { ipcMain } from "electron";
import Docker from 'dockerode';
import { ServiceInfo } from "../types";
import { dockerService } from "../services/docker-service";


// IPC Handlers
ipcMain.handle('docker-up', async (_event, projectPath: string): Promise<void> => {
    await dockerService.up(projectPath);
});

ipcMain.handle('docker-down', async (_event, projectPath: string): Promise<void> => {
    await dockerService.down(projectPath);
});

ipcMain.handle('docker-status', async (_event, projectPath: string): Promise<ServiceInfo[]> => {
    return await dockerService.status(projectPath);
});

ipcMain.handle('docker-stop', async (_event, projectPath: string, services: string[]): Promise<void> => {
    await dockerService.stop(projectPath, services);
});

ipcMain.handle('docker-restart', async (_event, projectPath: string, services: string[],
    timeout?: number): Promise<void> => {
    await dockerService.restart(projectPath, services, timeout);
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
