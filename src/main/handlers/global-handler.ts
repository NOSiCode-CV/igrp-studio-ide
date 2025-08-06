import { ipcMain } from "electron";
import { IGRPStudioSettings } from "../helpers/igrp-studio-settings";
import { DoctorService } from "../services/doctor-service";
import { ToolCheck, BPMNConfig } from "../types";
import { EVENTS } from "../constants/events";
import fs from 'fs';
import path from "path";

ipcMain.handle('theme:get', async () => {
    return IGRPStudioSettings.getActiveTheme();
});

ipcMain.handle('theme:set', async (_event, theme: string) => {
    IGRPStudioSettings.setActiveTheme(theme);
    return true;
});


ipcMain.handle('run-doctor-checks', async (): Promise<ToolCheck[]> => {
    return DoctorService.run()
});

// Save project icon file
ipcMain.handle('save-project-icon', async (_event, { filePath, fileData, assetsPath }) => {
    try {
        
        // Ensure assets directory exists
        await fs.promises.mkdir(assetsPath, { recursive: true });
        
        // Convert ArrayBuffer to Buffer and save file
        const buffer = Buffer.from(fileData);
        await fs.promises.writeFile(filePath, buffer);
        
        return { success: true };
    } catch (error) {
        console.error('Error saving project icon:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
});

// Get icon file data for secure serving
ipcMain.handle('get-icon-file', async (_event, iconPath, workspacePath) => {
    try {
        
        let fullPath: string;
        
        if (iconPath.startsWith('icons/')) {
            // For centralized icons, use the workspace path
            fullPath = path.join(workspacePath, iconPath);
        } else if (iconPath.startsWith('assets/')) {
            // For legacy assets, we need the project path
            // This is more complex and would need the project context
            return { success: false, error: 'Legacy assets paths not supported in this version' };
        } else {
            return { success: false, error: 'Invalid icon path format' };
        }
        
        if (!fs.existsSync(fullPath)) {
            return { success: false, error: 'File not found' };
        }
        
        // Read file and return as base64 for secure serving
        const fileBuffer = fs.readFileSync(fullPath);
        const base64Data = fileBuffer.toString('base64');
        
        // Determine MIME type from file extension
        const ext = path.extname(fullPath).toLowerCase();
        const mimeTypes: { [key: string]: string } = {
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml'
        };
        
        const mimeType = mimeTypes[ext] || 'image/png';
        
        return { 
            success: true, 
            data: `data:${mimeType};base64,${base64Data}`,
            mimeType 
        };
    } catch (error) {
        console.error('Error reading icon file:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
});

// BPMN Settings IPC Handlers
ipcMain.handle(EVENTS.BPMN.GET_CONFIGS, async () => {
    try {
        const configs = await IGRPStudioSettings.getBPMNConfigs();
        return configs;
    } catch (error) {
        console.error('Error getting BPMN configs:', error);
        return { configs: [], activeConfigId: undefined };
    }
});

ipcMain.handle(EVENTS.BPMN.GET_CONFIG, async () => {
    try {
        const config = await IGRPStudioSettings.getBPMNConfig();
        return config;
    } catch (error) {
        console.error('Error getting BPMN config:', error);
        return null;
    }
});

ipcMain.handle(EVENTS.BPMN.ADD_CONFIG, async (_event, config: BPMNConfig) => {
    try {
        await IGRPStudioSettings.addBPMNConfig(config);
        return { success: true };
    } catch (error) {
        console.error('Error adding BPMN config:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
});

ipcMain.handle(EVENTS.BPMN.UPDATE_CONFIG, async (_event, config: BPMNConfig) => {
    try {
        await IGRPStudioSettings.updateBPMNConfig(config);
        return { success: true };
    } catch (error) {
        console.error('Error updating BPMN config:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
});

ipcMain.handle(EVENTS.BPMN.DELETE_CONFIG, async (_event, configId: string) => {
    try {
        await IGRPStudioSettings.deleteBPMNConfig(configId);
        return { success: true };
    } catch (error) {
        console.error('Error deleting BPMN config:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
});

ipcMain.handle(EVENTS.BPMN.SET_ACTIVE_CONFIG, async (_event, configId: string) => {
    try {
        await IGRPStudioSettings.setActiveBPMNConfig(configId);
        return { success: true };
    } catch (error) {
        console.error('Error setting active BPMN config:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
});

ipcMain.handle(EVENTS.BPMN.DELETE_ALL_CONFIGS, async () => {
    try {
        await IGRPStudioSettings.deleteAllBPMNConfigs();
        return { success: true };
    } catch (error) {
        console.error('Error deleting all BPMN configs:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
});

// Language Settings IPC Handlers
ipcMain.handle(EVENTS.LANGUAGE.GET_LANGUAGE, () => {
    try {
        return IGRPStudioSettings.getLanguage();
    } catch (error) {
        console.error('Error getting language:', error);
        return 'en'; // fallback to default
    }
});

ipcMain.handle(EVENTS.LANGUAGE.SET_LANGUAGE, (_event, lang: string) => {
    try {
        IGRPStudioSettings.setLanguage(lang);
        return lang; // Return the new language for confirmation
    } catch (error) {
        console.error('Error setting language:', error);
        return 'en'; // fallback to default
    }
});

