export type SpecificationTab =
    | 'documents'
    | 'knowledge-base'
    | 'data'
    | 'prototype'
    | 'processes'

export interface SpecificationProject {
    id: string
    name: string
    description: string
    createdAt: string
    updatedAt: string
    settings: SpecificationSettings
}

export interface SpecificationSettings {
    defaultLLM: {
        provider: 'openrouter' | 'cli'
        model: string
    }
    embeddings: {
        provider: 'openai' | 'voyage' | 'local'
        model: string
    }
    systemPrompt?: string
}

export interface KBItem {
    id: string
    source: string
    mdPath?: string
    type: 'pdf' | 'docx' | 'pptx' | 'xlsx' | 'html' | 'image' | 'audio' | 'url' | 'youtube' | 'other'
    status: 'pending' | 'converting' | 'indexing' | 'indexed' | 'error'
    chunks?: number
    error?: string
}

export interface SpecDocument {
    id: string
    title: string
    path: string
    folder?: string
    syncedToKB: boolean
    updatedAt: string
}

export type ChatScope = 'main' | 'prototype'

export interface ChatMessage {
    id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    attachments?: ChatAttachment[]
    context?: { kbRefs?: string[]; docRefs?: string[] }
    model?: string
    timestamp: string
}

export interface ChatAttachment {
    type: 'image' | 'file'
    path: string
    mdPath?: string
    label?: string
}

export interface PrototypeFileOp {
    op: 'create' | 'update' | 'delete'
    path: string
    summary?: string
}

export interface PrototypeSnapshot {
    id: string
    timestamp: string
    message: string
    ops: PrototypeFileOp[]
}
