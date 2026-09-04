import Draggable from '@renderer/lib/dnd/Draggable'
import Droppable from '@renderer/lib/dnd/Droppable'
import type { DragEndResult, StructuredComponent } from '@renderer/lib/dnd/types'
import { cn } from '@renderer/lib/utils'
import { useDroppedComponents } from '../../contexts/EditorContext'
import { getCanvasItemSizing } from '../../utils/canvas-item-sizing'
import { getHoverClasses } from '../../utils/tailwindGroups'
import CardComponent, { type CardComponentProps } from '../CardComponent'
import BoxContainer from '../tools/BoxWrapper'

const IGRPStudioContainer = ({
    comp,
    group,
    hoverClass,
    onDragEnd,
    className
}: CardComponentProps) => {
    const { children: components = [], id: componentId } = comp || {}

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

    const { group: _group, hoverClass: _hoverClass } = getHoverClasses({
        group,
        hoverClass,
        componentName: 'container'
    })

    const selfSizing = getCanvasItemSizing(comp)

    return (
        <Droppable
            onDrop={handleDrop}
            component={comp}
            className={cn(className, selfSizing.className)}
            style={selfSizing.style}
        >
            {components.length > 0 &&
                components.map((child: StructuredComponent, index: number) => {
                    const sizing = getCanvasItemSizing(child)
                    return (
                        <Draggable
                            key={child.id}
                            item={child}
                            index={index}
                            dropTargetId={componentId}
                            mode="MOVE"
                            className={sizing.className}
                            style={sizing.style}
                        >
                            <BoxContainer
                                comp={child}
                                onEdit={() => handleEdit(child)}
                                group={_group ?? `group/row-container`}
                                className={cn(
                                    'opacity-0',
                                    _hoverClass ?? 'group-hover/row-container:opacity-100'
                                )}
                            >
                                <CardComponent
                                    comp={child}
                                    onDragEnd={onDragEnd}
                                    group="group/row-container-child"
                                    hoverClass="group-hover/row-container-child:opacity-100 left-0 right-auto"
                                />
                            </BoxContainer>
                        </Draggable>
                    )
                })}
        </Droppable>
    )
}

export default IGRPStudioContainer
