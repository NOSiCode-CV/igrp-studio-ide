import { app, shell, BrowserWindow, ipcMain, IpcMainInvokeEvent, dialog, screen } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { closeApp, installExtensions } from './helpers/utils'
import fs from 'fs'
import { FolderFiles, Handler, IOpenProject, Project } from './types'
import { addController, addDTO, addModel, addModule, deleteController, deleteDTO, deleteModel, engineTypes, newApi } from '@igrp/spring-engine'
import { addComponentToPage, deletePage, newApp, newPage } from '@igrp/nextjs-engine';
import { fetchFiles, getJsonContent, openDirectory } from './helpers'
import { ProjectRepository } from './helpers/repo/projects'
import {
  ApiConfig,
  ControllerConfig,
  DTOBaseConfig,
  DTOConfig,
  ModelConfig
} from '@igrp/spring-engine/dist/interfaces/types'
import { AppConfig, Component, PageConfig } from '@igrp/nextjs-engine/dist/interfaces/types'
import { exec } from 'child_process'

const backend = require('i18next-electron-fs-backend')

let mainWindow: BrowserWindow

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1160, //900,
    height: 650, //670,
    minWidth: 768,
    minHeight: 620,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
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
      : `file://${join(__dirname, '../renderer/index.html')}#/igrp`

  mainWindow.loadURL(startUrl)

  backend.mainBindings(ipcMain, mainWindow, fs) // <- configures the backend

  closeApp(mainWindow)

  installExtensions(mainWindow)
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
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

const handleWithCustomErrors = (channel: string, handler: Handler) => {
  ipcMain.handle(channel, async (event: IpcMainInvokeEvent, ...args: any[]) => {
    try {
      return { result: await Promise.resolve(handler(event, ...args)) }
    } catch (e) {
      return { error: e }
    }
  })
}

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

const repo = new ProjectRepository()

handleWithCustomErrors(
  'spring-engine:create-api',
  async (_event, apiConfig: ApiConfig, basePath: string) => {
    await newApi(apiConfig, basePath)

    await repo.save({
      path: basePath,
      dt_created: new Date(),
      config: {
        type: apiConfig.type,
        name: apiConfig.apiName,
        group: apiConfig.group,
        artifact: apiConfig.artifact,
        database: apiConfig.database,
        description: apiConfig.description,
        package: apiConfig.package
      }
    })
  }
)

handleWithCustomErrors('spring-engine:create-module', async (_event, moduleConfig, basePath) => {
  await addModule(moduleConfig, basePath)
})

handleWithCustomErrors('spring-engine:create-model', async (_event, modelConfig, basePath) => {
  await addModel(modelConfig, basePath)
})

handleWithCustomErrors(
  'spring-engine:delete-model',
  async (_event, modelConfig: ModelConfig, basePath: string) => {
    await deleteModel(modelConfig, basePath)
  }
)

handleWithCustomErrors(
  'spring-engine:delete-dto',
  async (_event, config: DTOBaseConfig, basePath: string) => {
    await deleteDTO(config, basePath)
  }
)

handleWithCustomErrors(
  'spring-engine:delete-controller',
  async (_event, config: ControllerConfig, basePath: string) => {
    await deleteController(config, basePath)
  }
)

handleWithCustomErrors(
  'spring-engine:create-dto',
  async (_event, dtoConfig: DTOConfig, basePath: string) => {
    await addDTO(dtoConfig, basePath)
  }
)

handleWithCustomErrors(
  'spring-engine:create-controller',
  async (_event, controllerConfig: ControllerConfig, basePath: string) => {
    await addController(controllerConfig, basePath)
  }
)

ipcMain.handle('spring-engine:fetch-selectors', async (_event, module: string, basePath: string) => {
  return await engineTypes(module, basePath)
})

handleWithCustomErrors(
  'next-engine:create-page',
  async (_event, pageConfig: PageConfig, basePath: string) => {
    await newPage(pageConfig, basePath)
  }
)

handleWithCustomErrors(
  'next-engine:add-component-page',
  async (_event, pageConfig: PageConfig, components: Component[], basePath: string) => {
    await addComponentToPage(pageConfig, components, basePath)
  }
)

ipcMain.handle(
  'igrp-studio:repo:project.findAllRecent',
  async (_event, page: { page: number; size: number }) => {
    return await repo.findAllRecent(page)
  }
)

ipcMain.handle('igrp-studio:repo:project.save', async (_event, project: Project) => {
  await repo.save(project)
})

handleWithCustomErrors(
  'next-engine:create-app',
  async (_event, appConfig: AppConfig, basePath: string) => {
    console.log(appConfig)
    await newApp(appConfig, basePath)
    await repo.save({
      path: basePath,
      dt_created: new Date(),
      config: {
        type: appConfig.type,
        name: appConfig.appName
      }
    })
  }
)

handleWithCustomErrors(
  'next-engine:delete-page',
  async (_event, pageConfig: PageConfig, basePath: string) => {
    await deletePage(pageConfig, basePath)
  }
)

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
