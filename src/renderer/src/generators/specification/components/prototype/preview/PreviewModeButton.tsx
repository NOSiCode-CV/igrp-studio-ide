import { cn } from '@renderer/lib/utils'
import type { JSX } from 'react'

/**
 * "Preview / Edit" toggle button used inside the Preview toolbar's
 * mode pill. Wider than `DeviceButton` because it carries a label
 * alongside the icon; `active` reads with `bg-primary/10 text-primary`
 * + ring so the live mode is clearly distinguished from idle.
 *
 * Extracted from `PrototypePanel.tsx` as part of the prototype refactor
 * (P4 — preview chrome).
 */
export const PreviewModeButton = ({
    active,
    onClick,
    icon,
    label
}: {
    active: boolean
    onClick: () => void
    icon: JSX.Element
    label: string
}): JSX.Element => (
    <button
        type="button"
        onClick={onClick}
        className={cn(
            'flex items-center gap-1.5 rounded px-2 py-1 text-[11px] font-medium transition-colors',
            active
                ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
                : 'text-muted-foreground hover:bg-accent'
        )}
    >
        {icon}
        {label}
    </button>
)
