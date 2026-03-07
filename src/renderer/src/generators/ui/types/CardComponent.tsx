import type { DragEndResult, StructuredComponent } from '@renderer/lib/dnd/types'
import { cn } from '@renderer/lib/utils'
import type { JSX } from 'react'
import { COMPONENT_MAP, ICON_MAP } from '../ComponentTypes'
import { generateAllClasses } from '../components/settings/style/utils'
import { useFakedata } from '../hooks/useFakeData'
import IGRPStudioCustomComponent from './components/CustomComponent'

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
                //@ts-expect-error - This is a workaround to allow the component to be rendered
                <Component
                    {...args}
                    {...FAKE_COMPONENT_DATA?.properties}
                    {...iconProps}
                    className={cn(classes, className)}
                    comp={comp}
                    onDragEnd={onDragEnd}
                    hoverClass={hoverClass}
                    group={group}
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
