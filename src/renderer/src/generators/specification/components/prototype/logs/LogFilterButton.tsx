import { cn } from '@renderer/lib/utils'
import type { JSX } from 'react'

/**
 * Pill button inside the LogsPane filter group ("All / Warn+Err /
 * Err"). Mirrors the style used by `DeviceButton` in the Preview
 * toolbar — quiet by default, primary when active.
 *
 * Extracted from `PrototypePanel.tsx` as part of the prototype refactor
 * (P5 — panes).
 */
export const LogFilterButton = ({
    active,
    onClick,
    label
}: {
    active: boolean
    onClick: () => void
    label: string
}): JSX.Element => (
    <button
        type="button"
        onClick={onClick}
        className={cn(
            'rounded px-2 py-0.5 text-[10px] font-medium transition-colors',
            active
                ? 'bg-secondary text-secondary-foreground'
                : 'text-muted-foreground hover:bg-accent'
        )}
    >
        {label}
    </button>
)
