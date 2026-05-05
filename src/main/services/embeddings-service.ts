/**
 * Embeddings service for the Specification Knowledge Base.
 *
 * Adapter pattern — same shape as the future LLMRouter (M2). Initial
 * implementation: OpenAI (`text-embedding-3-small` by default).
 *
 * The OpenAI API key is read from Electron `safeStorage` (configured via
 * Settings — M2). When the key is missing AND `IGRP_SPEC_DEV_EMBEDDINGS=1`
 * is set, a deterministic stub adapter is used instead so the rest of the
 * KB pipeline (chunker → upsert → query) can be exercised in development
 * without burning tokens.
 */
import { createHash } from 'node:crypto'
import { app } from 'electron'
import { specSettingsService } from './spec-settings-service'

export interface EmbeddingsAdapter {
    id(): string
    dim(): number
    embed(texts: string[]): Promise<number[][]>
}

export class MissingEmbeddingsKeyError extends Error {
    code = 'MISSING_EMBEDDINGS_KEY'
    constructor(provider: string) {
        super(`Embeddings provider "${provider}" requires an API key. Configure it in Settings.`)
    }
}

/**
 * OpenAI embeddings via REST. Uses `fetch` (Node ≥18, available in Electron
 * main). Streaming is unnecessary for embeddings.
 */
class OpenAIEmbeddings implements EmbeddingsAdapter {
    private readonly model: string
    private readonly dimension: number
    private readonly apiKey: string

    constructor(apiKey: string, model = 'text-embedding-3-small') {
        this.apiKey = apiKey
        this.model = model
        // text-embedding-3-small=1536, text-embedding-3-large=3072
        this.dimension = model.endsWith('large') ? 3072 : 1536
    }

    id(): string {
        return `openai:${this.model}`
    }

    dim(): number {
        return this.dimension
    }

    async embed(texts: string[]): Promise<number[][]> {
        if (texts.length === 0) return []
        const res = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({ model: this.model, input: texts })
        })
        if (!res.ok) {
            const errText = await res.text().catch(() => res.statusText)
            throw new Error(`OpenAI embeddings ${res.status}: ${errText}`)
        }
        const json = (await res.json()) as { data: { embedding: number[] }[] }
        return json.data.map((d) => d.embedding)
    }
}

/**
 * Deterministic stub used in development when no key is configured. Builds a
 * 1536-dim vector by hashing the input — enough to validate the upsert/query
 * pipeline locally without calling OpenAI.
 */
class StubEmbeddings implements EmbeddingsAdapter {
    constructor(private readonly dimension = 1536) {}

    id(): string {
        return `stub:dim-${this.dimension}`
    }

    dim(): number {
        return this.dimension
    }

    async embed(texts: string[]): Promise<number[][]> {
        return texts.map((text) => this.hashToVector(text))
    }

    private hashToVector(text: string): number[] {
        const out = new Array<number>(this.dimension)
        let seed = createHash('sha256').update(text).digest()
        for (let i = 0; i < this.dimension; i++) {
            if (i > 0 && i % seed.length === 0) {
                seed = createHash('sha256').update(seed).digest()
            }
            // map byte to [-1, 1]
            out[i] = (seed[i % seed.length] / 127.5) - 1
        }
        return out
    }
}

/** Resolves the active embeddings adapter based on saved settings. */
export class EmbeddingsService {
    private cached: EmbeddingsAdapter | null = null
    private cachedKey = ''

    /**
     * Returns the active adapter, building it on demand. Throws
     * `MissingEmbeddingsKeyError` when OpenAI is selected but no key is stored
     * (unless dev stub is enabled).
     */
    async getAdapter(
        opts: { provider?: 'openai' | 'stub'; model?: string } = {}
    ): Promise<EmbeddingsAdapter> {
        const provider = opts.provider ?? defaultProvider()
        const model = opts.model ?? 'text-embedding-3-small'
        const cacheKey = `${provider}|${model}`
        if (this.cached && this.cachedKey === cacheKey) return this.cached

        let adapter: EmbeddingsAdapter
        if (provider === 'stub') {
            adapter = new StubEmbeddings()
        } else {
            const apiKey = readOpenAIKey()
            if (!apiKey) {
                // Auto-fallback to stub in development so the KB pipeline can
                // be exercised without an OpenAI key. In production builds we
                // surface a clear error so the user knows to configure one.
                if (isDevEmbeddingsAllowed()) {
                    console.warn(
                        '[embeddings] No OpenAI key found — falling back to stub adapter (dev only). Configure OPENAI_API_KEY or Settings to use real embeddings.'
                    )
                    adapter = new StubEmbeddings()
                } else {
                    throw new MissingEmbeddingsKeyError('openai')
                }
            } else {
                adapter = new OpenAIEmbeddings(apiKey, model)
            }
        }

        this.cached = adapter
        this.cachedKey = cacheKey
        return adapter
    }

    /** Force rebuild on next call (e.g. after Settings updates the key). */
    invalidate(): void {
        this.cached = null
        this.cachedKey = ''
    }
}

function defaultProvider(): 'openai' | 'stub' {
    return process.env.IGRP_SPEC_DEV_EMBEDDINGS === '1' ? 'stub' : 'openai'
}

/**
 * Allows the stub embeddings adapter as a fallback when the OpenAI key is
 * absent. True in dev (and via the explicit env flag) so contributors can
 * exercise the pipeline without an API key. False in production builds.
 */
function isDevEmbeddingsAllowed(): boolean {
    if (process.env.IGRP_SPEC_DEV_EMBEDDINGS === '1') return true
    if (process.env.NODE_ENV !== 'production') return true
    try {
        if (!app.isPackaged) return true
    } catch {
        // app may not be ready in some edge cases — fall through.
    }
    return false
}

function readOpenAIKey(): string | null {
    return specSettingsService.getSecret('openai') ?? null
}

export const embeddingsService = new EmbeddingsService()
