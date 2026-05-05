/**
 * OpenRouter HTTP/SSE adapter.
 *
 * Streams chat completions via SSE (`stream: true` in the OpenAI-compatible
 * payload). The OpenRouter API key is read lazily from `spec-settings-service`
 * — adapter construction is cheap so we can recycle a singleton per process.
 */
import { specSettingsService } from '../spec-settings-service'
import {
    LLMNotConfiguredError,
    type LLMAdapter,
    type LLMChatChunk,
    type LLMChatOptions,
    type LLMMessage,
    type LLMModel
} from './types'

const BASE_URL = 'https://openrouter.ai/api/v1'

interface ListModelsResponse {
    data: Array<{
        id: string
        name?: string
        context_length?: number
        architecture?: { modality?: string }
    }>
}

export class OpenRouterAdapter implements LLMAdapter {
    readonly id = 'openrouter'
    readonly label = 'OpenRouter'

    private cachedModels: { ts: number; models: LLMModel[] } | null = null

    private apiKey(): string {
        const key = specSettingsService.getSecret('openrouter')
        if (!key) throw new LLMNotConfiguredError(this.id)
        return key
    }

    async isReady(): Promise<boolean> {
        return !!specSettingsService.getSecret('openrouter')
    }

    supportsVision(): boolean {
        return true
    }

    async listModels(): Promise<LLMModel[]> {
        if (this.cachedModels && Date.now() - this.cachedModels.ts < 60 * 60 * 1000) {
            return this.cachedModels.models
        }
        const res = await fetch(`${BASE_URL}/models`, {
            headers: { Authorization: `Bearer ${this.apiKey()}` }
        })
        if (!res.ok) {
            throw new Error(`OpenRouter listModels ${res.status}: ${await res.text()}`)
        }
        const json = (await res.json()) as ListModelsResponse
        const models: LLMModel[] = json.data.map((m) => ({
            id: m.id,
            label: m.name ?? m.id,
            provider: this.id,
            contextLength: m.context_length,
            supportsVision: m.architecture?.modality?.includes('image') ?? false
        }))
        this.cachedModels = { ts: Date.now(), models }
        return models
    }

    async *chat(
        messages: LLMMessage[],
        opts: LLMChatOptions
    ): AsyncIterable<LLMChatChunk> {
        const apiKey = this.apiKey()
        const fullMessages: LLMMessage[] = opts.systemPrompt
            ? [{ role: 'system', content: opts.systemPrompt }, ...messages]
            : messages

        const res = await fetch(`${BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://igrp.cv',
                'X-Title': 'IGRP Studio'
            },
            body: JSON.stringify({
                model: opts.model,
                messages: fullMessages,
                temperature: opts.temperature,
                max_tokens: opts.maxTokens,
                stream: true
            }),
            signal: opts.signal
        })

        if (!res.ok || !res.body) {
            const errText = await res.text().catch(() => res.statusText)
            yield {
                type: 'error',
                message: `OpenRouter ${res.status}: ${errText}`,
                code: `HTTP_${res.status}`
            }
            return
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        try {
            while (true) {
                const { done, value } = await reader.read()
                if (done) break
                buffer += decoder.decode(value, { stream: true })

                // SSE frames are separated by blank lines.
                const frames = buffer.split('\n\n')
                buffer = frames.pop() ?? ''

                for (const frame of frames) {
                    const lines = frame
                        .split('\n')
                        .filter((l) => l.startsWith('data:'))
                        .map((l) => l.slice(5).trim())
                    if (lines.length === 0) continue
                    for (const data of lines) {
                        if (data === '[DONE]') {
                            yield { type: 'done' }
                            return
                        }
                        if (!data) continue
                        try {
                            const json = JSON.parse(data)
                            const delta = json?.choices?.[0]?.delta?.content
                            if (typeof delta === 'string' && delta.length > 0) {
                                yield { type: 'delta', content: delta }
                            }
                            const usage = json?.usage
                            if (usage) {
                                yield {
                                    type: 'usage',
                                    promptTokens: usage.prompt_tokens,
                                    completionTokens: usage.completion_tokens
                                }
                            }
                        } catch {
                            // Ignore malformed JSON frames; OpenRouter sometimes
                            // emits keep-alive comments.
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock()
        }

        yield { type: 'done' }
    }
}

export const openRouterAdapter = new OpenRouterAdapter()
