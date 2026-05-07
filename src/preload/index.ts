import { electronAPI } from '@electron-toolkit/preload'
import type { ComponentRegistrationConfig } from '@igrp/igrp-studio-nextjs-engine/types'
import type { ServiceWorkspace } from '@igrp/igrp-studio-workspace-engine/dist/interfaces/types'
import { contextBridge, ipcRenderer } from 'electron'
import { preloadBindings } from 'i18next-electron-fs-backend'
import { EVENTS } from '../main/constants/events'
import type { WatchEvent } from '../main/helpers/watch-folder'
import type {
    BPMNConfig,
    Connection,
    DatabaseResponse,
    HandlerResponse,
    IWorkspace,
    OptionalStacksStatus,
    ProjectData,
    ToolCheck,
    WorkspaceBootstrapOptions
} from '../main/types'

const handleError = (error: unknown): HandlerResponse => ({
    error: (error as Error).message || 'An unknown error occurred'
})

/** IPC cannot serialize Error instances reliably; send a plain object. */
function serializeErrorForIpc(error: Error): { message: string; name: string; stack?: string } {
    return { message: error.message, name: error.name, stack: error.stack }
}

// Update channel type for auto-updates (stable | beta)
export type UpdateChannel = 'stable' | 'beta'

// Extended Electron API type
type ExtendedElectronAPI = typeof electronAPI & {
    getAppVersion: () => Promise<string>
    checkForUpdates: () => Promise<string>
    downloadUpdate: () => Promise<void>
    installUpdate: () => Promise<void>
    getUpdateChannel: () => Promise<UpdateChannel>
    setUpdateChannel: (channel: UpdateChannel) => Promise<void>
    reconfigureUpdateChannel: () => Promise<void>
    watchFolder: (folderPath: string) => Promise<void>
    onFolderChange: (callback: (event: WatchEvent) => void) => void
    reportError: (error: Error) => void
}

// Custom APIs for renderer
const api = {
    reportError: (error: Error) => ipcRenderer.send('report-error', serializeErrorForIpc(error)),

    fetchSelectors: (module: string, basePath: string) =>
        ipcRenderer.invoke('spring-engine:fetch-selectors', module, basePath),

    openDirectory: (buttonLabel?: string) => ipcRenderer.invoke('open-directory', buttonLabel),

    fetchFiles: (basePath: string) => ipcRenderer.invoke('igrp-studio:fetch-files', basePath),

    getJsonContent: (filePath: string) =>
        ipcRenderer.invoke('igrp-studio:get-json-content', filePath),

    getFileContent: (filePath: string) =>
        ipcRenderer.invoke('igrp-studio:get-file-content', filePath),

    readDirectory: (basePath: string) => ipcRenderer.invoke('read-directory', basePath),

    readProjectFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),

    openIDE: ({ basePath, ideType }: { basePath: string; ideType: string }) =>
        ipcRenderer.invoke('igrp-studio:open-ide', { basePath, ideType }),
    getIDEs: () => ipcRenderer.invoke('igrp-studio:ides'),

    getVersions: (endpoint: string) => ipcRenderer.invoke('get-versions', endpoint),

    fetchData: (endpoint: string, headers: object) =>
        ipcRenderer.invoke('fetch-data', endpoint, headers),

    i18nextElectronBackend: preloadBindings(ipcRenderer, process),

    runDoctorChecks: (): Promise<ToolCheck[]> => ipcRenderer.invoke('run-doctor-checks'),
    saveDoctorReport: (results) => ipcRenderer.invoke('save-doctor-report', results),
    installIGRPCLI: (): Promise<{ success: boolean; output?: string; error?: string }> =>
        ipcRenderer.invoke('install-igrp-cli'),

    saveProjectIcon: (data: { filePath: string; fileData: ArrayBuffer; assetsPath: string }) =>
        ipcRenderer.invoke('save-project-icon', data),

    getIconFile: (iconPath: string, workspacePath: string) =>
        ipcRenderer.invoke('get-icon-file', iconPath, workspacePath)
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
            return await ipcRenderer.invoke(
                EVENTS.ENGINE.DELETE_ELEMENT,
                config,
                engineType,
                basePath
            )
        } catch (error) {
            return handleError(error)
        }
    },
    duplicate: async (
        config: any,
        engineType: string,
        basePath: string
    ): Promise<HandlerResponse> => {
        try {
            return await ipcRenderer.invoke(
                EVENTS.ENGINE.DUPLICATE_ELEMENT,
                config,
                engineType,
                basePath
            )
        } catch (error) {
            return handleError(error)
        }
    },
    createResponse: async (
        response: any,
        engineType: string,
        basePath: string
    ): Promise<HandlerResponse> => {
        try {
            return await ipcRenderer.invoke(
                EVENTS.SPRING.CREATE_RESPONSE,
                response,
                engineType,
                basePath
            )
        } catch (error) {
            return handleError(error)
        }
    },
    createDto: async (
        dtoConfig: any,
        engineType: string,
        basePath: string
    ): Promise<HandlerResponse> => {
        try {
            return await ipcRenderer.invoke(
                EVENTS.SPRING.CREATE_DTO,
                dtoConfig,
                engineType,
                basePath
            )
        } catch (error) {
            return handleError(error)
        }
    },
    createModule: async (
        moduleConfig: any,
        engineType: string,
        basePath: string
    ): Promise<HandlerResponse> => {
        try {
            return await ipcRenderer.invoke(
                EVENTS.SPRING.CREATE_MODULE,
                moduleConfig,
                engineType,
                basePath
            )
        } catch (error) {
            return handleError(error)
        }
    },
    createController: async (
        controllerConfig: any,
        engineType: string,
        basePath: string
    ): Promise<HandlerResponse> => {
        try {
            return await ipcRenderer.invoke(
                EVENTS.SPRING.CREATE_CONTROLLER,
                controllerConfig,
                engineType,
                basePath
            )
        } catch (error) {
            return handleError(error)
        }
    },
    createModel: async (
        modelConfig: any,
        engineType: string,
        basePath: string
    ): Promise<HandlerResponse> => {
        try {
            return await ipcRenderer.invoke(
                EVENTS.SPRING.CREATE_MODEL,
                modelConfig,
                engineType,
                basePath
            )
        } catch (error) {
            return handleError(error)
        }
    },
    createEnum: async (
        data: any,
        engineType: string,
        basePath: string
    ): Promise<HandlerResponse> => {
        try {
            return await ipcRenderer.invoke(EVENTS.SPRING.CREATE_ENUM, data, engineType, basePath)
        } catch (error) {
            return handleError(error)
        }
    },
    serializeElement: async (
        data: any,
        engineType: string,
        basePath: string
    ): Promise<HandlerResponse> => {
        try {
            return await ipcRenderer.invoke(
                EVENTS.ENGINE.SERIALIZE_ELEMENT,
                data,
                engineType,
                basePath
            )
        } catch (error) {
            return handleError(error)
        }
    },
    createPermission: async (
        data: any,
        engineType: string,
        basePath: string
    ): Promise<HandlerResponse> => {
        try {
            return await ipcRenderer.invoke(
                EVENTS.ENGINE.CREATE_PERMISSION,
                data,
                engineType,
                basePath
            )
        } catch (error) {
            return handleError(error)
        }
    },

    createPage: async (
        data: any,
        engineType: string,
        basePath: string
    ): Promise<HandlerResponse> => {
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

    registerComponent: async (
        engineType: string,
        config: ComponentRegistrationConfig
    ): Promise<HandlerResponse> => {
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

    createProcess: async (
        process: any,
        engineType: string,
        basePath: string
    ): Promise<HandlerResponse> => {
        try {
            return await ipcRenderer.invoke(
                EVENTS.NEXT.CREATE_PROCESS,
                process,
                engineType,
                basePath
            )
        } catch (error) {
            return handleError(error)
        }
    },

    createProcessStep: async (
        step: any,
        engineType: string,
        basePath: string
    ): Promise<HandlerResponse> => {
        try {
            return await ipcRenderer.invoke(
                EVENTS.NEXT.CREATE_PROCESS_STEP,
                step,
                engineType,
                basePath
            )
        } catch (error) {
            return handleError(error)
        }
    }
}

const repo = {
    workspace: {
        // Initialization
        initialize: () => ipcRenderer.invoke(EVENTS.REPOSITORY.INITIALIZE),

        // Project methods
        findAllRecentProjects: (limit?: number) =>
            ipcRenderer.invoke(EVENTS.REPOSITORY.PROJECT.FIND_RECENT, limit),
        createProject: async (
            workspaceId: string,
            project: Omit<ProjectData, 'id' | 'createdAt' | 'workspaceId'>
        ) => {
            try {
                return await ipcRenderer.invoke(
                    EVENTS.REPOSITORY.PROJECT.CREATE,
                    workspaceId,
                    project
                )
            } catch (error) {
                return handleError(error)
            }
        },
        updateProject: async (projectId: string, updates: Partial<ProjectData>) => {
            try {
                return await ipcRenderer.invoke(
                    EVENTS.REPOSITORY.PROJECT.UPDATE,
                    projectId,
                    updates
                )
            } catch (error) {
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
        findAllWorkspaces: () => ipcRenderer.invoke(EVENTS.REPOSITORY.WORKSPACE.FIND_ALL),
        findRecentWorkspaces: (limit?: number) =>
            ipcRenderer.invoke(EVENTS.REPOSITORY.WORKSPACE.FIND_RECENT, limit),
        createWorkspace: async (
            workspace: Omit<IWorkspace, 'id' | 'createdAt'>,
            options?: WorkspaceBootstrapOptions
        ): Promise<HandlerResponse> => {
            try {
                return await ipcRenderer.invoke(
                    EVENTS.REPOSITORY.WORKSPACE.CREATE,
                    workspace,
                    options
                )
            } catch (error) {
                return handleError(error)
            }
        },
        installOptionalStacks: async (
            workspaceId: string,
            options: WorkspaceBootstrapOptions
        ): Promise<HandlerResponse> => {
            try {
                return await ipcRenderer.invoke(
                    EVENTS.REPOSITORY.WORKSPACE.INSTALL_OPTIONAL_STACKS,
                    workspaceId,
                    options
                )
            } catch (error) {
                return handleError(error)
            }
        },
        getOptionalStacksStatus: async (workspacePath: string): Promise<OptionalStacksStatus> => {
            return await ipcRenderer.invoke(
                EVENTS.REPOSITORY.WORKSPACE.GET_OPTIONAL_STACKS_STATUS,
                workspacePath
            )
        },
        updateWorkspace: (workspaceId: string, updates: Partial<IWorkspace>) =>
            ipcRenderer.invoke(EVENTS.REPOSITORY.WORKSPACE.UPDATE, workspaceId, updates),
        deleteWorkspace: (workspaceId: string) =>
            ipcRenderer.invoke(EVENTS.REPOSITORY.WORKSPACE.DELETE, workspaceId),
        getWorkspace: (workspaceId: string) =>
            ipcRenderer.invoke(EVENTS.REPOSITORY.WORKSPACE.GET, workspaceId),
        getLastAccessedWorkspace: () => ipcRenderer.invoke(EVENTS.REPOSITORY.WORKSPACE.GET_CURRENT),
        openWorkspace: async (workspacePath: string): Promise<HandlerResponse> => {
            try {
                return await ipcRenderer.invoke(EVENTS.REPOSITORY.WORKSPACE.OPEN, workspacePath)
            } catch (error) {
                return handleError(error)
            }
        },
        addProjectToWorkspace: async (
            workspaceId: string,
            project: ProjectData
        ): Promise<HandlerResponse> => {
            try {
                return await ipcRenderer.invoke(
                    EVENTS.REPOSITORY.PROJECT.ADD_TO_WORKSPACE,
                    workspaceId,
                    project
                )
            } catch (error) {
                return handleError(error)
            }
        },

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

        onError: (callback: (error: { code: string; message: string }) => void) => {
            ipcRenderer.on(EVENTS.ERROR, (_event, error) => callback(error))
            return () => ipcRenderer.removeAllListeners(EVENTS.ERROR)
        }
    },
    connection: {
        findAll: () => {
            return ipcRenderer.invoke(EVENTS.CONNECTION.GET_CONNECTIONS)
        },
        save: (connection: Connection) => {
            return ipcRenderer.invoke(EVENTS.CONNECTION.SAVE_CONNECTION, connection)
        },
        delete: (connection: string) => {
            return ipcRenderer.invoke(EVENTS.CONNECTION.DELETE_CONNECTION, connection)
        },
        connectToDatabase: async (config: Connection): Promise<DatabaseResponse> => {
            return await ipcRenderer.invoke(EVENTS.CONNECTION.CONNECT_DATABASE, config)
        },

        getTables: async (connectionName: string): Promise<DatabaseResponse> => {
            return await ipcRenderer.invoke(EVENTS.CONNECTION.GET_TABLES, connectionName)
        },

        getTableStructure: async (
            connectionName: string,
            tableName: string
        ): Promise<DatabaseResponse> => {
            return await ipcRenderer.invoke(
                EVENTS.CONNECTION.GET_TABLE_STRUCTURE,
                connectionName,
                tableName
            )
        }
    },
    docker: {
        up: (projectPath: string) => ipcRenderer.invoke(EVENTS.DOCKER.UP, projectPath),
        deployProject: (projectPath: string) =>
            ipcRenderer.invoke(EVENTS.DOCKER.DEPLOY_PROJECT, projectPath),
        down: (projectPath: string, options: { dropVolume?: boolean }) =>
            ipcRenderer.invoke(EVENTS.DOCKER.DOWN, projectPath, options),
        status: (projectPath: string) => ipcRenderer.invoke(EVENTS.DOCKER.STATUS, projectPath),
        stop: (projectPath: string, options: { services: string[] }) =>
            ipcRenderer.invoke(EVENTS.DOCKER.STOP, projectPath, options),
        restart: (projectPath: string, options: { services: string[]; timeout?: number }) =>
            ipcRenderer.invoke(EVENTS.DOCKER.RESTART, projectPath, options),
        check: () => ipcRenderer.invoke(EVENTS.DOCKER.CHECK),
        daemonStatus: () => ipcRenderer.invoke(EVENTS.DOCKER.DAEMON_STATUS)
    }
}

const windowControls = {
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
    addConnectionTest: (test) => ipcRenderer.invoke('app-logic:add-connection-test', test),
    getEnvironmentHistory: (environmentId) =>
        ipcRenderer.invoke('app-logic:get-environment-history', environmentId),

    // Export/Import
    exportData: () => ipcRenderer.invoke('app-logic:export-data'),
    importData: (jsonData) => ipcRenderer.invoke('app-logic:import-data', jsonData),

    // Test
    testEnvironment: (environment) => ipcRenderer.invoke(EVENTS.APPLOGIC.TEST, environment),

    // Store info
    getStoreInfo: () => ipcRenderer.invoke('app-logic:get-store-info'),

    // Events
    onEnvironmentsChanged: (callback) => {
        const subscription = (_event, environments) => callback(environments)
        ipcRenderer.on(EVENTS.APPLOGIC.CHANGE, subscription)
        return () => ipcRenderer.removeListener(EVENTS.APPLOGIC.CHANGE, subscription)
    },

    removeAllListeners: () => ipcRenderer.removeAllListeners(EVENTS.APPLOGIC.CHANGE)
}

const igrpStudioSettings = {
    getBPMNConfigs: () => ipcRenderer.invoke(EVENTS.BPMN.GET_CONFIGS),
    getBPMNConfig: () => ipcRenderer.invoke(EVENTS.BPMN.GET_CONFIG),
    addBPMNConfig: (config: BPMNConfig) => ipcRenderer.invoke(EVENTS.BPMN.ADD_CONFIG, config),
    updateBPMNConfig: (config: BPMNConfig) => ipcRenderer.invoke(EVENTS.BPMN.UPDATE_CONFIG, config),
    deleteBPMNConfig: (configId: string) => ipcRenderer.invoke(EVENTS.BPMN.DELETE_CONFIG, configId),
    setActiveBPMNConfig: (configId: string) =>
        ipcRenderer.invoke(EVENTS.BPMN.SET_ACTIVE_CONFIG, configId),
    deleteAllBPMNConfigs: () => ipcRenderer.invoke(EVENTS.BPMN.DELETE_ALL_CONFIGS),

    // Language methods
    getLanguage: () => ipcRenderer.invoke(EVENTS.LANGUAGE.GET_LANGUAGE),
    setLanguage: (lang: string) => ipcRenderer.invoke(EVENTS.LANGUAGE.SET_LANGUAGE, lang),

    // BPMN Project Preference methods
    setSelectedBPMNProject: (projectId: string) =>
        ipcRenderer.invoke(EVENTS.BPMN.SET_SELECTED_PROJECT, projectId),
    getSelectedBPMNProject: () => ipcRenderer.invoke(EVENTS.BPMN.GET_SELECTED_PROJECT),

    // BPMN Process Preference methods
    setSelectedBPMNProcess: (processDefinitionId: string) =>
        ipcRenderer.invoke(EVENTS.BPMN.SET_SELECTED_PROCESS, processDefinitionId),
    getSelectedBPMNProcess: () => ipcRenderer.invoke(EVENTS.BPMN.GET_SELECTED_PROCESS),

    getWelcomeOnboardingCompleted: () =>
        ipcRenderer.invoke(EVENTS.ONBOARDING.GET_WELCOME_COMPLETED),
    setWelcomeOnboardingCompleted: (completed: boolean) =>
        ipcRenderer.invoke(EVENTS.ONBOARDING.SET_WELCOME_COMPLETED, completed)
}

const terminal = {
    create: (sessionId: string, cwd?: string) => ipcRenderer.send('pty-create', { sessionId, cwd }),
    send: (sessionId: string, data: string) => ipcRenderer.send('pty-input', { sessionId, data }),
    resize: (sessionId: string, cols: number, rows: number) =>
        ipcRenderer.send('pty-resize', { sessionId, cols, rows }),
    destroy: (sessionId: string) => ipcRenderer.send('pty-destroy', sessionId),
    onData: (callback: (payload: { sessionId: string; data: string }) => void) => {
        const subscription = (
            _: Electron.IpcRendererEvent,
            payload: { sessionId: string; data: string }
        ) => callback(payload)
        ipcRenderer.on('pty-data', subscription)
        return () => ipcRenderer.removeListener('pty-data', subscription)
    },
    onExit: (callback: (payload: { sessionId: string }) => void) => {
        const subscription = (_: Electron.IpcRendererEvent, payload: { sessionId: string }) =>
            callback(payload)
        ipcRenderer.on('pty-exit', subscription)
        return () => ipcRenderer.removeListener('pty-exit', subscription)
    }
}
// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
    try {
        contextBridge.exposeInMainWorld('electron', {
            ...electronAPI,
            getAppVersion: () => ipcRenderer.invoke('get-app-version'),
            checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
            downloadUpdate: () => ipcRenderer.invoke('download-update'),
            installUpdate: () => ipcRenderer.invoke('install-update'),
            getUpdateChannel: () => ipcRenderer.invoke('update:get-channel'),
            setUpdateChannel: (channel: UpdateChannel) =>
                ipcRenderer.invoke('update:set-channel', channel),
            reconfigureUpdateChannel: () => ipcRenderer.invoke('update:reconfigure-channel'),
            watchFolder: (folderPath: string) => ipcRenderer.invoke('watch-folder', folderPath),
            onFolderChange: (callback: (event: WatchEvent) => void) => {
                ipcRenderer.on('folder-change', (_, data: WatchEvent) => callback(data))
            },
            reportError: (error: Error) =>
                ipcRenderer.send('report-error', serializeErrorForIpc(error))
        })
        contextBridge.exposeInMainWorld('api', api)
        contextBridge.exposeInMainWorld('engine', engine)
        contextBridge.exposeInMainWorld('igrpStudio', repo)
        contextBridge.exposeInMainWorld('menu', windowControls)
        contextBridge.exposeInMainWorld('appLogicAPI', appLogic)
        contextBridge.exposeInMainWorld('igrpStudioSettings', igrpStudioSettings)
        contextBridge.exposeInMainWorld('terminal', terminal)
    } catch (error) {
        console.error(error)
    }
} else {
    window.electron = {
        ...electronAPI,
        getAppVersion: () => ipcRenderer.invoke('get-app-version'),
        checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
        downloadUpdate: () => ipcRenderer.invoke('download-update'),
        installUpdate: () => ipcRenderer.invoke('install-update'),
        getUpdateChannel: () => ipcRenderer.invoke('update:get-channel'),
        setUpdateChannel: (channel: UpdateChannel) =>
            ipcRenderer.invoke('update:set-channel', channel),
        reconfigureUpdateChannel: () => ipcRenderer.invoke('update:reconfigure-channel'),
        watchFolder: (folderPath: string) => ipcRenderer.invoke('watch-folder', folderPath),
        onFolderChange: (callback: (event: WatchEvent) => void) => {
            ipcRenderer.on('folder-change', (_, data: WatchEvent) => callback(data))
        },
        reportError: (error: Error) => ipcRenderer.send('report-error', serializeErrorForIpc(error))
    }
    window.api = api
    window.engine = engine
    window.igrpStudio = repo
    window.menu = windowControls
    window.appLogicAPI = appLogic
    window.igrpStudioSettings = igrpStudioSettings
    window.terminal = terminal
}

declare global {
    interface Window {
        electron: ExtendedElectronAPI
        api: typeof api
        engine: typeof engine
        igrpStudio: typeof repo
        menu: typeof windowControls
        appLogicAPI: typeof appLogic
        igrpStudioSettings: typeof igrpStudioSettings
        terminal: typeof terminal
    }
}
