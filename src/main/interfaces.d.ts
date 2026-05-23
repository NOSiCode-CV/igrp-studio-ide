import {
    Component,
    ModuleConfig,
    ModelConfig,
    DTOConfig,
    ControllerConfig,
    DeleteConfig,
    ResponseConfig,
    EnumConfig,
    PageConfig,
    PayloadConfig,
    CodeSnippetsRegistrationConfig,
    ServiceInfo
} from './types' // Ajuste o caminho conforme a localização real dos seus tipos

import { Dependency } from '@igrp/igrp-studio-springboot-engine/dist/interfaces/springDependencyTypes'
import { Connection, HandlerResponse, PageableProjects, ProjectData } from './types'
import { ComponentRegistrationConfig } from '@igrp/igrp-studio-nextjs-engine/types'
import {
    DockerServiceRegistrationConfig,
    ProjectWorkspace,
    ServiceWorkspace,
    WorkspaceService
} from '@igrp/igrp-studio-workspace-engine/dist/interfaces/types'
import { IWorkspace, DatabaseResponse, WorkspaceBootstrapOptions } from 'src/main/types'

export interface IWorkspaceRepository {
    // Workspace Operations
    createWorkspace(
        workspace: Omit<IWorkspace, 'id' | 'createdAt' | 'projects'>,
        options?: WorkspaceBootstrapOptions
    ): Promise<HandlerResponse>
    updateWorkspace(id: string, updates: Partial<IWorkspace>): Promise<IWorkspace>
    deleteWorkspace(id: string): Promise<void>
    getWorkspace(id: string): Promise<IWorkspace | undefined>
    findAllWorkspaces(): Promise<IWorkspace[]>
    findRecentWorkspaces(limit?: number): Promise<IWorkspace[]>
    openWorkspace(workspacePath: string): Promise<HandlerResponse>
    saveCustomWorkspaceComposeFile(yaml: object, basePath: string): Promise<void>

    // Project Operations
    createProject(
        workspaceId: string,
        project: Omit<ProjectData, 'id' | 'createdAt' | 'workspaceId'>
    ): Promise<HandlerResponse>
    updateProject(projectId: string, updates: Partial<ProjectWorkspace>): Promise<HandlerResponse>
    configureService(config: ProjectWorkspace, basePath: string): Promise<HandlerResponse>
    deleteProject(projectId: string, basePath: string): Promise<void>
    getProject(id: string): Promise<ProjectData | undefined>
    findAllProjects(workspaceId?: string): Promise<ProjectData[]>
    getRecentProjects(workspaceId: string, limit?: number): Promise<ProjectData[]>
    addProjectToWorkspace(workspaceId: string, project: ProjectData): Promise<HandlerResponse>

    //Service Operations
    createService(service: ServiceWorkspace, basePath: string): Promise<HandlerResponse>
    updateService(service: ServiceWorkspace, basePath: string): Promise<HandlerResponse>
    deleteService(serviceId: string, basePath: string): Promise<HandlerResponse>
    findAllServices(workspaceId: string): Promise<WorkspaceService[]>

    // Utility Methods
    initialize(): Promise<void>
    backupData(backupPath: string): Promise<void>
    restoreData(backupPath: string): Promise<void>

    onError(callback: (error: { code: string; message: string }) => void)
}

export interface IProjectRepository {
    save(project: ProjectData): Promise<ProjectData>
    delete(project: ProjectData): Promise<void>
    findAllRecent(): Promise<PageableProjects>
    findAll(): Promise<Array<ProjectData>>
}

export interface IConnenctionRepository {
    save(connection: Connection): Promise<Connection>
    delete(connectionName: string): Promise<void>
    findAll(): Promise<Array<Connection>>
    findOne(name: string): Promise<Connection>

    connectToDatabase: (config: Connection) => Promise<DatabaseResponse>
    getTables: (connectionName: string) => Promise<DatabaseResponse>
    getTableStructure: (connectionName: string, tableName: string) => Promise<DatabaseResponse>
}

export interface BaseEngine {
    createProject(project: ProjectData, basePath: string): Promise<void>
    delete(config: DeleteConfig, basePath: string): Promise<void>
    duplicate(config: any, basePath: string): Promise<void>
    createResponse?(config: ResponseConfig, basePath: string): Promise<void>

    createEnum?(data: EnumConfig, basePath: string): Promise<void>
    createModule?(data: EnumConfig, basePath: string): Promise<void>
    createModel?(data: EnumConfig, basePath: string): Promise<void>
    createDto?(data: EnumConfig, basePath: string): Promise<void>
    createController?(data: EnumConfig, basePath: string): Promise<void>
    createGraphqlSchema?(config: any, basePath: string): Promise<void>

    serializeElement?: (data: any, basePath: string) => Promise<void>
    createPermission?: (data: any, basePath: string) => Promise<void>

    /**
     * Fetch the engine-specific selector universe (type names, MIME types,
     * HTTP methods, etc.) for the generators API UI. Originally exposed only
     * by the Spring engine; now part of the BaseEngine surface so callers
     * route via `EngineFactory.getEngine(framework).engineTypes(...)`.
     */
    engineTypes?: (module: string, basePath: string) => Promise<any>

    createPage?(pageConfig: PageConfig, basePath: string): Promise<void>

    registry?(): Promise<void>
    getComponents?(): ComponentRegistrationConfig
    getServices?(): Promise<DockerServiceRegistrationConfig>

    getDependencies?(): Promise<Dependency[]>

    getAppMetadata?: (basePath: string) => Promise<PayloadConfig>

    getCodeSnippets?(): CodeSnippetsRegistrationConfig

    registerComponent?(config: ComponentRegistrationConfig): void

    createProcess?: (process: ProcessConfig, basePath: string) => Promise<void>
    createProcessStep?: (step: ProcessStepConfig, basePath: string) => Promise<void>
}

export interface IBaseEngine {
    createProject: (project: ProjectData, basePath: string) => Promise<HandlerResponse>

    createResponse: (
        response: any,
        engineType: string,
        basePath: string
    ) => Promise<HandlerResponse>

    createEnum: (data: any, engineType: string, basePath: string) => Promise<HandlerResponse>
    createModule: (
        moduleConfig: ModuleConfig,
        engineType: string,
        basePath: string
    ) => Promise<HandlerResponse>
    createModel: (
        modelConfig: ModelConfig,
        engineType: string,
        basePath: string
    ) => Promise<HandlerResponse>
    createDto: (
        dtoConfig: DTOConfig,
        engineType: string,
        basePath: string
    ) => Promise<HandlerResponse>
    createController: (
        controllerConfig: ControllerConfig,
        engineType: string,
        basePath: string
    ) => Promise<HandlerResponse>

    createPermission: (data: any, engineType: string, basePath: string) => Promise<HandlerResponse>
    serializeElement: (data: any, engineType: string, basePath: string) => Promise<HandlerResponse>
    delete: (config: any, engineType: string, basePath: string) => Promise<HandlerResponse>
    duplicate: (config: any, engineType: string, basePath: string) => Promise<HandlerResponse>

    createPage: (config: any, engineType: string, basePath: string) => Promise<HandlerResponse>
    registry: (engineType: string) => Promise<HandlerResponse>
    getComponent: (engineType: string) => Promise<HandlerResponse>
    getService: (engineType: string) => Promise<Record<string, Component>>
    getDependencies: (engineType: string) => Promise<HandlerResponse>

    getAppMetadata: (engineType: string, basePath: string) => Promise<HandlerResponse>

    getCodeSnippets(engineType: string): CodeSnippetsRegistrationConfig

    registerComponent: (
        engineType: string,
        config: ComponentRegistrationConfig
    ) => Promise<HandlerResponse>

    createProcess: (process: any, engineType: string, basePath: string) => Promise<HandlerResponse>
    createProcessStep: (step: any, engineType: string, basePath: string) => Promise<HandlerResponse>
}

export interface IDocker {
    up: (projectPath: string) => Promise<ServiceInfo[]>
    down: (projectPath: string, options: { dropVolume?: boolean }) => Promise<void>
    status: (projectPath: string) => Promise<ServiceInfo[]>
    stop: (projectPath: string, options: { services: string[] }) => Promise<void>
    restart: (
        projectPath: string,
        options: { services: string[]; timeout?: number }
    ) => Promise<void>
    check: () => Promise<boolean>
    daemonStatus: () => Promise<{
        isRunning: boolean
        error?: string
        details?: string
    }>
}
