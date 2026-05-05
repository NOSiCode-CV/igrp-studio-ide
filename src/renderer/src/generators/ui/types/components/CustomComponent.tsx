import Draggable from '@renderer/lib/dnd/Draggable'
import type { DragEndResult, StructuredComponent } from '@renderer/lib/dnd/types'
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext'
import CardComponent from '../CardComponent'
import BoxField from '../tools/BoxFields'
import { ICON_MAP } from '../../ComponentTypes'
import Droppable from '@renderer/lib/dnd/Droppable'
import useStudio from '@renderer/hooks/use-studio'
import { useEffect, useState } from 'react'

export interface CustomComponentProps {
    comp: StructuredComponent
    onDragEnd: (result: DragEndResult) => void
    isDisabled?: boolean
}

const IGRPStudioCustomComponent: React.FC<CustomComponentProps> = ({
    comp,
    onDragEnd
}: CustomComponentProps) => {
    const { id: componentId, children: buttonComponents, componentName, properties } = comp

    const { findComponentById } = useStudio()

    const [hasChildren, setHasChildren] = useState(false)

    const componentLabel = properties?.label || componentName

    const Icon = ICON_MAP[componentName]

    const { setEditingComponent } = useDroppedComponents()

    useEffect(() => {
        const loadProperties = async () => {
            const propertiesComponent = await findComponentById(componentName)
            setHasChildren(propertiesComponent?.allowChildren ?? false)
        }
        loadProperties()
    }, [componentName, findComponentById])

    const handleEditClick = (component: StructuredComponent): void => {
        setEditingComponent({
            path: '',
            component
        })
    }

    const renderButtons = (): React.ReactNode => {
        return buttonComponents.map((button: StructuredComponent, index: number) => {
            return (
                <Draggable
                    key={button.id}
                    item={button}
                    index={index}
                    dropTargetId={componentId}
                    layout="horizontal"
                    className="p-1"
                    mode="MOVE"
                >
                    <BoxField
                        comp={button}
                        parentComp={comp}
                        onEdit={() => handleEditClick(button)}
                        index={index}
                    >
                        <CardComponent comp={button} onDragEnd={onDragEnd} />
                    </BoxField>
                </Draggable>
            )
        })
    }

    return (
        <div className="border border-dashed border-gray-200 p-4 rounded-lg">
            <div className="flex items-center gap-3 flex-wrap md:flex-nowrap mb-2">
                {Icon && (
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                    </div>
                )}
                <div className="text-base font-medium text-muted-foreground truncate">
                    {componentLabel}
                </div>
            </div>
            {hasChildren && (
                <Droppable component={comp} onDrop={onDragEnd}>
                    {renderButtons()}
                </Droppable>
            )}
        </div>
    )
}

export default IGRPStudioCustomComponent
