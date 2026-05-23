/**
 * Specification Data Models service.
 *
 * Owns the project's `<basePath>/data-models/` workspace:
 *   - `index.json` — the lightweight tree (EntitySummary[]).
 *   - `entities/<entityId>.json` — full Entity payload (fields, relations, layout).
 *
 * Splitting the manifest from per-entity payload keeps Git diffs small when a
 * single entity changes, and avoids parsing one growing JSON every list call.
 *
 * Mutations broadcast `spec:data:changed` so the renderer can refresh hooks.
 *
 * NOTE: the canonical Entity / Field / Relation / FieldType types are
 * duplicated from `src/renderer/src/features/data-models/types/entity.ts`
 * because the main process cannot reach renderer paths (tsconfig.node.json
 * scopes to `src/main/` and `src/preload/`). Keep both files in sync.
 */
import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import { promises as fsp } from 'node:fs'
import { dirname, join } from 'node:path'
import { BrowserWindow } from 'electron'
import { EVENTS } from '../constants/events'
import { ensureDirectoryExists } from '../helpers'
import { closeKnexConnection, createKnexConnection, getTableStructure } from '../helpers/Knex'
import { entitiesToDdl, type DdlDialect } from './data/entities-to-ddl'
import { ConnectionRepository } from './database-service'

const connectionRepo = new ConnectionRepository()

// ─── canonical types (mirror of features/data-models/types/entity.ts) ──────

export type FieldType =
    | 'string'
    | 'int'
    | 'decimal'
    | 'boolean'
    | 'date'
    | 'datetime'
    | 'json'
    | 'enum'
    | 'reference'

export interface Field {
    id: string
    name: string
    type: FieldType
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

export type RelationKind = 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many'

export interface Relation {
    id: string
    kind: RelationKind
    fromEntityId: string
    fromFieldId?: string
    toEntityId: string
    toFieldId?: string
    joinEntityId?: string
    description?: string
}

export interface NodeLayout {
    x: number
    y: number
    width?: number
    height?: number
}

export type EntitySource =
    | { kind: 'manual' }
    | { kind: 'imported'; connection: string; table: string; importedAt: string }

export interface Entity {
    id: string
    name: string
    description?: string
    fields: Field[]
    relations: Relation[]
    source: EntitySource
    layout?: NodeLayout
    createdAt: string
    updatedAt: string
}

export interface EntitySummary {
    id: string
    name: string
    source: EntitySource
    updatedAt: string
}

export interface SchemaDiff {
    entityId: string
    connection: string
    table: string
    checkedAt: string
    inSync: boolean
    /** Columns the live DB has that the spec entity lacks. */
    addedInDb: { name: string; type: string }[]
    /** Spec fields that no longer exist in the DB. */
    removedInDb: { name: string; type: FieldType }[]
    /** Columns whose type / nullable / pk differ between spec and DB. */
    changed: {
        name: string
        before: { type: FieldType; nullable: boolean; primaryKey: boolean }
        after: { type: string; nullable: boolean; primaryKey: boolean }
    }[]
}

// ─── service ───────────────────────────────────────────────────────────────

const DATA_MODELS_SUBDIR = 'data-models'
const ENTITIES_SUBDIR = 'entities'
const INDEX_FILE = 'index.json'

export interface CreateEntityInput {
    name: string
    description?: string
    fields?: Omit<Field, 'id'>[] | Field[]
    relations?: Omit<Relation, 'id' | 'fromEntityId'>[] | Relation[]
    source?: EntitySource
    layout?: NodeLayout
}

export interface UpdateEntityPatch {
    name?: string
    description?: string
    fields?: Field[]
    relations?: Relation[]
    source?: EntitySource
    layout?: NodeLayout
}

export class SpecDataService {
    async list(basePath: string): Promise<EntitySummary[]> {
        return readIndex(basePath)
    }

    async get(basePath: string, entityId: string): Promise<Entity | null> {
        return readEntity(basePath, entityId)
    }

    async create(basePath: string, input: CreateEntityInput): Promise<Entity> {
        await ensureDataDirs(basePath)
        const summaries = await readIndex(basePath)

        if (summaries.some((s) => s.name === input.name)) {
            throw new Error(`An entity named "${input.name}" already exists`)
        }

        const now = new Date().toISOString()
        const id = randomUUID()
        const entity: Entity = {
            id,
            name: input.name,
            description: input.description,
            fields: assignFieldIds(input.fields ?? []),
            relations: assignRelationIds(input.relations ?? [], id),
            source: input.source ?? { kind: 'manual' },
            layout: input.layout,
            createdAt: now,
            updatedAt: now
        }

        await writeEntity(basePath, entity)
        summaries.push(toSummary(entity))
        await writeIndex(basePath, summaries)

        broadcast()
        return entity
    }

    async update(basePath: string, entityId: string, patch: UpdateEntityPatch): Promise<Entity> {
        const current = await readEntity(basePath, entityId)
        if (!current) throw new Error(`Entity ${entityId} not found`)

        if (typeof patch.name === 'string' && patch.name !== current.name) {
            const summaries = await readIndex(basePath)
            if (summaries.some((s) => s.id !== entityId && s.name === patch.name)) {
                throw new Error(`An entity named "${patch.name}" already exists`)
            }
        }

        const next: Entity = {
            ...current,
            name: patch.name ?? current.name,
            description: patch.description ?? current.description,
            fields: patch.fields ? assignFieldIds(patch.fields) : current.fields,
            relations: patch.relations
                ? assignRelationIds(patch.relations, entityId)
                : current.relations,
            source: patch.source ?? current.source,
            layout: patch.layout ?? current.layout,
            updatedAt: new Date().toISOString()
        }

        await writeEntity(basePath, next)
        const summaries = await readIndex(basePath)
        const idx = summaries.findIndex((s) => s.id === entityId)
        if (idx >= 0) summaries[idx] = toSummary(next)
        else summaries.push(toSummary(next))
        await writeIndex(basePath, summaries)

        broadcast()
        return next
    }

    async remove(basePath: string, entityId: string): Promise<void> {
        const summaries = await readIndex(basePath)
        const nextSummaries = summaries.filter((s) => s.id !== entityId)
        if (nextSummaries.length === summaries.length) return

        // Reject if other entities reference this one. Cascade is opt-in via
        // applyOps's `cascade` flag; the plain remove path is conservative.
        for (const s of nextSummaries) {
            const other = await readEntity(basePath, s.id)
            if (!other) continue
            const referencingField = other.fields.find(
                (f) => f.type === 'reference' && f.referenceEntityId === entityId
            )
            if (referencingField) {
                throw new Error(
                    `Cannot delete: "${other.name}.${referencingField.name}" references this entity`
                )
            }
            const referencingRelation = other.relations.find(
                (r) => r.toEntityId === entityId || r.fromEntityId === entityId
            )
            if (referencingRelation) {
                throw new Error(`Cannot delete: "${other.name}" has a relation to this entity`)
            }
        }

        await fsp.unlink(entityPath(basePath, entityId)).catch(() => undefined)
        await writeIndex(basePath, nextSummaries)
        broadcast()
    }

    /**
     * Compares an imported entity against the live DB structure. Direction is
     * DB → spec only — we never write back to the database.
     */
    async diffWithDb(basePath: string, entityId: string): Promise<SchemaDiff> {
        const entity = await readEntity(basePath, entityId)
        if (!entity) throw new Error(`Entity ${entityId} not found`)
        if (entity.source.kind !== 'imported') {
            throw new Error('Entity is not linked to a database table')
        }
        const cfg = await connectionRepo.findOne(entity.source.connection)
        if (!cfg) {
            throw new Error(`Connection "${entity.source.connection}" no longer exists`)
        }
        const knex = createKnexConnection(cfg)
        let columns: any[]
        try {
            columns = await getTableStructure(knex, entity.source.table)
        } finally {
            await closeKnexConnection(knex).catch(() => undefined)
        }

        const dbByName = new Map<string, any>(columns.map((c) => [c.name.toLowerCase(), c]))
        const specByName = new Map(entity.fields.map((f) => [f.name.toLowerCase(), f]))

        const addedInDb: { name: string; type: string }[] = []
        const removedInDb: { name: string; type: FieldType }[] = []
        const changed: {
            name: string
            before: { type: FieldType; nullable: boolean; primaryKey: boolean }
            after: { type: string; nullable: boolean; primaryKey: boolean }
        }[] = []

        for (const [name, col] of dbByName) {
            if (!specByName.has(name)) {
                addedInDb.push({ name: col.name, type: col.data_type })
            }
        }
        for (const [name, field] of specByName) {
            const col = dbByName.get(name)
            if (!col) {
                removedInDb.push({ name: field.name, type: field.type })
                continue
            }
            const dbType = mapDriverTypeToCanonical(col.data_type)
            const dbNullable = col.is_nullable !== false
            const dbPk = !!col.is_primary_key
            const beforeNullable = field.nullable !== false
            const beforePk = !!field.primaryKey
            if (field.type !== dbType || beforeNullable !== dbNullable || beforePk !== dbPk) {
                changed.push({
                    name: field.name,
                    before: {
                        type: field.type,
                        nullable: beforeNullable,
                        primaryKey: beforePk
                    },
                    after: {
                        type: col.data_type,
                        nullable: dbNullable,
                        primaryKey: dbPk
                    }
                })
            }
        }

        return {
            entityId,
            connection: entity.source.connection,
            table: entity.source.table,
            checkedAt: new Date().toISOString(),
            inSync: addedInDb.length === 0 && removedInDb.length === 0 && changed.length === 0,
            addedInDb,
            removedInDb,
            changed
        }
    }

    /**
     * Imports a set of tables from a saved connection.
     *
     * Re-import policy ("smart merge"): when an entity with the same
     * `source.connection + source.table` already exists, fields originating
     * from the DB are refreshed (type, nullable, pk, default), while
     * user-added fields not in the live DB are preserved. New DB columns are
     * appended; user-renamed columns are detected by name and stay.
     *
     * Returns the imported / refreshed entities.
     */
    async importFromConnection(
        basePath: string,
        connectionName: string,
        tableNames: string[]
    ): Promise<Entity[]> {
        if (!tableNames.length) return []

        const cfg = await connectionRepo.findOne(connectionName)
        if (!cfg) throw new Error(`Connection "${connectionName}" not found`)

        const knex = createKnexConnection(cfg)
        let structures: { table: string; columns: any[] }[]
        try {
            structures = await Promise.all(
                tableNames.map(async (table) => ({
                    table,
                    columns: await getTableStructure(knex, table)
                }))
            )
        } finally {
            await closeKnexConnection(knex).catch(() => undefined)
        }

        await ensureDataDirs(basePath)
        const summaries = await readIndex(basePath)
        const now = new Date().toISOString()

        // Pre-allocate ids per imported table — needed so reference fields
        // from one imported entity to another resolve in the same batch.
        const idByTable = new Map<string, string>()
        for (const { table } of structures) {
            const existing = summaries.find(
                (s) =>
                    s.source.kind === 'imported' &&
                    s.source.connection === connectionName &&
                    s.source.table === table
            )
            idByTable.set(table, existing?.id ?? randomUUID())
        }

        const imported: Entity[] = []
        for (const { table, columns } of structures) {
            const entityId = idByTable.get(table)!
            const existing = await readEntity(basePath, entityId)

            // Build the DB-derived fields.
            const dbFields: Field[] = columns.map((col: any) => {
                const isFk = !!col.foreign_key_table
                const refTargetId = isFk ? idByTable.get(col.foreign_key_table) : undefined
                const baseField: Field = {
                    id: randomUUID(),
                    name: col.name,
                    type: isFk ? 'reference' : mapDriverTypeToCanonical(col.data_type),
                    nullable: col.is_nullable !== false,
                    primaryKey: !!col.is_primary_key,
                    unique: !!col.is_unique,
                    indexed: !!col.is_unique || !!col.is_primary_key,
                    defaultValue:
                        !col.is_primary_key && col.default_value != null
                            ? String(col.default_value)
                            : undefined,
                    description: col.comment || undefined
                }
                if (isFk) {
                    baseField.referenceEntityId = refTargetId
                }
                return baseField
            })

            // Smart merge with existing entity fields.
            const mergedFields = existing ? mergeFields(existing.fields, dbFields) : dbFields

            // Auto-derive `many-to-one` relations from FK columns.
            const dbRelations: Relation[] = columns
                .filter((c: any) => c.foreign_key_table && idByTable.has(c.foreign_key_table))
                .map((c: any) => ({
                    id: randomUUID(),
                    kind: 'many-to-one' as const,
                    fromEntityId: entityId,
                    toEntityId: idByTable.get(c.foreign_key_table)!,
                    description: `FK ${c.name} → ${c.foreign_key_table}.${c.foreign_key_column ?? 'id'}`
                }))

            const mergedRelations = existing ? existing.relations : dbRelations

            const next: Entity = {
                id: entityId,
                name: existing?.name ?? toEntityName(table),
                description: existing?.description,
                fields: mergedFields,
                relations: mergedRelations,
                source: {
                    kind: 'imported',
                    connection: connectionName,
                    table,
                    importedAt: now
                },
                layout: existing?.layout,
                createdAt: existing?.createdAt ?? now,
                updatedAt: now
            }
            await writeEntity(basePath, next)
            imported.push(next)

            const summary = toSummary(next)
            const idx = summaries.findIndex((s) => s.id === entityId)
            if (idx >= 0) summaries[idx] = summary
            else summaries.push(summary)
        }

        await writeIndex(basePath, summaries)
        broadcast()
        return imported
    }

    /**
     * Renders the project's full entity model as a single SQL script.
     * Pure read — no side effects on disk.
     */
    async exportDdl(basePath: string, dialect: DdlDialect): Promise<{ sql: string }> {
        const summaries = await readIndex(basePath)
        const fulls = await Promise.all(summaries.map((s) => readEntity(basePath, s.id)))
        const entities = fulls.filter(Boolean) as Entity[]
        return { sql: entitiesToDdl(entities, dialect) }
    }
}

export const specDataService = new SpecDataService()

// ─── import helpers ─────────────────────────────────────────────────────────

/**
 * Maps a driver column type to our canonical FieldType. Falls back to
 * `string` for anything we don't recognise — the user can refine via
 * `advancedType` later.
 */
function mapDriverTypeToCanonical(driverType: string | undefined): FieldType {
    if (!driverType) return 'string'
    const t = driverType.toLowerCase()
    if (/(^|\W)(int|integer|bigint|smallint|tinyint|mediumint|serial)/.test(t)) return 'int'
    if (/(decimal|numeric|real|double|float)/.test(t)) return 'decimal'
    if (/bool/.test(t)) return 'boolean'
    if (/timestamp|datetime/.test(t)) return 'datetime'
    if (/date/.test(t)) return 'date'
    if (/json/.test(t)) return 'json'
    return 'string'
}

function toEntityName(tableName: string): string {
    // snake_case → PascalCase
    return tableName
        .split(/[_\s]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('')
}

/**
 * Refreshes DB-coming fields (matched by name) and preserves user-added
 * fields not present in the fresh DB column set.
 */
function mergeFields(existing: Field[], fresh: Field[]): Field[] {
    const freshByName = new Map(fresh.map((f) => [f.name.toLowerCase(), f]))
    const out: Field[] = []
    const handled = new Set<string>()

    for (const ex of existing) {
        const key = ex.name.toLowerCase()
        const updated = freshByName.get(key)
        if (updated) {
            // Refresh DB-derived attributes; keep our id + description.
            out.push({
                ...ex,
                type: updated.type,
                nullable: updated.nullable,
                primaryKey: updated.primaryKey,
                unique: updated.unique,
                indexed: updated.indexed,
                defaultValue: updated.defaultValue,
                referenceEntityId: updated.referenceEntityId ?? ex.referenceEntityId
            })
            handled.add(key)
        } else {
            // Preserve user-added field that no longer exists in DB.
            out.push(ex)
        }
    }
    for (const fr of fresh) {
        if (!handled.has(fr.name.toLowerCase())) {
            out.push(fr)
        }
    }
    return out
}

// ─── helpers ───────────────────────────────────────────────────────────────

function dataModelsDir(basePath: string): string {
    return join(basePath, DATA_MODELS_SUBDIR)
}

function indexPath(basePath: string): string {
    return join(dataModelsDir(basePath), INDEX_FILE)
}

function entitiesDir(basePath: string): string {
    return join(dataModelsDir(basePath), ENTITIES_SUBDIR)
}

function entityPath(basePath: string, entityId: string): string {
    return join(entitiesDir(basePath), `${entityId}.json`)
}

async function ensureDataDirs(basePath: string): Promise<void> {
    await ensureDirectoryExists(dataModelsDir(basePath))
    await ensureDirectoryExists(entitiesDir(basePath))
}

async function readIndex(basePath: string): Promise<EntitySummary[]> {
    const file = indexPath(basePath)
    if (!fs.existsSync(file)) return []
    try {
        const raw = await fsp.readFile(file, 'utf-8')
        const parsed = JSON.parse(raw) as EntitySummary[]
        return Array.isArray(parsed) ? parsed : []
    } catch {
        return []
    }
}

async function writeIndex(basePath: string, summaries: EntitySummary[]): Promise<void> {
    await ensureDirectoryExists(dirname(indexPath(basePath)))
    await fsp.writeFile(indexPath(basePath), JSON.stringify(summaries, null, 2), 'utf-8')
}

async function readEntity(basePath: string, entityId: string): Promise<Entity | null> {
    const file = entityPath(basePath, entityId)
    if (!fs.existsSync(file)) return null
    try {
        const raw = await fsp.readFile(file, 'utf-8')
        return JSON.parse(raw) as Entity
    } catch {
        return null
    }
}

async function writeEntity(basePath: string, entity: Entity): Promise<void> {
    await ensureDirectoryExists(entitiesDir(basePath))
    await fsp.writeFile(entityPath(basePath, entity.id), JSON.stringify(entity, null, 2), 'utf-8')
}

function toSummary(entity: Entity): EntitySummary {
    return {
        id: entity.id,
        name: entity.name,
        source: entity.source,
        updatedAt: entity.updatedAt
    }
}

function assignFieldIds(fields: (Omit<Field, 'id'> | Field)[]): Field[] {
    return fields.map((f) =>
        'id' in f && f.id ? (f as Field) : { ...(f as Field), id: randomUUID() }
    )
}

function assignRelationIds(
    relations: (Omit<Relation, 'id' | 'fromEntityId'> | Relation)[],
    fromEntityId: string
): Relation[] {
    return relations.map((r) => {
        const withId =
            'id' in r && r.id ? (r as Relation) : { ...(r as Relation), id: randomUUID() }
        return withId.fromEntityId ? withId : { ...withId, fromEntityId }
    })
}

function broadcast(): void {
    for (const win of BrowserWindow.getAllWindows()) {
        if (!win.isDestroyed()) {
            win.webContents.send(EVENTS.SPEC_DATA.CHANGED)
        }
    }
}
