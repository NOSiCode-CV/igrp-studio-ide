import { Connection, PageableProjects, ProjectData } from "./types";

export interface IProjectRepository {
    async save(project: ProjectData): Promise<ProjectData>;
    async delete(project: ProjectData): Promise<void>;
    async findAllRecent(): Promise<PageableProjects>;
    async findAll(): Promise<Array<ProjectData>>;
}

export interface IConnenctionRepository {
    async save(connection: Connection): Promise<Connection>;
    async delete(connectionName: string): Promise<void>;
    async findAll(): Promise<Array<Connection>>;
    async findOne(name: string): Promise<Connection>;
}

export interface BaseEngine {
    createProject(project: ProjectData, basePath: string): Promise<void>;
    delete(config: DeleteConfig, basePath: string): Promise<void>;
    createResponse?(config: ResponseConfig, basePath: string): Promise<void>;
    
    createEnum?(data: EnumConfig, basePath: string): Promise<void>;
    createModule?(data: EnumConfig, basePath: string): Promise<void>;
    createModel?(data: EnumConfig, basePath: string): Promise<void>;
    createDto?(data: EnumConfig, basePath: string): Promise<void>;
    createController?(data: EnumConfig, basePath: string): Promise<void>;

    serializeElement?: (data: any, basePath: string) => Promise<void>;
    createPermission?: (data: any, basePath: string) => Promise<void>;

    createPage?(pageConfig: PageConfig, basePath: string): Promise<void>;

    registryComponent?(basePath: string): Promise<void>;
    getComponents?(): Record<string, Component>;
}
