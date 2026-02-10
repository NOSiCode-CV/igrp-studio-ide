import { useDroppedComponents } from '../../dnd/DroppedComponentsContext'
import { DragEndResult, StructuredComponent } from '@renderer/lib/dnd/types'
import Droppable from '@renderer/lib/dnd/Droppable'
import { cn } from '@renderer/lib/utils'
import Draggable from '@renderer/lib/dnd/Draggable'
import BoxField from '../tools/BoxFields'
import { IGRPPageHeader } from '@igrp/igrp-framework-react-design-system'
import CardComponent from '../CardComponent'

export interface PageHeaderProps {
  comp: StructuredComponent
  onDragEnd: (result: DragEndResult) => void
  isDisabled?: boolean
}

const IGRPStudioPageHeader: React.FC<PageHeaderProps> = ({ comp, onDragEnd }: PageHeaderProps) => {
  const { id: componentId, children: buttonComponents, componentName, label, properties } = comp
  const { title } = properties

  const { setEditingComponent } = useDroppedComponents()

  const handleEditClick = (component: StructuredComponent): void => {
    setEditingComponent({
      path: '',
      component
    })
  }

  const renderButtons = (): React.ReactNode => {
    return buttonComponents.map((button: StructuredComponent, index: number) => {
      return (
        <Draggable
          key={button.id}
          item={button}
          index={index}
          dropTargetId={componentId}
          layout="horizontal"
          className="p-1"
          mode="MOVE"
        >
          <BoxField
            comp={button}
            parentComp={comp}
            onEdit={() => handleEditClick(button)}
            index={index}
          >
            <CardComponent comp={button} onDragEnd={onDragEnd} />
          </BoxField>
        </Draggable>
      )
    })
  }

  return (
    <IGRPPageHeader
      title={title || label || componentName}
      {...properties}
      showBackButton={false}
    >
      <Droppable
        component={comp}
        onDrop={onDragEnd}
        layout="horizontal"
        className={cn('flex flex-1 justify-end gap-3')}
      >
        {renderButtons()}
      </Droppable>
    </IGRPPageHeader>
  )
}

export default IGRPStudioPageHeader
