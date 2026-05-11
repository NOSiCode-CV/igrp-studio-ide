/// <reference types="vite/client" />
/// <reference types="react" />
/// <reference types="react-dom" />

interface ImportMetaEnv {
    readonly VITE_DEV_PORT: string
    readonly VITE_NODE_ENV: string
    readonly RENDERER_VITE_API_IGRP_VERSIONS: string
    readonly ELECTRON_RENDERER_UPDATE_SERVER: string
    readonly VITE_APP_TITLE: string

    readonly VITE_GIT_REDIRECT_URI: string

    readonly VITE_GITHUB_CLIENT_ID: string
    readonly VITE_GITHUB_CLIENT_SECRET: string
    /** Optional: Personal Access Token for GitHub API (e.g. release notes in private repo). Not the OAuth client secret. */
    readonly VITE_GITHUB_TOKEN?: string

    /** Injected from SENTRY_DSN at build (see electron.vite.config). */
    readonly VITE_SENTRY_DSN: string
    /** Set to "true" in .env to send one test event from the renderer in dev. */
    readonly VITE_SENTRY_TEST: string
    readonly VITE_GITLAB_BASE_URL: string
    readonly VITE_GITLAB_CLIENT_ID: string
    readonly VITE_GITLAB_CLIENT_SECRET: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

interface TerminalBridge {
    create: (sessionId: string, cwd?: string) => void
    send: (sessionId: string, data: string) => void
    resize: (sessionId: string, cols: number, rows: number) => void
    destroy: (sessionId: string) => void
    onData: (callback: (payload: { sessionId: string; data: string }) => void) => () => void
    onExit: (callback: (payload: { sessionId: string }) => void) => () => void
}

type MarkItDownConvertResult =
    | { ok: true; markdown: string; durationMs: number }
    | {
          ok: false
          error: string
          code?: 'unsupported' | 'too-large' | 'not-found' | 'timeout' | 'spawn' | 'runtime'
      }

interface MarkItDownHistoryEntry {
    id: string
    fileName: string
    filePath: string
    sizeBytes: number
    markdown: string
    convertedAt: number
    durationMs: number
}

interface MarkItDownBridge {
    openWindow: () => void
    pickFile: () => Promise<string | null>
    convert: (filePath: string) => Promise<MarkItDownConvertResult>
    saveMarkdown: (payload: {
        markdown: string
        suggestedName?: string
    }) => Promise<{ ok: true; path: string } | { ok: false; error?: string }>
    getFilePath: (file: File) => string
    getHistory: () => Promise<MarkItDownHistoryEntry[]>
    deleteHistoryItem: (id: string) => Promise<void>
    clearHistory: () => Promise<void>
}

type SpecKBStatus = 'pending' | 'converting' | 'indexing' | 'indexed' | 'error'
type SpecKBType =
    | 'pdf'
    | 'docx'
    | 'pptx'
    | 'xlsx'
    | 'html'
    | 'image'
    | 'audio'
    | 'url'
    | 'youtube'
    | 'other'

interface SpecKBItem {
    id: string
    name: string
    type: SpecKBType
    status: SpecKBStatus
    origin: string
    size?: number
    createdAt: string
    updatedAt: string
    chunks?: number
    error?: string
    filePath?: string
    mdPath?: string
}

interface SpecKBHit {
    id: string
    score: number
    text: string
    metadata?: Record<string, unknown>
}

interface SpecKBBridge {
    list: (basePath: string) => Promise<SpecKBItem[]>
    get: (
        basePath: string,
        itemId: string
    ) => Promise<{ item: SpecKBItem; markdown?: string } | null>
    addFile: (basePath: string, filePath: string) => Promise<SpecKBItem>
    addUrl: (basePath: string, url: string, youtube?: boolean) => Promise<SpecKBItem>
    reindex: (basePath: string, itemId: string) => Promise<SpecKBItem | null>
    remove: (basePath: string, itemId: string) => Promise<{ ok: true }>
    search: (
        basePath: string,
        query: string,
        topK?: number,
        opts?: { kbItemIds?: string[] }
    ) => Promise<SpecKBHit[]>
    onProgress: (callback: (item: SpecKBItem) => void) => () => void
    pickFile: () => Promise<string | null>
    getFilePath: (file: File) => string
}

type SpecDocNodeType = 'file' | 'folder'

interface SpecDocNode {
    id: string
    name: string
    parentId: string | null
    type: SpecDocNodeType
    createdAt: string
    updatedAt: string
    kbRefs?: string[]
}

interface SpecDocBridge {
    list: (basePath: string) => Promise<SpecDocNode[]>
    read: (
        basePath: string,
        docId: string
    ) => Promise<{ node: SpecDocNode; content: string } | null>
    create: (
        basePath: string,
        input: {
            name: string
            parentId?: string | null
            type?: SpecDocNodeType
            content?: string
        }
    ) => Promise<SpecDocNode>
    update: (
        basePath: string,
        docId: string,
        patch: { content?: string; name?: string; kbRefs?: string[] }
    ) => Promise<SpecDocNode>
    move: (basePath: string, docId: string, newParentId: string | null) => Promise<SpecDocNode>
    remove: (basePath: string, docId: string) => Promise<{ ok: true }>
    convertAndInsert: (sourcePath: string) => Promise<{ markdown: string }>
    exportDocument: (
        basePath: string,
        docId: string,
        format: 'pdf' | 'docx'
    ) => Promise<{ ok: boolean; path?: string; cancelled?: boolean }>
    onChanged: (callback: () => void) => () => void
    getFilePath: (file: File) => string
}

type SpecLLMRole = 'system' | 'user' | 'assistant'

interface SpecLLMMessage {
    role: SpecLLMRole
    content: string
}

interface SpecLLMModel {
    id: string
    label: string
    provider: string
    contextLength?: number
    supportsVision?: boolean
    description?: string
}

type SpecLLMChunk =
    | { type: 'delta'; content: string }
    | { type: 'tool-call'; name: string; arguments: string }
    | { type: 'usage'; promptTokens?: number; completionTokens?: number }
    | { type: 'error'; message: string; code?: string }
    | { type: 'done' }

interface SpecLLMProviderStatus {
    id: string
    label: string
    ready: boolean
    note?: string
}

interface SpecCLIStatus {
    found: boolean
    path?: string
    version?: string
    error?: string
}

interface SpecLLMBridge {
    statuses: () => Promise<SpecLLMProviderStatus[]>
    listModels: () => Promise<Record<string, SpecLLMModel[]>>
    chatStart: (payload: {
        requestId: string
        providerId: string
        messages: SpecLLMMessage[]
        model: string
        temperature?: number
        maxTokens?: number
        systemPrompt?: string
    }) => Promise<{ ok: true }>
    chatCancel: (requestId: string) => Promise<{ ok: true }>
    detectCLIs: () => Promise<Record<'claude' | 'ollama', SpecCLIStatus>>
    onChunk: (callback: (payload: { requestId: string; chunk: SpecLLMChunk }) => void) => () => void
}

type SpecSecretProvider = 'openrouter' | 'openai' | 'voyage'

interface SpecSecretsStatus {
    openrouter: boolean
    openai: boolean
    voyage: boolean
}

interface SpecPreferencesPatch {
    defaultLLM?: string
    defaultEmbeddings?: { provider: 'openai' | 'voyage' | 'stub'; model: string }
    cliPaths?: Record<string, string>
}

interface SpecSettingsBridge {
    getSecretsStatus: () => Promise<SpecSecretsStatus>
    setSecret: (provider: SpecSecretProvider, value: string) => Promise<SpecSecretsStatus>
    testSecret: (provider: SpecSecretProvider) => Promise<{ ok: boolean; error?: string }>
    getPreferences: () => Promise<SpecPreferencesPatch>
    setPreferences: (patch: SpecPreferencesPatch) => Promise<SpecPreferencesPatch>
}

type SpecPrototypeOpKind = 'create' | 'update' | 'delete'

interface SpecPrototypeAppliedOp {
    op: SpecPrototypeOpKind
    path: string
    bytes?: number
    created?: boolean
    skipped?: boolean
}

interface SpecPrototypeFailedOp {
    op: { op: SpecPrototypeOpKind; path: string; content?: string }
    error: string
}

type SpecPrototypeChunk =
    | { type: 'delta'; content: string }
    | { type: 'op-applied'; op: SpecPrototypeAppliedOp }
    | { type: 'op-failed'; op: SpecPrototypeFailedOp['op']; error: string }
    | { type: 'commit'; sha: string | null; summary: string }
    | { type: 'parse-error'; message: string; raw: string }
    | { type: 'error'; message: string; code?: string }
    | { type: 'done' }

interface SpecPrototypeFileEntry {
    path: string
    type: 'file' | 'folder'
}

interface SpecPrototypeDevStatus {
    running: boolean
    port: number | null
    url: string | null
    pid: number | null
    startedAt: number | null
    installing: boolean
}

interface SpecPrototypeDevLog {
    timestamp: number
    level: 'info' | 'warn' | 'error'
    line: string
}

interface SpecPrototypeSnapshot {
    hash: string
    author: string
    date: string
    message: string
}

interface SpecPrototypeBridge {
    generateStart: (payload: {
        requestId: string
        basePath: string
        userMessage: string
        specContext?: string
        lastTurnSummary?: string
        providerId: string
        model: string
    }) => Promise<{ ok: true }>
    generateCancel: (requestId: string) => Promise<{ ok: true }>
    applyOps: (
        basePath: string,
        raw: string
    ) => Promise<{ summary: string; applied: number; failed: number }>
    listFiles: (basePath: string) => Promise<SpecPrototypeFileEntry[]>
    readFile: (
        basePath: string,
        path: string
    ) => Promise<{ content: string } | null>
    readFileAt: (
        basePath: string,
        ref: string,
        path: string
    ) => Promise<{ content: string | null }>
    openFolder: (basePath: string) => Promise<{ ok: boolean; error?: string }>
    startDev: (basePath: string) => Promise<SpecPrototypeDevStatus>
    stopDev: (basePath: string) => Promise<SpecPrototypeDevStatus>
    devStatus: (basePath: string) => Promise<SpecPrototypeDevStatus>
    getDevLogBuffer: (basePath: string, limit?: number) => Promise<SpecPrototypeDevLog[]>
    listSnapshots: (basePath: string) => Promise<SpecPrototypeSnapshot[]>
    restoreSnapshot: (basePath: string, sha: string) => Promise<{ ok: true; sha: string }>
    export: (basePath: string) => Promise<{
        ok: boolean
        path?: string
        cancelled?: boolean
    }>
    openFolder: (basePath: string) => Promise<{ ok: boolean; error?: string }>
    onChunk: (
        callback: (payload: { requestId: string; chunk: SpecPrototypeChunk }) => void
    ) => () => void
    onDevLog: (
        callback: (payload: { basePath: string; entry: SpecPrototypeDevLog }) => void
    ) => () => void
    onDevStatus: (
        callback: (payload: { basePath: string; status: SpecPrototypeDevStatus }) => void
    ) => () => void
    onTreeChanged: (callback: (payload: { basePath: string }) => void) => () => void
}

// ─── Spec Data Models bridge ───────────────────────────────────────────────
// Mirrors `src/main/services/spec-data-service.ts` and
// `src/renderer/src/features/data-models/types/entity.ts` — keep in sync.

type SpecDataFieldType =
    | 'string'
    | 'int'
    | 'decimal'
    | 'boolean'
    | 'date'
    | 'datetime'
    | 'json'
    | 'enum'
    | 'reference'

interface SpecDataField {
    id: string
    name: string
    type: SpecDataFieldType
    nullable?: boolean
    primaryKey?: boolean
    unique?: boolean
    indexed?: boolean
    defaultValue?: string | number | boolean | null
    enumValues?: string[]
    referenceEntityId?: string
    referenceFieldId?: string
    description?: string
    advancedType?: string
}

type SpecDataRelationKind = 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many'

interface SpecDataRelation {
    id: string
    kind: SpecDataRelationKind
    fromEntityId: string
    fromFieldId?: string
    toEntityId: string
    toFieldId?: string
    joinEntityId?: string
    description?: string
}

interface SpecDataNodeLayout {
    x: number
    y: number
    width?: number
    height?: number
}

type SpecDataEntitySource =
    | { kind: 'manual' }
    | { kind: 'imported'; connection: string; table: string; importedAt: string }

interface SpecDataEntity {
    id: string
    name: string
    description?: string
    fields: SpecDataField[]
    relations: SpecDataRelation[]
    source: SpecDataEntitySource
    layout?: SpecDataNodeLayout
    createdAt: string
    updatedAt: string
}

interface SpecDataEntitySummary {
    id: string
    name: string
    source: SpecDataEntitySource
    updatedAt: string
}

interface SpecDataCreateInput {
    name: string
    description?: string
    fields?: SpecDataField[]
    relations?: SpecDataRelation[]
    source?: SpecDataEntitySource
    layout?: SpecDataNodeLayout
}

interface SpecDataUpdatePatch {
    name?: string
    description?: string
    fields?: SpecDataField[]
    relations?: SpecDataRelation[]
    source?: SpecDataEntitySource
    layout?: SpecDataNodeLayout
}

interface SpecDataSchemaDiff {
    entityId: string
    connection: string
    table: string
    checkedAt: string
    inSync: boolean
    addedInDb: { name: string; type: string }[]
    removedInDb: { name: string; type: SpecDataFieldType }[]
    changed: {
        name: string
        before: { type: SpecDataFieldType; nullable: boolean; primaryKey: boolean }
        after: { type: string; nullable: boolean; primaryKey: boolean }
    }[]
}

type SpecDataOpKind =
    | 'entity-create'
    | 'entity-update'
    | 'entity-delete'
    | 'relation-add'
    | 'relation-remove'

interface SpecDataAppliedOp {
    op: SpecDataOpKind
    entityId?: string
    name?: string
}

interface SpecDataApplyResult {
    summary: string
    applied: SpecDataAppliedOp[]
    failed: {
        op: { op: SpecDataOpKind } & Record<string, unknown>
        error: string
    }[]
}

type SpecDataChunk =
    | { type: 'delta'; content: string }
    | { type: 'op-applied'; op: SpecDataAppliedOp }
    | {
          type: 'op-failed'
          op: { op: SpecDataOpKind } & Record<string, unknown>
          error: string
      }
    | { type: 'summary'; summary: string }
    | { type: 'parse-error'; message: string; raw: string }
    | { type: 'error'; message: string; code?: string }
    | { type: 'done' }

interface SpecDataBridge {
    list: (basePath: string) => Promise<SpecDataEntitySummary[]>
    get: (basePath: string, entityId: string) => Promise<SpecDataEntity | null>
    create: (basePath: string, input: SpecDataCreateInput) => Promise<SpecDataEntity>
    update: (
        basePath: string,
        entityId: string,
        patch: SpecDataUpdatePatch
    ) => Promise<SpecDataEntity>
    remove: (basePath: string, entityId: string) => Promise<{ ok: true }>
    importFromDb: (
        basePath: string,
        connectionName: string,
        tables: string[]
    ) => Promise<SpecDataEntity[]>
    diffWithDb: (basePath: string, entityId: string) => Promise<SpecDataSchemaDiff>
    exportDdl: (
        basePath: string,
        dialect: 'postgresql' | 'mysql'
    ) => Promise<{ ok: boolean; path?: string; cancelled?: boolean }>
    applyOps: (basePath: string, raw: string) => Promise<SpecDataApplyResult>
    generateStart: (payload: {
        requestId: string
        basePath: string
        userMessage: string
        specContext?: string
        providerId: string
        model: string
    }) => Promise<{ ok: true }>
    generateCancel: (requestId: string) => Promise<{ ok: true }>
    onChunk: (
        callback: (payload: { requestId: string; chunk: SpecDataChunk }) => void
    ) => () => void
    onChanged: (callback: () => void) => () => void
}

interface Window {
    terminal: TerminalBridge
    markitdown: MarkItDownBridge
    specKB: SpecKBBridge
    specDoc: SpecDocBridge
    specLLM: SpecLLMBridge
    specSettings: SpecSettingsBridge
    specPrototype: SpecPrototypeBridge
    specData: SpecDataBridge
    graphql: {
        createGraphQLOperation: (
            basePath: string,
            moduleName: string,
            operation: import('./generators/api/pages/graphql/types').GraphQLOperationPayload
        ) => Promise<import('./generators/api/pages/graphql/types').GraphQLPersistedOperation>
        updateGraphQLOperation: (
            basePath: string,
            moduleName: string,
            operationId: string,
            updates: Partial<import('./generators/api/pages/graphql/types').GraphQLOperationPayload>
        ) => Promise<import('./generators/api/pages/graphql/types').GraphQLPersistedOperation>
        deleteGraphQLOperation: (
            basePath: string,
            moduleName: string,
            operationId: string
        ) => Promise<void>
        listGraphQLOperations: (
            basePath: string,
            moduleName: string
        ) => Promise<import('./generators/api/pages/graphql/types').GraphQLPersistedOperation[]>
    }
}
