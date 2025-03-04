import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import {
	ControllerConfig,
	DTOConfig,
	ModelConfig
} from '@igrp/igrp-studio-springboot-engine/dist/interfaces/types'
import { Connection, DatabaseResponse, HandlerResponse, Page, ProjectData } from '../main/types'
import { EVENTS } from '../main/constants/events'
const backend = require('i18next-electron-fs-backend')

const handleError = (error: unknown): HandlerResponse => ({
	error: (error as Error).message || 'An unknown error occurred'
})

// Custom APIs for renderer
const api = {

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

	fetchSelectors: (module: string, basePath: string) =>
		ipcRenderer.invoke('spring-engine:fetch-selectors', module, basePath),

	openDirectory: (buttonLabel: string) => ipcRenderer.invoke('open-directory', buttonLabel),

	fetchFiles: (basePath: string) => ipcRenderer.invoke('igrp-studio:fetch-files', basePath),

	getJsonContent: (filePath: string) =>
		ipcRenderer.invoke('igrp-studio:get-json-content', filePath),

	readDirectory: (basePath: string) => ipcRenderer.invoke("read-directory", basePath),

	readProjectFile: (filePath: string) => ipcRenderer.invoke("read-file", filePath),

	openVSCode: (basePath: string) => ipcRenderer.invoke('igrp-studio:open-vs-code', basePath),

	getVersions: (endpoint: string) => ipcRenderer.invoke('get-versions', endpoint),

	//Database
	connectToDatabase: async (config: Connection): Promise<DatabaseResponse> => {
		return await ipcRenderer.invoke('connect-database', config)
	},

	getTables: async (connectionName: string): Promise<DatabaseResponse> => {
		return await ipcRenderer.invoke('get-tables', connectionName)
	},

	getTableStructure: async (connectionName: string, tableName: string): Promise<DatabaseResponse> => {
		return await ipcRenderer.invoke('get-table-structure', connectionName, tableName)
	},

	i18nextElectronBackend: backend.preloadBindings(ipcRenderer, process)
}

const engine = {
	createProject: async (project: ProjectData, basePath: string): Promise<HandlerResponse> => {
		try {
			return await ipcRenderer.invoke('engine:create-project', project, basePath)
		} catch (error) {
			return handleError(error)
		}
	},
	delete: async (config: any, engineType: string, basePath: string): Promise<HandlerResponse> => {
		try {
			return await ipcRenderer.invoke('engine:delete-element', config, engineType, basePath)
		} catch (error) {
			return handleError(error)
		}
	},
	createResponse: async (response: any, engineType: string, basePath: string): Promise<HandlerResponse> => {
		try {
			return await ipcRenderer.invoke('engine:create-response', response, engineType, basePath)
		} catch (error) {
			return handleError(error)
		}
	},
	createEnum: async (data: any, engineType: string, basePath: string): Promise<HandlerResponse> => {
		try {
			return await ipcRenderer.invoke('engine:create-enum', data, engineType, basePath)
		} catch (error) {
			return handleError(error)
		}
	},
	serializeElement: async (data: any, engineType: string, basePath: string): Promise<HandlerResponse> => {
		try {
			return await ipcRenderer.invoke('engine:serialize-element', data, engineType, basePath)
		} catch (error) {
			return handleError(error)
		}
	},
	createPermission: async (data: any, engineType: string, basePath: string): Promise<HandlerResponse> => {
		try {
			return await ipcRenderer.invoke('engine:create-permission', data, engineType, basePath)
		} catch (error) {
			return handleError(error)
		}
	},

	createPage: async (data: any, engineType: string, basePath: string): Promise<HandlerResponse> => {
		try {
			return await ipcRenderer.invoke(EVENTS.NEXT.CREATE_PAGE, data, engineType, basePath)
		} catch (error) {
			return handleError(error)
		}
	}
}

const repo = {
	project: {
		findAllRecent: (page: Page) => {
			return ipcRenderer.invoke('igrp-studio:repo:project.findAllRecent', page)
		},
		save: (p: ProjectData) => {
			return ipcRenderer.invoke('igrp-studio:repo:project.save', p)
		},
		delete: (p: ProjectData, index: number) => {
			return ipcRenderer.invoke('igrp-studio:repo:project.delete', p, index)
		}
	},
	connection: {
		findAll: () => {
			return ipcRenderer.invoke('igrp-studio:repo:connection.findAll')
		},
		save: (connection: Connection) => {
			return ipcRenderer.invoke('igrp-studio:repo:connection.save', connection)
		},
		delete: (connection: Connection) => {
			return ipcRenderer.invoke('igrp-studio:repo:connection.delete', connection)
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
		contextBridge.exposeInMainWorld('electron', {
			...electronAPI,
			getAppVersion: () => ipcRenderer.invoke('get-app-version'),
			getLanguage: () => ipcRenderer.invoke("get-language"),
			setLanguage: (lang: string) => ipcRenderer.invoke("set-language", lang)
		})
		contextBridge.exposeInMainWorld('api', api)
		contextBridge.exposeInMainWorld('engine', engine)
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
