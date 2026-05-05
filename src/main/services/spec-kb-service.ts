/**
 * Specification Knowledge Base service.
 *
 * Owns the full ingestion pipeline:
 *   add-source → MarkItDown convert → chunker → embeddings → LanceDB upsert.
 *
 * State of record is `<basePath>/kb/index.json` (a list of KBItem). Original
 * source files live in `<basePath>/kb/files/`, the converted markdown in
 * `<basePath>/kb/markdown/`. Vector storage is handled by VectorDBService
 * under `<basePath>/vectors/`.
 *
 * Status transitions are emitted as `spec:kb:progress` events on the supplied
 * BrowserWindow so the renderer can update the list in real-time.
 */
import fs from 'node:fs'
import { promises as fsp } from 'node:fs'
import { extname, join, basename } from 'node:path'
import { randomUUID } from 'node:crypto'
import { BrowserWindow } from 'electron'
import { EVENTS } from '../constants/events'
import { ensureDirectoryExists } from '../helpers'
import { convertFileToMarkdown } from '../helpers/markitdown/runner'
import { chunkMarkdown } from './chunker'
import { embeddingsService, MissingEmbeddingsKeyError } from './embeddings-service'
import { vectorDBService } from './vectordb-service'

export type KBItemStatus = 'pending' | 'converting' | 'indexing' | 'indexed' | 'error'
export type KBItemType =
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

export interface KBItem {
    id: string
    name: string
    type: KBItemType
    status: KBItemStatus
    origin: string
    size?: number
    createdAt: string
    updatedAt: string
    chunks?: number
    error?: string
    filePath?: string
    mdPath?: string
}

export type KBSource =
    | { kind: 'file'; filePath: string }
    | { kind: 'url'; url: string }
    | { kind: 'youtube'; url: string }

interface PipelineContext {
    basePath: string
    item: KBItem
}

const KB_SUBDIR = 'kb'
const FILES_SUBDIR = 'files'
const MARKDOWN_SUBDIR = 'markdown'
const INDEX_FILE = 'index.json'

export class SpecKBService {
    /** List all KB items for a project. */
    async list(basePath: string): Promise<KBItem[]> {
        return readIndex(basePath)
    }

    /** Read a single item with optional markdown content. */
    async get(
        basePath: string,
        itemId: string
    ): Promise<{ item: KBItem; markdown?: string } | null> {
        const items = await readIndex(basePath)
        const item = items.find((i) => i.id === itemId)
        if (!item) return null
        let markdown: string | undefined
        if (item.mdPath && fs.existsSync(item.mdPath)) {
            markdown = await fsp.readFile(item.mdPath, 'utf-8')
        }
        return { item, markdown }
    }

    /** Add a source and run the full pipeline. Returns the initial item; progress events follow. */
    async addSource(basePath: string, source: KBSource): Promise<KBItem> {
        const item = await this.createItem(basePath, source)
        // Fire-and-forget pipeline; progress events stream to the renderer.
        void this.runPipeline({ basePath, item }).catch((err) => {
            console.error('[spec-kb] pipeline failed', err)
        })
        return item
    }

    /** Re-run the pipeline for an existing item. */
    async reindex(basePath: string, itemId: string): Promise<KBItem | null> {
        const items = await readIndex(basePath)
        const item = items.find((i) => i.id === itemId)
        if (!item) return null
        const refreshed: KBItem = {
            ...item,
            status: 'pending',
            error: undefined,
            updatedAt: new Date().toISOString()
        }
        await writeItem(basePath, refreshed)
        emit(refreshed)
        void this.runPipeline({ basePath, item: refreshed }).catch((err) => {
            console.error('[spec-kb] reindex failed', err)
        })
        return refreshed
    }

    /** Removes the item, its files and its vector rows. */
    async remove(basePath: string, itemId: string): Promise<void> {
        const items = await readIndex(basePath)
        const item = items.find((i) => i.id === itemId)
        if (!item) return

        // 1. Drop vectors. We don't know individual chunk ids without
        // re-chunking, so we use a metadata filter via the LanceDB SQL `WHERE`
        // executed inside the service. As a pragmatic fallback, since chunk
        // ids are deterministic from `kbItemId|index|text`, we can't enumerate
        // them here — instead we drop by the kbItemId metadata column. The
        // VectorDBService doesn't expose that yet, so we re-derive ids from
        // the markdown file when possible; otherwise we accept orphaned rows
        // until reconcile().
        if (item.mdPath && fs.existsSync(item.mdPath)) {
            const md = await fsp.readFile(item.mdPath, 'utf-8')
            const chunks = chunkMarkdown(item.id, md)
            await vectorDBService.drop(
                basePath,
                chunks.map((c) => c.id)
            )
        }

        // 2. Delete physical files.
        if (item.filePath && fs.existsSync(item.filePath)) {
            await fsp.unlink(item.filePath).catch(() => undefined)
        }
        if (item.mdPath && fs.existsSync(item.mdPath)) {
            await fsp.unlink(item.mdPath).catch(() => undefined)
        }

        // 3. Update index.
        const next = items.filter((i) => i.id !== itemId)
        await writeIndex(basePath, next)
    }

    /**
     * Semantic search over the project's KB.
     *
     * When `kbItemIds` is provided, results are filtered to chunks belonging
     * to those KB items only — used by the AI Assistant to ground answers in
     * the items the user has linked to the active document.
     *
     * Filtering happens client-side because chunks store metadata as a JSON
     * string in LanceDB (no native column to push the predicate down). To
     * avoid losing relevant chunks we over-fetch and then prune. Acceptable
     * because typical KB sizes are small; if it grows we'll move metadata
     * to dedicated columns and use `where`.
     */
    async search(
        basePath: string,
        query: string,
        topK = 8,
        opts: { kbItemIds?: string[] } = {}
    ): Promise<
        Array<{ id: string; score: number; text: string; metadata?: Record<string, unknown> }>
    > {
        const adapter = await embeddingsService.getAdapter()
        const [vector] = await adapter.embed([query])

        if (opts.kbItemIds && opts.kbItemIds.length > 0) {
            const ids = new Set(opts.kbItemIds)
            const overFetch = Math.max(topK * 6, 32)
            const all = await vectorDBService.query(basePath, vector, overFetch)
            return all
                .filter((hit) => {
                    const owner = hit.metadata?.kbItemId
                    return typeof owner === 'string' && ids.has(owner)
                })
                .slice(0, topK)
        }
        return vectorDBService.query(basePath, vector, topK)
    }

    // ─── pipeline ──────────────────────────────────────────────────────────

    private async createItem(basePath: string, source: KBSource): Promise<KBItem> {
        await ensureKBDirs(basePath)
        const id = randomUUID()
        const now = new Date().toISOString()

        let name: string
        let type: KBItemType
        let origin: string
        let filePath: string | undefined
        let size: number | undefined

        if (source.kind === 'file') {
            const src = source.filePath
            if (!fs.existsSync(src)) throw new Error(`File not found: ${src}`)
            name = basename(src)
            const ext = extname(src).toLowerCase().replace(/^\./, '')
            type = mapExtensionToType(ext)
            origin = src
            const dest = join(basePath, KB_SUBDIR, FILES_SUBDIR, `${id}.${ext || 'bin'}`)
            await fsp.copyFile(src, dest)
            filePath = dest
            size = (await fsp.stat(dest)).size
        } else if (source.kind === 'youtube') {
            name = source.url
            type = 'youtube'
            origin = source.url
        } else {
            name = source.url
            type = 'url'
            origin = source.url
        }

        const item: KBItem = {
            id,
            name,
            type,
            status: 'pending',
            origin,
            size,
            createdAt: now,
            updatedAt: now,
            filePath
        }
        await writeItem(basePath, item)
        emit(item)
        return item
    }

    private async runPipeline(ctx: PipelineContext): Promise<void> {
        try {
            await this.convert(ctx)
            await this.indexItem(ctx)
            await this.transition(ctx, { status: 'indexed' })
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err)
            const code =
                err instanceof MissingEmbeddingsKeyError ? 'MISSING_EMBEDDINGS_KEY' : undefined
            await this.transition(ctx, {
                status: 'error',
                error: code ? `${code}: ${message}` : message
            })
        }
    }

    private async convert(ctx: PipelineContext): Promise<void> {
        await this.transition(ctx, { status: 'converting' })
        const { basePath, item } = ctx
        let markdown = ''
        if (item.filePath) {
            const result = await convertFileToMarkdown(item.filePath)
            if (!result.ok) {
                throw new Error(`MarkItDown failed: ${result.error}`)
            }
            markdown = result.markdown
        } else if (item.type === 'url' || item.type === 'youtube') {
            // Phase 1: persist the URL itself; URL/YouTube ingestion via
            // MarkItDown will plug in here (it accepts URLs natively).
            markdown = `# ${item.name}\n\n[Source](${item.origin})\n`
        }
        const mdPath = join(basePath, KB_SUBDIR, MARKDOWN_SUBDIR, `${item.id}.md`)
        await fsp.writeFile(mdPath, markdown, 'utf-8')
        ctx.item = { ...item, mdPath }
        await writeItem(basePath, ctx.item)
    }

    private async indexItem(ctx: PipelineContext): Promise<void> {
        await this.transition(ctx, { status: 'indexing' })
        const { basePath, item } = ctx
        if (!item.mdPath) throw new Error('Markdown path missing — convert step likely failed')

        const markdown = await fsp.readFile(item.mdPath, 'utf-8')
        const chunks = chunkMarkdown(item.id, markdown)
        if (chunks.length === 0) {
            await this.transition(ctx, { status: 'indexed', chunks: 0 })
            return
        }

        const adapter = await embeddingsService.getAdapter()
        const vectors = await batchedEmbed(
            adapter,
            chunks.map((c) => c.text)
        )

        await vectorDBService.upsert(
            basePath,
            chunks.map((chunk, idx) => ({
                id: chunk.id,
                vector: vectors[idx],
                text: chunk.text,
                metadata: chunk.metadata
            })),
            { dim: adapter.dim() }
        )

        ctx.item = { ...item, chunks: chunks.length }
        await writeItem(basePath, ctx.item)
    }

    private async transition(
        ctx: PipelineContext,
        patch: Partial<Pick<KBItem, 'status' | 'error' | 'chunks'>>
    ): Promise<void> {
        const next: KBItem = {
            ...ctx.item,
            ...patch,
            updatedAt: new Date().toISOString()
        }
        ctx.item = next
        await writeItem(ctx.basePath, next)
        emit(next)
    }
}

// ─── helpers ───────────────────────────────────────────────────────────────

async function batchedEmbed(
    adapter: { embed: (texts: string[]) => Promise<number[][]> },
    texts: string[],
    batchSize = 32
): Promise<number[][]> {
    const out: number[][] = []
    for (let i = 0; i < texts.length; i += batchSize) {
        const slice = texts.slice(i, i + batchSize)
        const vectors = await adapter.embed(slice)
        out.push(...vectors)
    }
    return out
}

async function ensureKBDirs(basePath: string): Promise<void> {
    await ensureDirectoryExists(join(basePath, KB_SUBDIR, FILES_SUBDIR))
    await ensureDirectoryExists(join(basePath, KB_SUBDIR, MARKDOWN_SUBDIR))
}

function indexPath(basePath: string): string {
    return join(basePath, KB_SUBDIR, INDEX_FILE)
}

async function readIndex(basePath: string): Promise<KBItem[]> {
    const file = indexPath(basePath)
    if (!fs.existsSync(file)) return []
    try {
        const raw = await fsp.readFile(file, 'utf-8')
        const parsed = JSON.parse(raw) as KBItem[]
        return Array.isArray(parsed) ? parsed : []
    } catch {
        return []
    }
}

async function writeIndex(basePath: string, items: KBItem[]): Promise<void> {
    await ensureKBDirs(basePath)
    await fsp.writeFile(indexPath(basePath), JSON.stringify(items, null, 2), 'utf-8')
}

async function writeItem(basePath: string, item: KBItem): Promise<void> {
    const items = await readIndex(basePath)
    const idx = items.findIndex((i) => i.id === item.id)
    if (idx >= 0) items[idx] = item
    else items.push(item)
    await writeIndex(basePath, items)
}

function emit(item: KBItem): void {
    for (const win of BrowserWindow.getAllWindows()) {
        win.webContents.send(EVENTS.SPEC_KB.PROGRESS, item)
    }
}

const EXT_MAP: Record<string, KBItemType> = {
    pdf: 'pdf',
    docx: 'docx',
    doc: 'docx',
    pptx: 'pptx',
    ppt: 'pptx',
    xlsx: 'xlsx',
    xls: 'xlsx',
    html: 'html',
    htm: 'html',
    png: 'image',
    jpg: 'image',
    jpeg: 'image',
    gif: 'image',
    webp: 'image',
    mp3: 'audio',
    wav: 'audio',
    m4a: 'audio',
    flac: 'audio'
}

function mapExtensionToType(ext: string): KBItemType {
    return EXT_MAP[ext] ?? 'other'
}

export const specKBService = new SpecKBService()
