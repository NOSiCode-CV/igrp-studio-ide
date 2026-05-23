'use client'

import {
    IGRPButtonPrimitive,
    IGRPDropdownMenuContentPrimitive,
    IGRPDropdownMenuItemPrimitive,
    IGRPDropdownMenuPrimitive,
    IGRPDropdownMenuTriggerPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { Database, KeyRound, MoreVertical, Plus, Trash2 } from 'lucide-react'
import { type FC, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
    Background,
    BackgroundVariant,
    Controls,
    type Edge,
    type EdgeMarkerType,
    Handle,
    MarkerType,
    type Node,
    type NodeChange,
    type NodeTypes,
    Position,
    ReactFlow,
    ReactFlowProvider,
    useEdgesState,
    useNodesState
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useEntities } from '../hooks/useEntities'
import type { Entity, RelationKind } from '../types/entity'

const PERSIST_DEBOUNCE_MS = 400

const EDGE_MARKERS: Record<
    RelationKind,
    { label: string; markerStart?: EdgeMarkerType; markerEnd: EdgeMarkerType }
> = {
    'one-to-one': {
        label: '1:1',
        markerEnd: { type: MarkerType.Arrow }
    },
    'one-to-many': {
        label: '1:N',
        markerEnd: { type: MarkerType.ArrowClosed }
    },
    'many-to-one': {
        label: 'N:1',
        markerEnd: { type: MarkerType.Arrow }
    },
    'many-to-many': {
        label: 'N:N',
        markerEnd: { type: MarkerType.ArrowClosed }
    }
}

interface EntityNodeData {
    entity: Entity
    readOnly?: boolean
    onAddField?: (entityId: string) => void
    onDelete?: (entityId: string) => void
    onRename?: (entityId: string) => void
    onOpen?: (entityId: string) => void
}

const EntityNode: FC<{ data: EntityNodeData; selected: boolean }> = memo(({ data, selected }) => {
    const { entity, readOnly, onAddField, onDelete, onRename, onOpen } = data
    const { t } = useTranslation()
    return (
        <div
            className={`min-w-[200px] rounded-md border bg-card text-card-foreground shadow-sm overflow-hidden ${
                selected ? 'ring-2 ring-primary' : ''
            }`}
        >
            {/* React-flow needs handles even on a custom node so edges can attach. */}
            <Handle
                type="target"
                position={Position.Left}
                style={{ background: '#888', border: 'none' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                style={{ background: '#888', border: 'none' }}
            />
            <div
                className="flex items-center justify-between gap-1 px-2 py-1.5 bg-muted/60 border-b cursor-pointer"
                onDoubleClick={() => onOpen?.(entity.id)}
            >
                <div className="flex items-center gap-1.5 min-w-0">
                    {entity.source.kind === 'imported' ? (
                        <Database className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    ) : null}
                    <span className="text-sm font-semibold truncate">{entity.name}</span>
                </div>
                {!readOnly && (
                    <IGRPDropdownMenuPrimitive>
                        <IGRPDropdownMenuTriggerPrimitive asChild>
                            <button
                                type="button"
                                className="p-0.5 rounded hover:bg-muted"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <MoreVertical className="h-3.5 w-3.5" />
                            </button>
                        </IGRPDropdownMenuTriggerPrimitive>
                        <IGRPDropdownMenuContentPrimitive align="end">
                            <IGRPDropdownMenuItemPrimitive onClick={() => onOpen?.(entity.id)}>
                                {t('open_in_editor')}
                            </IGRPDropdownMenuItemPrimitive>
                            <IGRPDropdownMenuItemPrimitive onClick={() => onAddField?.(entity.id)}>
                                <Plus className="h-3.5 w-3.5 mr-2" />
                                {t('add_field')}
                            </IGRPDropdownMenuItemPrimitive>
                            <IGRPDropdownMenuItemPrimitive onClick={() => onRename?.(entity.id)}>
                                {t('rename_entity')}
                            </IGRPDropdownMenuItemPrimitive>
                            <IGRPDropdownMenuItemPrimitive
                                onClick={() => onDelete?.(entity.id)}
                                className="text-destructive"
                            >
                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                {t('delete_entity')}
                            </IGRPDropdownMenuItemPrimitive>
                        </IGRPDropdownMenuContentPrimitive>
                    </IGRPDropdownMenuPrimitive>
                )}
            </div>
            <ul className="divide-y text-xs">
                {entity.fields.length === 0 ? (
                    <li className="px-2 py-2 text-muted-foreground italic">{t('no_fields_yet')}</li>
                ) : (
                    entity.fields.map((f) => (
                        <li key={f.id} className="flex items-center gap-1.5 px-2 py-1">
                            {f.primaryKey && (
                                <KeyRound className="h-3 w-3 text-amber-500 shrink-0" />
                            )}
                            <span className="font-mono truncate flex-1">{f.name}</span>
                            <span className="text-muted-foreground shrink-0">{f.type}</span>
                        </li>
                    ))
                )}
            </ul>
            {!readOnly && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation()
                        onAddField?.(entity.id)
                    }}
                    className="w-full flex items-center justify-center gap-1 px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted border-t"
                >
                    <Plus className="h-3 w-3" />
                    {t('add_field')}
                </button>
            )}
        </div>
    )
})
EntityNode.displayName = 'EntityNode'

const NODE_TYPES: NodeTypes = { entity: EntityNode }

interface ReactFlowERDProps {
    /** Per-project store path. Required unless `entities` is provided. */
    basePath?: string
    /**
     * Read-only override — when provided, the canvas renders these entities
     * directly without hitting the per-project store. Used by consumers that
     * own their own data shape (e.g. the API generator's models).
     */
    entities?: Entity[]
    /** Hide the dropdown menu + inline "add field" affordances. */
    readOnly?: boolean
    onEntityClick?: (entityId: string) => void
    onNewEntity?: () => void
}

function ReactFlowERDInner({
    basePath,
    entities: entitiesProp,
    readOnly,
    onEntityClick,
    onNewEntity
}: ReactFlowERDProps): React.ReactNode {
    const { t } = useTranslation()
    const writeable = !readOnly && !!basePath
    const { entities: summaries } = useEntities(writeable ? basePath : undefined)
    const [hydrated, setHydrated] = useState<Entity[]>([])

    const pending = useRef<Map<string, { x: number; y: number }>>(new Map())
    const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Hydrate full entities from the lightweight summary list (only when
    // we own the store — read-only consumers pass `entities` directly).
    useEffect(() => {
        if (entitiesProp || !basePath) return
        let cancelled = false
        const run = async (): Promise<void> => {
            const fulls = await Promise.all(
                summaries.map((s) => window.specData.get(basePath, s.id))
            )
            if (cancelled) return
            setHydrated(fulls.filter(Boolean) as Entity[])
        }
        void run()
        return () => {
            cancelled = true
        }
    }, [basePath, summaries, entitiesProp])

    const entities = entitiesProp ?? hydrated

    // ─── Inline mutations exposed to each EntityNode ─────────────────────

    const handleAddField = useCallback(
        async (entityId: string) => {
            if (!writeable || !basePath) return
            const ent = await window.specData.get(basePath, entityId)
            if (!ent) return
            const usedNames = new Set(ent.fields.map((f) => f.name))
            let name = `field${ent.fields.length + 1}`
            let n = ent.fields.length + 1
            while (usedNames.has(name)) {
                n += 1
                name = `field${n}`
            }
            const newField = {
                id: crypto.randomUUID(),
                name,
                type: 'string' as const,
                nullable: true
            }
            await window.specData.update(basePath, entityId, {
                fields: [...ent.fields, newField]
            })
        },
        [basePath, writeable]
    )

    const handleDelete = useCallback(
        async (entityId: string) => {
            if (!writeable || !basePath) return
            if (!window.confirm(t('confirm_delete_entity'))) return
            try {
                await window.specData.remove(basePath, entityId)
            } catch (err) {
                window.alert(err instanceof Error ? err.message : String(err))
            }
        },
        [basePath, writeable, t]
    )

    const handleRename = useCallback(
        async (entityId: string) => {
            if (!writeable || !basePath) return
            const ent = await window.specData.get(basePath, entityId)
            if (!ent) return
            const next = window.prompt(t('rename_entity'), ent.name)
            if (!next || next === ent.name) return
            try {
                await window.specData.update(basePath, entityId, { name: next })
            } catch (err) {
                window.alert(err instanceof Error ? err.message : String(err))
            }
        },
        [basePath, writeable, t]
    )

    const handleOpen = useCallback(
        (entityId: string) => {
            onEntityClick?.(entityId)
        },
        [onEntityClick]
    )

    // ─── React-flow nodes / edges ────────────────────────────────────────

    const idToName = useMemo(() => new Map(entities.map((e) => [e.id, e.name])), [entities])

    const initialNodes = useMemo<Node<EntityNodeData>[]>(
        () =>
            entities.map((e, idx) => ({
                id: e.id,
                type: 'entity',
                position: e.layout
                    ? { x: e.layout.x, y: e.layout.y }
                    : { x: (idx % 4) * 280, y: Math.floor(idx / 4) * 280 },
                data: {
                    entity: e,
                    readOnly: !writeable,
                    onAddField: writeable ? handleAddField : undefined,
                    onDelete: writeable ? handleDelete : undefined,
                    onRename: writeable ? handleRename : undefined,
                    onOpen: handleOpen
                }
            })),
        [entities, writeable, handleAddField, handleDelete, handleRename, handleOpen]
    )

    const initialEdges = useMemo<Edge[]>(
        () =>
            entities.flatMap((e) =>
                e.relations
                    .filter((r) => idToName.has(r.toEntityId))
                    .map((r) => {
                        const marker = EDGE_MARKERS[r.kind]
                        return {
                            id: r.id,
                            source: r.fromEntityId,
                            target: r.toEntityId,
                            label: marker.label,
                            type: 'smoothstep',
                            markerEnd: marker.markerEnd,
                            style: { stroke: '#9ca3af' }
                        }
                    })
            ),
        [entities, idToName]
    )

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

    // Re-sync when underlying data changes (broadcasts, refresh, etc.).
    useEffect(() => {
        setNodes(initialNodes)
    }, [initialNodes, setNodes])

    useEffect(() => {
        setEdges(initialEdges)
    }, [initialEdges, setEdges])

    // Persist drag positions (debounced). No-op when read-only.
    const flushLayouts = useCallback(async () => {
        if (!writeable || !basePath) return
        const batch = Array.from(pending.current.entries())
        pending.current.clear()
        for (const [entityId, layout] of batch) {
            try {
                await window.specData.update(basePath, entityId, { layout })
            } catch {
                // best-effort
            }
        }
    }, [basePath, writeable])

    const handleNodesChange = useCallback(
        (changes: NodeChange[]) => {
            onNodesChange(changes)
            if (!writeable) return
            for (const change of changes) {
                if (change.type === 'position' && change.position && !change.dragging) {
                    pending.current.set(change.id, {
                        x: change.position.x,
                        y: change.position.y
                    })
                }
            }
            if (pending.current.size > 0) {
                if (flushTimer.current) clearTimeout(flushTimer.current)
                flushTimer.current = setTimeout(() => {
                    void flushLayouts()
                }, PERSIST_DEBOUNCE_MS)
            }
        },
        [onNodesChange, flushLayouts, writeable]
    )

    useEffect(() => {
        return () => {
            if (flushTimer.current) clearTimeout(flushTimer.current)
            if (pending.current.size > 0) void flushLayouts()
        }
    }, [flushLayouts])

    return (
        <div className="h-full w-full">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={NODE_TYPES}
                onNodesChange={handleNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
                proOptions={{ hideAttribution: true }}
            >
                <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
                <Controls />
                {onNewEntity && (
                    <div className="absolute top-2 left-2 z-10">
                        <IGRPButtonPrimitive size="sm" onClick={onNewEntity}>
                            <Plus className="h-4 w-4 mr-1" />
                            {t('new_entity')}
                        </IGRPButtonPrimitive>
                    </div>
                )}
            </ReactFlow>
        </div>
    )
}

export function ReactFlowERD(props: ReactFlowERDProps): React.ReactNode {
    return (
        <ReactFlowProvider>
            <ReactFlowERDInner {...props} />
        </ReactFlowProvider>
    )
}
