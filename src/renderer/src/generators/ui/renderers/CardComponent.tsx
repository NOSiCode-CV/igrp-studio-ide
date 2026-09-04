import type { DragEndResult, StructuredComponent } from '@renderer/lib/dnd/types'
import { cn } from '@renderer/lib/utils'
import type { JSX } from 'react'
import { COMPONENT_MAP } from '../ComponentTypes'
import { generateAllClasses } from '../components/settings/style/utils'
import { useFakedata } from '../hooks/useFakeData'
import { omitInternalProperties } from '../utils/omitInternalProperties'
import IGRPStudioCustomComponent from './components/CustomComponent'

export interface CardComponentProps {
    comp: StructuredComponent
    onDragEnd: (result: DragEndResult) => void
    group?: string
    hoverClass?: string
    className?: string
}

/**
 * Canvas wrappers that read `hoverClass`/`group`. Leaf DS hosts must not receive them.
 * String literals (not `COMPONENT.*`) so this module can load while ComponentTypes
 * is still initializing Flex/Container — `COMPONENT` is in the TDZ during that cycle.
 */
const CANVAS_HOVER_COMPONENTS = new Set<string>([
    'container',
    'flex',
    'alert',
    'textList',
    'infoCard',
    'scrollArea',
    'aspectRatio',
    'tableRowSubcomponent',
    'popover',
    'hoverCard',
    'sheet',
    'drawer',
    'tooltip'
])

const CardComponent = ({ comp, group, hoverClass, onDragEnd }: CardComponentProps): JSX.Element => {
    const { getFakeComponentData } = useFakedata()

    const { componentName, properties, style } = comp

    const { iconProperties, className, content, label, ...rest } = properties || {}
    const args = omitInternalProperties(rest)

    const Component = COMPONENT_MAP[componentName]

    const FAKE_COMPONENT_DATA = getFakeComponentData(componentName)

    const classes = generateAllClasses(style)

    // Extract icon properties for button components
    const iconProps = iconProperties
        ? {
              ...iconProperties
          }
        : {}

    const canvasHoverProps = CANVAS_HOVER_COMPONENTS.has(componentName)
        ? { hoverClass, group }
        : {}

    return (
        <>
            {Component ? (
                <Component
                    {...args}
                    {...omitInternalProperties(FAKE_COMPONENT_DATA?.properties)}
                    {...iconProps}
                    className={cn(classes, className)}
                    comp={comp}
                    onDragEnd={onDragEnd}
                    {...canvasHoverProps}
                    label={label}
                >
                    {content || FAKE_COMPONENT_DATA?.properties?.content}
                </Component>
            ) : (
                <IGRPStudioCustomComponent comp={comp} onDragEnd={onDragEnd} />
            )}
        </>
    )
}

export default CardComponent
