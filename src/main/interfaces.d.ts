import { Connection, PageableProjects, Project } from "./types";

export interface IProjectRepository {
    async save(project: Project): Promise<Project>;
    async delete(project: Project, index: number): Promise<void>;
    async findAllRecent(): Promise<PageableProjects>;
    async findAll(): Promise<Array<Project>>;
}

export interface IConnenctionRepository {
    async save(connection: Connection): Promise<Connection>;
    async delete(connectionName: string): Promise<void>;
    async findAll(): Promise<Array<Connection>>;
    async findOne(name: string): Promise<Connection>;
}

export interface BaseEngine {
    createApi(apiConfig: BaseApiConfig, basePath: string): Promise<void>;
}