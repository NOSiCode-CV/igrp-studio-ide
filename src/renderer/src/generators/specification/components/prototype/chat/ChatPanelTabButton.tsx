import { cn } from '@renderer/lib/utils'
import type { JSX } from 'react'

/**
 * Pill button used by `ChatPanelTabs` to switch between Chat / Palette
 * modes. Optional `badge` shows a small count next to the label (used
 * for the number of pinned palette components).
 *
 * Extracted from `PrototypePanel.tsx` as part of the prototype refactor
 * (P6 — chat chrome + footer).
 */
export const ChatPanelTabButton = ({
    active,
    onClick,
    icon,
    label,
    badge
}: {
    active: boolean
    onClick: () => void
    icon: JSX.Element
    label: string
    badge?: number
}): JSX.Element => (
    <button
        type="button"
        onClick={onClick}
        className={cn(
            'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors',
            active
                ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
                : 'text-muted-foreground hover:bg-accent'
        )}
    >
        {icon}
        {label}
        {badge !== undefined && (
            <span
                className={cn(
                    'rounded-full px-1.5 py-px text-[9px] font-semibold',
                    active ? 'bg-primary/20 text-primary' : 'bg-muted-foreground/20'
                )}
            >
                {badge}
            </span>
        )}
    </button>
)
