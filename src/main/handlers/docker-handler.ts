import { ipcMain } from "electron";
import { ContainerInfo } from "../helpers/docker/types";
import { dockerService } from "../helpers/docker/docker";
import Docker from 'dockerode';


// IPC Handlers
ipcMain.handle('docker-up', async (_event, projectPath: string): Promise<ContainerInfo[]> => {
    return await dockerService.up(projectPath);
});

ipcMain.handle('docker-down', async (_event, projectPath: string): Promise<ContainerInfo[]> => {
    return await dockerService.down(projectPath);
});

ipcMain.handle('docker-status', async (_event, projectPath: string): Promise<ContainerInfo[]> => {
    return await dockerService.status(projectPath);
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
