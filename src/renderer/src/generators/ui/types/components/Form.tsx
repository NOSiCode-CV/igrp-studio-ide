import React from 'react'
import { cn } from '@renderer/lib/utils'
import { StructuredComponent } from '@renderer/lib/dnd/types'
import Draggable from '@renderer/lib/dnd/Draggable'
import Droppable from '@renderer/lib/dnd/Droppable'
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext'
import { formVariants } from '../../utils/layout-mapping'
import BoxWrapper from '../tools/BoxWrapper'
import CardComponent, { CardComponentProps } from '../CardComponent'

const IGRPStudioForm: React.FC<CardComponentProps> = ({ comp, onDragEnd }) => {
  const { id: componentId, properties, children } = comp
  const { className, variant } = properties || {}

  const { setEditingComponent } = useDroppedComponents()

  const handleEditClick = (component: StructuredComponent) => {
    setEditingComponent({
      path: '',
      component
    })
  }

  const renderFields = () => {
    return children.map((comp: StructuredComponent, index: number) => {
      return (
        <Draggable
          key={comp.id}
          item={comp}
          index={index}
          dropTargetId={componentId}
          className="p-1"
          mode="MOVE"
        >
          <BoxWrapper
            comp={comp}
            onEdit={() => handleEditClick(comp)}
            group="group/comp-form"
            className="opacity-0 group-hover/comp-form:opacity-100"
          >
            <CardComponent comp={comp} onDragEnd={onDragEnd} />
          </BoxWrapper>
        </Draggable>
      )
    })
  }

  return (
    <Droppable
      component={comp}
      onDrop={onDragEnd}
      className={cn(formVariants({ variant, className }))}
    >
      {renderFields()}
    </Droppable>
  )
}

export default IGRPStudioForm
