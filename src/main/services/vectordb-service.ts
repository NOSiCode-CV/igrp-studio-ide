/**
 * VectorDB service backed by LanceDB.
 *
 * One collection per Specification project, stored under
 * `<basePath>/vectors/<collectionName>.lance`. Collections are created on first
 * use using the embedding dimension provided by the caller (so the same
 * service can host different embedding models across projects).
 *
 * The `@lancedb/lancedb` package ships native binaries per platform — it is
 * lazy-loaded so that the rest of the main process keeps booting if the
 * binary fails to load on an unsupported platform.
 */
import { join } from 'node:path'
import { ensureDirectoryExists } from '../helpers'

export interface VectorRow {
    id: string
    vector: number[]
    text: string
    /** JSON-serialisable metadata (kbItemId, chunkIndex, source…) */
    metadata?: Record<string, unknown>
}

export interface VectorHit {
    id: string
    score: number
    text: string
    metadata?: Record<string, unknown>
}

interface CollectionHandle {
    table: any
    dim: number
}

const DEFAULT_COLLECTION = 'kb'

let lancedb: typeof import('@lancedb/lancedb') | null = null
let lancedbLoadError: Error | null = null

async function loadLanceDB(): Promise<typeof import('@lancedb/lancedb')> {
    if (lancedb) return lancedb
    if (lancedbLoadError) throw lancedbLoadError
    try {
        // Lazy require — keeps the main process boot-safe on platforms where
        // the native binary is missing.
        lancedb = await import('@lancedb/lancedb')
        return lancedb
    } catch (err) {
        lancedbLoadError = err instanceof Error ? err : new Error(String(err))
        throw lancedbLoadError
    }
}

export class VectorDBService {
    private readonly cache = new Map<string, CollectionHandle>()

    private cacheKey(basePath: string, collection: string): string {
        return `${basePath}::${collection}`
    }

    /**
     * Open (or create) a project's collection. `dim` is the embedding
     * dimension; on first call it stamps the schema, subsequent calls validate
     * compatibility.
     */
    async openCollection(
        basePath: string,
        dim: number,
        collection = DEFAULT_COLLECTION
    ): Promise<void> {
        const lib = await loadLanceDB()
        const dbPath = join(basePath, 'vectors')
        await ensureDirectoryExists(dbPath)

        const db = await lib.connect(dbPath)
        const tables = await db.tableNames()

        let table: any
        if (tables.includes(collection)) {
            table = await db.openTable(collection)
        } else {
            // Seed with a single dummy row so LanceDB infers the schema; we
            // delete it immediately so the collection starts empty.
            const seedId = `__seed_${Date.now()}__`
            const seedVector = new Array(dim).fill(0)
            table = await db.createTable(collection, [
                {
                    id: seedId,
                    vector: seedVector,
                    text: '',
                    metadata: ''
                }
            ])
            await table.delete(`id = '${seedId}'`)
        }

        this.cache.set(this.cacheKey(basePath, collection), { table, dim })
    }

    private async getTable(
        basePath: string,
        dim: number,
        collection = DEFAULT_COLLECTION
    ): Promise<CollectionHandle> {
        const key = this.cacheKey(basePath, collection)
        const cached = this.cache.get(key)
        if (cached) {
            if (cached.dim !== dim) {
                throw new Error(
                    `Vector dimension mismatch on collection "${collection}": stored=${cached.dim}, requested=${dim}. Recreate the collection if the embeddings model changed.`
                )
            }
            return cached
        }
        await this.openCollection(basePath, dim, collection)
        return this.cache.get(key) as CollectionHandle
    }

    async upsert(
        basePath: string,
        rows: VectorRow[],
        opts: { dim: number; collection?: string } = { dim: 0 }
    ): Promise<void> {
        if (rows.length === 0) return
        const dim = opts.dim || rows[0].vector.length
        const handle = await this.getTable(basePath, dim, opts.collection)

        const ids = rows.map((r) => `'${r.id.replace(/'/g, "''")}'`).join(',')
        // Idempotent upsert: delete existing rows with same ids, then add.
        await handle.table.delete(`id IN (${ids})`)
        await handle.table.add(
            rows.map((r) => ({
                id: r.id,
                vector: r.vector,
                text: r.text,
                metadata: JSON.stringify(r.metadata ?? {})
            }))
        )
    }

    async query(
        basePath: string,
        vector: number[],
        topK = 8,
        opts: { collection?: string } = {}
    ): Promise<VectorHit[]> {
        const handle = await this.getTable(basePath, vector.length, opts.collection)
        const results = await handle.table.search(vector).limit(topK).toArray()
        return results.map((row: any) => ({
            id: row.id,
            // LanceDB returns `_distance` (lower is better). Convert to a
            // similarity-style score in [0, 1] via 1 / (1 + d).
            score: typeof row._distance === 'number' ? 1 / (1 + row._distance) : 0,
            text: row.text,
            metadata: tryParseJson(row.metadata)
        }))
    }

    async drop(
        basePath: string,
        ids: string[],
        opts: { dim?: number; collection?: string } = {}
    ): Promise<void> {
        if (ids.length === 0) return
        const collection = opts.collection ?? DEFAULT_COLLECTION
        const cacheKey = this.cacheKey(basePath, collection)
        const cached = this.cache.get(cacheKey)
        if (!cached) {
            // Open without knowing the dim: peek tables and infer from schema.
            const lib = await loadLanceDB()
            const db = await lib.connect(join(basePath, 'vectors'))
            const tables = await db.tableNames()
            if (!tables.includes(collection)) return
            const table = await db.openTable(collection)
            const escaped = ids.map((id) => `'${id.replace(/'/g, "''")}'`).join(',')
            await table.delete(`id IN (${escaped})`)
            return
        }
        const escaped = ids.map((id) => `'${id.replace(/'/g, "''")}'`).join(',')
        await cached.table.delete(`id IN (${escaped})`)
    }

    /** Drops the entire collection (used by spec-kb-service.removeItem cascade). */
    async dropCollection(
        basePath: string,
        collection = DEFAULT_COLLECTION
    ): Promise<void> {
        const lib = await loadLanceDB()
        const db = await lib.connect(join(basePath, 'vectors'))
        const tables = await db.tableNames()
        if (tables.includes(collection)) {
            await db.dropTable(collection)
        }
        this.cache.delete(this.cacheKey(basePath, collection))
    }
}

function tryParseJson(value: unknown): Record<string, unknown> | undefined {
    if (typeof value !== 'string' || value.length === 0) return undefined
    try {
        return JSON.parse(value)
    } catch {
        return undefined
    }
}

/** Singleton — main process keeps a single instance with a per-project cache. */
export const vectorDBService = new VectorDBService()
