import { cn } from '@renderer/lib/utils'
import type React from 'react'

/**
 * Static canvas previews for the engine's overlay components (`popover`,
 * `hoverCard`, `sheet`, `drawer`). The generated components render through
 * portals and are invisible until triggered, so the canvas shows a static
 * trigger + panel mock instead — same approach as the Dropdown wrapper.
 * These are engine *leaf* components: internal structure is generated code,
 * so nothing here is droppable.
 */

interface OverlayPreviewProps {
    label?: React.ReactNode
    content?: React.ReactNode
    className?: string
}

const TriggerChip = ({ label }: { label: React.ReactNode }): React.ReactElement => (
    <div className="inline-flex w-fit items-center rounded-md border bg-background px-3 py-1.5 text-sm font-medium shadow-xs">
        {label}
    </div>
)

export const IGRPStudioPopover = ({
    label,
    content,
    className
}: OverlayPreviewProps): React.ReactElement => (
    <div className={cn('w-fit space-y-1', className)}>
        <TriggerChip label={label || 'Popover'} />
        <div className="w-64 rounded-md border bg-popover p-4 text-sm text-popover-foreground shadow-md">
            {content || 'Popover content'}
        </div>
    </div>
)

export const IGRPStudioHoverCard = ({
    label,
    content,
    className
}: OverlayPreviewProps): React.ReactElement => (
    <div className={cn('w-fit space-y-1', className)}>
        <span className="text-sm font-medium underline decoration-dotted underline-offset-4">
            {label || 'Hover me'}
        </span>
        <div className="w-64 rounded-md border bg-popover p-4 text-sm text-popover-foreground shadow-md">
            {content || 'Hover card content'}
        </div>
    </div>
)

export const IGRPStudioSheet = ({
    title,
    description,
    side,
    className
}: OverlayPreviewProps & {
    title?: React.ReactNode
    description?: React.ReactNode
    side?: string
}): React.ReactElement => {
    const panel = (
        <div className="w-1/3 min-w-40 space-y-1 bg-background p-3 shadow-lg">
            <p className="text-sm font-semibold">{title || 'Sheet'}</p>
            <p className="text-xs text-muted-foreground">{description || 'Sheet description'}</p>
        </div>
    )

    return (
        <div className={cn('flex h-40 w-full overflow-hidden rounded-md border', className)}>
            {side === 'left' && <div className="border-r">{panel}</div>}
            <div className="flex flex-1 items-center justify-center bg-muted/40 text-xs text-muted-foreground">
                Page
            </div>
            {side !== 'left' && <div className="border-l">{panel}</div>}
        </div>
    )
}

export const IGRPStudioTooltip = ({
    label,
    content,
    className
}: OverlayPreviewProps): React.ReactElement => (
    <div className={cn('flex w-fit flex-col items-center gap-1', className)}>
        <div className="rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground shadow-md">
            {content || 'Tooltip text'}
        </div>
        <TriggerChip label={label || 'Hover me'} />
    </div>
)

export const IGRPStudioDrawer = ({
    title,
    description,
    className
}: OverlayPreviewProps & {
    title?: React.ReactNode
    description?: React.ReactNode
}): React.ReactElement => (
    <div className={cn('flex h-40 w-full flex-col overflow-hidden rounded-md border', className)}>
        <div className="flex flex-1 items-center justify-center bg-muted/40 text-xs text-muted-foreground">
            Page
        </div>
        <div className="space-y-1 border-t bg-background p-3 shadow-lg">
            <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-muted" />
            <p className="text-sm font-semibold">{title || 'Drawer'}</p>
            <p className="text-xs text-muted-foreground">{description || 'Drawer description'}</p>
        </div>
    </div>
)
