import { type ChildProcess, exec } from 'child_process'
import { BrowserWindow } from 'electron'
import fs from 'fs'
import path from 'path'

class NextJsManager {
    private mainWindow: BrowserWindow
    private nextProcess: ChildProcess | null = null
    private previewWindow: BrowserWindow | null = null
    private nextAppPath: string | null = null

    constructor(mainWindow: BrowserWindow, nextAppPath: string | null = null) {
        this.mainWindow = mainWindow
        this.nextAppPath = nextAppPath
    }

    public setNextJsPath(nextAppPath: string): void {
        this.nextAppPath = nextAppPath
        this.sendLog(`Path set: ${nextAppPath}`)
    }

    public startNextJsServer(): void {
        if (!this.nextAppPath) {
            this.sendLog('Error: No path defined for the Next.js application.')
            return
        }

        const nodeModulesPath = path.join(this.nextAppPath, 'node_modules')
        if (!fs.existsSync(nodeModulesPath)) {
            this.sendLog('node_modules not found. Installing dependencies...')
            this.installDependencies()
        } else {
            this.runNextJsDevServer()
        }
    }

    private installDependencies(): void {
        if (!this.nextAppPath) {
            this.sendLog('Error: No path defined for the Next.js application.')
            return
        }

        const yarnLockPath = path.join(this.nextAppPath, 'yarn.lock')
        const pnpmLockPath = path.join(this.nextAppPath, 'pnpm-lock.yaml')
        const npmLockPath = path.join(this.nextAppPath, 'package-lock.json')

        let installCommand = 'yarn install' // Default to yarn (project package manager)

        if (fs.existsSync(yarnLockPath)) {
            installCommand = 'yarn install'
        } else if (fs.existsSync(pnpmLockPath)) {
            installCommand = 'pnpm install'
        } else if (fs.existsSync(npmLockPath)) {
            installCommand = 'npm install'
        }

        this.sendLog(`Using ${installCommand} to install dependencies...`)

        exec(installCommand, { cwd: this.nextAppPath }, (error, _stdout, _stderr) => {
            if (error) {
                this.sendLog(`Error installing dependencies: ${error.message}`)
                return
            }
            this.sendLog('Dependencies installed successfully.')
            this.runNextJsDevServer()
        })
    }

    private runNextJsDevServer(): void {
        if (!this.nextAppPath) {
            this.sendLog('Error: No path defined for the Next.js application.')
            return
        }

        this.sendLog('Starting Next.js...')
        this.nextProcess = exec(
            'npx next dev -p 3001',
            { cwd: this.nextAppPath },
            (error, stdout, _stderr) => {
                if (error) {
                    this.sendLog(`Error starting Next.js: ${error.message}`)
                    return
                }
                this.sendLog(`Next.js started: ${stdout}`)
            }
        )

        if (this.nextProcess) {
            this.nextProcess.stdout?.on('data', (data) => this.sendLog(data))
            this.nextProcess.stderr?.on('data', (data) => this.sendLog(data))
        }
    }

    public stopNextJsServer(): void {
        if (this.nextProcess) {
            this.nextProcess.kill()
            this.sendLog('Next.js stopped.')
        }
    }

    public openPreviewWindow(pageName?: string): void {
        if (this.previewWindow) {
            this.previewWindow.focus()
            this.previewWindow.reload()
            return
        }

        this.previewWindow = new BrowserWindow({
            width: 1200,
            height: 800,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true
            }
        })

        const url = pageName ? `http://localhost:3001/pages/${pageName}` : 'http://localhost:3001'
        this.previewWindow.loadURL(url)

        this.previewWindow.on('closed', () => {
            this.previewWindow = null
        })
    }

    private sendLog(message: string): void {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send('log', {
                code: 'INFO',
                message
            })
        }
    }
}

export default NextJsManager
