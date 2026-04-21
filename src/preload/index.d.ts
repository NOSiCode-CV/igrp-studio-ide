import { electronAPI } from '@electron-toolkit/preload'
import {
    Connection,
    DatabaseResponse,
    HandlerResponse,
    IWorkspace,
    ProjectData,
    ToolCheck,
    BPMNConfig
} from '../main/types'
import {
    ComponentRegistrationConfig,
    ServiceWorkspace
} from '@igrp/igrp-studio-nextjs-engine/types'
import { WatchEvent } from '../main/helpers/watch-folder'

type UpdateChannel = 'stable' | 'beta'

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
declare const api: {
    reportError: (error: Error) => void
    fetchSelectors: (module: string, basePath: string) => Promise<any>
    openDirectory: (buttonLabel?: string) => Promise<any>
    fetchFiles: (basePath: string) => Promise<any>
    getJsonContent: (filePath: string) => Promise<any>
    getFileContent: (filePath: string) => Promise<any>
    readDirectory: (basePath: string) => Promise<any>
    readProjectFile: (filePath: string) => Promise<any>
    openIDE: ({ basePath, ideType }: { basePath: string; ideType: string }) => Promise<any>
    getIDEs: () => Promise<any>
    getVersions: (endpoint: string) => Promise<any>
    fetchData: (endpoint: string, headers: object) => Promise<any>
    i18nextElectronBackend: {
        send: (channel: any, data: any) => void
        onReceive: (channel: any, func: any) => void
        onLanguageChange: (func: any) => void
        clientOptions: {
            environment: any
            platform: any
            resourcesPath: any
        }
    }
    runDoctorChecks: () => Promise<ToolCheck[]>
    saveDoctorReport: (results: any) => Promise<any>
    installIGRPCLI: () => Promise<{ success: boolean; output?: string; error?: string }>
    saveProjectIcon: (data: {
        filePath: string
        fileData: ArrayBuffer
        assetsPath: string
    }) => Promise<any>
    getIconFile: (iconPath: string, workspacePath: string) => Promise<any>
}
declare const engine: {
    createProject: (project: ProjectData, basePath: string) => Promise<HandlerResponse>
    delete: (config: any, engineType: string, basePath: string) => Promise<HandlerResponse>
    duplicate: (config: any, engineType: string, basePath: string) => Promise<HandlerResponse>
    createResponse: (
        response: any,
        engineType: string,
        basePath: string
    ) => Promise<HandlerResponse>
    createDto: (dtoConfig: any, engineType: string, basePath: string) => Promise<HandlerResponse>
    createModule: (
        moduleConfig: any,
        engineType: string,
        basePath: string
    ) => Promise<HandlerResponse>
    createController: (
        controllerConfig: any,
        engineType: string,
        basePath: string
    ) => Promise<HandlerResponse>
    createModel: (
        modelConfig: any,
        engineType: string,
        basePath: string
    ) => Promise<HandlerResponse>
    createEnum: (data: any, engineType: string, basePath: string) => Promise<HandlerResponse>
    serializeElement: (data: any, engineType: string, basePath: string) => Promise<HandlerResponse>
    createPermission: (data: any, engineType: string, basePath: string) => Promise<HandlerResponse>
    createPage: (data: any, engineType: string, basePath: string) => Promise<HandlerResponse>
    registry: (engineType: string) => Promise<HandlerResponse>
    getComponent: (engineType: string) => Promise<HandlerResponse>
    registerComponent: (
        engineType: string,
        config: ComponentRegistrationConfig
    ) => Promise<HandlerResponse>
    getService: (engineType: string) => Promise<HandlerResponse>
    getDependencies: (engineType: string) => Promise<HandlerResponse>
    getAppMetadata: (engineType: string, basePath: string) => Promise<HandlerResponse>
    getCodeSnippets: (engineType: string) => Promise<HandlerResponse>
    createProcess: (process: any, engineType: string, basePath: string) => Promise<HandlerResponse>
    createProcessStep: (step: any, engineType: string, basePath: string) => Promise<HandlerResponse>
}
declare const repo: {
    workspace: {
        initialize: () => Promise<any>
        findAllRecentProjects: (limit?: number) => Promise<any>
        createProject: (
            workspaceId: string,
            project: Omit<ProjectData, 'id' | 'createdAt' | 'workspaceId'>
        ) => Promise<any>
        updateProject: (projectId: string, updates: Partial<ProjectData>) => Promise<any>
        saveCustomWorkspaceComposeFile: (yaml: object, basePath: string) => Promise<any>
        configureService: (config: ProjectWorkspace, basePath: string) => Promise<any>
        deleteProject: (projectId: string, basePath: string) => Promise<any>
        getProject: (projectId: string) => Promise<any>
        findAllProjects: (workspaceId?: string) => Promise<any>
        findAllWorkspaces: () => Promise<any>
        findRecentWorkspaces: (limit?: number) => Promise<any>
        createWorkspace: (
            workspace: Omit<IWorkspace, 'id' | 'createdAt'>
        ) => Promise<HandlerResponse>
        updateWorkspace: (workspaceId: string, updates: Partial<IWorkspace>) => Promise<any>
        deleteWorkspace: (workspaceId: string) => Promise<any>
        getWorkspace: (workspaceId: string) => Promise<any>
        getLastAccessedWorkspace: () => Promise<any>
        openWorkspace: (workspacePath: string) => Promise<HandlerResponse>
        addProjectToWorkspace: (
            workspaceId: string,
            project: ProjectData
        ) => Promise<HandlerResponse>
        createService: (service: ServiceWorkspace, basePath: string) => Promise<any>
        updateService: (service: ServiceWorkspace, basePath: string) => Promise<any>
        deleteService: (serviceId: string, basePath: string) => Promise<any>
        findAllServices: (workspaceId: string) => Promise<any>
        createBackup: (backupPath?: string) => Promise<any>
        restoreBackup: (backupPath: string) => Promise<any>
        onError: (
            callback: (error: { code: string; message: string }) => void
        ) => () => Electron.IpcRenderer
    }
    connection: {
        findAll: () => Promise<any>
        save: (connection: Connection) => Promise<any>
        delete: (connection: string) => Promise<any>
        connectToDatabase: (config: Connection) => Promise<DatabaseResponse>
        getTables: (connectionName: string) => Promise<DatabaseResponse>
        getTableStructure: (connectionName: string, tableName: string) => Promise<DatabaseResponse>
    }
    docker: {
        up: (projectPath: string) => Promise<any>
        down: (
            projectPath: string,
            options: {
                dropVolume?: boolean
            }
        ) => Promise<any>
        status: (projectPath: string) => Promise<any>
        stop: (
            projectPath: string,
            options: {
                services: string[]
            }
        ) => Promise<any>
        restart: (
            projectPath: string,
            options: {
                services: string[]
                timeout?: number
            }
        ) => Promise<any>
        check: () => Promise<any>
        daemonStatus: () => Promise<any>
    }
}
declare const windowControls: {
    minimizeWindow: () => void
    maximizeWindow: () => void
    closeWindow: () => void
    restoreWindow: () => void
    isMaximized: () => Promise<any>
}
declare const appLogic: {
    getEnvironments: () => Promise<any>
    addEnvironment: (environment: any) => Promise<any>
    updateEnvironment: (id: any, updates: any) => Promise<any>
    deleteEnvironment: (id: any) => Promise<any>
    getEnvironment: (id: any) => Promise<any>
    addConnectionTest: (test: any) => Promise<any>
    getEnvironmentHistory: (environmentId: any) => Promise<any>
    exportData: () => Promise<any>
    importData: (jsonData: any) => Promise<any>
    testEnvironment: (environment: any) => Promise<any>
    getStoreInfo: () => Promise<any>
    onEnvironmentsChanged: (callback: any) => () => Electron.IpcRenderer
    removeAllListeners: () => Electron.IpcRenderer
}
declare const igrpStudioSettings: {
    getBPMNConfigs: () => Promise<any>
    getBPMNConfig: () => Promise<any>
    addBPMNConfig: (config: BPMNConfig) => Promise<any>
    updateBPMNConfig: (config: BPMNConfig) => Promise<any>
    deleteBPMNConfig: (configId: string) => Promise<any>
    setActiveBPMNConfig: (configId: string) => Promise<any>
    deleteAllBPMNConfigs: () => Promise<any>
    getLanguage: () => Promise<any>
    setLanguage: (lang: string) => Promise<any>
    setSelectedBPMNProject: (projectId: string) => Promise<any>
    getSelectedBPMNProject: () => Promise<string | undefined>
    setSelectedBPMNProcess: (processDefinitionId: string) => Promise<any>
    getSelectedBPMNProcess: () => Promise<string | undefined>
    getWelcomeOnboardingCompleted: () => Promise<boolean>
    setWelcomeOnboardingCompleted: (completed: boolean) => Promise<boolean>
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
    }
}
