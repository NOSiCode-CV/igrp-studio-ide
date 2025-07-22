import { ElectronAPI } from '@electron-toolkit/preload'
import { AppLogicEnvironment, ConnectionTest, FileTree, ToolCheck, IOpenProject, HandlerResponse } from '../main/types';
import { IConnenctionRepository, IWorkspaceRepository, IBaseEngine, IDocker } from '../main/interfaces';
import { IDEDetails } from '../main/helpers/ideDetection';

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

    saveProjectIcon: (data: { filePath: string; fileData: ArrayBuffer; assetsPath: string }) => Promise<any>;
    getIconFile: (iconPath: string, workspacePath: string) => Promise<any>;

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
  
  // Environments
  getEnvironments: () => Promise<AppLogicEnvironment[]>
  addEnvironment: (environment: AppLogicEnvironment) => Promise<AppLogicEnvironment>
  updateEnvironment: (id: string, updates: Partial<AppLogicEnvironment>) => Promise<boolean>
  deleteEnvironment: (id: string) => Promise<boolean>
  getEnvironment: (id: string) => Promise<AppLogicEnvironment | null> 

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

interface IGRPStudioSettings {
  setBPMNConfig: (config: any | null) => Promise<any>;
  getBPMNConfig: () => Promise<any>;
  deleteBPMNConfig: () => Promise<any>;
}
declare global {
    interface Window {
        electron: ElectronAPI & {
            getAppVersion: () => Promise<string>;
            getLanguage: () => Promise<string>;
            setLanguage: (lang: string) => Promise<void>;
            checkForUpdates: () => Promise<any>;
            downloadUpdate: () => Promise<any>;
            installUpdate: () => Promise<any>;
            watchFolder: (folderPath: string) => Promise<any>;
            onFolderChange: (callback: (event: any) => void) => void;
            ipcRenderer: {
                on: (channel: string, callback: (event: any, ...args: any[]) => void) => void;
            };
        };
        api: CustomAPI,
        igrpStudio: { workspace: IWorkspaceRepository, connection: IConnenctionRepository, docker: IDocker },
        menu: CustomMenu,
        engine: IBaseEngine,
        appLogicAPI: AppLogicAPI,
        igrpStudioSettings: IGRPStudioSettings
    }
}
