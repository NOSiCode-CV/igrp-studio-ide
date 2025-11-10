import React from 'react'
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext'
import { cn } from '@renderer/lib/utils'
import { EmptySlotComponent } from '../../components/EmptySlotComponent'
import { StructuredComponent } from '@renderer/lib/dnd/types'
import Draggable from '@renderer/lib/dnd/Draggable'
import Droppable from '@renderer/lib/dnd/Droppable'
import BoxWrapper from '../tools/BoxWrapper'
import CardComponent, { CardComponentProps } from '../CardComponent'
import { useResponsiveClasses } from '../../utils/layout-mapping'

const IGRPStudioColumn: React.FC<CardComponentProps> = ({
  comp,
  onDragEnd
}: CardComponentProps) => {
  const { children, id: componentId } = comp

  const { variant, className } = comp.properties

  const { setEditingComponent } = useDroppedComponents()

  const handleEditClick = (component: StructuredComponent) => {
    setEditingComponent({
      path: '',
      component
    })
  }

  const renderComponents = () => {
    if (children.length === 0) return <EmptySlotComponent />

    return children.map((child: StructuredComponent, index: number) => {
      return (
        <Draggable key={child.id} item={child} index={index} dropTargetId={componentId} mode="MOVE">
          <BoxWrapper
            parentComp={comp}
            comp={child}
            group="group/column"
            onEdit={() => handleEditClick(child)}
            className="opacity-0 group-hover/column:opacity-100"
          >
            <CardComponent comp={child} onDragEnd={onDragEnd} />
          </BoxWrapper>
        </Draggable>
      )
    })
  }

  // Gera as classes responsivas usando o hook personalizado
  const { classes: finalClasses } = useResponsiveClasses(variant, 'span', className)

  return (
    <Droppable component={comp} onDrop={onDragEnd} className={cn(finalClasses)}>
      {renderComponents()}
    </Droppable>
  )
}

export default IGRPStudioColumn
