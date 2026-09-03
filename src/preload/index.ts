import { electronAPI } from '@electron-toolkit/preload'
import type { BuildComponentRegistryInput } from '@igrp/igrp-studio-nextjs-engine'
import type { ComponentRegistrationConfig } from '@igrp/igrp-studio-nextjs-engine/types'
import type {
    ResetWorkspaceOptions,
    UpdateServiceRequest
} from '@igrp/igrp-studio-workspace-engine/dist/interfaces/types'
import { contextBridge, ipcRenderer, webUtils } from 'electron'
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
import type { GraphQLOperation } from '../main/types/graphql-manifest.types'

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
    onFolderChange: (callback: (event: WatchEvent) => void) => () => void
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

    setPageParent: (jsonPath: string, parentName: string | null) =>
        ipcRenderer.invoke('page:set-parent', jsonPath, parentName),

    readDirectory: (basePath: string) => ipcRenderer.invoke('read-directory', basePath),

    readProjectFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),

    openIDE: ({ basePath, ideType }: { basePath: string; ideType: string }) =>
        ipcRenderer.invoke('igrp-studio:open-ide', { basePath, ideType }),
    getIDEs: () => ipcRenderer.invoke('igrp-studio:ides'),
    openInFileManager: (basePath: string) =>
        ipcRenderer.invoke('igrp-studio:open-in-file-manager', basePath),

    getVersions: (endpoint: string) => ipcRenderer.invoke('get-versions', endpoint),

    fetchData: (endpoint: string, headers: object) =>
        ipcRenderer.invoke('fetch-data', endpoint, headers),

    i18nextElectronBackend: preloadBindings(ipcRenderer, process),

    runDoctorChecks: (): Promise<ToolCheck[]> => ipcRenderer.invoke('run-doctor-checks'),
    saveDoctorReport: (results) => ipcRenderer.invoke('save-doctor-report', results),
    checkIGRPCLI: (): Promise<{
        installed: string | null
        latest: string | null
        hasUpdate: boolean
        missing: boolean
        error?: string
    }> => ipcRenderer.invoke('check-igrp-cli'),
    installIGRPCLI: (
        version?: string
    ): Promise<{ success: boolean; output?: string; error?: string }> =>
        ipcRenderer.invoke('install-igrp-cli', version),

    saveProjectIcon: (data: { filePath: string; fileData: ArrayBuffer; assetsPath: string }) =>
        ipcRenderer.invoke('save-project-icon', data),

    getIconFile: (iconPath: string, workspacePath: string) =>
        ipcRenderer.invoke('get-icon-file', iconPath, workspacePath)
}

const graphql = {
    createGraphQLOperation: (
        basePath: string,
        moduleName: string,
        operation: Omit<GraphQLOperation, 'id'> & { id?: string }
    ) => ipcRenderer.invoke(EVENTS.GRAPHQL.CREATE_OPERATION, basePath, moduleName, operation),
    updateGraphQLOperation: (
        basePath: string,
        moduleName: string,
        operationId: string,
        updates: Partial<Omit<GraphQLOperation, 'id'>>
    ) =>
        ipcRenderer.invoke(
            EVENTS.GRAPHQL.UPDATE_OPERATION,
            basePath,
            moduleName,
            operationId,
            updates
        ),
    deleteGraphQLOperation: (basePath: string, moduleName: string, operationId: string) =>
        ipcRenderer.invoke(EVENTS.GRAPHQL.DELETE_OPERATION, basePath, moduleName, operationId),
    listGraphQLOperations: (basePath: string, moduleName: string) =>
        ipcRenderer.invoke(EVENTS.GRAPHQL.LIST_OPERATIONS, basePath, moduleName)
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
    createGraphqlSchema: async (
        schemaConfig: any,
        engineType: string,
        basePath: string
    ): Promise<HandlerResponse> => {
        try {
            return await ipcRenderer.invoke(
                EVENTS.SPRING.CREATE_GRAPHQL_SCHEMA,
                schemaConfig,
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

    getPermissions: async (engineType: string, basePath: string): Promise<HandlerResponse> => {
        try {
            return await ipcRenderer.invoke(EVENTS.ENGINE.GET_PERMISSIONS, engineType, basePath)
        } catch (error) {
            return handleError(error)
        }
    },

    savePermission: async (
        data: any,
        engineType: string,
        basePath: string
    ): Promise<HandlerResponse> => {
        try {
            return await ipcRenderer.invoke(
                EVENTS.ENGINE.SAVE_PERMISSION,
                data,
                engineType,
                basePath
            )
        } catch (error) {
            return handleError(error)
        }
    },

    deletePermission: async (
        id: string,
        engineType: string,
        basePath: string
    ): Promise<HandlerResponse> => {
        try {
            return await ipcRenderer.invoke(
                EVENTS.ENGINE.DELETE_PERMISSION,
                id,
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

    convertJsonSchema: async (schema: unknown): Promise<HandlerResponse> => {
        try {
            return await ipcRenderer.invoke(EVENTS.NEXT.CONVERT_JSON_SCHEMA, schema)
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

    resetComponents: async (engineType: string): Promise<HandlerResponse> => {
        try {
            return await ipcRenderer.invoke(EVENTS.NEXT.RESET_COMPONENT, engineType)
        } catch (error) {
            return handleError(error)
        }
    },

    buildComponentRegistry: async (
        engineType: string,
        input: BuildComponentRegistryInput
    ): Promise<HandlerResponse> => {
        try {
            return await ipcRenderer.invoke(EVENTS.NEXT.BUILD_COMPONENT_REGISTRY, engineType, input)
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
        resetWorkspace: async (
            basePath: string,
            options?: ResetWorkspaceOptions
        ): Promise<HandlerResponse> => {
            try {
                return await ipcRenderer.invoke(
                    EVENTS.REPOSITORY.WORKSPACE.RESET,
                    basePath,
                    options
                )
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

        // Service methods — only full-replace of an existing compose service
        // block remains after the workspace engine's surface shrank.
        updateService: (request: UpdateServiceRequest, basePath: string) =>
            ipcRenderer.invoke(EVENTS.REPOSITORY.SERVICE.UPDATE, request, basePath),
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

const markitdown = {
    openWindow: (): void => {
        ipcRenderer.send(EVENTS.MARKITDOWN.OPEN_WINDOW)
    },
    pickFile: (): Promise<string | null> => ipcRenderer.invoke(EVENTS.MARKITDOWN.PICK_FILE),
    convert: (filePath: string) => ipcRenderer.invoke(EVENTS.MARKITDOWN.CONVERT, filePath),
    saveMarkdown: (payload: { markdown: string; suggestedName?: string }) =>
        ipcRenderer.invoke(EVENTS.MARKITDOWN.SAVE_MARKDOWN, payload),
    getFilePath: (file: File): string => webUtils.getPathForFile(file),
    getHistory: () => ipcRenderer.invoke(EVENTS.MARKITDOWN.GET_HISTORY),
    deleteHistoryItem: (id: string) =>
        ipcRenderer.invoke(EVENTS.MARKITDOWN.DELETE_HISTORY_ITEM, id),
    clearHistory: () => ipcRenderer.invoke(EVENTS.MARKITDOWN.CLEAR_HISTORY)
}

const specPrototype = {
    generateStart: (payload: {
        requestId: string
        basePath: string
        userMessage: string
        specContext?: string
        lastTurnSummary?: string
        providerId: string
        model: string
    }) => ipcRenderer.invoke(EVENTS.SPEC_PROTOTYPE.GENERATE_START, payload),
    generateCancel: (requestId: string) =>
        ipcRenderer.invoke(EVENTS.SPEC_PROTOTYPE.GENERATE_CANCEL, { requestId }),
    applyOps: (basePath: string, raw: string) =>
        ipcRenderer.invoke(EVENTS.SPEC_PROTOTYPE.APPLY_OPS, { basePath, raw }),
    listFiles: (basePath: string) =>
        ipcRenderer.invoke(EVENTS.SPEC_PROTOTYPE.LIST_FILES, { basePath }),
    readFile: (basePath: string, path: string) =>
        ipcRenderer.invoke(EVENTS.SPEC_PROTOTYPE.READ_FILE, { basePath, path }),
    readFileAt: (basePath: string, ref: string, path: string) =>
        ipcRenderer.invoke(EVENTS.SPEC_PROTOTYPE.READ_FILE_AT, { basePath, ref, path }),
    startDev: (basePath: string) =>
        ipcRenderer.invoke(EVENTS.SPEC_PROTOTYPE.START_DEV, { basePath }),
    stopDev: (basePath: string) => ipcRenderer.invoke(EVENTS.SPEC_PROTOTYPE.STOP_DEV, { basePath }),
    devStatus: (basePath: string) =>
        ipcRenderer.invoke(EVENTS.SPEC_PROTOTYPE.DEV_STATUS, { basePath }),
    getDevLogBuffer: (basePath: string, limit?: number) =>
        ipcRenderer.invoke(EVENTS.SPEC_PROTOTYPE.GET_DEV_LOG_BUFFER, { basePath, limit }),
    listSnapshots: (basePath: string) =>
        ipcRenderer.invoke(EVENTS.SPEC_PROTOTYPE.LIST_SNAPSHOTS, { basePath }),
    restoreSnapshot: (basePath: string, sha: string) =>
        ipcRenderer.invoke(EVENTS.SPEC_PROTOTYPE.RESTORE_SNAPSHOT, { basePath, sha }),
    export: (basePath: string) => ipcRenderer.invoke(EVENTS.SPEC_PROTOTYPE.EXPORT, { basePath }),
    openFolder: (basePath: string) =>
        ipcRenderer.invoke(EVENTS.SPEC_PROTOTYPE.OPEN_FOLDER, { basePath }),
    readManifest: (basePath: string) =>
        ipcRenderer.invoke(EVENTS.SPEC_PROTOTYPE.READ_MANIFEST, { basePath }),
    applyManifest: (basePath: string, manifest: Record<string, unknown>) =>
        ipcRenderer.invoke(EVENTS.SPEC_PROTOTYPE.APPLY_MANIFEST, { basePath, manifest }),
    listSkills: (basePath: string) =>
        ipcRenderer.invoke(EVENTS.SPEC_PROTOTYPE.LIST_SKILLS, { basePath }),
    readSkillFile: (basePath: string, skillName: string, filename: string) =>
        ipcRenderer.invoke(EVENTS.SPEC_PROTOTYPE.READ_SKILL_FILE, {
            basePath,
            skillName,
            filename
        }),
    installSkill: (basePath: string, skillName: string) =>
        ipcRenderer.invoke(EVENTS.SPEC_PROTOTYPE.INSTALL_SKILL, { basePath, skillName }),
    checkSkillUpdates: (basePath: string) =>
        ipcRenderer.invoke(EVENTS.SPEC_PROTOTYPE.CHECK_SKILL_UPDATES, { basePath }),
    updateSkill: (basePath: string, skillName: string) =>
        ipcRenderer.invoke(EVENTS.SPEC_PROTOTYPE.UPDATE_SKILL, { basePath, skillName }),
    onChunk: (callback: (payload: { requestId: string; chunk: any }) => void): (() => void) => {
        const sub = (_event: Electron.IpcRendererEvent, payload: any) => callback(payload)
        ipcRenderer.on(EVENTS.SPEC_PROTOTYPE.GENERATE_CHUNK, sub)
        return () => ipcRenderer.removeListener(EVENTS.SPEC_PROTOTYPE.GENERATE_CHUNK, sub)
    },
    onDevLog: (callback: (payload: { basePath: string; entry: any }) => void): (() => void) => {
        const sub = (_event: Electron.IpcRendererEvent, payload: any) => callback(payload)
        ipcRenderer.on(EVENTS.SPEC_PROTOTYPE.DEV_LOG, sub)
        return () => ipcRenderer.removeListener(EVENTS.SPEC_PROTOTYPE.DEV_LOG, sub)
    },
    onDevStatus: (callback: (payload: { basePath: string; status: any }) => void): (() => void) => {
        const sub = (_event: Electron.IpcRendererEvent, payload: any) => callback(payload)
        ipcRenderer.on(EVENTS.SPEC_PROTOTYPE.DEV_STATUS, sub)
        return () => ipcRenderer.removeListener(EVENTS.SPEC_PROTOTYPE.DEV_STATUS, sub)
    },
    onTreeChanged: (callback: (payload: { basePath: string }) => void): (() => void) => {
        const sub = (_event: Electron.IpcRendererEvent, payload: any) => callback(payload)
        ipcRenderer.on(EVENTS.SPEC_PROTOTYPE.TREE_CHANGED, sub)
        return () => ipcRenderer.removeListener(EVENTS.SPEC_PROTOTYPE.TREE_CHANGED, sub)
    }
}

const specLLM = {
    statuses: () => ipcRenderer.invoke(EVENTS.SPEC_LLM.STATUSES),
    listModels: () => ipcRenderer.invoke(EVENTS.SPEC_LLM.LIST_MODELS),
    chatStart: (payload: {
        requestId: string
        providerId: string
        messages: { role: 'system' | 'user' | 'assistant'; content: string }[]
        model: string
        temperature?: number
        maxTokens?: number
        systemPrompt?: string
    }) => ipcRenderer.invoke(EVENTS.SPEC_LLM.CHAT_START, payload),
    chatCancel: (requestId: string) =>
        ipcRenderer.invoke(EVENTS.SPEC_LLM.CHAT_CANCEL, { requestId }),
    detectCLIs: () => ipcRenderer.invoke(EVENTS.SPEC_LLM.DETECT_CLIS),
    onChunk: (
        callback: (payload: {
            requestId: string
            chunk:
                | { type: 'delta'; content: string }
                | { type: 'tool-call'; name: string; arguments: string }
                | { type: 'usage'; promptTokens?: number; completionTokens?: number }
                | { type: 'error'; message: string; code?: string }
                | { type: 'done' }
        }) => void
    ): (() => void) => {
        const subscription = (
            _event: Electron.IpcRendererEvent,
            payload: Parameters<typeof callback>[0]
        ) => callback(payload)
        ipcRenderer.on(EVENTS.SPEC_LLM.CHAT_CHUNK, subscription)
        return () => ipcRenderer.removeListener(EVENTS.SPEC_LLM.CHAT_CHUNK, subscription)
    }
}

const specSettings = {
    getSecretsStatus: () => ipcRenderer.invoke(EVENTS.SPEC_SETTINGS.GET_SECRETS_STATUS),
    setSecret: (provider: 'openrouter' | 'openai' | 'voyage', value: string) =>
        ipcRenderer.invoke(EVENTS.SPEC_SETTINGS.SET_SECRET, { provider, value }),
    testSecret: (provider: 'openrouter' | 'openai' | 'voyage') =>
        ipcRenderer.invoke(EVENTS.SPEC_SETTINGS.TEST_SECRET, { provider }),
    getPreferences: () => ipcRenderer.invoke(EVENTS.SPEC_SETTINGS.GET_PREFERENCES),
    setPreferences: (patch: {
        defaultLLM?: string
        defaultEmbeddings?: { provider: 'openai' | 'voyage' | 'stub'; model: string }
        cliPaths?: Record<string, string>
    }) => ipcRenderer.invoke(EVENTS.SPEC_SETTINGS.SET_PREFERENCES, patch)
}

const specDoc = {
    list: (basePath: string) => ipcRenderer.invoke(EVENTS.SPEC_DOC.LIST, { basePath }),
    read: (basePath: string, docId: string) =>
        ipcRenderer.invoke(EVENTS.SPEC_DOC.READ, { basePath, docId }),
    create: (
        basePath: string,
        input: {
            name: string
            parentId?: string | null
            type?: 'file' | 'folder'
            content?: string
        }
    ) => ipcRenderer.invoke(EVENTS.SPEC_DOC.CREATE, { basePath, ...input }),
    update: (
        basePath: string,
        docId: string,
        patch: { content?: string; name?: string; kbRefs?: string[] }
    ) => ipcRenderer.invoke(EVENTS.SPEC_DOC.UPDATE, { basePath, docId, ...patch }),
    move: (basePath: string, docId: string, newParentId: string | null) =>
        ipcRenderer.invoke(EVENTS.SPEC_DOC.MOVE, { basePath, docId, newParentId }),
    remove: (basePath: string, docId: string) =>
        ipcRenderer.invoke(EVENTS.SPEC_DOC.REMOVE, { basePath, docId }),
    convertAndInsert: (sourcePath: string) =>
        ipcRenderer.invoke(EVENTS.SPEC_DOC.CONVERT_AND_INSERT, { sourcePath }),
    exportDocument: (basePath: string, docId: string, format: 'pdf' | 'docx') =>
        ipcRenderer.invoke(EVENTS.SPEC_DOC.EXPORT, { basePath, docId, format }),
    onChanged: (callback: () => void): (() => void) => {
        const subscription = () => callback()
        ipcRenderer.on(EVENTS.SPEC_DOC.CHANGED, subscription)
        return () => ipcRenderer.removeListener(EVENTS.SPEC_DOC.CHANGED, subscription)
    },
    getFilePath: (file: File): string => webUtils.getPathForFile(file)
}

const specKB = {
    list: (basePath: string) => ipcRenderer.invoke(EVENTS.SPEC_KB.LIST, { basePath }),
    get: (basePath: string, itemId: string) =>
        ipcRenderer.invoke(EVENTS.SPEC_KB.GET, { basePath, itemId }),
    addFile: (basePath: string, filePath: string) =>
        ipcRenderer.invoke(EVENTS.SPEC_KB.ADD_FILE, { basePath, filePath }),
    addUrl: (basePath: string, url: string, youtube = false) =>
        ipcRenderer.invoke(EVENTS.SPEC_KB.ADD_URL, { basePath, url, youtube }),
    reindex: (basePath: string, itemId: string) =>
        ipcRenderer.invoke(EVENTS.SPEC_KB.REINDEX, { basePath, itemId }),
    remove: (basePath: string, itemId: string) =>
        ipcRenderer.invoke(EVENTS.SPEC_KB.REMOVE, { basePath, itemId }),
    search: (basePath: string, query: string, topK = 8, opts: { kbItemIds?: string[] } = {}) =>
        ipcRenderer.invoke(EVENTS.SPEC_KB.SEARCH, {
            basePath,
            query,
            topK,
            kbItemIds: opts.kbItemIds
        }),
    onProgress: (callback: (item: any) => void): (() => void) => {
        const subscription = (_event: Electron.IpcRendererEvent, item: any) => callback(item)
        ipcRenderer.on(EVENTS.SPEC_KB.PROGRESS, subscription)
        return () => ipcRenderer.removeListener(EVENTS.SPEC_KB.PROGRESS, subscription)
    },
    pickFile: (): Promise<string | null> => ipcRenderer.invoke(EVENTS.MARKITDOWN.PICK_FILE),
    getFilePath: (file: File): string => webUtils.getPathForFile(file)
}

const specData = {
    list: (basePath: string) => ipcRenderer.invoke(EVENTS.SPEC_DATA.LIST, { basePath }),
    get: (basePath: string, entityId: string) =>
        ipcRenderer.invoke(EVENTS.SPEC_DATA.GET, { basePath, entityId }),
    create: (basePath: string, input: unknown) =>
        ipcRenderer.invoke(EVENTS.SPEC_DATA.CREATE, { basePath, input }),
    update: (basePath: string, entityId: string, patch: unknown) =>
        ipcRenderer.invoke(EVENTS.SPEC_DATA.UPDATE, { basePath, entityId, patch }),
    remove: (basePath: string, entityId: string) =>
        ipcRenderer.invoke(EVENTS.SPEC_DATA.REMOVE, { basePath, entityId }),
    importFromDb: (basePath: string, connectionName: string, tables: string[]) =>
        ipcRenderer.invoke(EVENTS.SPEC_DATA.IMPORT_FROM_DB, {
            basePath,
            connectionName,
            tables
        }),
    diffWithDb: (basePath: string, entityId: string) =>
        ipcRenderer.invoke(EVENTS.SPEC_DATA.DIFF_WITH_DB, { basePath, entityId }),
    exportDdl: (basePath: string, dialect: 'postgresql' | 'mysql') =>
        ipcRenderer.invoke(EVENTS.SPEC_DATA.EXPORT_DDL, { basePath, dialect }),
    applyOps: (basePath: string, raw: string) =>
        ipcRenderer.invoke(EVENTS.SPEC_DATA.APPLY_OPS, { basePath, raw }),
    generateStart: (payload: {
        requestId: string
        basePath: string
        userMessage: string
        specContext?: string
        providerId: string
        model: string
    }) => ipcRenderer.invoke(EVENTS.SPEC_DATA.GENERATE_START, payload),
    generateCancel: (requestId: string) =>
        ipcRenderer.invoke(EVENTS.SPEC_DATA.GENERATE_CANCEL, { requestId }),
    onChunk: (callback: (payload: { requestId: string; chunk: any }) => void): (() => void) => {
        const sub = (_event: Electron.IpcRendererEvent, payload: any) => callback(payload)
        ipcRenderer.on(EVENTS.SPEC_DATA.GENERATE_CHUNK, sub)
        return () => ipcRenderer.removeListener(EVENTS.SPEC_DATA.GENERATE_CHUNK, sub)
    },
    onChanged: (callback: () => void): (() => void) => {
        const subscription = () => callback()
        ipcRenderer.on(EVENTS.SPEC_DATA.CHANGED, subscription)
        return () => ipcRenderer.removeListener(EVENTS.SPEC_DATA.CHANGED, subscription)
    }
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
                const subscription = (_: Electron.IpcRendererEvent, data: WatchEvent): void =>
                    callback(data)
                ipcRenderer.on('folder-change', subscription)
                return () => ipcRenderer.removeListener('folder-change', subscription)
            },
            reportError: (error: Error) =>
                ipcRenderer.send('report-error', serializeErrorForIpc(error))
        })
        contextBridge.exposeInMainWorld('api', api)
        contextBridge.exposeInMainWorld('graphql', graphql)
        contextBridge.exposeInMainWorld('engine', engine)
        contextBridge.exposeInMainWorld('igrpStudio', repo)
        contextBridge.exposeInMainWorld('menu', windowControls)
        contextBridge.exposeInMainWorld('appLogicAPI', appLogic)
        contextBridge.exposeInMainWorld('igrpStudioSettings', igrpStudioSettings)
        contextBridge.exposeInMainWorld('terminal', terminal)
        contextBridge.exposeInMainWorld('markitdown', markitdown)
        contextBridge.exposeInMainWorld('specKB', specKB)
        contextBridge.exposeInMainWorld('specDoc', specDoc)
        contextBridge.exposeInMainWorld('specLLM', specLLM)
        contextBridge.exposeInMainWorld('specSettings', specSettings)
        contextBridge.exposeInMainWorld('specPrototype', specPrototype)
        contextBridge.exposeInMainWorld('specData', specData)
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
            const subscription = (_: Electron.IpcRendererEvent, data: WatchEvent): void =>
                callback(data)
            ipcRenderer.on('folder-change', subscription)
            return () => ipcRenderer.removeListener('folder-change', subscription)
        },
        reportError: (error: Error) => ipcRenderer.send('report-error', serializeErrorForIpc(error))
    }
    window.api = api
    window.graphql = graphql
    window.engine = engine
    window.igrpStudio = repo
    window.menu = windowControls
    window.appLogicAPI = appLogic
    window.igrpStudioSettings = igrpStudioSettings
    window.terminal = terminal
    window.markitdown = markitdown
    window.specKB = specKB
    window.specDoc = specDoc
    window.specLLM = specLLM
    window.specSettings = specSettings
    window.specPrototype = specPrototype
    window.specData = specData
}

declare global {
    interface Window {
        electron: ExtendedElectronAPI
        api: typeof api
        graphql: typeof graphql
        engine: typeof engine
        igrpStudio: typeof repo
        menu: typeof windowControls
        appLogicAPI: typeof appLogic
        igrpStudioSettings: typeof igrpStudioSettings
        terminal: typeof terminal
        markitdown: typeof markitdown
        specKB: typeof specKB
        specDoc: typeof specDoc
        specLLM: typeof specLLM
        specSettings: typeof specSettings
        specPrototype: typeof specPrototype
        specData: typeof specData
    }
}
