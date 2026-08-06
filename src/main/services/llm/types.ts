/**
 * Shared LLM types used by every adapter (OpenRouter, CLI…).
 *
 * The renderer never imports these directly — it talks to the main process
 * through the preload `window.specLLM` bridge with serialisable payloads.
 */

export type LLMRole = 'system' | 'user' | 'assistant'

export interface LLMMessage {
    role: LLMRole
    content: string
    /** Optional name (some providers support multi-user threads). */
    name?: string
}

export interface LLMChatOptions {
    /** Model identifier as recognised by the provider, e.g. `anthropic/claude-sonnet-4.5`. */
    model: string
    temperature?: number
    maxTokens?: number
    /** Additional system instructions injected ahead of the user history. */
    systemPrompt?: string
    /** Lets the renderer cancel a running stream via AbortController. */
    signal?: AbortSignal
}

export type LLMChatChunk =
    | { type: 'delta'; content: string }
    | { type: 'tool-call'; name: string; arguments: string }
    | { type: 'usage'; promptTokens?: number; completionTokens?: number }
    | { type: 'error'; message: string; code?: string }
    | { type: 'done' }

export interface LLMModel {
    id: string
    label: string
    provider: string
    contextLength?: number
    supportsVision?: boolean
    /** Free-form note shown in the model picker (e.g. "Detected at /usr/local/bin/claude"). */
    description?: string
}

export interface LLMAdapter {
    /** Stable identifier — `openrouter`, `cli:claude`, `cli:ollama`. */
    id: string
    /** Human-readable provider name. */
    label: string
    listModels(): Promise<LLMModel[]>
    chat(messages: LLMMessage[], opts: LLMChatOptions): AsyncIterable<LLMChatChunk>
    supportsVision(): boolean
    /** Returns true when the adapter is ready (e.g. has API key / CLI present). */
    isReady(): Promise<boolean>
}

export class LLMNotConfiguredError extends Error {
    code = 'LLM_NOT_CONFIGURED'
    constructor(provider: string) {
        super(`LLM provider "${provider}" is not configured. Open Settings to set it up.`)
    }
}
