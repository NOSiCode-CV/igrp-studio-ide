import { ElectronAPI } from '@electron-toolkit/preload'
import { IOpenProject } from './types';
import { IProjectRepository } from '@renderer/interfaces/types'
import { BaseApiConfig, PageConfig } from 'nextjs-engine/dist/interfaces/types';
import { ControllerConfig, DTOBaseConfig, DTOConfig, ModelConfig, ModuleConfig } from '@igrp/spring-engine/dist/interfaces/types';

interface CustomAPI {

    createApi: (apiConfig: BaseApiConfig, basePath: string) => Promise<HandlerResponse>;
    createModule: (moduleConfig: ModuleConfig, basePath: string) => Promise<HandlerResponse>;
    createModel: (modelConfig: ModelConfig, basePath: string) => Promise<HandlerResponse>;
    createDto: (dtoConfig: DTOConfig, basePath: string) => Promise<HandlerResponse>;
    createController: (controllerConfig: ControllerConfig, basePath: string) => Promise<HandlerResponse>;

    deleteDTO: (config: DTOBaseConfig, basePath: string) => Promise<HandlerResponse>;
    deleteModel: (config: ModelConfig, basePath: string) => Promise<HandlerResponse>;
    deleteController: (config: ControllerConfig, basePath: string) => Promise<HandlerResponse>;


    createPage: (modelConfig: PageConfig, basePath: string) => Promise<HandlerResponse>;
    deletePage: (pageConfig: PageConfig, basePath: string) => Promise<HandlerResponse>;
    addComponentToPage: (pageConfig: PageConfig, components: Component[], basePath: string) => Promise<HandlerResponse>;

    fetchSelectors: (module: string, basePath: string) => Promise<[]>

    openDirectory: (buttonLabel: string) => Promise<IOpenProject>;
    fetchFiles: (basePath: string) => Promise<FolderFiles>;
    getJsonContent: (filePath: string) => Promise<any>;

    createAppNext: (appConfig: AppConfig, basePath: string) => Promise<HandlerResponse>;

    openVSCode: (basePath: string | undefined) => Promise<void>;

    getVersions: (endpoint: string) => Promise<HandlerResponse>,

    i18nextElectronBackend: any
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
        electron: ElectronAPI
        api: CustomAPI,
        repo: { project: IProjectRepository },
        menu: CustomMenu
    }
}
