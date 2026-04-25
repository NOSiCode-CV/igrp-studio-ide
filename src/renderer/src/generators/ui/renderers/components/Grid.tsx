import Draggable from '@renderer/lib/dnd/Draggable'
import Droppable from '@renderer/lib/dnd/Droppable'
import type { StructuredComponent } from '@renderer/lib/dnd/types'
import { cn } from '@renderer/lib/utils'
import type React from 'react'
import { EmptySlotComponent } from '../../components/EmptySlotComponent'
import { useDroppedComponents } from '../../contexts/EditorContext'
import { useResponsiveClasses } from '../../utils/layout-mapping'
import CardComponent, { type CardComponentProps } from '../CardComponent'
import BoxWrapper from '../tools/BoxWrapper'

const IGRPStudioGrid: React.FC<CardComponentProps> = ({
    comp,
    onDragEnd,
    className
}: CardComponentProps) => {
    const { children, properties, id: componentId } = comp

    const { variant } = properties || {}

    const { setEditingComponent } = useDroppedComponents()

    const handleEditClick = (component: StructuredComponent) => {
        setEditingComponent({
            path: '',
            component
        })
    }

    const renderChild = () => {
        const fields =
            children.length > 0 &&
            children.map((comp: StructuredComponent, index: number) => {
                return (
                    <Draggable
                        key={comp.id}
                        item={comp}
                        layout="horizontal"
                        index={index}
                        dropTargetId={componentId}
                        mode="MOVE"
                        className="border-none p-1"
                    >
                        <BoxWrapper
                            comp={comp}
                            onEdit={() => handleEditClick(comp)}
                            group="group/comp-grid"
                            className="opacity-0 group-hover/comp-grid:opacity-100 -top-4"
                        >
                            <CardComponent comp={comp} onDragEnd={onDragEnd} />
                        </BoxWrapper>
                    </Draggable>
                )
            })

        const emptySlots = variant && variant?.default?.replace('cols', 0) - children.length
        const emptySlotComponents = Array.from({ length: emptySlots }, (_, index) => (
            <div key={`empty-slot-${index}`}>
                <EmptySlotComponent />
            </div>
        ))

        return (
            <>
                {fields}
                {emptySlotComponents}
            </>
        )
    }

    // Gera as classes responsivas usando o hook personalizado
    const { classes: finalClasses } = useResponsiveClasses(variant, 'grid', className)

    return (
        <Droppable
            component={comp}
            onDrop={onDragEnd}
            layout="horizontal"
            className={cn(finalClasses)}
        >
            {renderChild()}
        </Droppable>
    )
}

export default IGRPStudioGrid
