import { Button } from '@renderer/components/ui/button'
import type { PrototypeSnapshot } from '@renderer/redux/specPrototype/reducer'
import { CheckCircle2, FileCode, History } from 'lucide-react'
import type { JSX } from 'react'

/**
 * One snapshot card in the History grid. Shows date / author / message
 * / hash and exposes a "Restore version" CTA on hover.
 *
 * Extracted from `PrototypePanel.tsx` as part of the prototype refactor
 * (P5 — panes).
 */
export const SnapshotCard = ({
    snap,
    onRestore
}: {
    snap: PrototypeSnapshot
    onRestore: () => void
}): JSX.Element => (
    <div className="group space-y-3 rounded-xl border bg-card p-4 transition-all hover:border-primary/30">
        <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <History size={12} />
                {snap.date} · {snap.author}
            </div>
            <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px] opacity-0 transition-opacity group-hover:opacity-100"
                onClick={onRestore}
            >
                Restore version
            </Button>
        </div>
        <p className="text-xs leading-relaxed">{snap.message}</p>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1 font-mono">
                <FileCode size={12} /> {snap.hash}
            </span>
            <span className="flex items-center gap-1">
                <CheckCircle2 size={12} className="text-emerald-500" /> Committed
            </span>
        </div>
    </div>
)
