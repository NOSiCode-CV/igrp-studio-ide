import { cn } from '@renderer/lib/utils'
import type React from 'react'
import type { CardComponentProps } from '../CardComponent'
import IGRPStudioContainer from './Container'

/**
 * Canvas previews for the engine's overlay components (`popover`,
 * `hoverCard`, `sheet`, `drawer`, `tooltip`). The generated components
 * render through portals and are invisible until triggered, so the canvas
 * shows a static trigger + open panel instead — same approach as the
 * Dropdown wrapper.
 *
 * The engine's default template renders `resourceConfig.children` inside
 * these components, so the panel body is a droppable area (delegated to
 * IGRPStudioContainer). `tooltip` is the exception — its text comes from
 * the `content` prop, so it stays fully static.
 */

type OverlayProps = CardComponentProps & {
    label?: React.ReactNode
    content?: React.ReactNode
    title?: React.ReactNode
    description?: React.ReactNode
    side?: string
}

const TriggerChip = ({ label }: { label: React.ReactNode }): React.ReactElement => (
    <div className="inline-flex w-fit items-center rounded-md border bg-background px-3 py-1.5 text-sm font-medium shadow-xs">
        {label}
    </div>
)

const DroppableBody = ({
    comp,
    group,
    hoverClass,
    onDragEnd
}: CardComponentProps): React.ReactElement => (
    <IGRPStudioContainer
        comp={comp}
        group={group}
        hoverClass={hoverClass}
        onDragEnd={onDragEnd}
        className="min-h-16"
    />
)

export const IGRPStudioPopover = ({
    label,
    className,
    ...cardProps
}: OverlayProps): React.ReactElement => (
    <div className={cn('w-fit space-y-1', className)}>
        <TriggerChip label={label || 'Popover'} />
        <div className="w-64 rounded-md border bg-popover p-2 text-sm text-popover-foreground shadow-md">
            <DroppableBody {...cardProps} />
        </div>
    </div>
)

export const IGRPStudioHoverCard = ({
    label,
    className,
    ...cardProps
}: OverlayProps): React.ReactElement => (
    <div className={cn('w-fit space-y-1', className)}>
        <span className="text-sm font-medium underline decoration-dotted underline-offset-4">
            {label || 'Hover me'}
        </span>
        <div className="w-64 rounded-md border bg-popover p-2 text-sm text-popover-foreground shadow-md">
            <DroppableBody {...cardProps} />
        </div>
    </div>
)

export const IGRPStudioSheet = ({
    title,
    description,
    side,
    className,
    ...cardProps
}: OverlayProps): React.ReactElement => {
    const panel = (
        <div className="flex h-full w-full flex-col gap-2 bg-background p-3 shadow-lg">
            <div className="space-y-1">
                <p className="text-sm font-semibold">{title || 'Sheet'}</p>
                <p className="text-xs text-muted-foreground">
                    {description || 'Sheet description'}
                </p>
            </div>
            <DroppableBody {...cardProps} />
        </div>
    )

    return (
        <div className={cn('flex min-h-40 w-full overflow-hidden rounded-md border', className)}>
            {side === 'left' && <div className="w-1/3 min-w-40 border-r">{panel}</div>}
            <div className="flex flex-1 items-center justify-center bg-muted/40 text-xs text-muted-foreground">
                Page
            </div>
            {side !== 'left' && <div className="w-1/3 min-w-40 border-l">{panel}</div>}
        </div>
    )
}

export const IGRPStudioTooltip = ({
    label,
    content,
    className
}: OverlayProps): React.ReactElement => (
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
    className,
    ...cardProps
}: OverlayProps): React.ReactElement => (
    <div
        className={cn('flex min-h-40 w-full flex-col overflow-hidden rounded-md border', className)}
    >
        <div className="flex flex-1 items-center justify-center bg-muted/40 text-xs text-muted-foreground">
            Page
        </div>
        <div className="space-y-2 border-t bg-background p-3 shadow-lg">
            <div className="mx-auto h-1.5 w-10 rounded-full bg-muted" />
            <div className="space-y-1">
                <p className="text-sm font-semibold">{title || 'Drawer'}</p>
                <p className="text-xs text-muted-foreground">
                    {description || 'Drawer description'}
                </p>
            </div>
            <DroppableBody {...cardProps} />
        </div>
    </div>
)
