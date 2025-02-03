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
    apiName: string;
    artifact: string;
    database: DatabaseTypes;
    description?: string;
    package?: string;
    projectStructureStyle: ProjectStructureStyle;
    name?: string;
    enableObservability: boolean;
    igrpCoreVersion: string;
}

export interface SpringConfigData {
    apiName: string;
    description: string;
    group: string;
    artifact: string;
    database: string;
    projectStructureStyle: 'technical' | 'domain';
    enableObservability: boolean;
    projectStructureStyle: string;
    igrpCoreVersion: string
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
    id?: string;
    label: string;
    isHeader?: boolean;
    icon?: any;
    link?: string;
    stateVariables?: boolean;
    click?: (e: any) => void;
    subItems?: MenuItem[];
    parentId?: string;
    badgeColor?: string;
    badgeName?: string;
    type?: string;
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

export interface FileTree {
    name: string; // Name of the file or folder
    path: string; // Full path of the file or folder
    isDirectory: boolean; // Whether it's a directory
    children?: FileTree[]; // Array of children (only for directories)
    content?: any
}

export interface Repository {
    id: number;
    name: string;
    full_name: string;
    description: string | null;
    private: boolean;
    html_url: string;
    clone_url: string;
    updated_at: string | null;
}

interface Commit {
    hash: string;
    author: string;
    date: string;
    message: string;
    branch?: string;
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


export interface SchemaTypeItem {
    label: string;
    value: string;
    items?: SchemaTypeItem[]; // Optional submenu items
}
