/**
 * `TreeView` — public mounting surface for the manifest-tree feature.
 *
 * Thin wrapper that:
 *   - Forwards `root` to the recursive `TreeNode` renderer.
 *   - Renders a transient `DropFeedback` banner above the tree when the
 *     last drop produced a warning or block. Auto-dismisses after 3s so
 *     callers don't have to manage the timer.
 *   - Stays free of state lifecycle (no manifest load, no save, no
 *     selection model beyond pass-through) — those belong to the caller.
 *
 * Mount alongside `<PropsPanel />` for the canonical 2-col layout, or
 * embed standalone if the surface just needs a draggable tree.
 */

import type { ComponentRegisterConfig } from '@igrp/igrp-studio-nextjs-engine/types'
import type { StructuredComponent } from '@renderer/lib/dnd/types'
import { cn } from '@renderer/lib/utils'
import { AlertCircle } from 'lucide-react'
import { type JSX, useEffect, useState } from 'react'
import { TreeNode } from './TreeNode'
import type { DropFeedback, TreeCallbacks } from './types'

export interface TreeViewProps {
    /** Root component of the manifest. Pass null while the tree is empty. */
    root: StructuredComponent | null
    selectedId: string | null
    /** Engine component registry — drives default property hydration. */
    engineCatalog: ReadonlyArray<ComponentRegisterConfig>
    /** State mutations (Redux, Context, IPC — caller's choice). */
    callbacks: TreeCallbacks
    /** Rendered when `root` is null. Defaults to a generic empty hint. */
    emptyState?: JSX.Element
    /**
     * Optional external feedback sink. When provided, the tree no longer
     * mounts its own inline banner — useful when the caller wants to
     * surface feedback via a toast or a sticky status bar instead.
     */
    onExternalDropFeedback?: (fb: DropFeedback | null) => void
    className?: string
}

const AUTO_DISMISS_MS = 3000

export const TreeView = ({
    root,
    selectedId,
    engineCatalog,
    callbacks,
    emptyState,
    onExternalDropFeedback,
    className
}: TreeViewProps): JSX.Element => {
    const [feedback, setFeedback] = useState<DropFeedback | null>(null)

    // Auto-dismiss the inline banner. If the caller routes feedback
    // externally we don't even mount the banner; the timer still runs so
    // the next inline feedback (if any) doesn't carry over a stale one.
    useEffect(() => {
        if (!feedback) return
        const handle = setTimeout(() => setFeedback(null), AUTO_DISMISS_MS)
        return () => clearTimeout(handle)
    }, [feedback])

    const handleDropFeedback = (fb: DropFeedback | null): void => {
        if (onExternalDropFeedback) onExternalDropFeedback(fb)
        else setFeedback(fb)
    }

    const inline = !onExternalDropFeedback && feedback ? feedback : null

    return (
        <div className={cn('flex h-full flex-col overflow-hidden', className)}>
            {inline && (
                <div
                    className={cn(
                        'flex shrink-0 items-center gap-2 border-b px-3 py-1.5 text-[11px]',
                        // Semi-transparent tints so the banner reads on both
                        // light + dark themes — solid `bg-red-50` etc. would
                        // wash out in dark mode.
                        inline.kind === 'block'
                            ? 'border-destructive/30 bg-destructive/10 text-destructive'
                            : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400'
                    )}
                >
                    <AlertCircle size={11} />
                    {inline.msg}
                </div>
            )}
            <div className="flex-1 overflow-auto p-4">
                {root ? (
                    <TreeNode
                        node={root}
                        depth={0}
                        selectedId={selectedId}
                        isRoot
                        manifestRoot={root}
                        engineCatalog={engineCatalog}
                        callbacks={callbacks}
                        onDropFeedback={handleDropFeedback}
                    />
                ) : (
                    (emptyState ?? <DefaultEmptyState />)
                )}
            </div>
        </div>
    )
}

const DefaultEmptyState = (): JSX.Element => (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
        <p className="text-[11px] italic">No manifest loaded yet.</p>
    </div>
)
