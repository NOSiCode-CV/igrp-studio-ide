import { cn } from '@renderer/lib/utils'
import type React from 'react'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import type { CardComponentProps } from '../CardComponent'
import IGRPStudioContainer from './Container'

/**
 * Droppable shells for engine components that are plain wrappers around
 * arbitrary children (`scrollArea`, `aspectRatio`). The engine registers
 * them without childrenTypes — exactly like `container`/`section`/`flex` —
 * so accepting drops is purely a Studio-side wrapper concern. Each shell
 * draws the component's visual chrome and delegates child drop/drag/edit
 * handling to IGRPStudioContainer.
 */

export const IGRPStudioScrollAreaContainer = ({
    comp,
    group,
    hoverClass,
    onDragEnd,
    className
}: CardComponentProps): React.ReactElement => (
    <ScrollArea className={cn('h-48 w-full rounded-md border', className)}>
        <IGRPStudioContainer
            comp={comp}
            group={group}
            hoverClass={hoverClass}
            onDragEnd={onDragEnd}
            className="min-h-full"
        />
    </ScrollArea>
)

export const IGRPStudioAspectRatioContainer = ({
    comp,
    group,
    hoverClass,
    onDragEnd,
    className,
    ratio
}: CardComponentProps & { ratio?: number }): React.ReactElement => (
    <div
        className={cn('w-full overflow-hidden rounded-md border', className)}
        style={{ aspectRatio: Number(ratio) > 0 ? Number(ratio) : 16 / 9 }}
    >
        <IGRPStudioContainer
            comp={comp}
            group={group}
            hoverClass={hoverClass}
            onDragEnd={onDragEnd}
            className="h-full"
        />
    </div>
)
