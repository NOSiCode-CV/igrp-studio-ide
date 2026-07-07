// Must come first so process.env is populated before any module that reads
// env vars at top-level evaluation (e.g. git-auth's DEV_PORT capture).
import './helpers/env'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { exec } from 'child_process'
import {
    app,
    BrowserWindow,
    dialog,
    type IpcMainInvokeEvent,
    ipcMain,
    screen,
    shell
} from 'electron'
import fs from 'fs'
import * as os from 'os'
import dns from 'node:dns'
import path, { join } from 'path'
import * as pty from 'node-pty'
import icon from '../../resources/icon.png?asset'
import {
    checkAndReadBaseApi,
    getFileContent,
    getJsonContent,
    openDirectory,
    readDirectory,
    readIgrpStudioDirectory,
    readProjectFile
} from './helpers'
import { buildGitAuth, getProviderConfigById } from './helpers/git-auth/git-auth-factory'
import { githubAuth } from './helpers/git-auth/github-auth'
import { gitlabAuth } from './helpers/git-auth/gitlab-auth'
import { initMainSentryEarly, initializeLogger, sendErrorReport } from './helpers/logger'
import { registerPowerRecovery } from './helpers/power-recovery'
import { closeApp, installExtensions } from './helpers/utils'
import { GitStore } from './services/git-store'
import { GitHubService } from './services/github-service'
import { GitLabService } from './services/gitlab-service'
import type { FileTree, IOpenProject } from './types'

import './handlers/api-handler'
import './handlers/db-handler'
import './handlers/workspace-handler'
import './handlers/git-handler'
import './handlers/app-logic-handlers'
import './handlers/docker-handler'
import './handlers/global-handler'
import './handlers/graphql/graphql-manifest.handler'
import './handlers/markitdown-handler'
import './handlers/spec-kb-handler'
import './handlers/spec-doc-handler'
import './handlers/spec-llm-handler'
import './handlers/spec-prototype-handler'
import './handlers/spec-data-handler'
import { prototypeDevServer } from './services/prototype/prototype-dev-server'
import './helpers/fetch-request'

import { initComponents } from '@igrp/igrp-studio-nextjs-engine'
import dotenv from 'dotenv'
import { autoUpdater } from 'electron-updater'
import { mainBindings } from 'i18next-electron-fs-backend'
import { NextjsEngine } from './engines/NextjsEngine'
import { SpringEngine } from './engines/SpringEngine'
import AppUpdater, { applyUpdateChannelConfig } from './helpers/electron-updater'
import { detectInstalledIDEs, getShellEnv, type IDEDetails, IDES } from './helpers/ideDetection'
import { IGRPStudioSettings } from './helpers/igrp-studio-settings'
import NextJsManager from './helpers/nextjsManager'
import { buildTaskbar } from './helpers/taskbar'
import { folderWatcher } from './helpers/watch-folder'
import { WorkspaceRepository } from './services/workspace-service'

let mainWindow: BrowserWindow
const ptySessions = new Map<string, pty.IPty>()

let nextJsManager: NextJsManager
let currentAuthProvider: 'github' | 'gitlab' | null = null
/**
 * Tracks the GitAuth instance that initiated the in-flight OAuth flow.
 * When set it is used to handle the protocol callback so dynamic configs
 * (e.g. GitHub Enterprise instances saved via the UI) can complete the
 * round-trip alongside the env-based singletons.
 */
let activeAuthInstance: import('./helpers/git-auth/git-auth').GitAuth | null = null

dotenv.config()

initMainSentryEarly()

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error)
    void sendErrorReport(error, { errorType: 'uncaughtException' })
})

process.on('warning', (warning) => {
    const warningWithCode = warning as Error & { code?: string }
    // Silence known Node deprecation noise from transitive deps on startup.
    if (warningWithCode.name === 'DeprecationWarning' && warningWithCode.code === 'DEP0169') {
        return
    }

    console.warn(warningWithCode)
})

function createWindow(): void {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1160,
        height: 650,
        minWidth: 960,
        minHeight: 620,
        show: false,
        autoHideMenuBar: true,
        ...(process.platform === 'linux' ? { icon } : {}),
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false,
            // Required so the Specification project type can preview the
            // Next.js dev server inside an Electron <webview> element.
            webviewTag: true
        },
        titleBarStyle: 'hidden',
        icon: path.join(__dirname, 'resources/icons', 'icon.icns') // Set icon for the window
    })

    nextJsManager = new NextJsManager(mainWindow)

    mainWindow.maximize()

    mainWindow.on('ready-to-show', () => {
        mainWindow.show()
    })

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url)
        return { action: 'deny' }
    })

    // HMR for renderer base on electron-vite cli.
    // Load the remote URL for development or the local html file for production.
    const startUrl =
        is.dev && process.env['ELECTRON_RENDERER_URL']
            ? process.env['ELECTRON_RENDERER_URL']
            : `file://${join(__dirname, '../renderer/index.html')}#/ide-initial-screen`

    mainWindow.loadURL(startUrl)

    mainBindings(ipcMain, mainWindow, fs) // <- configures the backend

    closeApp(mainWindow)

    installExtensions(mainWindow)

    void initializeLogger()
}

function resolveTerminalShell(): string {
    if (os.platform() === 'win32') {
        return 'powershell.exe'
    }

    return process.env.SHELL || 'bash'
}

function resolveTerminalCwd(targetCwd?: string): string {
    if (targetCwd && fs.existsSync(targetCwd) && fs.statSync(targetCwd).isDirectory()) {
        return targetCwd
    }
    return os.homedir()
}

function createPtyProcess(sessionId: string, targetCwd?: string): pty.IPty {
    const existingSession = ptySessions.get(sessionId)
    if (existingSession) {
        return existingSession
    }

    const terminalProcess = pty.spawn(resolveTerminalShell(), [], {
        name: 'xterm-color',
        cols: 80,
        rows: 30,
        cwd: resolveTerminalCwd(targetCwd),
        env: process.env as Record<string, string>
    })

    terminalProcess.onData((data) => {
        if (!mainWindow || mainWindow.isDestroyed()) return
        mainWindow.webContents.send('pty-data', { sessionId, data })
    })

    terminalProcess.onExit(() => {
        if (!mainWindow || mainWindow.isDestroyed()) return
        mainWindow.webContents.send('pty-exit', { sessionId })
        ptySessions.delete(sessionId)
    })

    ptySessions.set(sessionId, terminalProcess)

    return terminalProcess
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
    // Set app user model id for windows
    electronApp.setAppUserModelId('com.electron')

    if (process.defaultApp) {
        if (process.argv.length >= 2) {
            app.setAsDefaultProtocolClient('igrp-studio', process.execPath, [process.argv[1]])
        }
    } else {
        app.setAsDefaultProtocolClient('igrp-studio')
    }

    if (process.platform === 'win32') {
        app.setAsDefaultProtocolClient('igrp-studio')

        const gotTheLock = app.requestSingleInstanceLock()

        if (!gotTheLock) {
            app.quit()
        } else {
            app.on('second-instance', (_event, argv) => {
                const url = argv[argv.length - 1]

                if (url.startsWith('igrp-studio://') && mainWindow) {
                    if (mainWindow.isMinimized()) mainWindow.restore()
                    mainWindow.focus()

                    if (url.includes('oauth/callback')) {
                        if (activeAuthInstance) {
                            activeAuthInstance.handleProtocolCallback(url, mainWindow)
                        } else if (currentAuthProvider === 'github') {
                            githubAuth.handleProtocolCallback(url, mainWindow)
                        } else if (currentAuthProvider === 'gitlab') {
                            gitlabAuth.handleProtocolCallback(url, mainWindow)
                        } else if (url.includes('github')) {
                            githubAuth.handleProtocolCallback(url, mainWindow)
                        } else if (url.includes('gitlab')) {
                            gitlabAuth.handleProtocolCallback(url, mainWindow)
                        }
                    }
                }
            })

            if (process.argv.length > 1) {
                const url = process.argv[process.argv.length - 1]
                if (url.startsWith('igrp-studio://')) {
                    if (activeAuthInstance) {
                        activeAuthInstance.handleProtocolCallback(url, mainWindow)
                    } else if (url.includes('github')) {
                        githubAuth.handleProtocolCallback(url, mainWindow)
                    } else if (url.includes('gitlab')) {
                        gitlabAuth.handleProtocolCallback(url, mainWindow)
                    }
                }
            }
        }

        buildTaskbar()

        initComponents()
    }

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
    app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window)
    })

    // IPC test
    ipcMain.on('ping', () => console.log('pong'))

    ipcMain.on('pty-create', (_, payload: { sessionId: string; cwd?: string }) => {
        const { sessionId, cwd } = payload
        if (!sessionId) return
        createPtyProcess(sessionId, cwd)
    })

    ipcMain.on('pty-input', (_, payload: { sessionId: string; data: string }) => {
        const { sessionId, data } = payload
        if (!sessionId) return
        if (!data) return
        createPtyProcess(sessionId).write(data)
    })

    ipcMain.on('pty-resize', (_, payload: { sessionId: string; cols: number; rows: number }) => {
        const { sessionId, cols, rows } = payload
        if (!sessionId) return
        if (!cols || !rows) return
        createPtyProcess(sessionId).resize(cols, rows)
    })

    ipcMain.on('pty-destroy', (_, sessionId: string) => {
        if (!sessionId) return
        const targetSession = ptySessions.get(sessionId)
        if (!targetSession) return
        targetSession.kill()
        ptySessions.delete(sessionId)
    })

    ipcMain.on(
        'report-error',
        (_, payload: Error | { message: string; name?: string; stack?: string }) => {
            const err =
                payload instanceof Error
                    ? payload
                    : Object.assign(new Error(payload.message), {
                          name: payload.name ?? 'Error',
                          stack: payload.stack
                      })
            void sendErrorReport(err, { source: 'renderer-ipc' })
        }
    )

    await GitStore.initialize()
    const initializeGitHubService = async (): Promise<void> => {
        try {
            await GitHubService.initializeServices()
        } catch (err) {
            console.error('Failed to initialize GitHub service:', err)
        }
    }

    const initializeGitLabService = async (): Promise<void> => {
        try {
            await GitLabService.initializeServices()
        } catch (err) {
            console.error('Failed to initialize GitLab service:', err)
        }
    }

    const initializeAllServices = async (): Promise<void> => {
        await Promise.allSettled([initializeGitHubService(), initializeGitLabService()])
    }
    await initializeAllServices()

    ipcMain.on('github-oauth', async (_event, configId?: string) => {
        const isDev = process.env.VITE_NODE_ENV === 'development'
        try {
            currentAuthProvider = 'github'
            const auth = configId
                ? (() => {
                      const cfg = getProviderConfigById(configId)
                      return cfg ? buildGitAuth(cfg) : githubAuth
                  })()
                : githubAuth
            activeAuthInstance = auth
            await auth.setupOAuth(mainWindow, isDev)
        } catch (error: unknown) {
            console.error('GitHub OAuth failed:', error)
            currentAuthProvider = null
            activeAuthInstance = null
        }
    })

    // GitLab handler
    ipcMain.on('gitlab-oauth', async (_event, configId?: string) => {
        const isDev = process.env.VITE_NODE_ENV === 'development'
        try {
            currentAuthProvider = 'gitlab'
            const auth = configId
                ? (() => {
                      const cfg = getProviderConfigById(configId)
                      return cfg ? buildGitAuth(cfg) : gitlabAuth
                  })()
                : gitlabAuth
            activeAuthInstance = auth
            await auth.setupOAuth(mainWindow, isDev)
        } catch (error: unknown) {
            console.error('GitLab OAuth failed:', error)
            currentAuthProvider = null
            activeAuthInstance = null
        }
    })

    createWindow()
    registerPowerRecovery()

    app.on('activate', () => {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })

    new NextjsEngine().registry()

    new SpringEngine().registry()

    new WorkspaceRepository().initialize()

    await IGRPStudioSettings.initialize()
    new AppUpdater(mainWindow)
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    for (const session of ptySessions.values()) {
        session.kill()
    }
    ptySessions.clear()
    // Tear down any running Next.js dev servers spawned by Specification
    // projects so we don't leak ports on quit.
    void prototypeDevServer.stopAll()
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

ipcMain.on('open-external-url', (_event, url) => {
    if (!url) {
        console.error('No URL provided')
        return
    }

    try {
        const parsed = new URL(url)
        const host = parsed.hostname
        if (host === 'localhost' || host === '127.0.0.1') {
            shell.openExternal(url)
            return
        }

        dns.lookup(host, (err) => {
            if (!err) {
                shell.openExternal(url)
                return
            }

            const fallback = new URL(url)
            fallback.hostname = 'localhost'
            shell.openExternal(fallback.toString())
        })
    } catch {
        shell.openExternal(url)
    }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.

ipcMain.handle(
    'read-directory',
    async (
        _event: IpcMainInvokeEvent,
        dirPath: string
    ): Promise<FileTree[] | { error: string }> => {
        try {
            return readDirectory(dirPath)
        } catch (error: unknown) {
            console.error('Error reading directory:', error)
            return {
                error: error instanceof Error ? error.message : 'Failed to read directory'
            }
        }
    }
)

ipcMain.handle(
    'read-file',
    async (_event: IpcMainInvokeEvent, filePath: string): Promise<string | null> => {
        try {
            return await readProjectFile(filePath)
        } catch (error) {
            console.error('Error reading file:', error)
            return null
        }
    }
)

ipcMain.handle('get-app-version', () => {
    return app.getVersion()
})

ipcMain.on('open-directory-dialog', async (event) => {
    await dialog
        .showOpenDialog(mainWindow, {
            properties: ['openDirectory', 'createDirectory'],
            buttonLabel: 'Select Destination Folder'
        })
        .then((result) => {
            event.sender.send('file-content', result)
        })
        .catch((err) => {
            console.log(err)
        })
})

ipcMain.handle('open-directory', async (_event, buttonLabel?: string): Promise<IOpenProject> => {
    return await openDirectory(buttonLabel)
})

ipcMain.handle(
    'igrp-studio:fetch-files',
    async (_event, basePath: string): Promise<FileTree[] | { error: string }> => {
        try {
            return readIgrpStudioDirectory(basePath)
        } catch (error) {
            console.error('Error reading directory:', error)
            return {
                error: error instanceof Error ? error.message : 'Failed to read directory'
            }
        }
    }
)

ipcMain.handle(
    'igrp-studio:get-json-content',
    async (_event, filePath: string): Promise<unknown> => {
        if (!filePath) return null
        return await getJsonContent(filePath)
    }
)

ipcMain.handle(
    'igrp-studio:get-file-content',
    async (_event, filePath: string): Promise<unknown> => {
        return await getFileContent(filePath)
    }
)

ipcMain.handle(
    'igrp-studio:open-ide',
    async (_event, { basePath, ideType }: { basePath: string; ideType: string }) => {
        if (!basePath || !IDES[ideType]) return

        const ideConfig = IDES[ideType]
        const command = `${ideConfig.command} "${basePath}"`

        exec(command, { env: getShellEnv() }, (err): void => {
            if (err) {
                console.error(`Error opening ${ideConfig.name}:`, err)
            }
        })
    }
)

ipcMain.handle(
    'igrp-studio:open-in-file-manager',
    async (_event, basePath: string): Promise<string> => {
        if (!basePath) return 'No path provided'
        // Finder on macOS, Explorer on Windows, default file manager on Linux.
        return await shell.openPath(basePath)
    }
)

ipcMain.handle(
    'igrp-studio:ides',
    async (): Promise<Array<{ key: string; config: IDEDetails }>> => {
        return await detectInstalledIDEs()
    }
)

// Handle IPC events
ipcMain.on('minimize-window', () => {
    mainWindow.minimize()
})

ipcMain.on('maximize-window', () => {
    if (mainWindow.isMaximized()) {
        mainWindow.unmaximize()
    } else {
        mainWindow.maximize()
    }
})

ipcMain.on('close-window', () => {
    mainWindow.close()
})

ipcMain.handle('is-window-maximized', () => {
    return mainWindow.isMaximized()
})

ipcMain.on('restore-window', () => {
    mainWindow.unmaximize()
})

ipcMain.on('start-drag', (): void => {
    mainWindow.on('move', () => {
        const windowBounds = mainWindow.getBounds()
        const displayBounds = screen.getDisplayMatching(windowBounds).bounds

        // Snap to top-left corner
        if (windowBounds.x <= displayBounds.x + 10 && windowBounds.y <= displayBounds.y + 10) {
            mainWindow.setBounds({
                x: displayBounds.x,
                y: displayBounds.y,
                width: displayBounds.width / 2,
                height: displayBounds.height / 2
            })
        }
    })
})

ipcMain.handle('check-project-config', async (_event, targetDir: string) => {
    try {
        const { folderExists, config } = await checkAndReadBaseApi(targetDir)
        return { folderExists, config }
    } catch (error) {
        console.error('Error checking project config:', error)
        return { folderExists: false, config: null }
    }
})

app.on('open-url', (event, url) => {
    event.preventDefault()
    console.log('Received URL via open-url:', url)

    if (mainWindow) {
        if (url.includes('oauth/callback')) {
            if (activeAuthInstance) {
                console.log('Processing OAuth callback via active auth instance')
                activeAuthInstance.handleProtocolCallback(url, mainWindow)
            } else if (currentAuthProvider === 'github') {
                console.log('Processing GitHub callback')
                githubAuth.handleProtocolCallback(url, mainWindow)
            } else if (currentAuthProvider === 'gitlab') {
                console.log('Processing GitLab callback')
                gitlabAuth.handleProtocolCallback(url, mainWindow)
            } else {
                console.error('Received OAuth callback but no active provider is set')
                if (url.includes('github')) {
                    githubAuth.handleProtocolCallback(url, mainWindow)
                } else if (url.includes('gitlab')) {
                    gitlabAuth.handleProtocolCallback(url, mainWindow)
                }
            }
        }
    }
})

// NEXTJS
ipcMain.on('start-nextjs', (_event, basePath) => {
    nextJsManager.setNextJsPath(basePath)
    nextJsManager.startNextJsServer()
})

ipcMain.on('open-preview', (_event, pageName) => {
    nextJsManager.openPreviewWindow(pageName)
})

ipcMain.on('stop-nextjs', () => {
    nextJsManager.stopNextJsServer()
})

// 📌 IPC para UI chamar o check update manualmente
ipcMain.handle('check-for-updates', async () => {
    try {
        const updateCheckResult = await autoUpdater.checkForUpdates()
        return updateCheckResult?.updateInfo?.version || null
    } catch (error) {
        console.error('Update check failed:', error)
        return null
    }
})

// 📌 Update channel (beta / stable)
ipcMain.handle('update:get-channel', () => {
    return IGRPStudioSettings.getUpdateChannel()
})

ipcMain.handle('update:set-channel', async (_event, channel: 'stable' | 'beta') => {
    if (channel !== 'stable' && channel !== 'beta') return
    IGRPStudioSettings.setUpdateChannel(channel)
    applyUpdateChannelConfig()
})

ipcMain.handle('update:reconfigure-channel', () => {
    applyUpdateChannelConfig()
})

// 📌 IPC para iniciar o download manualmente
ipcMain.handle('download-update', async () => {
    return autoUpdater.downloadUpdate()
})

// 📌 IPC para instalar a atualização quando o usuário clicar
ipcMain.handle('install-update', async () => {
    autoUpdater.quitAndInstall()
})

// Handle folder watching
ipcMain.handle('watch-folder', (_, folderPath: string) => {
    return folderWatcher.watchFolder(folderPath, (event) => {
        mainWindow?.webContents.send('folder-change', event)
    })
})
