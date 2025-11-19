import React from 'react'
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext'
import { cn } from '@renderer/lib/utils'
import { StructuredComponent } from '@renderer/lib/dnd/types'
import Draggable from '@renderer/lib/dnd/Draggable'
import { useResponsiveClasses, generateResponsiveClasses } from '../../utils/layout-mapping'
import BoxWrapper from '../tools/BoxWrapper'
import CardComponent, { CardComponentProps } from '../CardComponent'
import { GenNoInfoComp } from '../../components/GenNoInfoComp'

const IGRPStudioColumns: React.FC<CardComponentProps> = ({
  comp,
  onDragEnd
}: CardComponentProps) => {
  const { children, properties, componentName } = comp

  const { variant, className } = properties || {}

  const { setEditingComponent } = useDroppedComponents()

  const handleEditClick = (component: StructuredComponent) => {
    setEditingComponent({
      path: componentName,
      component
    })
  }

  const renderColumns = () => {
    return children.map((comp: StructuredComponent, index: number) => {
      const { properties } = comp
      const { variant, className } = properties || {}

      // Use the function directly instead of the hook
      const finalClasses = generateResponsiveClasses(variant)
      const spanClasses = `span ${finalClasses} ${className || ''}`.trim()

      return (
        <Draggable key={comp.id} item={comp} index={index} dropZone={true} className={spanClasses}>
          <BoxWrapper
            comp={comp}
            parentComp={comp}
            onEdit={() => handleEditClick(comp)}
            group="group/comp-columns"
            className="opacity-0 group-hover/comp-columns:opacity-100"
          >
            <CardComponent comp={comp} onDragEnd={onDragEnd} />
          </BoxWrapper>
        </Draggable>
      )
    })
  }

  // Gera as classes responsivas usando o hook personalizado
  const { classes: finalClasses } = useResponsiveClasses(variant, 'grid', className)

  return (
    <div className={cn('p-2 py-5', children.length > 0 && finalClasses)}>
      {children.length > 0 ? renderColumns() : <GenNoInfoComp type="COLUMNS" />}
    </div>
  )
}

export default IGRPStudioColumns
