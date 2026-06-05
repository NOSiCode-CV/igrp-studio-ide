import { cn } from '@renderer/lib/utils'
import type { PrototypeLog } from '@renderer/redux/specPrototype/reducer'
import type { JSX } from 'react'

/**
 * One log entry rendered inside LogsPane. Timestamp in muted grey,
 * line content colour-coded by `level` (error → red, warn → amber,
 * info → foreground).
 *
 * Extracted from `PrototypePanel.tsx` as part of the prototype refactor
 * (P5 — panes).
 */
export const LogLine = ({ log }: { log: PrototypeLog }): JSX.Element => {
    const ts = new Date(log.timestamp).toLocaleTimeString()
    const colour =
        log.level === 'error'
            ? 'text-red-500'
            : log.level === 'warn'
              ? 'text-amber-500'
              : 'text-foreground'
    return (
        <div className="flex gap-3">
            <span className="select-none text-muted-foreground">[{ts}]</span>
            <span className={cn('whitespace-pre-wrap break-all', colour)}>{log.line}</span>
        </div>
    )
}
