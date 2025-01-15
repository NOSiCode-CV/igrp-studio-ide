import { app, shell, BrowserWindow, ipcMain, dialog, screen } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { closeApp, installExtensions } from './helpers/utils'
import fs from 'fs'
import { FolderFiles, HandlerResponse, IOpenProject, Project } from './types'

import { fetchFiles, getJsonContent, openDirectory } from './helpers'
import { ProjectRepository } from './repo/projects'

import { exec } from 'child_process'
import { handleProtocolCallback, setupGitHubOAuth } from './helpers/git-auth/github-auth'

import { TokenService } from './services/token-service';
import { GitHubService } from './services/github-service';

const isDev = process.env.NODE_ENV === 'development';
if (!isDev) {
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient('igrp-studio', process.execPath, [process.argv[1]]);
    }
  } else {
    app.setAsDefaultProtocolClient('igrp-studio');
  }
}

import './handlers/apiHandler';
import './handlers/dbHandler';

import { GitLabService } from './services/gitlab-service'
import { setupGitLabOAuth } from './helpers/git-auth/gitlab-auth'
import { GitService } from './services/git-service'

const backend = require('i18next-electron-fs-backend')

let mainWindow: BrowserWindow

const repo = new ProjectRepository()


function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1160, //900,
    height: 650, //670,
    minWidth: 960, //768,
    minHeight: 620,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      //nodeIntegration: true, // Enable Node.js in the renderer process
      // contextIsolation: false // Allow the `process` global
    },
    titleBarStyle: "hidden",
  })

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

  backend.mainBindings(ipcMain, mainWindow, fs) // <- configures the backend

  closeApp(mainWindow)

  installExtensions(mainWindow)
}


if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('igrp-studio', process.execPath, [process.argv[1]])
  }
} else {
  app.setAsDefaultProtocolClient('igrp-studio')
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  await TokenService.initialize();
  await Promise.all([
    GitHubService.initializeServices(),
    GitLabService.initializeServices()
  ]);

  // GitHub handlers
  ipcMain.on('github-oauth', async () => {
    const mainWindow = BrowserWindow.getFocusedWindow();
    if (!mainWindow) return;
    try {
      await setupGitHubOAuth(mainWindow, process.env.NODE_ENV === 'development');
    } catch (error) {
      console.error('GitHub OAuth failed:', error);
    }
  });

  // GitLab handlers
  ipcMain.on('gitlab-oauth', async () => {
    const mainWindow = BrowserWindow.getFocusedWindow();
    if (!mainWindow) return;
    try {
      await setupGitLabOAuth(mainWindow, process.env.NODE_ENV === 'development');
    } catch (error) {
      console.error('GitLab OAuth failed:', error);
    }
  });

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})



// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.

ipcMain.on('open-directory-dialog', async (event) => {
  await dialog
    .showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
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
  'igrp-studio:repo:project.findAllRecent',
  async (_event, page: { page: number; size: number }) => {
    return await repo.findAllRecent(page)
  }
)

ipcMain.handle('igrp-studio:repo:project.save', async (_event, project: Project) => {
  await repo.save(project)
})

ipcMain.handle('igrp-studio:repo:project.delete', async (_event, project: Project, index: number) => {
  await repo.delete(project, index)
})

ipcMain.handle(
  'igrp-studio:fetch-files',
  async (_event, basePath: string): Promise<FolderFiles> => {
    return await fetchFiles(basePath)
  }
)

ipcMain.handle('igrp-studio:get-json-content', async (_event, filePath: string): Promise<any> => {
  return await getJsonContent(filePath)
})

ipcMain.handle('igrp-studio:open-vs-code', async (_event, basePath: string) => {
  if (basePath) {
    exec(`code "${basePath}"`, (err, _stdout, _stderr) => {
      if (err) {
        console.error(`Error: ${err}`)
        return
      }
    })
  }
})

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

ipcMain.on('is-window-maximized', () => {
  return mainWindow.isMaximized()
})

ipcMain.on('restore-window', () => {
  mainWindow.unmaximize()
})

ipcMain.on('start-drag', (_event) => {
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

    // Add other snapping conditions for top-right, bottom-left, and bottom-right
  })
})


// Handler para buscar versões
ipcMain.handle("get-versions", async (_event, endpoint: string): Promise<HandlerResponse> => {
  try {
    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.items || !Array.isArray(data.items)) {
      throw new Error("Formato de resposta inesperado");
    }

    // Retorna somente os números de versão
    return {
      result: data.items.map((item: { version: string }) => item.version),
    };
  } catch (error) {
    console.error("Erro ao buscar versões:", error);

    // Retorna o erro no formato definido
    return {
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
});


// GitHub
ipcMain.handle('github-initialize', async (_event, token) => {
  await GitHubService.initialize(token);
  TokenService.setToken('github', token);
  return true;
});
ipcMain.handle('gitlab-initialize', async (_event, token) => {
  try {
    await GitLabService.initialize(token);
    TokenService.setToken('gitlab', token);
    return true;
  } catch (error) {
    console.error('GitLab initialization failed:', error);
    throw error;
  }
});
ipcMain.handle('github-user-info', async () => {
  return GitHubService.getUserInfo();
});
ipcMain.handle('github-repositories', async (event) => {
  const mainWindow = BrowserWindow.fromWebContents(event.sender);
  return GitHubService.listIGRPStudioRepositories(mainWindow as BrowserWindow);
});

// Git
ipcMain.handle('clone-repository', async (event, repoUrl) => {
  const mainWindow = BrowserWindow.fromWebContents(event.sender);
  return GitService.cloneRepository(repoUrl, mainWindow as BrowserWindow);
});
ipcMain.handle('list-branches', async (_event, projectPath) => {
  return GitService.listBranches(projectPath);
});
ipcMain.handle('checkout-branch', async (_event, { projectPath, branchName }) => {
  return GitService.checkoutBranch(projectPath, branchName);
});
ipcMain.handle('create-branch', async (_event, { projectPath, branchName }) => {
  return GitService.createBranch(projectPath, branchName);
});
ipcMain.handle('create-commit', async (_event, { projectPath, message }) => {
  return GitService.createCommit(projectPath, message);
});
ipcMain.handle('pull-changes', async (_event, { projectPath }) => {
  return GitService.pull(projectPath);
});
ipcMain.handle('push-changes', async (_event, { projectPath, branch }) => {
  return GitService.push(projectPath, branch);
});
ipcMain.handle('sync-changes', async (_event, { projectPath, branch }) => {
  return GitService.sync(projectPath, branch);
});
ipcMain.handle('get-changes-count', async (_event, projectPath: string) => {
  return GitService.getChangesCount(projectPath);
});

// GitLab
// ipcMain.handle('gitlab-repositories', async () => {
//   return GitLabService.listRepositories();
// });
// ipcMain.handle('gitlab-user-info', async () => {
//   return GitLabService.getUserInfo();
// });
