import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { Connection, DatabaseResponse, HandlerResponse, IWorkspace, ProjectData, ToolCheck } from '../main/types'
import { EVENTS } from '../main/constants/events'
import { ComponentRegistrationConfig, ServiceWorkspace } from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types'
import { WatchEvent } from '../main/helpers/watch-folder'


const backend = require('i18next-electron-fs-backend')

const handleError = (error: unknown): HandlerResponse => ({
	error: (error as Error).message || 'An unknown error occurred'
})

// Custom APIs for renderer
const api = {

	fetchSelectors: (module: string, basePath: string) =>
		ipcRenderer.invoke('spring-engine:fetch-selectors', module, basePath),

	openDirectory: (buttonLabel: string) => ipcRenderer.invoke('open-directory', buttonLabel),

	fetchFiles: (basePath: string) => ipcRenderer.invoke('igrp-studio:fetch-files', basePath),

	getJsonContent: (filePath: string) =>
		ipcRenderer.invoke('igrp-studio:get-json-content', filePath),

	getFileContent: (filePath: string) =>
		ipcRenderer.invoke('igrp-studio:get-file-content', filePath),

	readDirectory: (basePath: string) => ipcRenderer.invoke("read-directory", basePath),

	readProjectFile: (filePath: string) => ipcRenderer.invoke("read-file", filePath),

	openIDE: ({ basePath, ideType }: { basePath: string; ideType: string }) => ipcRenderer.invoke('igrp-studio:open-ide', { basePath, ideType }),
	getIDEs: () => ipcRenderer.invoke('igrp-studio:ides'),

	getVersions: (endpoint: string) => ipcRenderer.invoke('get-versions', endpoint),

	fetchData: (endpoint: string, headers: object) => ipcRenderer.invoke('fetch-data', endpoint, headers),

	i18nextElectronBackend: backend.preloadBindings(ipcRenderer, process),

	runDoctorChecks: (): Promise<ToolCheck[]> => ipcRenderer.invoke('run-doctor-checks'),
	saveDoctorReport: (results) => ipcRenderer.invoke('save-doctor-report', results),
}

const engine = {
	createProject: async (project: ProjectData, basePath: string): Promise<HandlerResponse> => {
		try {
			return await ipcRenderer.invoke(EVENTS.ENGINE.CREATE_PROJECT, project, basePath)
		} catch (error) {
			return handleError(error)
		}
	},
	delete: async (config: any, engineType: string, basePath: string): Promise<HandlerResponse> => {
		try {
			return await ipcRenderer.invoke(EVENTS.ENGINE.DELETE_ELEMENT, config, engineType, basePath)
		} catch (error) {
			return handleError(error)
		}
	},
	createResponse: async (response: any, engineType: string, basePath: string): Promise<HandlerResponse> => {
		try {
			return await ipcRenderer.invoke(EVENTS.SPRING.CREATE_RESPONSE, response, engineType, basePath)
		} catch (error) {
			return handleError(error)
		}
	},
	createDto: async (dtoConfig: any, engineType: string, basePath: string): Promise<HandlerResponse> => {
		try {
			return await ipcRenderer.invoke(EVENTS.SPRING.CREATE_DTO, dtoConfig, engineType, basePath)
		} catch (error) {
			return handleError(error)
		}
	},
	createModule: async (moduleConfig: any, engineType: string, basePath: string): Promise<HandlerResponse> => {
		try {
			return await ipcRenderer.invoke(EVENTS.SPRING.CREATE_MODULE, moduleConfig, engineType, basePath)
		} catch (error) {
			return handleError(error)
		}
	},
	createController: async (controllerConfig: any, engineType: string, basePath: string): Promise<HandlerResponse> => {
		try {
			return await ipcRenderer.invoke(EVENTS.SPRING.CREATE_CONTROLLER, controllerConfig, engineType, basePath)
		} catch (error) {
			return handleError(error)
		}
	},
	createModel: async (modelConfig: any, engineType: string, basePath: string): Promise<HandlerResponse> => {
		try {
			return await ipcRenderer.invoke(EVENTS.SPRING.CREATE_MODEL, modelConfig, engineType, basePath)
		} catch (error) {
			return handleError(error)
		}
	},
	createEnum: async (data: any, engineType: string, basePath: string): Promise<HandlerResponse> => {
		try {
			return await ipcRenderer.invoke(EVENTS.SPRING.CREATE_ENUM, data, engineType, basePath)
		} catch (error) {
			return handleError(error)
		}
	},
	serializeElement: async (data: any, engineType: string, basePath: string): Promise<HandlerResponse> => {
		try {
			return await ipcRenderer.invoke(EVENTS.ENGINE.SERIALIZE_ELEMENT, data, engineType, basePath)
		} catch (error) {
			return handleError(error)
		}
	},
	createPermission: async (data: any, engineType: string, basePath: string): Promise<HandlerResponse> => {
		try {
			return await ipcRenderer.invoke(EVENTS.ENGINE.CREATE_PERMISSION, data, engineType, basePath)
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
	},

	registry: async (engineType: string): Promise<HandlerResponse> => {
		try {
			return await ipcRenderer.invoke(EVENTS.NEXT.REGISTRY_COMPONENT, engineType)
		} catch (error) {
			return handleError(error)
		}
	},

	getComponent: async (engineType: string): Promise<HandlerResponse> => {
		try {
			return await ipcRenderer.invoke(EVENTS.NEXT.GET_COMPONENT, engineType)
		} catch (error) {
			return handleError(error)
		}
	},

	registerComponent: async (engineType: string, config: ComponentRegistrationConfig): Promise<HandlerResponse> => {
		try {
			return await ipcRenderer.invoke(EVENTS.NEXT.REGISTER_COMPONENT, engineType, config)
		} catch (error) {
			return handleError(error)
		}
	},

	getService: async (engineType: string): Promise<HandlerResponse> => {
		try {
			return await ipcRenderer.invoke(EVENTS.NEXT.GET_SERVICE, engineType)
		} catch (error) {
			return handleError(error)
		}
	},

	getDependencies: async (engineType: string): Promise<HandlerResponse> => {
		try {
			return await ipcRenderer.invoke(EVENTS.ENGINE.GET_DEPENDENCIES, engineType)
		} catch (error) {
			return handleError(error)
		}
	},

	getAppMetadata: async (engineType: string, basePath: string): Promise<HandlerResponse> => {
		try {
			return await ipcRenderer.invoke(EVENTS.NEXT.LOAD_METADATA, engineType, basePath)
		} catch (error) {
			return handleError(error)
		}
	},

	getCodeSnippets: async (engineType: string): Promise<HandlerResponse> => {
		try {
			return await ipcRenderer.invoke(EVENTS.NEXT.GET_CODE_SNIPPET, engineType)
		} catch (error) {
			return handleError(error)
		}
	},
}

const repo = {
	workspace: {
		// Initialization
		initialize: () => ipcRenderer.invoke(EVENTS.REPOSITORY.INITIALIZE),

		// Project methods
		findAllRecentProjects: (limit?: number) =>
			ipcRenderer.invoke(EVENTS.REPOSITORY.PROJECT.FIND_RECENT, limit),
		createProject: async (workspaceId: string, project: Omit<ProjectData, 'id' | 'createdAt' | 'workspaceId'>) => {
			try { return await ipcRenderer.invoke(EVENTS.REPOSITORY.PROJECT.CREATE, workspaceId, project) } catch (error) {
				return handleError(error)
			}
		},
		updateProject: async (projectId: string, updates: Partial<ProjectData>) => {
			try { return await ipcRenderer.invoke(EVENTS.REPOSITORY.PROJECT.UPDATE, projectId, updates) } catch (error) {
				return handleError(error)
			}
		},
		saveCustomWorkspaceComposeFile: (yaml: object, basePath: string) =>
			ipcRenderer.invoke(EVENTS.REPOSITORY.WORKSPACE.SAVE_CUSTOM_YAML, yaml, basePath),
		configureService: (config: ServiceWorkspace, basePath: string) =>
			ipcRenderer.invoke(EVENTS.REPOSITORY.PROJECT.CONFIGURE_SERVICE, config, basePath),
		deleteProject: (projectId: string, basePath: string) =>
			ipcRenderer.invoke(EVENTS.REPOSITORY.PROJECT.DELETE, projectId, basePath),
		getProject: (projectId: string) =>
			ipcRenderer.invoke(EVENTS.REPOSITORY.PROJECT.GET, projectId),
		findAllProjects: (workspaceId?: string) =>
			ipcRenderer.invoke(EVENTS.REPOSITORY.PROJECT.FIND_ALL, workspaceId),

		// Workspace methods
		findAllWorkspaces: () =>
			ipcRenderer.invoke(EVENTS.REPOSITORY.WORKSPACE.FIND_ALL),
		findRecentWorkspaces: (limit?: number) =>
			ipcRenderer.invoke(EVENTS.REPOSITORY.WORKSPACE.FIND_RECENT, limit),
		createWorkspace: async (workspace: Omit<IWorkspace, 'id' | 'createdAt'>): Promise<HandlerResponse> => {
			try { return await ipcRenderer.invoke(EVENTS.REPOSITORY.WORKSPACE.CREATE, workspace) } catch (error) {
				return handleError(error)
			}
		},
		updateWorkspace: (workspaceId: string, updates: Partial<IWorkspace>) =>
			ipcRenderer.invoke(EVENTS.REPOSITORY.WORKSPACE.UPDATE, workspaceId, updates),
		deleteWorkspace: (workspaceId: string) =>
			ipcRenderer.invoke(EVENTS.REPOSITORY.WORKSPACE.DELETE, workspaceId),
		getWorkspace: (workspaceId: string) =>
			ipcRenderer.invoke(EVENTS.REPOSITORY.WORKSPACE.GET, workspaceId),
		getLastAccessedWorkspace: () => ipcRenderer.invoke(EVENTS.REPOSITORY.WORKSPACE.GET_CURRENT),

		// Service methods
		createService: (service: ServiceWorkspace, basePath: string) =>
			ipcRenderer.invoke(EVENTS.REPOSITORY.SERVICE.CREATE, service, basePath),
		updateService: (service: ServiceWorkspace, basePath: string) =>
			ipcRenderer.invoke(EVENTS.REPOSITORY.SERVICE.UPDATE, service, basePath),
		deleteService: (serviceId: string, basePath: string) =>
			ipcRenderer.invoke(EVENTS.REPOSITORY.SERVICE.DELETE, serviceId, basePath),
		findAllServices: (workspaceId: string) =>
			ipcRenderer.invoke(EVENTS.REPOSITORY.SERVICE.FIND_ALL, workspaceId),

		// Backup methods
		createBackup: (backupPath?: string) =>
			ipcRenderer.invoke(EVENTS.REPOSITORY.BACKUP.CREATE, backupPath),
		restoreBackup: (backupPath: string) =>
			ipcRenderer.invoke(EVENTS.REPOSITORY.BACKUP.RESTORE, backupPath),

		onError: (callback: (error: {
			code: string;
			message: string
		}) => void) => {
			ipcRenderer.on(EVENTS.ERROR, (_event, error) => callback(error));
			return () => ipcRenderer.removeAllListeners(EVENTS.ERROR);
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
		},
		connectToDatabase: async (config: Connection): Promise<DatabaseResponse> => {
			return await ipcRenderer.invoke('connect-database', config)
		},

		getTables: async (connectionName: string): Promise<DatabaseResponse> => {
			return await ipcRenderer.invoke('get-tables', connectionName)
		},

		getTableStructure: async (connectionName: string, tableName: string): Promise<DatabaseResponse> => {
			return await ipcRenderer.invoke('get-table-structure', connectionName, tableName)
		},
	},
	docker: {
		up: (projectPath: string) => ipcRenderer.invoke('docker-up', projectPath),
		down: (projectPath: string, options: { dropVolume?: boolean }) => ipcRenderer.invoke('docker-down', projectPath, options),
		status: (projectPath: string) => ipcRenderer.invoke('docker-status', projectPath),
		stop: (projectPath: string, options: { services: string[] }) => ipcRenderer.invoke('docker-stop', projectPath, options),
		restart: (projectPath: string, options: { services: string[]; timeout?: number }) => ipcRenderer.invoke('docker-restart', projectPath, options),
		check: () => ipcRenderer.invoke('docker-check')
	}
}

const window = {
	minimizeWindow: () => ipcRenderer.send('minimize-window'),
	maximizeWindow: () => ipcRenderer.send('maximize-window'),
	closeWindow: () => ipcRenderer.send('close-window'),
	restoreWindow: () => ipcRenderer.send('restore-window'),
	isMaximized: async () => await ipcRenderer.invoke('is-window-maximized')
}
const appLogic = {

	// Environments
	getEnvironments: () => ipcRenderer.invoke(EVENTS.APPLOGIC.FIND_ALL),
	addEnvironment: (environment) => ipcRenderer.invoke(EVENTS.APPLOGIC.CREATE, environment),
	updateEnvironment: (id, updates) => ipcRenderer.invoke(EVENTS.APPLOGIC.UPDATE, id, updates),
	deleteEnvironment: (id) => ipcRenderer.invoke(EVENTS.APPLOGIC.DELETE, id),
	getEnvironment: (id) => ipcRenderer.invoke(EVENTS.APPLOGIC.GET, id),

	// History
	addConnectionTest: (test) => ipcRenderer.invoke("app-logic:add-connection-test", test),
	getEnvironmentHistory: (environmentId) => ipcRenderer.invoke("app-logic:get-environment-history", environmentId),

	// Export/Import
	exportData: () => ipcRenderer.invoke("app-logic:export-data"),
	importData: (jsonData) => ipcRenderer.invoke("app-logic:import-data", jsonData),

	// Test
	testEnvironment: (environment) => ipcRenderer.invoke(EVENTS.APPLOGIC.TEST, environment),

	// Store info
	getStoreInfo: () => ipcRenderer.invoke("app-logic:get-store-info"),

	// Events
	onEnvironmentsChanged: (callback) => {
		const subscription = (event, environments) => callback(environments)
		ipcRenderer.on(EVENTS.APPLOGIC.CHANGE, subscription)
		return () => ipcRenderer.removeListener(EVENTS.APPLOGIC.CHANGE, subscription)
	},

	removeAllListeners: () => ipcRenderer.removeAllListeners(EVENTS.APPLOGIC.CHANGE),
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
			setLanguage: (lang: string) => ipcRenderer.invoke("set-language", lang),
			checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
			downloadUpdate: () => ipcRenderer.invoke('download-update'),
			installUpdate: () => ipcRenderer.invoke('install-update'),
			watchFolder: (folderPath: string) => ipcRenderer.invoke('watch-folder', folderPath),
			onFolderChange: (callback: (event: WatchEvent) => void) => {
				ipcRenderer.on('folder-change', (_, data: WatchEvent) => callback(data));
			},

		})
		contextBridge.exposeInMainWorld('api', api)
		contextBridge.exposeInMainWorld('engine', engine)
		contextBridge.exposeInMainWorld('igrpStudio', repo)
		contextBridge.exposeInMainWorld('menu', window)
		contextBridge.exposeInMainWorld('appLogicAPI', appLogic)

	} catch (error) {
		console.error(error)
	}
} else {
	window.electron = electronAPI
	window.api = api
}
