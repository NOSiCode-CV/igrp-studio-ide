import { ElectronAPI } from '@electron-toolkit/preload'
import { IOpenProject } from './types';
import { BaseApiConfig, PageConfig } from 'nextjs-engine/dist/interfaces/types';
import { ControllerConfig, DTOBaseConfig, DTOConfig, ModelConfig, ModuleConfig } from '@igrp/spring-engine/dist/interfaces/types';
import { Connection, FileTree, IConnenctionRepository, ProjectData } from 'src/main/types';
import { IConnenctionRepository, IProjectRepository } from 'src/main/interfaces';


interface CustomAPI {

    createModule: (moduleConfig: ModuleConfig, basePath: string) => Promise<HandlerResponse>;
    createModel: (modelConfig: ModelConfig, basePath: string) => Promise<HandlerResponse>;
    createDto: (dtoConfig: DTOConfig, basePath: string) => Promise<HandlerResponse>;
    createController: (controllerConfig: ControllerConfig, basePath: string) => Promise<HandlerResponse>;

    createPage: (modelConfig: PageConfig, basePath: string) => Promise<HandlerResponse>;
    deletePage: (pageConfig: PageConfig, basePath: string) => Promise<HandlerResponse>;
    addComponentToPage: (pageConfig: PageConfig, components: Component[], basePath: string) => Promise<HandlerResponse>;

    fetchSelectors: (module: string, basePath: string) => Promise<[]>

    openDirectory: (buttonLabel: string) => Promise<IOpenProject>;
    fetchFiles: (basePath: string) => Promise<FileTree[]>;
    getJsonContent: (filePath: string) => Promise<any>;
    readDirectory: (basePath: string) => Promise<FileTree[]>;
    readProjectFile(filePath: string): Promise<any>;

    createAppNext: (appConfig: AppConfig, basePath: string) => Promise<HandlerResponse>;

    openVSCode: (basePath: string | undefined) => Promise<void>;

    getVersions: (endpoint: string) => Promise<HandlerResponse>,

    //Database
    connectToDatabase: (config: Connection) => Promise<DatabaseResponse>,

    getTables: (connectionName: string) => Promise<DatabaseResponse>,

    getTableStructure: (connectionName: string, tableName: string) => Promise<DatabaseResponse>,

    i18nextElectronBackend: any
}

interface BaseEngine {
    createProject: (project: ProjectData, basePath: string) => Promise<HandlerResponse>;
    createResponse: (response: any, engineType: string, basePath: string) => Promise<HandlerResponse>;
    createEnum: (data: any, engineType: string, basePath: string) => Promise<HandlerResponse>;
    serializeElement: (data: any, engineType: string, basePath: string) => Promise<HandlerResponse>;
    delete: (config: any, engineType: string, basePath: string) => Promise<HandlerResponse>;
}

interface CustomMenu {
    minimizeWindow: () => void,
    maximizeWindow: () => void,
    closeWindow: () => void,
    restoreWindow: () => void,
    isMaximized: () => boolean,
}

declare global {
    interface Window {
        electron: ElectronAPI | getAppVersion | getLanguage | setLanguage
        api: CustomAPI,
        repo: { project: IProjectRepository, connection: IConnenctionRepository },
        menu: CustomMenu,
        engine: BaseEngine
    }
}
