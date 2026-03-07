import { type DragEvent, useEffect, useState } from 'react'
import { GenNoInfoComp } from '../../generators/ui/components/GenNoInfoComp'
import { cn } from '../utils'
import { useDragDrop } from './drag-drop-context'
import type { LayoutMode, StructuredComponent } from './types'

interface DroppableProps {
    onDrop: (result: any) => void
    component: StructuredComponent
    layout?: string
    children: React.ReactNode
    className?: string
    accept?: string[]
    path?: string
}

const Droppable = ({ onDrop, component, children, className, path }: DroppableProps) => {
    const { id: componentId, componentName, children: components } = component || {}

    const [targetHovered, setTargetHovered] = useState<string>('')
    const [isItemOverGenNoInfoComp, setIsItemOverGenNoInfoComp] = useState<boolean>(false)

    const {
        activeDropZone,
        draggingItem,
        setComponents,
        handleDrop,
        handleDragLeave,
        handleDragOver,
        setLayoutMode
    } = useDragDrop()

    const handleLayoutChange = (layout: LayoutMode) => {
        setLayoutMode(layout)
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
            }
        })
        setIsItemOverGenNoInfoComp(false)
        setTargetHovered('')
    }

    const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        handleDragLeave(e)
        setTargetHovered('')
        setIsItemOverGenNoInfoComp(false)
    }

    const onDragOverCapture = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setTargetHovered((e.target as HTMLElement)?.id)
        setIsItemOverGenNoInfoComp(true)
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
    }, [component])

    return (
        <div
            onDrop={handleDropItem}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDragOverCapture={onDragOverCapture}
            id={componentId}
            className={cn(
                'space-y-3 min-h-12 rounded-lg bg-card',
                draggingItem &&
                    (activeDropZone?.dropTargetId === componentId ||
                        targetHovered === componentId) &&
                    'bg-primary/35',
                components.length > 0 && 'p-3',
                className
            )}
        >
            {components.length === 0 ? (
                <GenNoInfoComp isActive={isItemOverGenNoInfoComp} />
            ) : (
                children
            )}
        </div>
    )
}

export default Droppable
