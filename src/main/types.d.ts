import { ReactNode } from 'react';

type Handler = (event: IpcMainInvokeEvent, ...args: any[]) => any;

type HandlerResponse<T = any> = {
    result?: T;
    error?: string;
};

export interface IOpenProject {
    canceled: boolean,
    folderExists: boolean,
    config?: ConfigOptions,
    basePath?: string
}

export type Project = {
    path: string,
    config: ConfigOptions
    dt_created?: Date,
    dt_updated?: Date,
    location: location
}

export interface ConfigOptions {
    type: string;
    name: string;
    group?: string;
    artifact?: string;
    database?: string;
    description?: string;
    package?: string;
    projectStructureStyle?: false
}

export type Page = {
    page: number,
    size: number
}

export type PageableProjects = { data: Array<Project>, total: number }

export interface IProjectRepository {
    async save(project: Project): Promise<Project>;
    async delete(project: Project, index: number): Promise<void>;
    async findAllRecent(page: Page): Promise<PageableProjects>;
    async findAll(): Promise<Array<Project>>;

}

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