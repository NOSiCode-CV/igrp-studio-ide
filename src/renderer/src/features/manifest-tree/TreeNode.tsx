/**
 * Recursive renderer for a single tree node + its descendants.
 *
 * Each row is BOTH a drag-source (the node payload rides in dataTransfer)
 * AND a drop-target (palette items and other tree nodes can drop onto
 * it). Visual state cycles `idle → allow → warn → block` as the user
 * drags; the verdict is computed from `evaluateDrop` against the live
 * engine rules.
 *
 * Lifted out of `prototype/EditCanvas.tsx` (M-DnD α) so the Page Builder
 * and any future generator can reuse the same tree UI. The component is
 * **state-agnostic** — all mutations flow through the `callbacks` prop.
 */

import type { ComponentRegisterConfig } from '@igrp/igrp-studio-nextjs-engine/types'
import { Button } from '@renderer/components/ui/button'
import { resolveIcon } from '@renderer/features/component-icons'
import type { StructuredComponent } from '@renderer/lib/dnd/types'
import { cn } from '@renderer/lib/utils'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { type DragEvent, type JSX, useCallback, useState } from 'react'
import { applyPaletteDrop, applyTreeReorder, detectDragKind } from './drop-orchestrator'
import type { DropFeedback, PaletteDragPayload, TreeCallbacks, TreeNodeDragPayload } from './types'
import { evaluateDrop } from './validation'

export interface TreeNodeProps {
    node: StructuredComponent
    depth: number
    selectedId: string | null
    isRoot?: boolean
    /** Root of the manifest tree — passed for cycle / cap validation. */
    manifestRoot: StructuredComponent
    /** Engine component registry, for default property hydration on add. */
    engineCatalog: ReadonlyArray<ComponentRegisterConfig>
    /** Mutation callbacks (Redux dispatch, Context setter, IPC — caller's choice). */
    callbacks: TreeCallbacks
    /** Sink for transient warn / block messages produced by drops. */
    onDropFeedback: (fb: DropFeedback | null) => void
}

export const TreeNode = ({
    node,
    depth,
    selectedId,
    isRoot,
    manifestRoot,
    engineCatalog,
    callbacks,
    onDropFeedback
}: TreeNodeProps): JSX.Element => {
    const hasChildren = Array.isArray(node.children) && node.children.length > 0
    const [open, setOpen] = useState(depth < 2 || isRoot)
    const [dropState, setDropState] = useState<'idle' | 'allow' | 'warn' | 'block'>('idle')
    const isSelected = selectedId === node.id
    const Icon = resolveIcon(node.componentName)
    const label = node.label || node.componentName

    // ── drag (this node is the source) ──
    const handleDragStart = useCallback(
        (e: DragEvent<HTMLDivElement>) => {
            if (isRoot) {
                // Root has nowhere valid to land — disable dragging.
                e.preventDefault()
                return
            }
            const payload: TreeNodeDragPayload = { ...node, kind: 'tree-node' }
            e.dataTransfer.setData('text/plain', JSON.stringify(payload))
            e.dataTransfer.setData('application/x-igrp-tree-node', JSON.stringify(payload))
            e.dataTransfer.effectAllowed = 'move'
            e.stopPropagation()
        },
        [node, isRoot]
    )

    // ── drop (this node is a container target) ──
    const previewVerdict = useCallback(
        (e: DragEvent<HTMLDivElement>): 'allow' | 'warn' | 'block' | null => {
            const raw =
                e.dataTransfer.getData('application/x-igrp-palette') ||
                e.dataTransfer.getData('application/x-igrp-tree-node') ||
                e.dataTransfer.getData('text/plain')
            if (!raw) return null
            try {
                const parsed = JSON.parse(raw)
                const incoming = parsed?.componentName ?? parsed?.id?.split('_')?.[0] ?? ''
                if (!incoming) return null
                if (parsed?.id === node.id) return 'block'
                const verdict = evaluateDrop({
                    parent: node,
                    incomingComponentName: incoming,
                    extraDelta: parsed?.kind === 'tree-node' ? 0 : 1
                })
                if (verdict.kind === 'block') return 'block'
                if (verdict.kind === 'warn') return 'warn'
                return 'allow'
            } catch {
                return null
            }
        },
        [node]
    )

    const handleDragOver = useCallback(
        (e: DragEvent<HTMLDivElement>) => {
            e.preventDefault()
            e.stopPropagation()
            const verdict = previewVerdict(e)
            setDropState(verdict ?? 'allow')
            e.dataTransfer.dropEffect = verdict === 'block' ? 'none' : 'copy'
        },
        [previewVerdict]
    )

    const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
        // Only reset when we actually leave the row, not when we hover a
        // child element inside it.
        const next = e.relatedTarget as Node | null
        if (next && e.currentTarget.contains(next)) return
        setDropState('idle')
    }, [])

    const handleDrop = useCallback(
        (e: DragEvent<HTMLDivElement>) => {
            e.preventDefault()
            e.stopPropagation()
            setDropState('idle')
            const paletteRaw = e.dataTransfer.getData('application/x-igrp-palette')
            const treeRaw = e.dataTransfer.getData('application/x-igrp-tree-node')
            const fallback = e.dataTransfer.getData('text/plain')
            const raw = paletteRaw || treeRaw || fallback
            if (!raw) return
            let parsed: unknown
            try {
                parsed = JSON.parse(raw)
            } catch {
                onDropFeedback({ kind: 'block', msg: 'Drop payload not parsable' })
                return
            }
            const kind = detectDragKind(parsed)
            if (!kind) {
                onDropFeedback({ kind: 'block', msg: 'Unknown drop payload' })
                return
            }
            const ctx = {
                manifestRoot,
                engineCatalog,
                callbacks,
                onWarn: (msg: string) => onDropFeedback({ kind: 'warn', msg }),
                onBlock: (msg: string) => onDropFeedback({ kind: 'block', msg })
            }
            if (kind === 'palette-item') {
                applyPaletteDrop(parsed as PaletteDragPayload, node, undefined, ctx)
            } else {
                applyTreeReorder(parsed as TreeNodeDragPayload, node, undefined, ctx)
            }
        },
        [engineCatalog, callbacks, manifestRoot, node, onDropFeedback]
    )

    const handleSelect = useCallback(() => {
        callbacks.onSelect(node.id)
    }, [callbacks, node.id])

    return (
        <div className="select-none">
            <div
                draggable={!isRoot}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                    'group flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] transition-colors',
                    isSelected ? 'bg-primary/10 ring-1 ring-primary/30' : 'hover:bg-accent/50',
                    dropState === 'allow' && 'bg-emerald-500/10 ring-1 ring-emerald-500/40',
                    dropState === 'warn' && 'bg-amber-500/10 ring-1 ring-amber-500/40',
                    dropState === 'block' &&
                        'bg-red-500/10 ring-1 ring-red-500/40 cursor-not-allowed',
                    !isRoot && 'cursor-grab active:cursor-grabbing'
                )}
                style={{ paddingLeft: `${depth * 14 + 8}px` }}
                onClick={(e) => {
                    e.stopPropagation()
                    handleSelect()
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleSelect()
                    }
                }}
                role="button"
                tabIndex={0}
            >
                {hasChildren ? (
                    // shadcn Button with size override — the default `size="icon"`
                    // is 36×36 which is way too big for an inline tree chevron;
                    // we collapse to 16×16 to fit the row height. Variant `ghost`
                    // gives us the right hover + focus-visible ring out of the
                    // box (theme-aware on light + dark).
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation()
                            setOpen((v) => !v)
                        }}
                        aria-label={open ? 'Collapse' : 'Expand'}
                        className="h-4 w-4 shrink-0 rounded text-muted-foreground"
                    >
                        {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                    </Button>
                ) : (
                    <span className="w-4 shrink-0" />
                )}
                <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="font-mono text-[10.5px] text-muted-foreground">
                    {node.componentName}
                </span>
                {label && label !== node.componentName && (
                    <span className="truncate text-[11.5px] font-medium text-foreground">
                        {label}
                    </span>
                )}
                <span className="ml-auto font-mono text-[9px] text-muted-foreground/60">
                    {node.id}
                </span>
            </div>
            {hasChildren && open && (
                <div>
                    {node.children.map((child) => (
                        <TreeNode
                            key={child.id}
                            node={child}
                            depth={depth + 1}
                            selectedId={selectedId}
                            manifestRoot={manifestRoot}
                            engineCatalog={engineCatalog}
                            callbacks={callbacks}
                            onDropFeedback={onDropFeedback}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
