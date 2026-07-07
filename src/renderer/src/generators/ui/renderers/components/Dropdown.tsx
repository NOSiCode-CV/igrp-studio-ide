import Draggable from '@renderer/lib/dnd/Draggable'
import Droppable from '@renderer/lib/dnd/Droppable'
import type { StructuredComponent } from '@renderer/lib/dnd/types'
import { cn } from '@renderer/lib/utils'
import { getLabel } from '@renderer/utils'
import { ChevronDown } from 'lucide-react'
import type React from 'react'
import { GenNoInfoComp } from '../../components/GenNoInfoComp'
import { useDroppedComponents } from '../../contexts/EditorContext'
import type { CardComponentProps } from '../CardComponent'
import BoxField from '../tools/BoxFields'

/**
 * Canvas preview for the engine's `dropdown` container (IGRPDropdownMenu).
 * The generated component is trigger + portal menu; on the canvas we render
 * the menu permanently open so its `dropdownItem` children stay visible,
 * droppable and editable.
 */
const IGRPStudioDropdown: React.FC<CardComponentProps> = ({
    comp,
    onDragEnd
}: CardComponentProps) => {
    const {
        children: components,
        componentName: parentComponentName,
        properties,
        id: componentId
    } = comp

    const { className, content, label } = properties || {}

    const { setEditingComponent } = useDroppedComponents()

    const handleEditClick = (component: StructuredComponent, componentName: string) => {
        setEditingComponent({
            path: componentName,
            component
        })
    }

    return (
        <Droppable onDrop={onDragEnd} component={comp} className={cn('w-fit', className)}>
            <div className="inline-flex items-center gap-1 rounded-md border bg-background px-3 py-1.5 text-sm font-medium shadow-xs">
                <span>{content || label || getLabel(parentComponentName)}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-1 w-56 rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
                {components.length > 0 ? (
                    components.map((child: StructuredComponent, index: number) => {
                        const { properties: childProperties } = child
                        const childLabel =
                            childProperties?.content ||
                            childProperties?.label ||
                            child.label ||
                            getLabel(child.componentName)

                        return (
                            <Draggable
                                key={child.id}
                                item={child}
                                index={index}
                                dropTargetId={componentId}
                                dropZone={true}
                                className="p-0 bg-muted/0"
                                mode="MOVE"
                            >
                                <BoxField
                                    comp={child}
                                    parentComp={comp}
                                    index={index}
                                    onEdit={() => handleEditClick(child, parentComponentName)}
                                    group="group/dropdown-item"
                                    className={cn(
                                        'left-0 right-auto opacity-0',
                                        'group-hover/dropdown-item:opacity-100'
                                    )}
                                >
                                    <div className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground">
                                        {childLabel}
                                    </div>
                                </BoxField>
                            </Draggable>
                        )
                    })
                ) : (
                    <GenNoInfoComp type={getLabel(parentComponentName).toUpperCase()} />
                )}
            </div>
        </Droppable>
    )
}

export default IGRPStudioDropdown
