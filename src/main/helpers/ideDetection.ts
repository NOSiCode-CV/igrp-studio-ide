// utils/ideDetection.ts
import { exec } from 'child_process'
import * as os from 'os'
import path from 'path'
import { promisify } from 'util'

export interface IDEDetails {
    command: string
    name: string
    icon?: string
}

// utils/ideConfig.ts
interface IDEConfig {
    [key: string]: IDEDetails
}

export const IDES: IDEConfig = {
    vscode: {
        command: 'code',
        name: 'VS Code',
        icon: 'Code'
    },
    intellij: {
        command: 'idea',
        name: 'IntelliJ IDEA',
        icon: 'Lightbulb'
    },
    sublime: {
        command: 'subl',
        name: 'Sublime Text',
        icon: 'Type' // or "FileText" depending on your icon set
    },
    cursor: {
        command: 'cursor',
        name: 'Cursor',
        icon: 'MousePointer2' // or "Pointer" depending on your icon set
    }
}

const execAsync = promisify(exec)

// GUI-launched Electron apps inherit a minimal PATH on macOS/Linux (no
// /usr/local/bin, Homebrew or JetBrains Toolbox launcher dirs), so IDE
// launchers installed there would never be found when the Studio is
// started from Finder/Dock. Extend PATH for detection and for opening.
export function getShellEnv(): NodeJS.ProcessEnv {
    if (process.platform === 'win32') return process.env

    const extraDirs = [
        '/usr/local/bin',
        '/opt/homebrew/bin',
        path.join(os.homedir(), '.local', 'bin'),
        path.join(os.homedir(), 'Library/Application Support/JetBrains/Toolbox/scripts')
    ]
    const current = (process.env.PATH || '').split(path.delimiter).filter(Boolean)
    const merged = [...current, ...extraDirs.filter((dir) => !current.includes(dir))]
    return { ...process.env, PATH: merged.join(path.delimiter) }
}

// Checks that a launcher exists on PATH WITHOUT executing it. Running the
// launcher to probe it (e.g. `idea --version`) is not safe: JetBrains'
// `idea` treats any invocation as "open the IDE" and boots IntelliJ.
async function isCommandAvailable(command: string): Promise<boolean> {
    const probe =
        process.platform === 'win32' ? `where ${command}` : `command -v ${command}`
    try {
        await execAsync(probe, { env: getShellEnv() })
        return true
    } catch {
        // Non-zero exit simply means "not installed" — expected, not an error.
        return false
    }
}

export async function detectInstalledIDEs(): Promise<Array<{ key: string; config: IDEDetails }>> {
    const results = await Promise.all(
        Object.entries(IDES).map(async ([key, config]) => ({
            key,
            config,
            installed: await isCommandAvailable(config.command)
        }))
    )
    return results.filter((r) => r.installed).map(({ key, config }) => ({ key, config }))
}
