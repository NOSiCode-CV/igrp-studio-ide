/**
 * LLM router — single entry point for the renderer.
 *
 * The renderer addresses providers via a stable id (`openrouter`, `cli:claude`,
 * `cli:ollama`). The router fans out to the right adapter, hides credential
 * lookups and exposes a simple `listAllModels` for the model picker.
 */
import { cliAdapters } from './cli-llm-service'
import { openRouterAdapter } from './openrouter-service'
import {
    LLMNotConfiguredError,
    type LLMAdapter,
    type LLMChatChunk,
    type LLMChatOptions,
    type LLMMessage,
    type LLMModel
} from './types'

export interface ProviderStatus {
    id: string
    label: string
    ready: boolean
    note?: string
}

class LLMRouter {
    private readonly adapters = new Map<string, LLMAdapter>()

    constructor() {
        this.register(openRouterAdapter)
        this.register(cliAdapters.claude)
        this.register(cliAdapters.ollama)
    }

    register(adapter: LLMAdapter): void {
        this.adapters.set(adapter.id, adapter)
    }

    get(id: string): LLMAdapter {
        const adapter = this.adapters.get(id)
        if (!adapter) throw new LLMNotConfiguredError(id)
        return adapter
    }

    listProviders(): LLMAdapter[] {
        return Array.from(this.adapters.values())
    }

    async statuses(): Promise<ProviderStatus[]> {
        return Promise.all(
            this.listProviders().map(async (adapter) => ({
                id: adapter.id,
                label: adapter.label,
                ready: await adapter.isReady().catch(() => false)
            }))
        )
    }

    /**
     * Aggregates models from every ready provider — used by the renderer's
     * model picker. Errors per-provider are swallowed (we just skip that
     * group) so a single broken provider doesn't blank the picker.
     */
    async listAllModels(): Promise<Record<string, LLMModel[]>> {
        const out: Record<string, LLMModel[]> = {}
        for (const adapter of this.listProviders()) {
            try {
                const ready = await adapter.isReady()
                if (!ready) {
                    out[adapter.id] = []
                    continue
                }
                out[adapter.id] = await adapter.listModels()
            } catch (err) {
                console.warn(`[llm] listModels failed for ${adapter.id}:`, err)
                out[adapter.id] = []
            }
        }
        return out
    }

    chat(
        providerId: string,
        messages: LLMMessage[],
        opts: LLMChatOptions
    ): AsyncIterable<LLMChatChunk> {
        return this.get(providerId).chat(messages, opts)
    }
}

export const llmRouter = new LLMRouter()
