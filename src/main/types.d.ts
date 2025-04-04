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
    database: "MySQL" | "Oracle" | "Postgresql" | "H2";
    projectStructureStyle: 'technical' | 'domain';
    enableObservability: boolean;
    enableEntityRevision: boolean;
    projectStructureStyle: string;
    igrpCoreVersion: string;
    springBootVersion: string;
    dependencies: Array<any>
    enableGraalVm: boolean
}

export type ConfigData = SpringConfigData | NextConfigData | DotNetConfigData;

export interface ProjectData {
    id: string;
    name: string;
    icon?: string;
    type?: 'frontend' | 'backend' | 'fullstack';
    framework: 'springboot' | 'nextjs' | 'dotnet';
    config?: ConfigData;
    path: string;
    themeColor?: string;
    location?: location,
    createdAt?: string;
    updatedAt?: string;
    workspaceId?: string;
}

export interface IWorkspace {
    id: string;
    name: string;
    path: string;
    slug: string;
    description?: string;
    createdAt: string;
    updatedAt?: string;
    lastOpenedAt?: string;
    projects?: ProjectData[];
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
    module?: string;
    items?: SchemaTypeItem[]; // Optional submenu items
}
