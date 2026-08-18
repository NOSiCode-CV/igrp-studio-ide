import { WorkspaceService } from '@igrp/igrp-studio-workspace-engine/dist/interfaces/types'

type Handler = (event: IpcMainInvokeEvent, ...args: any[]) => any

type HandlerResponse<T = any> = {
    result?: T
    error?: string
}

export type ProjectType = 'frontend' | 'backend' | 'specification'

export type FrameworkType = 'springboot' | 'nextjs' | 'dotnet' | 'specification' | 'django'

export type ProjectStorageMode = 'managed' | 'linked'

export interface NextConfigData {
    name: string
    description?: string
    workspaceId: string
    id: string
    version: string
}

export interface DjangoConfigData {
    artifact: string
    database: 'PostgreSQL' | 'MySQL' | 'SQLite' | 'Oracle'
    description?: string
    projectStructureStyle: 'technical' | 'domain'
    name?: string
    enableObservability: boolean
    enableEntityRevision: boolean
    /** Opt-in Strawberry GraphQL scaffolding (forwarded to @igrp/django-engine). */
    enableGraphQL?: boolean
    /** Identity provider used by the generated Django JWT resource-server scaffold. */
    authMode?: 'keycloak' | 'autentika'
}

export interface DotNetConfigData {
    artifact: string
    database: DatabaseTypes
    description?: string
    package?: string
    projectStructureStyle: ProjectStructureStyle
    name?: string
    enableObservability: boolean
    /** Whether the generated project enables IGRP entity revision/audit history. */
    enableEntityRevision: boolean
    /** Opt-in HotChocolate GraphQL generation for .NET projects. */
    enableGraphQL?: boolean
    /**
     * iGRP workspace slug (workspace metadata, not a UUID). When present,
     * `@igrp/dotnet-engine` additionally emits the workspace deployment files
     * (`igrp-compose-<name>.yaml` + `.igrp.<name>.env`) and wires the CI
     * `REGISTRY_PROJECT`. Not collected by the Studio config form; injected from
     * `IWorkspace.slug` by `workspace-service.addProject` so the feature is not
     * inert through Studio.
     */
    workspaceSlug?: string
    /**
     * Identity provider the generated .NET app validates JWTs against (Spring
     * parity). Forwarded to the engine only when the config carries it; the
     * engine defaults to `'keycloak'` when omitted.
     */
    authMode?: 'keycloak' | 'autentika'
}

export interface SpringConfigData {
    name: string
    description: string
    group: string
    artifact: string
    database: 'MySQL' | 'Oracle' | 'Postgresql' | 'H2'
    projectStructureStyle: 'technical' | 'domain'
    enableObservability: boolean
    enableEntityRevision: boolean
    version: string
    dependencies: Array<any>
    enableGraalVm: boolean
    package?: string
}

export interface SpecificationConfigData {
    name: string
    description?: string
    workspaceId: string
    id: string
    version: string
    /** LLM padrão para o AIAssistant */
    defaultLLM?: { provider: 'openrouter' | 'cli'; model: string }
    /** Provider/modelo de embeddings para a Knowledge Base */
    embeddings?: { provider: 'openai' | 'voyage' | 'local'; model: string }
    /** System prompt opcional aplicado a todos os chats do projeto */
    systemPrompt?: string
}

export type ConfigData =
    | SpringConfigData
    | NextConfigData
    | DotNetConfigData
    | SpecificationConfigData
    | DjangoConfigData

export interface ProjectData {
    id: string
    name: string
    icon?: string
    type?: ProjectType
    framework: FrameworkType
    config: ConfigData | any
    service?: any
    path: string
    /**
     * managed: project is placed under <workspace>/projects/<name>
     * linked: project lives outside the workspace (e.g. monorepo); do not copy/move sources
     */
    storageMode?: ProjectStorageMode
    /**
     * Absolute path to the Git repository root (from `git rev-parse --show-toplevel`).
     * When project is inside a monorepo, this will differ from `path`.
     */
    gitRootPath?: string
    /** ISO timestamp when gitRootPath was last detected */
    gitRepoRootDetectedAt?: string
    themeColor?: string
    location?: location
    createdAt?: string
    updatedAt?: string
    workspaceId: string
    dependsOn?: string[] | Record<string, DependencyConfig>[]
}

export interface IWorkspace {
    id: string
    name: string
    path: string
    slug: string
    description?: string
    createdAt: string
    updatedAt?: string
    lastOpenedAt?: string
    projects?: ProjectData[]
    services?: WorkspaceService[]
    pinned?: boolean
    /** Actual Postgres database name — read from workspace .env IGRP_DATABASE_NAME at load time. Not persisted to disk. */
    databaseName?: string
}

export interface WorkspaceBootstrapOptions {
    autoStartStack?: boolean
    installMonitoringStack?: boolean
    installProcessStack?: boolean
}

export interface WorkspaceBootstrapResult {
    stackStarted: boolean
    optionalStacksInstalled: {
        monitoring: boolean
        process: boolean
    }
    errors: string[]
}

export interface OptionalStacksStatus {
    monitoringInstalled: boolean
    processInstalled: boolean
}

export interface IOpenProject {
    canceled: boolean
    folderExists: boolean
    config?: ProjectData
    basePath?: string
}

export type PageableProjects = { data: Array<ProjectData>; total: number }

export interface MenuItem {
    id?: string
    label: string
    isHeader?: boolean
    icon?: any
    link?: string
    stateVariables?: boolean
    click?: (e: any) => void
    subItems?: MenuItem[]
    parentId?: string
    badgeColor?: string
    badgeName?: string
    deprecated?: boolean
    type?: string
    component?: React.ReactNode
    path?: string
    module?: string
    dropdownMenus?: [][{ label: string; type: string }]
    dropdownclick?: (e: any) => void
    content?: any
}

export interface FileTree {
    name: string // Name of the file or folder
    path: string // Full path of the file or folder
    isDirectory: boolean // Whether it's a directory
    children?: FileTree[] // Array of children (only for directories)
    content?: any
}

export interface Repository {
    id: number
    name: string
    full_name: string
    description: string | null
    private: boolean
    html_url: string
    clone_url: string
    updated_at: string | null
    platform: string
}

export type RepositoryPlatform = 'github' | 'gitlab' | 'other'

interface Commit {
    hash: string
    author: string
    date: string
    message: string
    branch?: string
}
export interface DatabaseResponse {
    success: boolean
    message?: string
    tables?: any
    structure?: any
}

export interface Connection {
    description?: string
    name: string
    databaseType: string
    connectionType: 'general' | 'ssh'
    host: string
    port: number | undefined
    user: string
    password: string
    sshHost?: string
    sshPort?: string
    sshUsername?: string
    sshPassword?: string
    database: string
}

export interface SchemaTypeItem {
    label: string
    value: string
    module?: string
    items?: SchemaTypeItem[] // Optional submenu items
}

export interface DockerComposeConfig {
    version: string
    services: Record<string, DockerComposeService>
    networks?: Record<string, DockerComposeNetwork>
    volumes?: Record<string, DockerComposeVolume>
    name: string
}

export interface DockerComposeService {
    image: string
    container_name?: string
    ports?: string[]
    volumes?: string[]
    environment?: string[]
    depends_on?: string[]
    networks?: string[]
    hostname?: string
    restart?: string
    host_config?: Record<string, any>
    status: string
    type?: string
    labels: Record<string, string>
    env_file: string | string[]
}

export interface DockerComposeNetwork {
    name?: string
    driver?: string
    external?: boolean
    internal?: boolean
}

export interface DockerComposeVolume {
    name?: string
    driver?: string
    external?: boolean
}

interface DependencyConfig {
    condition?: string
}

export interface ServiceInfo {
    image: string
    container_name?: string
    ports?: string[]
    volumes?: string[]
    environments?: { key: string; value: string }[]
    dependsOn?: string[] | Record<string, DependencyConfig>[]
    networks?: string[]
    hostname?: string
    restart?: string
    hostConfig?: Record<string, any>
    status: string
    name: string
    id?: string
    labels: Record<string, string>
    env_file: { file: string }[]
    createdAt?: string
    statusMessage?: string
    composeFile?: string
    stack?: 'main' | 'monitoring' | 'process' | 'project'
}

export type GitProviderType = 'github' | 'gitlab'

export interface GitProviderConfig {
    id: string
    /**
     * Discriminates which auth/API client to use for this instance.
     * Older configs without `type` are treated as 'gitlab' for backwards
     * compatibility with the legacy storage layout.
     */
    type?: GitProviderType
    name: string
    /** Web base URL of the host (e.g. https://github.com, https://git.nosi.cv). */
    baseUrl: string
    clientId: string
    clientSecret: string
    active: boolean
    isDefault?: boolean
}

/**
 * Common surface implemented by GitHubService and GitLabService. Lets
 * provider-agnostic code drive auth and repository listings without
 * knowing which kind of host is on the other side.
 */
export interface IGitProvider {
    readonly type: GitProviderType
    initialize(token: string, config?: GitProviderConfig): Promise<void> | void
    getUserInfo(): Promise<unknown>
    listRepositories(window: unknown): Promise<unknown[]>
    logout(): void
}

export type ToolCheck = {
    name: string
    command: string
    success: boolean
    version?: string
    error?: string
    link: string
    category: 'frontend' | 'backend' | 'development'
    description?: string
    required: boolean
}
export interface AppLogicEnvironment {
    id: string
    name: string
    url: string
    apiKey: string
    status: 'connected' | 'disconnected' | 'testing' | 'error'
    description?: string
    createdAt: string
    lastTested?: string
    lastModified?: string
    tags?: string[]
    timeout?: number
    retryAttempts?: number
}

export interface ConnectionTest {
    id: string
    environmentId: string
    success: boolean
    timestamp: string
    responseTime?: number
    error?: string
    statusCode?: number
    endpoint?: string
    method?: string
}

export interface AppLogicRequest {
    id: string
    environmentId: string
    endpoint: string
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    headers?: Record<string, string>
    body?: any
    timeout?: number
    timestamp: string
    response?: {
        status: number
        data: any
        headers: Record<string, string>
        responseTime: number
    }
    error?: string
}

export interface AppLogicSettings {
    autoTest: boolean
    testInterval: number
    maxHistoryEntries: number
    defaultTimeout: number
    retryAttempts: number
    notifications: boolean
    autoBackup: boolean
    backupInterval: number
}

export interface BackupData {
    version: string
    timestamp: string
    environments: AppLogicEnvironment[]
    settings: AppLogicSettings
    history: Record<string, ConnectionTest[]>
    requests: AppLogicRequest[]
}

// BPMN Process Management Interfaces
export interface BPMNConfig {
    id: string
    name: string
    apiUrl: string
    basePath: string
    token: string
    description?: string
    isActive: boolean
    createdAt: string
    lastConnected?: string
    status: 'connected' | 'disconnected' | 'error'
}

export interface BPMNConfigs {
    configs: BPMNConfig[]
    activeConfigId?: string
}

export interface BPMNProcessDefinition {
    id: string
    key: string
    name: string
    description?: string
    version: number
    category?: string
    deploymentId: string
    resourceName: string
    diagramResourceName?: string
    tenantId?: string
    suspended: boolean
    startableInTasklist: boolean
    startablePermissionCheck: boolean
    historyTimeToLive?: number
    createdAt: string
    updatedAt: string
}

export interface BPMNProcessInstance {
    id: string
    processDefinitionId: string
    processDefinitionKey: string
    processDefinitionName: string
    businessKey?: string
    startTime: string
    endTime?: string
    durationInMillis?: number
    startUserId?: string
    startActivityId?: string
    deleteReason?: string
    tenantId?: string
    state: 'active' | 'suspended' | 'completed' | 'terminated'
}

export interface BPMNTask {
    id: string
    name: string
    description?: string
    assignee?: string
    created: string
    due?: string
    followUp?: string
    delegationState?: string
    executionId: string
    owner?: string
    parentTaskId?: string
    priority: number
    processDefinitionId: string
    processInstanceId: string
    taskDefinitionKey: string
    caseExecutionId?: string
    caseInstanceId?: string
    caseDefinitionId?: string
    suspended: boolean
    formKey?: string
    tenantId?: string
}

export interface BPMNPageDefinition {
    id: string
    processDefinitionId: string
    processDefinitionKey: string
    taskDefinitionKey?: string
    formKey?: string
    description?: string
    isStartPage: boolean
    isTaskPage: boolean
    content: { [key: string]: string }
    createdAt: string
    updatedAt: string
}

// New BPMN Project Structure Types
export interface BPMNProjectArtifactVariable {
    artifactVariableId: string
    name: string
    type: string
    defaultValue: string
    required: boolean
}

export interface BPMNProjectArtifact {
    projectArtifactId: string
    taskKey: string
    name: string
    artifactVariables: BPMNProjectArtifactVariable[]
    subProcessTask: boolean
    subProcessId: string
    subProcessName: string
    formKey: string
    description: string
}

export interface BPMNProjectProcessDefinition {
    processDefinitionId: string
    projectId: string
    processKey: string
    code: string
    bpmnDiagramUrl?: string
    title: string
    descripiton?: string
    version?: number
    status: string
    statusDesc: string
    deploymentId?: string
    deploymentDate?: BPMNDateLike
    bpmFileContent?: string
    processArtifacts?: BPMNProjectArtifact[]
    createdBy?: BPMNAuditUser | string
    createdDate?: BPMNDateLike
    lastModifiedBy?: BPMNAuditUser | string
    lastModifiedDate?: BPMNDateLike
}

/**
 * Process Studio API serializes timestamps as Java `LocalDateTime` arrays
 * `[year, month, day, hour, minute, second, nanos]`. Some endpoints / older
 * deployments may still return ISO strings — accept either.
 */
export type BPMNDateLike = string | number[]

export interface BPMNAuditUser {
    id?: string
    username?: string
    email?: string
    firstName?: string
    lastName?: string
    fullName?: string
    sub?: string
}

export interface BPMNProject {
    projectId: string
    code: string
    name: string
    description: string
    active: boolean
    appCode?: string
    processDefinitions: BPMNProjectProcessDefinition[]
}

export interface PaginatedResponse<T> {
    pageNumber: number
    pageSize: number
    totalElements: number
    totalPages: number
    last: boolean
    first: boolean
    content: T[]
}
