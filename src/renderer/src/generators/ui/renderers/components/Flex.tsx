import Draggable from '@renderer/lib/dnd/Draggable'
import Droppable from '@renderer/lib/dnd/Droppable'
import type { StructuredComponent } from '@renderer/lib/dnd/types'
import { cn } from '@renderer/lib/utils'
import type React from 'react'
import { COMPONENT } from '../../ComponentTypes'
import { EmptySlotComponent } from '../../components/EmptySlotComponent'
import { useDroppedComponents } from '../../contexts/EditorContext'
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
        componentName: COMPONENT.Flex
    })

    const renderColumns = () => {
        const fields =
            children.length > 0 ? (
                children.map((comp: StructuredComponent, index: number) => {
                    return (
                        <Draggable
                            key={comp.id}
                            item={comp}
                            layout="horizontal"
                            index={index}
                            dropTargetId={componentId}
                            mode="MOVE"
                            className="p-1 text-center"
                        >
                            <BoxWrapper
                                comp={comp}
                                group={cn(_group ?? 'group/comp-flex')}
                                onEdit={() => handleEditClick(comp)}
                                className={cn(
                                    'opacity-0',
                                    _hoverClass ?? 'group-hover/comp-flex:opacity-100'
                                )}
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
            className={cn(flexVariants({ variant, className }))}
        >
            {renderColumns()}
        </Droppable>
    )
}

export default IGRPStudioFlex
