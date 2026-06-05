import { cn } from '@renderer/lib/utils'
import type { JSX } from 'react'

/**
 * Compact 24×24 device-frame button used inside the Preview toolbar's
 * pill group. `active` flips the colour pair to `bg-secondary
 * text-secondary-foreground`; idle reads as muted to keep the chrome
 * quiet.
 *
 * Extracted from `PrototypePanel.tsx` as part of the prototype refactor
 * (P4 — preview chrome).
 */
export const DeviceButton = ({
    active,
    onClick,
    icon,
    title
}: {
    active: boolean
    onClick: () => void
    icon: JSX.Element
    title: string
}): JSX.Element => (
    <button
        type="button"
        onClick={onClick}
        title={title}
        className={cn(
            'flex h-6 w-6 items-center justify-center rounded transition-colors',
            active
                ? 'bg-secondary text-secondary-foreground'
                : 'text-muted-foreground hover:bg-accent'
        )}
    >
        {icon}
    </button>
)
