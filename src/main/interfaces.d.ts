import { Dependency } from "@igrp/igrp-studio-springboot-engine/dist/interfaces/springDependencyTypes";
import { Connection, DockerComposeService, Handler, HandlerResponse, PageableProjects, ProjectData } from "./types";
import { ComponentRegistrationConfig, DockerServiceRegistrationConfig } from "@igrp/igrp-studio-nextjs-engine/dist/interfaces/types";

export interface IWorkspaceRepository {
    // Workspace Operations
    createWorkspace(workspace: Omit<IWorkspace, 'id' | 'createdAt' | 'projects'>): Promise<IWorkspace>;
    updateWorkspace(id: string, updates: Partial<IWorkspace>): Promise<IWorkspace>;
    deleteWorkspace(id: string): Promise<void>;
    getWorkspace(id: string): Promise<IWorkspace | undefined>;
    findAllWorkspaces(): Promise<IWorkspace[]>;
    findRecentWorkspaces(limit?: number): Promise<IWorkspace[]>;
    saveCustomWorkspaceComposeFile(yaml: object, basePath: string): Promise<void>;

    // Project Operations
    saveProject(workspaceId: string, project: Omit<ProjectData, 'id' | 'createdAt' | 'workspaceId'>): Promise<HandlerResponse>;
    updateProject(projectId: string, updates: Partial<ProjectData>): Promise<ProjectData>;
    deleteProject(projectId: string, basePath: string): Promise<void>;
    getProject(id: string): Promise<ProjectData | undefined>;
    findAllProjects(workspaceId?: string): Promise<ProjectData[]>;
    getRecentProjects(workspaceId: string, limit?: number): Promise<ProjectData[]>;

    // Utility Methods
    initialize(): Promise<void>;
    backupData(backupPath: string): Promise<void>;
    restoreData(backupPath: string): Promise<void>;

    onError(callback: (error: {
        code: string;
        message: string
    }) => void);
}

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

    connectToDatabase: (config: Connection) => Promise<DatabaseResponse>,
    getTables: (connectionName: string) => Promise<DatabaseResponse>,
    getTableStructure: (connectionName: string, tableName: string) => Promise<DatabaseResponse>,
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

    registry?(basePath: string): Promise<void>;
    getComponents?(): ComponentRegistrationConfig;
    getServices?(): Promise<DockerServiceRegistrationConfig>;

    getDependencies?(): Promise<Dependency[]>
}


export interface IBaseEngine {
    createProject: (project: ProjectData, basePath: string) => Promise<HandlerResponse>;
    createResponse: (response: any, engineType: string, basePath: string) => Promise<HandlerResponse>;

    createEnum: (data: any, engineType: string, basePath: string) => Promise<HandlerResponse>;
    createModule: (moduleConfig: ModuleConfig, engineType: string, basePath: string) => Promise<HandlerResponse>;
    createModel: (modelConfig: ModelConfig, engineType: string, basePath: string) => Promise<HandlerResponse>;
    createDto: (dtoConfig: DTOConfig, engineType: string, basePath: string) => Promise<HandlerResponse>;
    createController: (controllerConfig: ControllerConfig, engineType: string, basePath: string) => Promise<HandlerResponse>;

    createPermission: (data: any, engineType: string, basePath: string) => Promise<HandlerResponse>;
    serializeElement: (data: any, engineType: string, basePath: string) => Promise<HandlerResponse>;
    delete: (config: any, engineType: string, basePath: string) => Promise<HandlerResponse>;

    createPage: (config: any, engineType: string, basePath: string) => Promise<HandlerResponse>;
    registry: (engineType: string, basePath: string) => Promise<HandlerResponse>;
    getComponent: (engineType: string) => Promise<HandlerResponse>;
    getService: (engineType: string) => Promise<Record<string, Component>>;

    getDependencies: (engineType: string) => Promise<HandlerResponse>;
}

export interface IDocker {
    up: (projectPath: string) => Promise<ServiceInfo[]>;
    down: (projectPath: string) => Promise<void>;
    status: (projectPath: string) => Promise<ServiceInfo[]>;
    stop: (projectPath: string, services: string[]) => Promise<void>;
    restart: (projectPath: string, services: string[], timeout?: number) => Promise<void>;
    check: () => Promise<boolean>
}