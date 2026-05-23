/**
 * Canonical entity model for the shared `data-models` feature.
 *
 * Ids are UUIDs across the board so renames and re-imports never break
 * cross-references (D6 / D12 / approval gate #6).
 *
 * The field type set is the day-one minimal locked in approval gate #10:
 * primitives + `enum` + `reference`. Driver-specific types (blob, geo, …)
 * are deferred follow-ups; until then the optional `advancedType` lets a
 * field carry a verbatim driver type used by DDL export.
 */

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
    /** Stable UUID — survives renames. */
    id: string
    name: string
    type: FieldType
    nullable?: boolean
    primaryKey?: boolean
    unique?: boolean
    indexed?: boolean
    defaultValue?: string | number | boolean | null
    /** For `type === 'enum'`. */
    enumValues?: string[]
    /** For `type === 'reference'`. UUID of the target entity. */
    referenceEntityId?: string
    /**
     * For `type === 'reference'`. UUID of the target field — defaults to
     * the target entity's primary key when omitted.
     */
    referenceFieldId?: string
    /** Free-form column comment. */
    description?: string
    /**
     * Verbatim driver type override emitted as-is by DDL export when set.
     * Escape hatch for types not in the canonical set.
     */
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
    /**
     * For `many-to-many` — the auto-created join entity (D7 default).
     * Absent when the user opted out and kept the relation as pure metadata.
     */
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

/** Lightweight tree summary stored in `<basePath>/data-models/index.json`. */
export interface EntitySummary {
    id: string
    name: string
    source: EntitySource
    updatedAt: string
}
