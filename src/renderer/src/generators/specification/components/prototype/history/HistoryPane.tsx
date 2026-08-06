import type { RootState } from '@renderer/redux'
import {
    loadPrototypeSnapshots,
    restorePrototypeSnapshot
} from '@renderer/redux/specPrototype/thunks'
import { History, RefreshCw } from 'lucide-react'
import type { JSX } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { SnapshotCard } from './SnapshotCard'

/**
 * "History" tab — grid of snapshot cards, one per successful build
 * turn. Each card exposes a restore-to-this-snapshot CTA on hover.
 *
 * `window.confirm` guards the restore — uncommitted changes would be
 * lost. The thunk handles the git plumbing.
 *
 * Extracted from `PrototypePanel.tsx` as part of the prototype refactor
 * (P5 — panes).
 */
export const HistoryPane = ({ basePath }: { basePath?: string }): JSX.Element => {
    const dispatch = useDispatch<any>()
    const snapshots = useSelector((s: RootState) => s.specPrototype.snapshots)

    return (
        <div className="h-full overflow-y-auto p-2">
            <div className="mb-3 flex items-center justify-between px-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {snapshots.length} snapshot{snapshots.length === 1 ? '' : 's'}
                </span>
                <button
                    type="button"
                    onClick={() => basePath && dispatch(loadPrototypeSnapshots(basePath))}
                    title="Refresh"
                    className="rounded p-1 hover:bg-accent"
                >
                    <RefreshCw size={11} />
                </button>
            </div>
            {snapshots.length === 0 ? (
                <div className="rounded-xl border border-dashed bg-muted/30 p-8 text-center">
                    <History size={28} className="mx-auto mb-3 text-muted-foreground/40" />
                    <p className="text-sm font-medium">No snapshots yet</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Each successful build turn creates a snapshot you can restore from.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {snapshots.map((snap) => (
                        <SnapshotCard
                            key={snap.hash}
                            snap={snap}
                            onRestore={() => {
                                if (!basePath) return
                                if (
                                    window.confirm(
                                        `Restore snapshot ${snap.hash}? Uncommitted changes will be lost.`
                                    )
                                ) {
                                    dispatch(restorePrototypeSnapshot(basePath, snap.hash))
                                }
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
