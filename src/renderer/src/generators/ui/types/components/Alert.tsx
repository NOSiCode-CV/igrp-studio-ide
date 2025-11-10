import Droppable from '@renderer/lib/dnd/Droppable'
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext'
import { DragEndResult, StructuredComponent } from '@renderer/lib/dnd/types'
import { cn } from '@renderer/lib/utils'
import Draggable from '@renderer/lib/dnd/Draggable'
import BoxContainer from '../tools/BoxWrapper'
import CardComponent, { CardComponentProps } from '../CardComponent'
import { COMPONENT } from '../../ComponentTypes'
import { getHoverClasses } from '../../utils/tailwindGroups'
import { IGRPAlert } from '@igrp/igrp-framework-react-design-system'

const IGRPStudioAlert = ({ comp, group, hoverClass, className, onDragEnd }: CardComponentProps) => {
  const { children: components, id: componentId, properties } = comp || {}

  const { setEditingComponent } = useDroppedComponents()

  const handleDrop = (item: DragEndResult) => {
    onDragEnd(item)
  }

  const handleEdit = async (component: StructuredComponent) => {
    setEditingComponent({
      path: '',
      component
    })
  }

  //RESET Hover if parent is diff current component
  const { group: _group, hoverClass: _hoverClass } = getHoverClasses({
    group,
    hoverClass,
    componentName: COMPONENT.Container
  })

  return (
    <Droppable onDrop={handleDrop} component={comp} className={cn(className)}>
      <IGRPAlert {...properties}>
        {components &&
          components.length > 0 &&
          components.map((comp: StructuredComponent, index: number) => {
            return (
              <Draggable
                key={comp.id}
                item={comp}
                index={index}
                dropTargetId={componentId}
                mode="MOVE"
              >
                <BoxContainer
                  comp={comp}
                  onEdit={() => handleEdit(comp)}
                  group={_group ?? `group/row-alert`}
                  className={cn(
                    'top-2 opacity-0',
                    _hoverClass ?? 'group-hover/row-alert:opacity-100'
                  )}
                >
                  <CardComponent
                    comp={comp}
                    onDragEnd={onDragEnd}
                    group="group/row-alert-child"
                    hoverClass="group-hover/row-alert-child:opacity-100 left-0 right-auto"
                  />
                </BoxContainer>
              </Draggable>
            )
          })}
      </IGRPAlert>
    </Droppable>
  )
}

export default IGRPStudioAlert
