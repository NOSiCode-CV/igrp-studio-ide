import { IGRPHeadline, IGRPIcon } from '@igrp/igrp-framework-react-design-system'
import Draggable from '@renderer/lib/dnd/Draggable'
import Droppable from '@renderer/lib/dnd/Droppable'
import type { StructuredComponent } from '@renderer/lib/dnd/types'
import { cn } from '@renderer/lib/utils'
import { COMPONENT } from '../../ComponentTypes'
import { useDroppedComponents } from '../../contexts/EditorContext'
import { getHoverClasses } from '../../utils/tailwindGroups'
import type { CardComponentProps } from '../CardComponent'
import BoxWrapper from '../tools/BoxWrapper'

const IGRPStudioInfoCard = ({ comp, group, hoverClass, onDragEnd }: CardComponentProps) => {
    const {
        children: components,
        id: componentId,
        componentName: parentComponentName,
        properties
    } = comp || {}

    const { title } = properties

    const { setEditingComponent } = useDroppedComponents()

    const handleEdit = async (component: StructuredComponent, path: string) => {
        setEditingComponent({
            path,
            component
        })
    }

    //RESET Hover if parent is diff current component
    const { group: _group, hoverClass: _hoverClass } = getHoverClasses({
        group,
        hoverClass,
        componentName: COMPONENT.Container
    })

    const renderInfoSection = (comp: StructuredComponent) => {
        const { children: components, componentName } = comp
        const { className } = properties
        const path = `${parentComponentName}/${componentName}`
        return (
            <Droppable
                className={cn('flex w-full flex-col gap-2', className)}
                onDrop={onDragEnd}
                component={comp}
                path={parentComponentName}
            >
                {components.length > 0 &&
                    components.map((child, index) => {
                        const { properties } = child

                        return (
                            <Draggable
                                key={child.id}
                                item={child}
                                index={index}
                                mode="MOVE"
                                dropTargetId={componentId}
                                layout="horizontal"
                                className={cn('p-1')}
                            >
                                <BoxWrapper
                                    parentComp={comp}
                                    comp={child}
                                    onEdit={() => handleEdit(child, path)}
                                    group="group/info-section"
                                    className="top-0 opacity-0 group-hover/info-section:opacity-100"
                                >
                                    <IGRPInfoField item={properties}></IGRPInfoField>
                                </BoxWrapper>
                            </Draggable>
                        )
                    })}
            </Droppable>
        )
    }

    return (
        <div className={cn('space-y-3 relative p-3', properties?.className)}>
            <IGRPHeadline title={title}></IGRPHeadline>
            {components &&
                components.length > 0 &&
                components.map((child: StructuredComponent, index: number) => {
                    return (
                        <Draggable
                            key={child.id}
                            item={child}
                            index={index}
                            dropTargetId={componentId}
                            mode="MOVE"
                            className="space-y-2 flex flex-col"
                        >
                            <BoxWrapper
                                comp={child}
                                parentComp={comp}
                                onEdit={() => handleEdit(child, parentComponentName)}
                                group={_group ?? `group/info-card`}
                                className={cn(
                                    'space-y-1 flex flex-col opacity-0',
                                    _hoverClass ?? 'group-hover/info-card:opacity-100'
                                )}
                            >
                                {renderInfoSection(child)}
                            </BoxWrapper>
                        </Draggable>
                    )
                })}
        </div>
    )
}

function IGRPInfoField({ item }: any) {
    return (
        <div className={cn('flex flex-col space-y-0.5')}>
            <span className="text-sm font-medium">{item.label}</span>
            <div className="flex items-center gap-2">
                {item.icon && (
                    <div className="flex items-center gap-2">
                        <IGRPIcon iconName={item.icon} className={item.iconClassName} />
                    </div>
                )}
                <span>{item.text}</span>
            </div>
        </div>
    )
}

export default IGRPStudioInfoCard
