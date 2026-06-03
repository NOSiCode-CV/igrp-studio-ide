import type { DragEvent, ReactNode } from 'react'
import { cn } from '@renderer/lib/utils'
import { DropZone } from './DropZone'
import { useDragDrop } from './drag-drop-context'
import type { DraggableItem, LayoutMode } from './types'

export interface DraggableProps<T extends DraggableItem = DraggableItem> {
    index?: number
    dropTargetId?: string
    className?: string
    item: T
    layout?: LayoutMode
    dropZone?: boolean
    children: ReactNode
    type?: string
    mode?: 'DROP' | 'MOVE'
    isDisabled?: boolean
}

/**
 * Generic draggable wrapper. Serializes the entire `item` payload via the
 * native `dataTransfer` API; consumers downstream parse it back as their
 * own type. Concrete generators provide a typed re-export — see
 * `@renderer/lib/dnd/Draggable` for the `StructuredComponent` adapter.
 */
function Draggable<T extends DraggableItem = DraggableItem>({
    item,
    dropTargetId,
    className,
    index = 0,
    dropZone = true,
    layout = 'vertical',
    type = 'DEFAULT',
    mode = 'DROP',
    children
}: DraggableProps<T>) {
    const { id: componentId } = item

    const {
        draggedId,
        onDragStart,
        onDragEnd,
        activeDropZone,
        handleDragLeave,
        handleDragOver,
        setLayoutMode,
        handleDragStartComponent
    } = useDragDrop()

    const handleLayoutChange = (next: LayoutMode) => {
        setLayoutMode(next)
    }

    const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
        onDragStart(item)
        handleDragStartComponent(e, componentId)
        e.dataTransfer.setData('text/plain', JSON.stringify(item))
        e.dataTransfer.setData('type', JSON.stringify(type))
        e.dataTransfer.setData('mode', JSON.stringify(mode))
        e.dataTransfer.setData('draggableIndex', JSON.stringify(index))
        e.dataTransfer.setData('dropTargetId', JSON.stringify(dropTargetId))
    }

    return (
        <div
            draggable
            onDragStartCapture={handleDragStart}
            onDragEnd={onDragEnd}
            onDragLeave={handleDragLeave}
            onDragOver={(e) => {
                handleDragOver({
                    e,
                    id: componentId,
                    cellIndex: index,
                    dropTargetId,
                    countItems: item.children?.length || 0
                })
                handleLayoutChange(layout)
            }}
            className={cn(
                mode === 'MOVE' && 'min-w-42',
                dropZone &&
                    'relative border border-dashed  hover:border-primary/50 rounded-lg bg-card transition-all p-2',
                draggedId === componentId && dropZone
                    ? 'opacity-25 border-primary bg-primary/35'
                    : 'border-border',
                className
            )}
            id={`drag-${componentId}`}
        >
            {dropZone && (
                <DropZone
                    layoutMode={layout}
                    activeDropZone={activeDropZone}
                    componentId={componentId}
                />
            )}
            {children}
        </div>
    )
}

export default Draggable
