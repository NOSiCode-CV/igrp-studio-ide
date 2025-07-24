import { Connection, DatabaseResponse, HandlerResponse, IWorkspace, ProjectData, ServiceInfo, BPMNConfig } from '@main/types';
import { ComponentRegistrationConfig, ServiceWorkspace } from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';
import { WatchEvent } from '@main/helpers/watch-folder';

interface Window {
  electron: {
    getAppVersion: () => Promise<string>;
    getLanguage: () => Promise<string>;
    setLanguage: (lang: string) => Promise<void>;
    checkForUpdates: () => Promise<any>;
    downloadUpdate: () => Promise<any>;
    installUpdate: () => Promise<any>;
    watchFolder: (folderPath: string) => Promise<any>;
    onFolderChange: (callback: (event: WatchEvent) => void) => void;
  };
  api: {
    fetchSelectors: (module: string, basePath: string) => Promise<any>;
    openDirectory: (buttonLabel: string) => Promise<any>;
    fetchFiles: (basePath: string) => Promise<any>;
    getJsonContent: (filePath: string) => Promise<any>;
    getFileContent: (filePath: string) => Promise<any>;
    readDirectory: (basePath: string) => Promise<any>;
    readProjectFile: (filePath: string) => Promise<any>;
    openIDE: ({ basePath, ideType }: { basePath: string; ideType: string }) => Promise<any>;
    getIDEs: () => Promise<any>;
    getVersions: (endpoint: string) => Promise<any>;
    fetchData: (endpoint: string, headers: object) => Promise<any>;
    i18nextElectronBackend: any;
    runDoctorChecks: () => Promise<any>;
    saveDoctorReport: (results: any) => Promise<any>;
  };
  engine: {
    createProject: (project: ProjectData, basePath: string) => Promise<HandlerResponse>;
    delete: (config: any, engineType: string, basePath: string) => Promise<HandlerResponse>;
    createResponse: (response: any, engineType: string, basePath: string) => Promise<HandlerResponse>;
    createDto: (dtoConfig: any, engineType: string, basePath: string) => Promise<HandlerResponse>;
    createModule: (moduleConfig: any, engineType: string, basePath: string) => Promise<HandlerResponse>;
    createController: (controllerConfig: any, engineType: string, basePath: string) => Promise<HandlerResponse>;
    createModel: (modelConfig: any, engineType: string, basePath: string) => Promise<HandlerResponse>;
    createEnum: (data: any, engineType: string, basePath: string) => Promise<HandlerResponse>;
    serializeElement: (data: any, engineType: string, basePath: string) => Promise<HandlerResponse>;
    createPermission: (data: any, engineType: string, basePath: string) => Promise<HandlerResponse>;
    createPage: (data: any, engineType: string, basePath: string) => Promise<HandlerResponse>;
    registry: (engineType: string) => Promise<HandlerResponse>;
    getComponent: (engineType: string) => Promise<HandlerResponse>;
    registerComponent: (engineType: string, config: ComponentRegistrationConfig) => Promise<HandlerResponse>;
    getService: (engineType: string) => Promise<HandlerResponse>;
    getDependencies: (engineType: string) => Promise<HandlerResponse>;
    getAppMetadata: (engineType: string, basePath: string) => Promise<HandlerResponse>;
    getCodeSnippets: (engineType: string) => Promise<HandlerResponse>;
  };
  igrpStudio: {
    workspace: {
      initialize: () => Promise<any>;
      findAllRecentProjects: (limit?: number) => Promise<any>;
      createProject: (workspaceId: string, project: Omit<ProjectData, 'id' | 'createdAt' | 'workspaceId'>) => Promise<HandlerResponse>;
      updateProject: (projectId: string, updates: Partial<ProjectData>) => Promise<HandlerResponse>;
      saveCustomWorkspaceComposeFile: (yaml: object, basePath: string) => Promise<any>;
      configureService: (config: ServiceWorkspace, basePath: string) => Promise<any>;
      deleteProject: (projectId: string, basePath: string) => Promise<any>;
      getProject: (projectId: string) => Promise<any>;
      findAllProjects: (workspaceId?: string) => Promise<any>;
      findAllWorkspaces: () => Promise<any>;
      findRecentWorkspaces: (limit?: number) => Promise<any>;
      createWorkspace: (workspace: Omit<IWorkspace, 'id' | 'createdAt'>) => Promise<HandlerResponse>;
      updateWorkspace: (workspaceId: string, updates: Partial<IWorkspace>) => Promise<any>;
      deleteWorkspace: (workspaceId: string) => Promise<any>;
      getWorkspace: (workspaceId: string) => Promise<any>;
      getLastAccessedWorkspace: () => Promise<any>;
      createService: (service: ServiceWorkspace, basePath: string) => Promise<any>;
      updateService: (service: ServiceWorkspace, basePath: string) => Promise<any>;
      deleteService: (serviceId: string, basePath: string) => Promise<any>;
      findAllServices: (workspaceId: string) => Promise<any>;
      createBackup: (backupPath?: string) => Promise<any>;
      restoreBackup: (backupPath: string) => Promise<any>;
      onError: (callback: (error: { code: string; message: string }) => void) => () => void;
    };
    connection: {
      findAll: () => Promise<Connection[]>;
      save: (connection: Connection) => Promise<any>;
      delete: (connection: Connection | string) => Promise<any>;
      connectToDatabase: (config: Connection) => Promise<DatabaseResponse>;
      getTables: (connectionName: string) => Promise<DatabaseResponse>;
      getTableStructure: (connectionName: string, tableName: string) => Promise<DatabaseResponse>;
    };
    docker: {
      up: (projectPath: string) => Promise<any>;
      down: (projectPath: string, options: { dropVolume?: boolean }) => Promise<any>;
      status: (projectPath: string) => Promise<ServiceInfo[]>;
      stop: (projectPath: string, options: { services: string[] }) => Promise<any>;
      restart: (projectPath: string, options: { services: string[]; timeout?: number }) => Promise<any>;
      check: () => Promise<any>;
    };
  };
  menu: {
    minimizeWindow: () => void;
    maximizeWindow: () => void;
    closeWindow: () => void;
    restoreWindow: () => void;
    isMaximized: () => Promise<boolean>;
  };
  appLogicAPI: {
    getEnvironments: () => Promise<any>;
    addEnvironment: (environment: any) => Promise<any>;
    updateEnvironment: (id: string, updates: any) => Promise<any>;
    deleteEnvironment: (id: string) => Promise<any>;
    getEnvironment: (id: string) => Promise<any>;
    addConnectionTest: (test: any) => Promise<any>;
    getEnvironmentHistory: (environmentId: string) => Promise<any>;
    exportData: () => Promise<any>;
    importData: (jsonData: any) => Promise<any>;
    testEnvironment: (environment: any) => Promise<any>;
    getStoreInfo: () => Promise<any>;
    onEnvironmentsChanged: (callback: (environments: any) => void) => () => void;
    removeAllListeners: () => void;
  };
  igrpStudioSettings: {
    setBPMNConfig: (config: BPMNConfig | null) => Promise<void>;
    getBPMNConfig: () => Promise<BPMNConfig | null>;
    deleteBPMNConfig: () => Promise<void>;

  };
}

export {};
