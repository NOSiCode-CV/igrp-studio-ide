import { ipcMain } from 'electron'
import { ERROR_CODES, EVENTS } from '../constants/events'
import { dockerService } from '../services/docker-service'
import type { ServiceInfo } from '../types'

// IPC Handlers
ipcMain.handle(EVENTS.DOCKER.UP, async (event, projectPath: string): Promise<void> => {
    try {
        await dockerService.up(projectPath)
    } catch (error: any) {
        event.sender.send(EVENTS.LOG, {
            code: ERROR_CODES.ERROR,
            message: error.message
        })
        throw error
    }
})

ipcMain.handle(
    EVENTS.DOCKER.DOWN,
    async (event, projectPath: string, options: { dropVolume: boolean }): Promise<void> => {
        try {
            const { dropVolume } = options || {}
            await dockerService.down(projectPath, dropVolume)
        } catch (error: any) {
            event.sender.send(EVENTS.LOG, {
                code: ERROR_CODES.ERROR,
                message: error.message
            })
            throw error
        }
    }
)

ipcMain.handle(EVENTS.DOCKER.STATUS, async (event, projectPath: string): Promise<ServiceInfo[]> => {
    try {
        return await dockerService.status(projectPath)
    } catch (error: any) {
        event.sender.send(EVENTS.LOG, {
            code: ERROR_CODES.ERROR,
            message: error.message
        })
        throw error
    }
})

ipcMain.handle(
    EVENTS.DOCKER.STOP,
    async (
        event,
        projectPath: string,
        options: { services: string[]; timeout?: number }
    ): Promise<void> => {
        try {
            const { services } = options || {}
            await dockerService.stop(projectPath, services)
        } catch (error: any) {
            event.sender.send(EVENTS.LOG, {
                code: ERROR_CODES.ERROR,
                message: error.message
            })
            throw error
        }
    }
)

ipcMain.handle(
    EVENTS.DOCKER.RESTART,
    async (
        event,
        projectPath: string,
        options: { services: string[]; timeout?: number }
    ): Promise<void> => {
        try {
            const { services, timeout } = options || {}
            await dockerService.restart(projectPath, services, timeout)
        } catch (error: any) {
            event.sender.send(EVENTS.LOG, {
                code: ERROR_CODES.ERROR,
                message: error.message
            })
            throw error
        }
    }
)

ipcMain.handle(EVENTS.DOCKER.CHECK, async () => {
    try {
        const check = await dockerService.checkDockerDaemon()
        return check.isRunning
    } catch (err) {
        return false
    }
})

ipcMain.handle(EVENTS.DOCKER.DAEMON_STATUS, async () => {
    try {
        return await dockerService.checkDockerDaemon()
    } catch (err) {
        return {
            isRunning: false,
            error: 'Failed to check Docker daemon status',
            details: err instanceof Error ? err.message : 'Unknown error'
        }
    }
})

// Test logging functionality
ipcMain.handle('docker-test-logging', async () => {
    try {
        dockerService.testLogging()
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
})
