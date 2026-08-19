import { type CSSProperties, type DragEvent, type ReactNode, useEffect, useState } from 'react'
import { cn } from '@renderer/lib/utils'
import { useDragDrop } from './drag-drop-context'
import type { DraggableItem, DragEndResult, LayoutMode } from './types'

/**
 * Tree-shaped item the generic Droppable can host. Concrete generators pin
 * a richer type via the wrapping adapter — see `@renderer/lib/dnd/Droppable`
 * for the `StructuredComponent` shim that wires the manifest model in.
 */
export interface DroppableContainer extends DraggableItem {
    componentName?: string
    children: DroppableContainer[]
}

export interface DroppableProps<T extends DroppableContainer = DroppableContainer> {
    onDrop: (result: DragEndResult) => void
    component: T
    layout?: string
    children: ReactNode
    className?: string
    style?: CSSProperties
    accept?: string[]
    path?: string
    /**
     * Rendered when `component.children` is empty. Generators ship their own
     * empty-state — the UI generator pipes in `<GenNoInfoComp>` while a
     * Specification chat target might render a `(drop a component here)`
     * helper. Receives `isHovered` so the empty state can react to drag-over.
     */
    emptyState?: (props: { isHovered: boolean }) => ReactNode
}

function Droppable<T extends DroppableContainer = DroppableContainer>({
    onDrop,
    component,
    children,
    className,
    style,
    path,
    emptyState
}: DroppableProps<T>) {
    const { id: componentId, componentName, children: components } = component || ({} as T)

    const [targetHovered, setTargetHovered] = useState<string>('')
    const [isItemOverEmpty, setIsItemOverEmpty] = useState<boolean>(false)

    const {
        activeDropZone,
        draggingItem,
        setComponents,
        handleDrop,
        handleDragLeave,
        handleDragOver,
        setLayoutMode
    } = useDragDrop()

    const handleLayoutChange = (next: LayoutMode) => {
        setLayoutMode(next)
    }

    const handleDropItem = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        const droppedItem = handleDrop(e, componentId)
        onDrop({
            ...droppedItem,
            destination: {
                ...droppedItem.destination,
                droppableName: componentName,
                droppablePath: path
            } as DragEndResult['destination']
        })
        setIsItemOverEmpty(false)
        setTargetHovered('')
    }

    const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        handleDragLeave(e)
        setTargetHovered('')
        setIsItemOverEmpty(false)
    }

    const onDragOverCapture = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setTargetHovered((e.target as HTMLElement)?.id)
        setIsItemOverEmpty(true)
    }

    const onDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        handleDragOver({
            e,
            id: componentId,
            cellIndex: 0,
            dropTargetId: componentId,
            countItems: components?.length || 0
        })
    }

    useEffect(() => {
        if (component) {
            handleLayoutChange
            setComponents(component.children)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [component])

    const isEmpty = !components || components.length === 0

    return (
        <div
            onDrop={handleDropItem}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDragOverCapture={onDragOverCapture}
            id={componentId}
            style={style}
            className={cn(
                'space-y-3 min-h-12 rounded-lg bg-card',
                Boolean(draggingItem) &&
                    (activeDropZone?.dropTargetId === componentId ||
                        targetHovered === componentId) &&
                    'bg-primary/35',
                !isEmpty && 'p-3',
                className
            )}
        >
            {isEmpty ? (emptyState ? emptyState({ isHovered: isItemOverEmpty }) : null) : children}
        </div>
    )
}

export default Droppable
