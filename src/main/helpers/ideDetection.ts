// utils/ideDetection.ts
import { exec } from 'child_process';
import { promisify } from 'util';
import { BrowserWindow } from 'electron';
import { ERROR_CODES, EVENTS } from '../constants/events';

export interface IDEDetails {
    command: string;
    name: string;
    detectionCommand?: string;
    icon?: string;
}

// utils/ideConfig.ts
interface IDEConfig {
    [key: string]: IDEDetails;
}

export const IDES: IDEConfig = {
    vscode: {
        command: 'code',
        name: 'VS Code',
        detectionCommand: 'code --version',
        icon: 'Code',
    },
    intellij: {
        command: 'idea',
        name: 'IntelliJ IDEA',
        detectionCommand: 'idea --version',
        icon: 'Lightbulb',
    },
    sublime: {
        command: 'subl',
        name: 'Sublime Text',
        detectionCommand: 'subl --version',
        icon: 'Type', // or "FileText" depending on your icon set
    },
    cursor: {
        command: 'cursor',
        name: 'Cursor',
        detectionCommand: 'cursor --version',
        icon: 'MousePointer2', // or "Pointer" depending on your icon set
    },
};

const execAsync = promisify(exec);

export async function detectInstalledIDEs(): Promise<
    Array<{ key: string; config: IDEDetails }>
> {
    const installedIDEs: Array<{ key: string; config: IDEDetails }> = [];

    await Promise.all(
        Object.entries(IDES).map(async ([ideKey, ideConfig]) => {
            try {
                if (ideConfig.detectionCommand) {
                    await execAsync(ideConfig.detectionCommand);
                    installedIDEs.push({ key: ideKey, config: ideConfig });
                }
            } catch (error: any) {
                console.error(`Error detecting ${ideKey} IDE:`, error.message);

                // Send log to renderer process
                const mainWindow = BrowserWindow.getFocusedWindow();
                if (mainWindow) {
                    mainWindow.webContents.send(EVENTS.LOG, {
                        code: ERROR_CODES.ERROR,
                        message: `Error detecting ${ideKey} IDE: ${error.message}`,
                    });
                }
            }
        })
    );

    return installedIDEs;
}
