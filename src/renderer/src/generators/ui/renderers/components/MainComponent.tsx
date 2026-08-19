import Draggable from '@renderer/lib/dnd/Draggable'
import Droppable from '@renderer/lib/dnd/Droppable'
import type { DragEndResult, StructuredComponent, StructuredLayout } from '@renderer/lib/dnd/types'
import { cn } from '@renderer/lib/utils'
import { COMPONENT } from '../../ComponentTypes'
import { useDroppedComponents } from '../../contexts/EditorContext'
import { getCanvasItemSizing } from '../../utils/canvas-item-sizing'
import CardComponent from '../CardComponent'
import BoxWrapper from '../tools/BoxWrapper'
import PageTools from '../tools/PageTools'
import IGRPStudioProcess from './Process'

interface PageProps {
    component: StructuredLayout
    onDragEnd: (result: DragEndResult) => void
}

const IGRPStudioMainComponent = ({ onDragEnd, component }: PageProps) => {
    const { children: components, id: componentId, componentName } = component

    const isProcess = componentName === COMPONENT.ProcessContent

    const { setEditingComponent } = useDroppedComponents()

    const handleEditClick = (component: StructuredComponent) => {
        setEditingComponent({ component: component })
    }

    return (
        <div className="group/page relative !bg-custom-pattern min-h-[calc(100svh-var(--header-height-three))] overflow-x-auto">
            <PageTools onEdit={() => handleEditClick(component)} />
            {isProcess ? (
                <IGRPStudioProcess comp={component} onDragEnd={onDragEnd} />
            ) : (
                <Droppable onDrop={onDragEnd} component={component}>
                    <div className="overflow-y-auto flex flex-col space-y-6 py-6">
                        {components.map((row, index) => {
                            const sizing = getCanvasItemSizing(row)
                            return (
                                <Draggable
                                    key={row.id}
                                    item={row}
                                    index={index}
                                    dropTargetId={componentId}
                                    mode="MOVE"
                                    className={sizing.className}
                                    style={sizing.style}
                                >
                                    <BoxWrapper
                                        parentComp={component}
                                        comp={row}
                                        onEdit={() => handleEditClick(row)}
                                        group="group/row-main"
                                        className={cn(
                                            'left-0 right-auto opacity-0 group-hover/row-main:opacity-100'
                                        )}
                                    >
                                        <CardComponent
                                            key={row.id}
                                            comp={row}
                                            onDragEnd={onDragEnd}
                                        />
                                    </BoxWrapper>
                                </Draggable>
                            )
                        })}
                    </div>
                </Droppable>
            )}
        </div>
    )
}

export default IGRPStudioMainComponent
