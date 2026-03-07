import Draggable from '@renderer/lib/dnd/Draggable'
import Droppable from '@renderer/lib/dnd/Droppable'
import type { StructuredComponent } from '@renderer/lib/dnd/types'
import type React from 'react'
import { useCallback } from 'react'
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext'
import CardComponent, { type CardComponentProps } from '../CardComponent'
import BoxWrapper from '../tools/BoxWrapper'
import TableTool from '../tools/tableTool'

const IGRPStudioRepetitive: React.FC<CardComponentProps> = ({ comp, onDragEnd }) => {
    const { id: componentId, componentName: parentComponentName } = comp

    const { setEditingComponent } = useDroppedComponents()

    const handleEdit = useCallback(
        (component: StructuredComponent, path: string) => {
            setEditingComponent({ path, component })
        },
        [setEditingComponent]
    )

    const renderChildComp = useCallback(
        (component: StructuredComponent) => {
            const { children: childComponents } = component
            const path = parentComponentName

            return (
                <Droppable component={component} onDrop={onDragEnd}>
                    <TableTool
                        comp={component}
                        parentComp={comp}
                        onEdit={() => handleEdit(component, path)}
                    />
                    {childComponents.map((child, index) => {
                        return (
                            <Draggable
                                key={child.id}
                                item={child}
                                index={index}
                                mode="MOVE"
                                layout="horizontal"
                                dropTargetId={componentId}
                            >
                                <BoxWrapper
                                    parentComp={comp}
                                    comp={child}
                                    path={path}
                                    onEdit={() => handleEdit(child, path)}
                                >
                                    <CardComponent comp={child} onDragEnd={onDragEnd} />
                                </BoxWrapper>
                            </Draggable>
                        )
                    })}
                </Droppable>
            )
        },
        [componentId, handleEdit, onDragEnd, parentComponentName, comp]
    )

    return <>{renderChildComp(comp)}</>
}

export default IGRPStudioRepetitive
