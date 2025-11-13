import { DragEndResult, StructuredComponent } from '@renderer/lib/dnd/types'
import { COMPONENT_MAP, ICON_MAP } from '../ComponentTypes'
import { useFakedata } from '../hooks/useFakeData'
import { generateAllClasses } from '../components/settings/style/utils'
import { cn } from '@renderer/lib/utils'
import { JSX } from 'react'

export interface CardComponentProps {
  comp: StructuredComponent
  onDragEnd: (result: DragEndResult) => void
  group?: string
  hoverClass?: string
  className?: string
}

const CardComponent = ({ comp, group, hoverClass, onDragEnd }: CardComponentProps): JSX.Element => {
  const { getFakeComponentData } = useFakedata()

  const { componentName, properties, style } = comp

  const { iconProperties, className, content, label, ...args } = properties || {}

  const componentLabel = content || label || properties?.label || componentName

  const Icon = ICON_MAP[componentName]

  const Component = COMPONENT_MAP[componentName]

  const FAKE_COMPONENT_DATA = getFakeComponentData(componentName)

  const classes = generateAllClasses(style)

  // Extract icon properties for button components
  const iconProps = iconProperties
    ? {
        ...iconProperties
      }
    : {}

  return (
    <>
      {Component ? (
        //@ts-ignore - This is a workaround to allow the component to be rendered
        <Component
          {...args}
          {...FAKE_COMPONENT_DATA?.properties}
          {...iconProps}
          className={cn(classes, className)}
          comp={comp}
          onDragEnd={onDragEnd}
          hoverClass={hoverClass}
          group={group}
        >
          {content || label || FAKE_COMPONENT_DATA?.properties?.content}
        </Component>
      ) : (
        <div className="rounded-lg shadow-xs border p-4 bg-card">
          <div className="flex items-center gap-3 flex-wrap md:flex-nowrap justify-center">
            {Icon && (
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
            )}
            <div className="text-sm font-medium text-muted-foreground truncate">
              {componentLabel}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default CardComponent
