import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import {
  BaseApiConfig,
  ControllerConfig,
  DTOBaseConfig,
  DTOConfig,
  ModelConfig
} from '@igrp/spring-engine/dist/interfaces/types'
import { AppConfig, Component, PageConfig } from '@igrp/nextjs-engine/dist/interfaces/types'
import { HandlerResponse, Page, Project } from '../main/types'
const backend = require('i18next-electron-fs-backend')

const handleError = (error: unknown): HandlerResponse => ({
  error: (error as Error).message || 'An unknown error occurred'
})

// Custom APIs for renderer
const api = {
  createApi: async (apiConfig: BaseApiConfig, basePath: string): Promise<HandlerResponse> => {
    try {
      return await ipcRenderer.invoke('spring-engine:create-api', apiConfig, basePath)
    } catch (error) {
      return handleError(error)
    }
  },

  createModule: async (moduleConfig: ModelConfig, basePath: string): Promise<HandlerResponse> => {
    try {
      return await ipcRenderer.invoke('spring-engine:create-module', moduleConfig, basePath)
    } catch (error) {
      return handleError(error)
    }
  },

  createModel: async (modelConfig: ModelConfig, basePath: string): Promise<HandlerResponse> => {
    try {
      return await ipcRenderer.invoke('spring-engine:create-model', modelConfig, basePath)
    } catch (error) {
      return handleError(error)
    }
  },

  createDto: async (dtoConfig: DTOConfig, basePath: string): Promise<HandlerResponse> => {
    try {
      return await ipcRenderer.invoke('spring-engine:create-dto', dtoConfig, basePath)
    } catch (error) {
      return handleError(error)
    }
  },

  createController: async (
    controllerConfig: ControllerConfig,
    basePath: string
  ): Promise<HandlerResponse> => {
    try {
      return await ipcRenderer.invoke('spring-engine:create-controller', controllerConfig, basePath)
    } catch (error) {
      return handleError(error)
    }
  },

  deleteDTO: async (config: DTOBaseConfig, basePath: string): Promise<HandlerResponse> => {
    try {
      return await ipcRenderer.invoke('spring-engine:delete-dto', config, basePath)
    } catch (error) {
      return handleError(error)
    }
  },

  deleteModel: async (config: ModelConfig, basePath: string): Promise<HandlerResponse> => {
    try {
      return await ipcRenderer.invoke('spring-engine:delete-model', config, basePath)
    } catch (error) {
      return handleError(error)
    }
  },

  deleteController: async (
    config: ControllerConfig,
    basePath: string
  ): Promise<HandlerResponse> => {
    try {
      return await ipcRenderer.invoke('spring-engine:delete-controller', config, basePath)
    } catch (error) {
      return handleError(error)
    }
  },

  createAppNext: async (apiConfig: AppConfig, basePath: string): Promise<HandlerResponse> => {
    try {
      return await ipcRenderer.invoke('next-engine:create-app', apiConfig, basePath)
    } catch (error) {
      return handleError(error)
    }
  },

  createPage: async (modelConfig: AppConfig, basePath: string): Promise<HandlerResponse> => {
    try {
      return await ipcRenderer.invoke('next-engine:create-page', modelConfig, basePath)
    } catch (error) {
      return handleError(error)
    }
  },

  deletePage: async (pageConfig: PageConfig, basePath: string): Promise<HandlerResponse> => {
    try {
      return await ipcRenderer.invoke('next-engine:delete-page', pageConfig, basePath)
    } catch (error) {
      return handleError(error)
    }
  },

  addComponentToPage: async (
    pageConfig: PageConfig,
    components: Component[],
    basePath: string
  ): Promise<HandlerResponse> => {
    try {
      return await ipcRenderer.invoke(
        'next-engine:add-component-page',
        pageConfig,
        components,
        basePath
      )
    } catch (error) {
      return handleError(error)
    }
  },

  fetchSelectors: (module: string, basePath: string) =>
    ipcRenderer.invoke('spring-engine:fetch-selectors', module, basePath),

  openDirectory: (buttonLabel: string) => ipcRenderer.invoke('open-directory', buttonLabel),
  fetchFiles: (basePath: string) => ipcRenderer.invoke('igrp-studio:fetch-files', basePath),
  getJsonContent: (filePath: string) =>
    ipcRenderer.invoke('igrp-studio:get-json-content', filePath),

  openVSCode: (basePath: string) => ipcRenderer.invoke('igrp-studio:open-vs-code', basePath),

  i18nextElectronBackend: backend.preloadBindings(ipcRenderer, process)
}

const repo = {
  project: {
    findAllRecent: (page: Page) => {
      return ipcRenderer.invoke('igrp-studio:repo:project.findAllRecent', page)
    },
    save: (p: Project) => {
      return ipcRenderer.invoke('igrp-studio:repo:project.save', p)
    },
    delete: (p: Project, index: number) => {
      return ipcRenderer.invoke('igrp-studio:repo:project.delete', p, index)
    }
  }
}

const window = {
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  restoreWindow: () => ipcRenderer.send('restore-window'),
  isMaximized: () => ipcRenderer.send('is-window-maximized')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('repo', repo)
    contextBridge.exposeInMainWorld('menu', window)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
