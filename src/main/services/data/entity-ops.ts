/**
 * Entity-ops contract for the Data Models AI Assistant.
 *
 * The LLM emits one fenced JSON block describing the changes to apply to
 * the project's entity store. Parsing is tolerant (LLMs occasionally wrap
 * the JSON in prose); validation is strict (UUIDs only for cross-references,
 * canonical field types, cascade rules).
 *
 * Output schema:
 *
 * ```json
 * {
 *   "summary": "Add Order, OrderItem and link to existing Customer",
 *   "ops": [
 *     { "op": "entity-create", "name": "Order", "fields": [...] },
 *     { "op": "entity-update", "id": "<uuid>", "patch": { "name": "...", "fields": [...] } },
 *     { "op": "entity-delete", "id": "<uuid>", "cascade": false },
 *     { "op": "relation-add", "from": "OrderItem.orderId", "to": "Order.id", "kind": "many-to-one" },
 *     { "op": "relation-remove", "id": "<relationId>" }
 *   ]
 * }
 * ```
 *
 * Apply happens by delegating to `specDataService` CRUD methods so the
 * broadcast/index/file layout stay consistent with manual edits.
 */
import { randomUUID } from 'node:crypto'
import {
    type Entity,
    type Field,
    type FieldType,
    type Relation,
    type RelationKind,
    specDataService
} from '../spec-data-service'

const CANONICAL_TYPES: ReadonlySet<FieldType> = new Set([
    'string',
    'int',
    'decimal',
    'boolean',
    'date',
    'datetime',
    'json',
    'enum',
    'reference'
])

const RELATION_KINDS: ReadonlySet<RelationKind> = new Set([
    'one-to-one',
    'one-to-many',
    'many-to-one',
    'many-to-many'
])

export type EntityOp =
    | EntityCreateOp
    | EntityUpdateOp
    | EntityDeleteOp
    | RelationAddOp
    | RelationRemoveOp

export interface EntityCreateOp {
    op: 'entity-create'
    name: string
    description?: string
    fields?: Partial<Field>[]
}

export interface EntityUpdateOp {
    op: 'entity-update'
    id: string
    patch: {
        name?: string
        description?: string
        fields?: Partial<Field>[]
    }
}

export interface EntityDeleteOp {
    op: 'entity-delete'
    id: string
    cascade?: boolean
}

export interface RelationAddOp {
    op: 'relation-add'
    /** Either `EntityName` or `EntityName.fieldName`. */
    from: string
    /** Either `EntityName` or `EntityName.fieldName`. */
    to: string
    kind: RelationKind
    description?: string
}

export interface RelationRemoveOp {
    op: 'relation-remove'
    id: string
}

export interface EntityOpsPayload {
    summary: string
    ops: EntityOp[]
}

export interface AppliedEntityOp {
    op: EntityOp['op']
    entityId?: string
    name?: string
}

export class EntityOpsParseError extends Error {
    code = 'ENTITY_OPS_PARSE_ERROR'
}

// ─── Parsing ────────────────────────────────────────────────────────────────

export function parseEntityOps(raw: string): EntityOpsPayload {
    const candidates = collectJSONCandidates(raw)
    const errors: string[] = []
    for (const candidate of candidates) {
        try {
            return validatePayload(JSON.parse(candidate))
        } catch (err) {
            errors.push(err instanceof Error ? err.message : String(err))
        }
    }
    throw new EntityOpsParseError(
        errors.length > 0
            ? `Could not parse entity ops: ${errors[errors.length - 1]}`
            : 'Could not find a JSON block matching the entity-ops schema in the assistant reply.'
    )
}

function collectJSONCandidates(raw: string): string[] {
    const out: string[] = []
    const trimmed = raw.trim()
    if (!trimmed) return out

    const fenceRegex = /```(?:json)?\n([\s\S]*?)\n```/g
    let match: RegExpExecArray | null
    // eslint-disable-next-line no-cond-assign
    while ((match = fenceRegex.exec(trimmed)) !== null) {
        out.push(match[1].trim())
    }

    if (out.length === 0) {
        const start = trimmed.indexOf('{')
        if (start >= 0) {
            const balanced = extractBalanced(trimmed.slice(start))
            if (balanced) out.push(balanced)
        }
    }

    if (out.length === 0) out.push(trimmed)
    return out
}

function extractBalanced(text: string): string | null {
    let depth = 0
    let inString: false | '"' | "'" = false
    let escape = false
    for (let i = 0; i < text.length; i++) {
        const ch = text[i]
        if (escape) {
            escape = false
            continue
        }
        if (ch === '\\') {
            escape = true
            continue
        }
        if (inString) {
            if (ch === inString) inString = false
            continue
        }
        if (ch === '"' || ch === "'") {
            inString = ch
            continue
        }
        if (ch === '{') depth++
        else if (ch === '}') {
            depth--
            if (depth === 0) return text.slice(0, i + 1)
        }
    }
    return null
}

function validatePayload(value: unknown): EntityOpsPayload {
    if (!value || typeof value !== 'object') {
        throw new EntityOpsParseError('payload must be an object')
    }
    const root = value as Record<string, unknown>
    if (typeof root.summary !== 'string') {
        throw new EntityOpsParseError('payload.summary must be a string')
    }
    if (!Array.isArray(root.ops)) {
        throw new EntityOpsParseError('payload.ops must be an array')
    }
    const ops = root.ops.map((entry, idx) => validateOp(entry, idx))
    return { summary: root.summary, ops }
}

function validateOp(entry: unknown, idx: number): EntityOp {
    if (!entry || typeof entry !== 'object') {
        throw new EntityOpsParseError(`ops[${idx}] must be an object`)
    }
    const item = entry as Record<string, unknown>
    const op = item.op
    switch (op) {
        case 'entity-create':
            if (typeof item.name !== 'string' || !item.name.trim()) {
                throw new EntityOpsParseError(`ops[${idx}].name required for entity-create`)
            }
            if (item.fields !== undefined && !Array.isArray(item.fields)) {
                throw new EntityOpsParseError(`ops[${idx}].fields must be an array`)
            }
            return {
                op,
                name: item.name,
                description: typeof item.description === 'string' ? item.description : undefined,
                fields: Array.isArray(item.fields)
                    ? item.fields.map((f) => validateFieldShape(f, idx))
                    : undefined
            }
        case 'entity-update':
            if (typeof item.id !== 'string') {
                throw new EntityOpsParseError(`ops[${idx}].id required for entity-update`)
            }
            if (!item.patch || typeof item.patch !== 'object') {
                throw new EntityOpsParseError(`ops[${idx}].patch must be an object`)
            }
            return {
                op,
                id: item.id,
                patch: validatePatch(item.patch as Record<string, unknown>, idx)
            }
        case 'entity-delete':
            if (typeof item.id !== 'string') {
                throw new EntityOpsParseError(`ops[${idx}].id required for entity-delete`)
            }
            return { op, id: item.id, cascade: item.cascade === true }
        case 'relation-add':
            if (typeof item.from !== 'string' || typeof item.to !== 'string') {
                throw new EntityOpsParseError(`ops[${idx}].from/to required for relation-add`)
            }
            if (typeof item.kind !== 'string' || !RELATION_KINDS.has(item.kind as RelationKind)) {
                throw new EntityOpsParseError(
                    `ops[${idx}].kind must be one of ${[...RELATION_KINDS].join('|')}`
                )
            }
            return {
                op,
                from: item.from,
                to: item.to,
                kind: item.kind as RelationKind,
                description: typeof item.description === 'string' ? item.description : undefined
            }
        case 'relation-remove':
            if (typeof item.id !== 'string') {
                throw new EntityOpsParseError(`ops[${idx}].id required for relation-remove`)
            }
            return { op, id: item.id }
        default:
            throw new EntityOpsParseError(
                `ops[${idx}].op must be one of entity-create|entity-update|entity-delete|relation-add|relation-remove`
            )
    }
}

function validateFieldShape(value: unknown, opIdx: number): Partial<Field> {
    if (!value || typeof value !== 'object') {
        throw new EntityOpsParseError(`ops[${opIdx}].fields[*] must be an object`)
    }
    const f = value as Record<string, unknown>
    if (typeof f.name !== 'string' || !f.name.trim()) {
        throw new EntityOpsParseError(`ops[${opIdx}].fields[*].name required`)
    }
    if (typeof f.type !== 'string' || !CANONICAL_TYPES.has(f.type as FieldType)) {
        throw new EntityOpsParseError(
            `ops[${opIdx}].fields[*].type must be one of ${[...CANONICAL_TYPES].join('|')}`
        )
    }
    return f as Partial<Field>
}

function validatePatch(patch: Record<string, unknown>, opIdx: number): EntityUpdateOp['patch'] {
    const out: EntityUpdateOp['patch'] = {}
    if (patch.name !== undefined) {
        if (typeof patch.name !== 'string') {
            throw new EntityOpsParseError(`ops[${opIdx}].patch.name must be a string`)
        }
        out.name = patch.name
    }
    if (patch.description !== undefined) {
        if (typeof patch.description !== 'string') {
            throw new EntityOpsParseError(`ops[${opIdx}].patch.description must be a string`)
        }
        out.description = patch.description
    }
    if (patch.fields !== undefined) {
        if (!Array.isArray(patch.fields)) {
            throw new EntityOpsParseError(`ops[${opIdx}].patch.fields must be an array`)
        }
        out.fields = patch.fields.map((f) => validateFieldShape(f, opIdx))
    }
    return out
}

// ─── Apply ───────────────────────────────────────────────────────────────

export interface ApplyResult {
    summary: string
    applied: AppliedEntityOp[]
    failed: { op: EntityOp; error: string }[]
}

export async function applyEntityOps(
    basePath: string,
    payload: EntityOpsPayload
): Promise<ApplyResult> {
    const applied: AppliedEntityOp[] = []
    const failed: { op: EntityOp; error: string }[] = []

    // Snapshot the project for name → id resolution. Refresh after each
    // entity-create so subsequent ops can target newly-created entities.
    let summaries = await specDataService.list(basePath)

    const findByName = (name: string): { id: string } | null => {
        const found = summaries.find((s) => s.name === name)
        return found ? { id: found.id } : null
    }

    const resolveRef = async (
        ref: string
    ): Promise<{ entityId: string; fieldId?: string } | null> => {
        const [entityName, fieldName] = ref.split('.')
        const entity = findByName(entityName)
        if (!entity) return null
        if (!fieldName) return { entityId: entity.id }
        const full = await specDataService.get(basePath, entity.id)
        const field = full?.fields.find((f) => f.name === fieldName)
        if (!field) return null
        return { entityId: entity.id, fieldId: field.id }
    }

    for (const op of payload.ops) {
        try {
            switch (op.op) {
                case 'entity-create': {
                    const fields: Field[] = (op.fields ?? []).map((f) => ({
                        ...(f as Field),
                        id: f.id ?? randomUUID()
                    }))
                    const created = await specDataService.create(basePath, {
                        name: op.name,
                        description: op.description,
                        fields
                    })
                    summaries = await specDataService.list(basePath)
                    applied.push({ op: 'entity-create', entityId: created.id, name: created.name })
                    break
                }
                case 'entity-update': {
                    const patchFields = op.patch.fields
                        ? op.patch.fields.map((f) => ({
                              ...(f as Field),
                              id: (f as Field).id ?? randomUUID()
                          }))
                        : undefined
                    const updated = await specDataService.update(basePath, op.id, {
                        name: op.patch.name,
                        description: op.patch.description,
                        fields: patchFields
                    })
                    summaries = await specDataService.list(basePath)
                    applied.push({ op: 'entity-update', entityId: updated.id, name: updated.name })
                    break
                }
                case 'entity-delete': {
                    if (op.cascade) {
                        await cascadingRemove(basePath, op.id)
                    } else {
                        await specDataService.remove(basePath, op.id)
                    }
                    summaries = await specDataService.list(basePath)
                    applied.push({ op: 'entity-delete', entityId: op.id })
                    break
                }
                case 'relation-add': {
                    const from = await resolveRef(op.from)
                    const to = await resolveRef(op.to)
                    if (!from) throw new Error(`relation-add: cannot resolve "${op.from}"`)
                    if (!to) throw new Error(`relation-add: cannot resolve "${op.to}"`)
                    const fromEntity = await specDataService.get(basePath, from.entityId)
                    if (!fromEntity)
                        throw new Error(`relation-add: entity ${from.entityId} disappeared`)
                    const relation: Relation = {
                        id: randomUUID(),
                        kind: op.kind,
                        fromEntityId: from.entityId,
                        fromFieldId: from.fieldId,
                        toEntityId: to.entityId,
                        toFieldId: to.fieldId,
                        description: op.description
                    }
                    await specDataService.update(basePath, from.entityId, {
                        relations: [...fromEntity.relations, relation]
                    })
                    applied.push({ op: 'relation-add', entityId: from.entityId })
                    break
                }
                case 'relation-remove': {
                    const owner = await findRelationOwner(basePath, op.id, summaries)
                    if (!owner) throw new Error(`relation-remove: relation ${op.id} not found`)
                    await specDataService.update(basePath, owner.entityId, {
                        relations: owner.entity.relations.filter((r) => r.id !== op.id)
                    })
                    applied.push({ op: 'relation-remove', entityId: owner.entityId })
                    break
                }
            }
        } catch (err) {
            failed.push({ op, error: err instanceof Error ? err.message : String(err) })
        }
    }

    return { summary: payload.summary, applied, failed }
}

async function cascadingRemove(basePath: string, entityId: string): Promise<void> {
    const summaries = await specDataService.list(basePath)
    for (const s of summaries) {
        if (s.id === entityId) continue
        const ent = await specDataService.get(basePath, s.id)
        if (!ent) continue
        const cleanedFields = ent.fields.map((f) =>
            f.type === 'reference' && f.referenceEntityId === entityId
                ? { ...f, referenceEntityId: undefined }
                : f
        )
        const cleanedRelations = ent.relations.filter(
            (r) => r.toEntityId !== entityId && r.fromEntityId !== entityId
        )
        if (cleanedFields !== ent.fields || cleanedRelations.length !== ent.relations.length) {
            await specDataService.update(basePath, s.id, {
                fields: cleanedFields,
                relations: cleanedRelations
            })
        }
    }
    await specDataService.remove(basePath, entityId)
}

async function findRelationOwner(
    basePath: string,
    relationId: string,
    summaries: { id: string }[]
): Promise<{ entityId: string; entity: Entity } | null> {
    for (const s of summaries) {
        const ent = await specDataService.get(basePath, s.id)
        if (ent?.relations.some((r) => r.id === relationId)) {
            return { entityId: s.id, entity: ent }
        }
    }
    return null
}
