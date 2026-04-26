import { ipcMain } from 'electron'
import { exec } from 'node:child_process'
import fs from 'fs'
import path from 'path'
import { EVENTS } from '../constants/events'
import { IGRPStudioSettings } from '../helpers/igrp-studio-settings'
import { DoctorService } from '../services/doctor-service'
import type { BPMNConfig, ToolCheck } from '../types'

ipcMain.handle('theme:get', async () => {
    return IGRPStudioSettings.getActiveTheme()
})

ipcMain.handle('theme:set', async (_event, theme: string) => {
    IGRPStudioSettings.setActiveTheme(theme)
    return true
})

ipcMain.handle('run-doctor-checks', async (): Promise<ToolCheck[]> => {
    return DoctorService.run()
})

ipcMain.handle('install-igrp-cli', async () => {
    const command =
        'npm install -g @igrp/cli --registry=https://sonatype.nosi.cv/repository/npm-group/'

    try {
        const result = await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
            exec(command, { timeout: 10 * 60 * 1000 }, (error, stdout, stderr) => {
                if (error) {
                    reject(
                        new Error(
                            stderr?.trim() ||
                                stdout?.trim() ||
                                error.message ||
                                'Failed to install @igrp/cli'
                        )
                    )
                    return
                }
                resolve({ stdout, stderr })
            })
        })

        return {
            success: true,
            output: [result.stdout, result.stderr].filter(Boolean).join('\n').trim()
        }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to install @igrp/cli'
        }
    }
})

// Save project icon file
ipcMain.handle('save-project-icon', async (_event, { filePath, fileData, assetsPath }) => {
    try {
        // Ensure assets directory exists
        await fs.promises.mkdir(assetsPath, { recursive: true })

        // Convert ArrayBuffer to Buffer and save file
        const buffer = Buffer.from(fileData)
        await fs.promises.writeFile(filePath, buffer)

        return { success: true }
    } catch (error) {
        console.error('Error saving project icon:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
})

// Get icon file data for secure serving
ipcMain.handle('get-icon-file', async (_event, iconPath, workspacePath) => {
    try {
        let fullPath: string

        if (iconPath.startsWith('icons/')) {
            // For centralized icons, use the workspace path
            fullPath = path.join(workspacePath, iconPath)
        } else if (iconPath.startsWith('assets/')) {
            // For legacy assets, we need the project path
            // This is more complex and would need the project context
            return {
                success: false,
                error: 'Legacy assets paths not supported in this version'
            }
        } else {
            return { success: false, error: 'Invalid icon path format' }
        }

        if (!fs.existsSync(fullPath)) {
            return { success: false, error: 'File not found' }
        }

        // Read file and return as base64 for secure serving
        const fileBuffer = fs.readFileSync(fullPath)
        const base64Data = fileBuffer.toString('base64')

        // Determine MIME type from file extension
        const ext = path.extname(fullPath).toLowerCase()
        const mimeTypes: { [key: string]: string } = {
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml'
        }

        const mimeType = mimeTypes[ext] || 'image/png'

        return {
            success: true,
            data: `data:${mimeType};base64,${base64Data}`,
            mimeType
        }
    } catch (error) {
        console.error('Error reading icon file:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
})

// BPMN Settings IPC Handlers
ipcMain.handle(EVENTS.BPMN.GET_CONFIGS, async () => {
    try {
        const configs = await IGRPStudioSettings.getBPMNConfigs()
        return configs
    } catch (error) {
        console.error('Error getting BPMN configs:', error)
        return { configs: [], activeConfigId: undefined }
    }
})

ipcMain.handle(EVENTS.BPMN.GET_CONFIG, async () => {
    try {
        const config = await IGRPStudioSettings.getBPMNConfig()
        return config
    } catch (error) {
        console.error('Error getting BPMN config:', error)
        return null
    }
})

ipcMain.handle(EVENTS.BPMN.ADD_CONFIG, async (_event, config: BPMNConfig) => {
    try {
        await IGRPStudioSettings.addBPMNConfig(config)
        return { success: true }
    } catch (error) {
        console.error('Error adding BPMN config:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
})

ipcMain.handle(EVENTS.BPMN.UPDATE_CONFIG, async (_event, config: BPMNConfig) => {
    try {
        await IGRPStudioSettings.updateBPMNConfig(config)
        return { success: true }
    } catch (error) {
        console.error('Error updating BPMN config:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
})

ipcMain.handle(EVENTS.BPMN.DELETE_CONFIG, async (_event, configId: string) => {
    try {
        await IGRPStudioSettings.deleteBPMNConfig(configId)
        return { success: true }
    } catch (error) {
        console.error('Error deleting BPMN config:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
})

ipcMain.handle(EVENTS.BPMN.SET_ACTIVE_CONFIG, async (_event, configId: string) => {
    try {
        await IGRPStudioSettings.setActiveBPMNConfig(configId)
        return { success: true }
    } catch (error) {
        console.error('Error setting active BPMN config:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
})

ipcMain.handle(EVENTS.BPMN.DELETE_ALL_CONFIGS, async () => {
    try {
        await IGRPStudioSettings.deleteAllBPMNConfigs()
        return { success: true }
    } catch (error) {
        console.error('Error deleting all BPMN configs:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
})

// Language Settings IPC Handlers
ipcMain.handle(EVENTS.LANGUAGE.GET_LANGUAGE, () => {
    try {
        return IGRPStudioSettings.getLanguage()
    } catch (error) {
        console.error('Error getting language:', error)
        return 'en' // fallback to default
    }
})

ipcMain.handle(EVENTS.LANGUAGE.SET_LANGUAGE, (_event, lang: string) => {
    try {
        IGRPStudioSettings.setLanguage(lang)
        return lang // Return the new language for confirmation
    } catch (error) {
        console.error('Error setting language:', error)
        return 'en' // fallback to default
    }
})

ipcMain.handle(EVENTS.ONBOARDING.GET_WELCOME_COMPLETED, () => {
    try {
        return IGRPStudioSettings.getWelcomeOnboardingCompleted()
    } catch (error) {
        console.error('Error getting welcome onboarding flag:', error)
        return false
    }
})

ipcMain.handle(EVENTS.ONBOARDING.SET_WELCOME_COMPLETED, (_event, completed: boolean) => {
    try {
        IGRPStudioSettings.setWelcomeOnboardingCompleted(Boolean(completed))
        return true
    } catch (error) {
        console.error('Error setting welcome onboarding flag:', error)
        return false
    }
})

// BPMN Project Preference IPC Handlers
ipcMain.handle(EVENTS.BPMN.SET_SELECTED_PROJECT, async (_event, projectId: string) => {
    try {
        await IGRPStudioSettings.setSelectedBPMNProject(projectId)
        return { success: true }
    } catch (error) {
        console.error('Error setting selected BPMN project:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
})

ipcMain.handle(EVENTS.BPMN.GET_SELECTED_PROJECT, async () => {
    try {
        const projectId = await IGRPStudioSettings.getSelectedBPMNProject()
        return projectId
    } catch (error) {
        console.error('Error getting selected BPMN project:', error)
        return undefined
    }
})

// BPMN Process Preference IPC Handlers
ipcMain.handle(EVENTS.BPMN.SET_SELECTED_PROCESS, async (_event, processDefinitionId: string) => {
    try {
        await IGRPStudioSettings.setSelectedBPMNProcess(processDefinitionId)
        return { success: true }
    } catch (error) {
        console.error('Error setting selected BPMN process:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
})

ipcMain.handle(EVENTS.BPMN.GET_SELECTED_PROCESS, async () => {
    try {
        const processDefinitionId = await IGRPStudioSettings.getSelectedBPMNProcess()
        return processDefinitionId
    } catch (error) {
        console.error('Error getting selected BPMN process:', error)
        return undefined
    }
})

/**
 * Update a page's parentName field directly on its `.igrpstudio` JSON.
 * Used by the Move action in the page browser — the operation is purely
 * metadata so we skip the engine round-trip and just rewrite the file.
 */
ipcMain.handle(
    'page:set-parent',
    async (_event, jsonPath: string, parentName: string | null) => {
        try {
            const raw = await fs.promises.readFile(jsonPath, 'utf-8')
            const data = JSON.parse(raw) as Record<string, unknown>
            if (parentName) data.parentName = parentName
            else delete data.parentName
            await fs.promises.writeFile(
                jsonPath,
                `${JSON.stringify(data, null, 2)}\n`,
                'utf-8'
            )
            return { success: true as const }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error'
            console.error('Failed to update page parent:', message)
            return { success: false as const, error: message }
        }
    }
)
