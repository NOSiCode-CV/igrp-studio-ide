import Draggable from '@renderer/lib/dnd/Draggable'
import Droppable from '@renderer/lib/dnd/Droppable'
import type { StructuredComponent } from '@renderer/lib/dnd/types'
import { cn } from '@renderer/lib/utils'
import type React from 'react'
import { useCallback } from 'react'
import { generateAllClasses } from '../../components/settings/style/utils'
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext'
import CardComponent, { type CardComponentProps } from '../CardComponent'
import BoxWrapper from '../tools/BoxWrapper'
import TableTool from '../tools/tableTool'

const IGRPStudioCard: React.FC<CardComponentProps> = ({ comp, onDragEnd }) => {
    const { children: components, componentName: parentComponentName } = comp

    const { setEditingComponent } = useDroppedComponents()

    const handleEdit = useCallback(
        (component: StructuredComponent, path: string) => {
            setEditingComponent({ path, component })
        },
        [setEditingComponent]
    )

    const renderChildComp = useCallback(
        (component: StructuredComponent, className: string, childClassName: string) => {
            const { children: childComponents, id: componentId } = component
            const path = parentComponentName

            return (
                <Droppable component={component} onDrop={onDragEnd} className={cn(className)}>
                    {childComponents.length > 0 &&
                        childComponents.map((child, index) => {
                            return (
                                <Draggable
                                    key={child.id}
                                    item={child}
                                    index={index}
                                    mode="MOVE"
                                    dropTargetId={componentId}
                                    layout="horizontal"
                                    className={cn(childClassName)}
                                >
                                    <BoxWrapper
                                        parentComp={comp}
                                        comp={child}
                                        onEdit={() => handleEdit(child, path)}
                                        group="group/card-content-item"
                                        className="opacity-0 group-hover/card-content-item:opacity-100"
                                    >
                                        <CardComponent comp={child} onDragEnd={onDragEnd} />
                                    </BoxWrapper>
                                </Draggable>
                            )
                        })}
                </Droppable>
            )
        },
        [handleEdit, onDragEnd, parentComponentName, comp]
    )

    return (
        <div className="w-full flex flex-col py-3 space-y-3">
            {components.map((child, index) => {
                const { properties, style, childProperties } = child
                const { className, ...args } = properties || {}

                const { className: childClassName } = childProperties || {}

                const classes = generateAllClasses(style)

                return (
                    <div
                        key={index}
                        {...args}
                        className={cn(
                            'bg-card rounded-lg border border-dashed border-gray-400 p-2'
                        )}
                    >
                        <TableTool
                            parentComp={comp}
                            comp={child}
                            onEdit={() => handleEdit(child, parentComponentName)}
                            group="group/card-comp"
                            className="-top-4 popacity-0 group-hover/card-comp:opacity-100"
                            index={index}
                        />
                        {renderChildComp(child, cn(`${classes}, ${className}`), childClassName)}
                    </div>
                )
            })}
        </div>
    )
}

export default IGRPStudioCard
