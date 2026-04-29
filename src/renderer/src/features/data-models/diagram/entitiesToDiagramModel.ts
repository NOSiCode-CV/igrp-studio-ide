import type { Entity } from '../types/entity'
import type { Attribute, ModelData, RelationData } from './types'

const KIND_LABELS: Record<string, { text: string; toText: string }> = {
    'one-to-one': { text: '1', toText: '1' },
    'one-to-many': { text: '1', toText: '0..N' },
    'many-to-one': { text: '0..N', toText: '1' },
    'many-to-many': { text: '0..N', toText: '0..N' }
}

/**
 * Converts the canonical Entity[] into the gojs-shaped data the existing
 * `ERDCanvas` expects. Node keys are entity ids (UUIDs) so renames don't
 * break persisted layouts; link from/to use the same ids.
 */
export function entitiesToDiagramModel(entities: Entity[]): {
    models: ModelData[]
    relations: RelationData[]
} {
    const idToName = new Map(entities.map((e) => [e.id, e.name]))

    const models: ModelData[] = entities.map((e) => {
        const items: Attribute[] = e.fields
            .filter((f) => f.type !== 'reference')
            .map((f) => ({
                name: `${f.name}: ${f.type}`,
                iskey: !!f.primaryKey,
                figure: f.primaryKey ? 'Diamond' : 'Circle',
                color: f.primaryKey
                    ? 'purple'
                    : f.type === 'string'
                      ? 'green'
                      : 'orange'
            }))
        const inheritedItems: Attribute[] = e.fields
            .filter((f) => f.type === 'reference')
            .map((f) => {
                const target = f.referenceEntityId
                    ? idToName.get(f.referenceEntityId) ?? '?'
                    : '?'
                return {
                    name: `${f.name} → ${target}`,
                    iskey: !!f.primaryKey,
                    figure: 'Triangle',
                    color: 'cyan'
                }
            })
        return {
            key: e.id,
            name: e.name,
            items,
            inheritedItems,
            loc: e.layout ? `${e.layout.x} ${e.layout.y}` : undefined
        }
    })

    const relations: RelationData[] = entities.flatMap((e) =>
        e.relations
            .filter((r) => idToName.has(r.toEntityId))
            .map((r) => {
                const labels = KIND_LABELS[r.kind] ?? { text: '', toText: '' }
                return {
                    from: r.fromEntityId,
                    to: r.toEntityId,
                    text: labels.text,
                    toText: labels.toText
                }
            })
    )

    return { models, relations }
}

/** Inverse of `loc` formatting in entitiesToDiagramModel. */
export function parseDiagramLoc(loc: string): { x: number; y: number } | null {
    const parts = loc.trim().split(/\s+/)
    if (parts.length !== 2) return null
    const x = Number(parts[0])
    const y = Number(parts[1])
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null
    return { x, y }
}
