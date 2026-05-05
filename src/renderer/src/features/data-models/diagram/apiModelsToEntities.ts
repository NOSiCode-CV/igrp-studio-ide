import type { Entity, FieldType, RelationKind } from '../types/entity'

const KIND_MAP: Record<string, RelationKind> = {
    OneToOne: 'one-to-one',
    OneToMany: 'one-to-many',
    ManyToOne: 'many-to-one',
    ManyToMany: 'many-to-many'
}

/**
 * Adapts the API generator's model shape — `useStudioAPI(module).models`
 * (`{ content: { name, attributes: [...] } }[]`) — into our canonical
 * `Entity[]` so it can feed `<ReactFlowERD entities={…} readOnly />`.
 *
 * Lossy: ids are derived from names (no UUID minted), since the API
 * generator never persisted layout via `Entity.layout` and the diagram is
 * read-only there. Switch to per-entity UUIDs when those models migrate to
 * the per-project store.
 */
export function apiModelsToEntities(rawModels: unknown[]): Entity[] {
    const idForName = (name: string): string => `api:${name}`
    const now = new Date().toISOString()

    return rawModels.map((m: any) => {
        const content = m?.content ?? m
        const attrs: any[] = Array.isArray(content?.attributes) ? content.attributes : []
        const fields = attrs.map((attr) => ({
            id: `${idForName(content.name)}#${attr.name}`,
            name: attr.name as string,
            type: mapApiType(attr) as FieldType,
            primaryKey: !!attr.primaryKey,
            nullable: attr.nullable !== false,
            unique: !!attr.unique,
            referenceEntityId:
                attr.type === 'relation' && attr.relation?.entity
                    ? idForName(attr.relation.entity)
                    : undefined
        }))

        const relations = attrs
            .filter((a) => a?.type === 'relation' && a?.relation?.entity)
            .map((a) => ({
                id: `${idForName(content.name)}>${a.relation.entity}`,
                kind: KIND_MAP[a.relation.type as string] ?? 'many-to-one',
                fromEntityId: idForName(content.name),
                toEntityId: idForName(a.relation.entity)
            }))

        return {
            id: idForName(content.name),
            name: content.name as string,
            fields,
            relations,
            source: { kind: 'manual' as const },
            createdAt: now,
            updatedAt: now
        }
    })
}

function mapApiType(attr: { type?: string }): FieldType {
    const t = (attr?.type ?? 'string').toLowerCase()
    if (t === 'relation') return 'reference'
    if (t === 'integer' || t === 'long' || t === 'short' || t === 'int') return 'int'
    if (t === 'decimal' || t === 'double' || t === 'float' || t === 'numeric') return 'decimal'
    if (t === 'boolean') return 'boolean'
    if (t === 'date') return 'date'
    if (t === 'datetime' || t === 'timestamp') return 'datetime'
    if (t === 'json' || t === 'jsonb') return 'json'
    return 'string'
}
