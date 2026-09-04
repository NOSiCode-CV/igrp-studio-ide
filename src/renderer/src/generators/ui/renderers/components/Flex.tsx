import Draggable from '@renderer/lib/dnd/Draggable'
import Droppable from '@renderer/lib/dnd/Droppable'
import type { StructuredComponent } from '@renderer/lib/dnd/types'
import { cn } from '@renderer/lib/utils'
import type React from 'react'
import { EmptySlotComponent } from '../../components/EmptySlotComponent'
import { useDroppedComponents } from '../../contexts/EditorContext'
import { getCanvasItemSizing } from '../../utils/canvas-item-sizing'
import { flexVariants } from '../../utils/layout-mapping'
import { getHoverClasses } from '../../utils/tailwindGroups'
import CardComponent, { type CardComponentProps } from '../CardComponent'
import BoxWrapper from '../tools/BoxWrapper'

const IGRPStudioFlex: React.FC<CardComponentProps> = ({
    comp,
    group,
    hoverClass,
    onDragEnd,
    className
}) => {
    const { children, properties, id: componentId } = comp

    const { variant } = properties || {}

    const { setEditingComponent } = useDroppedComponents()

    const handleEditClick = (component: StructuredComponent) => {
        setEditingComponent({
            path: '',
            component
        })
    }

    //RESET Hover if parent is diff current component
    const { group: _group, hoverClass: _hoverClass } = getHoverClasses({
        group,
        hoverClass,
        componentName: 'flex'
    })

    const selfSizing = getCanvasItemSizing(comp)

    const renderColumns = () => {
        const fields =
            children.length > 0 ? (
                children.map((comp: StructuredComponent, index: number) => {
                    const sizing = getCanvasItemSizing(comp)
                    return (
                        <Draggable
                            key={comp.id}
                            item={comp}
                            layout="horizontal"
                            index={index}
                            dropTargetId={componentId}
                            mode="MOVE"
                            className={cn('p-1', sizing.className)}
                            style={sizing.style}
                        >
                            <BoxWrapper
                                comp={comp}
                                group={cn(_group ?? 'group/comp-flex')}
                                onEdit={() => handleEditClick(comp)}
                                className={cn(
                                    'opacity-0',
                                    _hoverClass ?? 'group-hover/comp-flex:opacity-100'
                                )}
                                wrapperClassName="w-full"
                            >
                                <CardComponent
                                    comp={comp}
                                    onDragEnd={onDragEnd}
                                    group={`group/comp-flex-child`}
                                    hoverClass={`group-hover/comp-flex-child:opacity-100`}
                                />
                            </BoxWrapper>
                        </Draggable>
                    )
                })
            ) : (
                <EmptySlotComponent></EmptySlotComponent>
            )

        return <>{fields}</>
    }

    return (
        <Droppable
            component={comp}
            onDrop={onDragEnd}
            layout="horizontal"
            className={cn(flexVariants({ variant, className }), selfSizing.className)}
            style={selfSizing.style}
        >
            {renderColumns()}
        </Droppable>
    )
}

export default IGRPStudioFlex
