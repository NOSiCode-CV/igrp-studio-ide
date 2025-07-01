import {
    app,
    shell,
    BrowserWindow,
    ipcMain,
    dialog,
    screen,
    IpcMainInvokeEvent,
} from 'electron';
import path, { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import icon from '../../resources/icon.png?asset';
import { closeApp, installExtensions } from './helpers/utils';
import fs from 'fs';
import { FileTree, IOpenProject } from './types';

import {
    checkAndReadBaseApi,
    getFileContent,
    getJsonContent,
    openDirectory,
    readDirectory,
    readIgrpStudioDirectory,
    readProjectFile,
} from './helpers';

import { exec } from 'child_process';
import { githubAuth } from './helpers/git-auth/github-auth';
import { GitLabService } from './services/gitlab-service';
import { gitlabAuth } from './helpers/git-auth/gitlab-auth';
import { GitStore } from './services/git-store';
import { GitHubService } from './services/github-service';

import './handlers/api-handler';
import './handlers/db-handler';
import './handlers/workspace-handler';
import './handlers/git-handler';
import './handlers/app-logic-handlers';
import './handlers/docker-handler';
import './handlers/global-handler';
import './helpers/fetch-request';

import { buildTaskbar } from './helpers/taskbar';
import {
    getCurrentLanguage,
    loadConfig,
    setCurrentLanguage,
} from './helpers/language';
import NextJsManager from './helpers/nextjsManager';
import { initComponents } from '@igrp/igrp-studio-nextjs-engine';
import dotenv from 'dotenv';
import AppUpdater from './helpers/electron-updater';
import { autoUpdater } from 'electron-updater';
import { detectInstalledIDEs, IDEDetails, IDES } from './helpers/ideDetection';
import { NextjsEngine } from './engines/NextjsEngine';
import { WorkspaceRepository } from './services/workspace-service';
import { IGRPStudioSettings } from './helpers/igrp-studio-settings';
import { folderWatcher } from './helpers/watch-folder';

const backend = require('i18next-electron-fs-backend');

let mainWindow: BrowserWindow;

let nextJsManager: NextJsManager;
let currentAuthProvider: 'github' | 'gitlab' | null = null;
// Load the initial language configuration
loadConfig();
dotenv.config();

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
        },
        titleBarStyle: 'hidden',
        icon: path.join(__dirname, 'resources/icons', 'icon.icns'), // Set icon for the window
    });

    nextJsManager = new NextJsManager(mainWindow);

    mainWindow.maximize();

    mainWindow.on('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url);
        return { action: 'deny' };
    });

    // HMR for renderer base on electron-vite cli.
    // Load the remote URL for development or the local html file for production.
    const startUrl =
        is.dev && process.env['ELECTRON_RENDERER_URL']
            ? process.env['ELECTRON_RENDERER_URL']
            : `file://${join(__dirname, '../renderer/index.html')}#/ide-initial-screen`;

    mainWindow.loadURL(startUrl);

    backend.mainBindings(ipcMain, mainWindow, fs); // <- configures the backend

    closeApp(mainWindow);

    installExtensions(mainWindow);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
    // Set app user model id for windows
    electronApp.setAppUserModelId('com.electron');

    if (process.defaultApp) {
        if (process.argv.length >= 2) {
            app.setAsDefaultProtocolClient('igrp-studio', process.execPath, [
                process.argv[1],
            ]);
        }
    } else {
        app.setAsDefaultProtocolClient('igrp-studio');
    }

    if (process.platform === 'win32') {
        app.setAsDefaultProtocolClient('igrp-studio');

        const gotTheLock = app.requestSingleInstanceLock();

        if (!gotTheLock) {
            app.quit();
        } else {
            app.on('second-instance', (_event, argv) => {
                const url = argv[argv.length - 1];

                if (url.startsWith('igrp-studio://') && mainWindow) {
                    if (mainWindow.isMinimized()) mainWindow.restore();
                    mainWindow.focus();

                    if (url.includes('oauth/callback')) {
                        if (currentAuthProvider === 'github') {
                            githubAuth.handleProtocolCallback(url, mainWindow);
                        } else if (currentAuthProvider === 'gitlab') {
                            gitlabAuth.handleProtocolCallback(url, mainWindow);
                        } else {
                            if (url.includes('github')) {
                                githubAuth.handleProtocolCallback(
                                    url,
                                    mainWindow
                                );
                            } else if (url.includes('gitlab')) {
                                gitlabAuth.handleProtocolCallback(
                                    url,
                                    mainWindow
                                );
                            }
                        }
                    }
                }
            });

            if (process.argv.length > 1) {
                const url = process.argv[process.argv.length - 1];
                if (url.startsWith('igrp-studio://')) {
                    if (url.includes('github')) {
                        githubAuth.handleProtocolCallback(url, mainWindow);
                    } else if (url.includes('gitlab')) {
                        gitlabAuth.handleProtocolCallback(url, mainWindow);
                    }
                }
            }
        }

        buildTaskbar();

        initComponents();
    }

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
    app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window);
    });

    // IPC test
    ipcMain.on('ping', () => console.log('pong'));

    await GitStore.initialize();
    const initializeGitHubService = async () => {
        try {
            await GitHubService.initializeServices();
        } catch { }
    };

    const initializeGitLabService = async () => {
        try {
            await GitLabService.initializeServices();
        } catch { }
    };

    const initializeAllServices = async () => {
        await Promise.allSettled([
            initializeGitHubService(),
            initializeGitLabService(),
        ]);
    };
    await initializeAllServices();

    ipcMain.on('github-oauth', async () => {
        const isDev = process.env.VITE_NODE_ENV === 'development';
        try {
            currentAuthProvider = 'github'; // Add this line
            await githubAuth.setupOAuth(mainWindow, isDev);
        } catch (error) {
            console.error('GitHub OAuth failed:', error);
            currentAuthProvider = null; // Add this line
        }
    });

    // GitLab handler
    ipcMain.on('gitlab-oauth', async () => {
        const isDev = process.env.VITE_NODE_ENV === 'development';
        console.log("isDev", isDev)
        try {
            currentAuthProvider = 'gitlab'; // Add this line
            await gitlabAuth.setupOAuth(mainWindow, isDev);
        } catch (error) {
            console.error('GitLab OAuth failed:', error);
            currentAuthProvider = null; // Add this line
        }
    });

    createWindow();

    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });

    new NextjsEngine().registry();

    new WorkspaceRepository().initialize();

    new AppUpdater(mainWindow);

    await IGRPStudioSettings.initialize();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

ipcMain.on('open-external-url', (_event, url) => {
    if (url) {
        // Open the provided URL in the default browser
        shell.openExternal(url);
    } else {
        console.error('No URL provided');
    }
});

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.

ipcMain.handle(
    'read-directory',
    async (
        _event: IpcMainInvokeEvent,
        dirPath: string
    ): Promise<FileTree[] | { error: string }> => {
        try {
            const fileTree = await readDirectory(dirPath);
            return fileTree;
        } catch (error) {
            console.error('Error reading directory:', error);
            return {
                error:
                    error instanceof Error
                        ? error.message
                        : 'Failed to read directory',
            };
        }
    }
);

ipcMain.handle(
    'read-file',
    async (
        _event: IpcMainInvokeEvent,
        filePath: string
    ): Promise<FileTree[] | { error: string }> => {
        try {
            return await readProjectFile(filePath);
        } catch (error) {
            console.error('Error reading file:', error);
            return {
                error:
                    error instanceof Error
                        ? error.message
                        : 'Failed to read file',
            };
        }
    }
);

ipcMain.handle('get-app-version', () => {
    return app.getVersion();
});


ipcMain.on('open-directory-dialog', async (event) => {

    await dialog
        .showOpenDialog(mainWindow, {
            properties: ['openDirectory', 'createDirectory', 'showHiddenFiles'],
            buttonLabel: 'Select Destination Folder',
        })
        .then((result) => {
            event.sender.send('file-content', result);
        })
        .catch((err) => {
            console.log(err);
        });
});

ipcMain.handle(
    'open-directory',
    async (_event, buttonLabel?: string): Promise<IOpenProject> => {
        return await openDirectory(buttonLabel);
    }
);

ipcMain.handle(
    'igrp-studio:fetch-files',
    async (
        _event,
        basePath: string
    ): Promise<FileTree[] | { error: string }> => {
        try {
            return readIgrpStudioDirectory(basePath);
        } catch (error) {
            console.error('Error reading directory:', error);
            return {
                error:
                    error instanceof Error
                        ? error.message
                        : 'Failed to read directory',
            };
        }
    }
);

ipcMain.handle(
    'igrp-studio:get-json-content',
    async (_event, filePath: string): Promise<any> => {
        return await getJsonContent(filePath);
    }
);

ipcMain.handle(
    'igrp-studio:get-file-content',
    async (_event, filePath: string): Promise<any> => {
        return await getFileContent(filePath);
    }
);

ipcMain.handle(
    'igrp-studio:open-ide',
    async (
        _event,
        { basePath, ideType }: { basePath: string; ideType: string }
    ) => {
        if (!basePath || !IDES[ideType]) return;

        const ideConfig = IDES[ideType];
        const command = `${ideConfig.command} "${basePath}"`;

        exec(command, (err, _stdout, _stderr) => {
            if (err) {
                console.error(`Error opening ${ideConfig.name}:`, err);
            }
        });
    }
);

ipcMain.handle(
    'igrp-studio:ides',
    async (_event): Promise<Array<{ key: string; config: IDEDetails }>> => {
        return await detectInstalledIDEs();
    }
);

// Handle IPC events
ipcMain.on('minimize-window', () => {
    mainWindow.minimize();
});

ipcMain.on('maximize-window', () => {
    if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
    } else {
        mainWindow.maximize();
    }
});

ipcMain.on('close-window', () => {
    mainWindow.close();
});

ipcMain.handle('is-window-maximized', () => {
    return mainWindow.isMaximized();
});

ipcMain.on('restore-window', () => {
    mainWindow.unmaximize();
});

ipcMain.on('start-drag', (_event) => {
    mainWindow.on('move', () => {
        const windowBounds = mainWindow.getBounds();
        const displayBounds = screen.getDisplayMatching(windowBounds).bounds;

        // Snap to top-left corner
        if (
            windowBounds.x <= displayBounds.x + 10 &&
            windowBounds.y <= displayBounds.y + 10
        ) {
            mainWindow.setBounds({
                x: displayBounds.x,
                y: displayBounds.y,
                width: displayBounds.width / 2,
                height: displayBounds.height / 2,
            });
        }
    });
});

ipcMain.handle('check-project-config', async (_event, targetDir: string) => {
    try {
        const { folderExists, config } = await checkAndReadBaseApi(targetDir);
        return { folderExists, config };
    } catch (error) {
        console.error('Error checking project config:', error);
        return { folderExists: false, config: null };
    }
});

app.on('open-url', (event, url) => {
    event.preventDefault();
    console.log('Received URL via open-url:', url);

    if (mainWindow) {
        if (url.includes('oauth/callback')) {
            if (currentAuthProvider === 'github') {
                console.log('Processing GitHub callback');
                githubAuth.handleProtocolCallback(url, mainWindow);
            } else if (currentAuthProvider === 'gitlab') {
                console.log('Processing GitLab callback');
                gitlabAuth.handleProtocolCallback(url, mainWindow);
            } else {
                console.error(
                    'Received OAuth callback but no active provider is set'
                );
                // Try to guess based on URL
                if (url.includes('github')) {
                    githubAuth.handleProtocolCallback(url, mainWindow);
                } else if (url.includes('gitlab')) {
                    gitlabAuth.handleProtocolCallback(url, mainWindow);
                }
            }
        }
    }
});

// IPC handlers for language management
ipcMain.handle('get-language', () => {
    return getCurrentLanguage();
});

ipcMain.handle('set-language', (_, lang: string) => {
    setCurrentLanguage(lang);
    return lang; // Return the new language for confirmation
});

// NEXTJS
ipcMain.on('start-nextjs', (_event, basePath) => {
    nextJsManager.setNextJsPath(basePath);
    nextJsManager.startNextJsServer();
});

ipcMain.on('open-preview', (_event, pageName) => {
    nextJsManager.openPreviewWindow(pageName);
});

ipcMain.on('stop-nextjs', () => {
    nextJsManager.stopNextJsServer();
});

// 📌 IPC para UI chamar o check update manualmente
ipcMain.handle('check-for-updates', async () => {
    try {
        const updateCheckResult = await autoUpdater.checkForUpdates();
        return updateCheckResult?.updateInfo?.version || null;
    } catch (error) {
        console.error('Update check failed:', error);
        return null;
    }
});

// 📌 IPC para iniciar o download manualmente
ipcMain.handle('download-update', async () => {
    return autoUpdater.downloadUpdate();
});

// 📌 IPC para instalar a atualização quando o usuário clicar
ipcMain.handle('install-update', async () => {
    autoUpdater.quitAndInstall();
});


// Handle folder watching
ipcMain.handle('watch-folder', (_, folderPath: string) => {
    return folderWatcher.watchFolder(folderPath, (event) => {
        mainWindow?.webContents.send('folder-change', event);
    });
});