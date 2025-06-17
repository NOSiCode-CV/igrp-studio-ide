import { ElectronAPI } from '@electron-toolkit/preload'
import { IOpenProject } from './types';
import { BaseApiConfig, PageConfig } from 'nextjs-engine/dist/interfaces/types';
import { ControllerConfig, DTOBaseConfig, DTOConfig, ModelConfig, ModuleConfig } from '@igrp/igrp-studio-springboot-engine/dist/interfaces/types';
import { AppLogicEnvironment, AppLogicSettings, Connection, ConnectionTest, FileTree, ProjectData, ToolCheck } from 'src/main/types';
import { IConnenctionRepository, IWorkspaceRepository, IBaseEngine, IDocker } from 'src/main/interfaces';
import { Component } from '@igrp/igrp-studio-nextjs-engine/dist/components';

interface CustomAPI {

    fetchSelectors: (module: string, basePath: string) => Promise<[]>

    openDirectory: (buttonLabel?: string) => Promise<IOpenProject>;
    fetchFiles: (basePath: string) => Promise<FileTree[]>;
    getJsonContent: (filePath: string) => Promise<any>;
    getFileContent: (filePath: string) => Promise<any>;
    readDirectory: (basePath: string) => Promise<FileTree[]>;
    readProjectFile(filePath: string): Promise<any>;

    openIDE: ({ basePath, ideType }: { basePath: string; ideType: string }) => Promise<void>;

    getIDEs: () => Promise<Array<{ key: string; config: IDEDetails }>>;

    getVersions: (endpoint: string) => Promise<HandlerResponse>,

    fetchData: (endpoint: string, headers: object) => Promise<HandlerResponse>,

    runDoctorChecks: () => Promise<ToolCheck[]>;
    saveDoctorReport: (results: ToolCheck[] ) => Promise<void>

    i18nextElectronBackend: any,

}

interface CustomMenu {
    minimizeWindow: () => void,
    maximizeWindow: () => void,
    closeWindow: () => void,
    restoreWindow: () => void,
    isMaximized: () => Promise<boolean>,
}
interface AppLogicAPI {
  // Initialize
  initialize: () => Promise<{
    success: boolean
    path?: string | null
    info?: {
      isReady: boolean
      storeName: string
      environmentsCount: number
    }
    error?: string
  }>

  // Environments
  getEnvironments: () => Promise<AppLogicEnvironment[]>
  addEnvironment: (environment: AppLogicEnvironment) => Promise<AppLogicEnvironment>
  updateEnvironment: (id: string, updates: Partial<AppLogicEnvironment>) => Promise<boolean>
  deleteEnvironment: (id: string) => Promise<boolean>
  getEnvironment: (id: string) => Promise<AppLogicEnvironment | null>

  // Stats
  getStats: () => Promise<{
    total: number
    connected: number
    disconnected: number
    testing: number
    error: number
  }>

  // Settings
  getSettings: () => Promise<AppLogicSettings>
  updateSettings: (updates: Partial<AppLogicSettings>) => Promise<boolean>

  // History
  addConnectionTest: (test: ConnectionTest) => Promise<boolean>
  getEnvironmentHistory: (environmentId: string) => Promise<ConnectionTest[]>

  // Export/Import
  exportData: () => Promise<string>
  importData: (jsonData: string) => Promise<{ success: boolean; error?: string }>

  // Test
  testEnvironment: (environment: AppLogicEnvironment) => Promise<{
    isValid: boolean
    responseTime?: number
    error?: string
    statusCode?: number
  }>

  // Store info
  getStoreInfo: () => Promise<{
    isReady: boolean
    storeName: string
    environmentsCount: number
    path: string | null
  }>

  // Events
  onEnvironmentsChanged: (callback: (environments: AppLogicEnvironment[]) => void) => () => void
  removeAllListeners: () => void
}
declare global {
    interface Window {
        electron: ElectronAPI | getAppVersion | getLanguage | setLanguage | onFolderChange | watchFolder
        api: CustomAPI,
        igrpStudio: { workspace: IWorkspaceRepository, connection: IConnenctionRepository, docker: IDocker },
        menu: CustomMenu,
        engine: IBaseEngine,
        appLogicAPI: AppLogicAPI
    }
}
