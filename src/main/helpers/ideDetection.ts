// utils/ideDetection.ts
import { exec } from 'child_process';
import { promisify } from 'util';

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
            } catch {}
        })
    );

    return installedIDEs;
}
