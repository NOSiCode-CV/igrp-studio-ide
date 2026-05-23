/**
 * UI-generator adapter — `Droppable` pinned to `StructuredComponent` and
 * defaulting `emptyState` to the manifest-specific `<GenNoInfoComp>`. The
 * generic primitive in `@renderer/features/dnd/Droppable` accepts any
 * tree-shaped item and any empty-state renderer.
 */

import type { ReactNode } from 'react'
import { GenNoInfoComp } from '@renderer/generators/ui/components/GenNoInfoComp'
import GenericDroppable from '@renderer/features/dnd/Droppable'
import type { DragEndResult, StructuredComponent } from './types'

interface DroppableProps {
    onDrop: (result: DragEndResult) => void
    component: StructuredComponent
    layout?: string
    children: ReactNode
    className?: string
    accept?: string[]
    path?: string
}

const Droppable = ({
    onDrop,
    component,
    children,
    className,
    path,
    accept,
    layout
}: DroppableProps) => (
    <GenericDroppable<StructuredComponent>
        onDrop={onDrop as (result: import('@renderer/features/dnd/types').DragEndResult) => void}
        component={component}
        layout={layout}
        accept={accept}
        path={path}
        className={className}
        emptyState={({ isHovered }) => <GenNoInfoComp isActive={isHovered} />}
    >
        {children}
    </GenericDroppable>
)

export default Droppable
