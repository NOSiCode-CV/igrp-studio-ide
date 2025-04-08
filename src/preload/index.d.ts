import { ElectronAPI } from '@electron-toolkit/preload'
import { IOpenProject } from './types';
import { BaseApiConfig, PageConfig } from 'nextjs-engine/dist/interfaces/types';
import { ControllerConfig, DTOBaseConfig, DTOConfig, ModelConfig, ModuleConfig } from '@igrp/igrp-studio-springboot-engine/dist/interfaces/types';
import { Connection, FileTree, ProjectData } from 'src/main/types';
import { IConnenctionRepository, IWorkspaceRepository, IBaseEngine, IDocker } from 'src/main/interfaces';
import { Component } from '@igrp/igrp-studio-nextjs-engine/dist/components';

export 


interface CustomAPI {

    fetchSelectors: (module: string, basePath: string) => Promise<[]>

    openDirectory: (buttonLabel: string) => Promise<IOpenProject>;
    fetchFiles: (basePath: string) => Promise<FileTree[]>;
    getJsonContent: (filePath: string) => Promise<any>;
    getFileContent: (filePath: string) => Promise<any>;
    readDirectory: (basePath: string) => Promise<FileTree[]>;
    readProjectFile(filePath: string): Promise<any>;

    openIDE: ({ basePath, ideType }: { basePath: string; ideType: string }) => Promise<void>;

    getIDEs: () => Promise<Array<{ key: string; config: IDEDetails }>>;

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
        electron: ElectronAPI | getAppVersion | getLanguage | setLanguage
        api: CustomAPI,
        igrpStudio: { workspace: IWorkspaceRepository, connection: IConnenctionRepository, docker: IDocker },
        menu: CustomMenu,
        engine: IBaseEngine
    }
}
