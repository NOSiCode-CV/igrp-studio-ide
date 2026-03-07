import Draggable from '@renderer/lib/dnd/Draggable'
import Droppable from '@renderer/lib/dnd/Droppable'
import type { DragEndResult, StructuredComponent } from '@renderer/lib/dnd/types'
import { cn } from '@renderer/lib/utils'
import { GenNoInfoComp } from '../../components/GenNoInfoComp'
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext'
import CardComponent, { type CardComponentProps } from '../CardComponent'
import BoxWrapper from '../tools/BoxWrapper'

const IGRPStudioComponent = ({ comp, onDragEnd }: CardComponentProps) => {
    const { children: components, id: componentId } = comp || {}

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

    return (
        <div className="group/row relative hover:border-2 hover:border-primary rounded-lg px-1">
            <Droppable
                onDrop={handleDrop}
                component={comp}
                className={cn('hover:border-none space-y-1')}
            >
                {components && components.length > 0 ? (
                    components.map((childComp: StructuredComponent, index: number) => {
                        return (
                            <Draggable
                                key={childComp.id}
                                item={childComp}
                                index={index}
                                dropTargetId={componentId}
                                mode="MOVE"
                            >
                                <BoxWrapper
                                    parentComp={comp}
                                    comp={childComp}
                                    onEdit={() => handleEdit(childComp)}
                                    group="group/row-comp"
                                    className={cn(
                                        'left-0 right-auto opacity-0 group-hover/row-comp:opacity-100'
                                    )}
                                >
                                    <CardComponent comp={childComp} onDragEnd={onDragEnd} />
                                </BoxWrapper>
                            </Draggable>
                        )
                    })
                ) : (
                    <GenNoInfoComp />
                )}
            </Droppable>
        </div>
    )
}

export default IGRPStudioComponent
