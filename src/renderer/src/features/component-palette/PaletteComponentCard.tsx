/**
 * Visual chip for a palette component — extracted from the UI generator's
 * `sidebar-left.tsx`. Pure presentation: takes an icon + label + a few
 * affordances and renders the same card both surfaces use.
 *
 * The visual contract:
 *  - Bordered card with subtle shadow.
 *  - `GripHorizontal` "drag handle" hint at the top (decorative — the
 *    actual drag behaviour is owned by the caller via `<Draggable>` wrap
 *    when needed; the Prototype palette uses `onClick` instead).
 *  - Component icon centred.
 *  - Label below the icon.
 *  - Optional deprecated-warning badge in the corner.
 *  - Optional `active` style when the component is pinned (Prototype) or
 *    selected (UI generator hover/focus). Adds primary-tinted ring.
 *
 * Callers decide:
 *  - Whether to wrap the card in `<Draggable>` (UI gen) or call `onClick`
 *    (Prototype's click-to-pin).
 *  - Whether to show the deprecated badge from `EnginePaletteComponent.deprecated`
 *    or from a custom field on a static catalog item.
 */

import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/components/ui/tooltip'
import { cn } from '@renderer/lib/utils'
import { AlertTriangle, Check, GripHorizontal } from 'lucide-react'
import type React from 'react'
import type { JSX, ReactNode } from 'react'

export interface PaletteComponentCardProps {
    /** Lucide icon (or any `React.ElementType`) to render in the body. */
    icon?: React.ElementType
    /** Component name shown below the icon. */
    label: string
    /** Optional helper text shown under the label (used by the Prototype). */
    hint?: string
    /** Flag deprecated components with a tooltip + warning badge. */
    deprecated?: boolean
    /** Visual state — pinned/selected (Prototype) or focused (UI gen). */
    active?: boolean
    /** Show a check mark in the top-right when active. Default true. */
    showActiveCheck?: boolean
    /** Show the grip-handle hint at the top. Default true. */
    showGripHint?: boolean
    /** Click handler — when omitted the card renders non-interactive. */
    onClick?: () => void
    /** Tooltip text on the deprecated badge. */
    deprecatedTooltip?: string
    /** Extra classes for one-off overrides. */
    className?: string
    /** Slot rendered absolutely-positioned in the top-right (overrides Check). */
    topRight?: ReactNode
}

export function PaletteComponentCard({
    icon: Icon,
    label,
    hint,
    deprecated,
    active,
    showActiveCheck = true,
    showGripHint = true,
    onClick,
    deprecatedTooltip = 'Deprecated component',
    className,
    topRight
}: PaletteComponentCardProps): JSX.Element {
    const interactive = Boolean(onClick)
    const content = (
        <>
            {deprecated && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className="absolute right-2 top-2 text-amber-500">
                            <AlertTriangle className="h-4 w-4" />
                        </span>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{deprecatedTooltip}</p>
                    </TooltipContent>
                </Tooltip>
            )}
            {topRight && <span className="absolute right-2 top-2">{topRight}</span>}
            {active && !deprecated && !topRight && showActiveCheck && (
                <span className="absolute right-1.5 top-1.5 text-primary">
                    <Check className="h-3 w-3" />
                </span>
            )}
            {showGripHint && <GripHorizontal className="h-4 w-4 text-muted-foreground/50" />}
            <div className="flex flex-col items-center gap-1.5">
                {Icon && <Icon className="h-6 w-6" />}
                <span className="text-center text-[11px] font-medium leading-tight">{label}</span>
                {hint && (
                    <span className="line-clamp-2 text-center text-[9px] leading-tight text-muted-foreground">
                        {hint}
                    </span>
                )}
            </div>
        </>
    )

    const cardClasses = cn(
        'relative flex w-full flex-col items-center gap-2 rounded-md border bg-card p-2 text-xs shadow-xs transition-all duration-200 hover:shadow-md',
        active
            ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20'
            : 'border-border hover:bg-accent',
        interactive && 'cursor-pointer',
        className
    )

    if (!interactive) {
        return <div className={cardClasses}>{content}</div>
    }

    return (
        <button type="button" onClick={onClick} className={cn(cardClasses, 'text-left')}>
            {content}
        </button>
    )
}
