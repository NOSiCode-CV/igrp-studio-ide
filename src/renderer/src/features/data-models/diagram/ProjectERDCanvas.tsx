'use client'

import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system'
import type * as go from 'gojs'
import { Database, LayoutGrid, Plus, Shuffle } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useEntities } from '../hooks/useEntities'
import type { Entity } from '../types/entity'
import ERDCanvas from './ERDCanvas'
import { entitiesToDiagramModel, parseDiagramLoc } from './entitiesToDiagramModel'

interface ProjectERDCanvasProps {
    basePath: string
    onEntityClick?: (entityId: string) => void
    onNewEntity?: () => void
    onImportFromDb?: () => void
}

const PERSIST_DEBOUNCE_MS = 500

/**
 * Project-aware wrapper around `ERDCanvas`. Loads entities from the per-project
 * store, renders them, and persists drag positions back to the entity's
 * `layout` field via `window.specData.update`.
 */
export function ProjectERDCanvas({
    basePath,
    onEntityClick,
    onNewEntity,
    onImportFromDb
}: ProjectERDCanvasProps): React.ReactNode {
    const { t } = useTranslation()
    const { entities: summaries } = useEntities(basePath)
    const [entities, setEntities] = useState<Entity[]>([])
    const diagramRef = useRef<go.Diagram | null>(null)
    const pending = useRef<Map<string, { x: number; y: number }>>(new Map())
    const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Hydrate full entities from the lightweight summaries.
    useEffect(() => {
        let cancelled = false
        const run = async (): Promise<void> => {
            const fulls = await Promise.all(
                summaries.map((s) => window.specData.get(basePath, s.id))
            )
            if (cancelled) return
            setEntities(fulls.filter(Boolean) as Entity[])
        }
        void run()
        return () => {
            cancelled = true
        }
    }, [basePath, summaries])

    const { models, relations } = useMemo(() => entitiesToDiagramModel(entities), [entities])

    const flushLayouts = useCallback(async () => {
        const batch = Array.from(pending.current.entries())
        pending.current.clear()
        for (const [entityId, layout] of batch) {
            try {
                await window.specData.update(basePath, entityId, { layout })
            } catch {
                // best-effort — next drag will retry
            }
        }
    }, [basePath])

    const handleNodeMoved = useCallback(
        (key: string, loc: string) => {
            const parsed = parseDiagramLoc(loc)
            if (!parsed) return
            pending.current.set(key, parsed)
            if (flushTimer.current) clearTimeout(flushTimer.current)
            flushTimer.current = setTimeout(() => {
                void flushLayouts()
            }, PERSIST_DEBOUNCE_MS)
        },
        [flushLayouts]
    )

    useEffect(() => {
        return () => {
            if (flushTimer.current) clearTimeout(flushTimer.current)
            // On unmount, fire-and-forget any pending writes.
            if (pending.current.size > 0) void flushLayouts()
        }
    }, [flushLayouts])

    const handleAutoLayout = (): void => {
        const diagram = diagramRef.current
        if (!diagram) return
        // Re-apply the existing ForceDirectedLayout. Mark all nodes as
        // movable so the layout takes effect even if the user previously
        // dragged them.
        diagram.layoutDiagram(true)
        // After auto-layout, push the new positions back to storage.
        diagram.nodes.each((part) => {
            const data = part.data
            if (data?.key && part.location) {
                pending.current.set(String(data.key), {
                    x: part.location.x,
                    y: part.location.y
                })
            }
        })
        if (flushTimer.current) clearTimeout(flushTimer.current)
        flushTimer.current = setTimeout(() => void flushLayouts(), PERSIST_DEBOUNCE_MS)
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-1 border-b px-2 py-1.5 bg-background">
                {onNewEntity && (
                    <IGRPButtonPrimitive size="sm" variant="ghost" onClick={onNewEntity}>
                        <Plus className="h-4 w-4 mr-1" />
                        {t('new_entity')}
                    </IGRPButtonPrimitive>
                )}
                {onImportFromDb && (
                    <IGRPButtonPrimitive size="sm" variant="ghost" onClick={onImportFromDb}>
                        <Database className="h-4 w-4 mr-1" />
                        {t('import_from_db')}
                    </IGRPButtonPrimitive>
                )}
                <IGRPButtonPrimitive size="sm" variant="ghost" onClick={handleAutoLayout}>
                    <Shuffle className="h-4 w-4 mr-1" />
                    {t('auto_layout')}
                </IGRPButtonPrimitive>
                <span className="ml-auto text-xs text-muted-foreground inline-flex items-center gap-1">
                    <LayoutGrid className="h-3 w-3" />
                    {t('entities_count', { count: entities.length })}
                </span>
            </div>
            <div className="flex-1 min-h-0">
                <ERDCanvas
                    models={models}
                    relations={relations}
                    onNodeMoved={handleNodeMoved}
                    onNodeClicked={onEntityClick}
                    onDiagramReady={(d) => {
                        diagramRef.current = d
                    }}
                    height="100%"
                />
            </div>
        </div>
    )
}
