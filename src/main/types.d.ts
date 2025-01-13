type Handler = (event: IpcMainInvokeEvent, ...args: any[]) => any;

type HandlerResponse<T = any> = {
    result?: T;
    error?: string;
};

export interface NextConfigData {
    appName: string
    description?: string
}

export interface DotNetConfigData {
    projectName: string
    solutionName: string
    framework: string
    language: string
    auth: boolean
    https: boolean
    dockerSupport: boolean
}

export interface SpringConfigData {
    apiName: string;
    description: string;
    group: string;
    artifact: string;
    database: string;
    structureStyle: 'technical' | 'domain';
    enableObservability: boolean;
    igrpCoreVersion: string;
}

export type ConfigData = SpringConfigData | NextConfigData | DotNetConfigData;

export interface ProjectData {
    name: string;
    icon?: File;
    type?: 'frontend' | 'backend';
    framework: string;
    config: ConfigData | undefinedF;
    path: string;
    themeColor?: string;
    dt_created?: Date,
    dt_updated?: Date,
    location?: location
}

export type Page = {
    page: number,
    size: number
}

export interface IOpenProject {
    canceled: boolean,
    folderExists: boolean,
    config?: ProjectData,
    basePath?: string
}

export type PageableProjects = { data: Array<ProjectData>, total: number }

export interface MenuItem {
    id?: string; // id might be optional
    label: string;
    isHeader?: boolean; // isHeader is optional since not all items have it
    icon?: any; // optional as some items like headers don't have icons
    link?: string; // link is optional since headers might not have links
    stateVariables?: boolean; // this seems to be a boolean related to state
    click?: (e: any) => void; // function that handles clicks, optional
    subItems?: MenuItem[]; // subItems is an array of MenuItems, optional
    parentId?: string; // optional field for subItems
    badgeColor?: string; // optional field for badges
    badgeName?: string; // optional field for badges
    type?: string;
    sutType?: string;
    component?: React.ReactNode,
    path?: string,
    module?: string,
    dropdownMenus?: [][{ label: string; type: string; }]
    dropdownclick?: (e: any) => void;
    content?: any,
}

type FolderFiles = { [folderName: string]: FolderFileStructure };

export interface File {
    name: string;
    path: string;
    config?: Object
    content?: Object
}

export interface FolderFileStructure {
    name: string;
    files: Array<Record<string, File[]>>; // Group files by subfolder
    path: string;
}

export interface DatabaseResponse {
    success: boolean, message?: string, tables?: any, structure?: any
}

export interface Connection {
    description?: string;
    name: string;
    databaseType: string;
    connectionType: 'general' | 'ssh';
    host: string;
    port: number | null;
    user: string;
    password: string;
    sshHost?: string;
    sshPort?: string;
    sshUsername?: string;
    sshPassword?: string;
    database: string;
}
