import Draggable from '@renderer/lib/dnd/Draggable'
import Droppable from '@renderer/lib/dnd/Droppable'
import type { StructuredComponent } from '@renderer/lib/dnd/types'
import { cn } from '@renderer/lib/utils'
import { getLabel } from '@renderer/utils'
import type React from 'react'
import { GenNoInfoComp } from '../../components/GenNoInfoComp'
import { useDroppedComponents } from '../../contexts/EditorContext'
import type { CardComponentProps } from '../CardComponent'
import BoxField from '../tools/BoxFields'

/**
 * Canvas preview for the engine's `menubar` container (IGRPMenubar).
 * Renders the bar with its `menubarMenu` children as static menu buttons —
 * the trigger/content/item structure inside each menu is generated code,
 * not canvas-editable detail, so each menu is shown as a single chip.
 */
const IGRPStudioMenubar: React.FC<CardComponentProps> = ({
    comp,
    onDragEnd
}: CardComponentProps) => {
    const {
        children: components,
        componentName: parentComponentName,
        properties,
        id: componentId
    } = comp

    const { className } = properties || {}

    const { setEditingComponent } = useDroppedComponents()

    const handleEditClick = (component: StructuredComponent, componentName: string) => {
        setEditingComponent({
            path: componentName,
            component
        })
    }

    return (
        <Droppable onDrop={onDragEnd} component={comp} className={cn('w-fit', className)}>
            <div
                className={cn(
                    'flex h-10 items-center gap-1 rounded-md border bg-background p-1 shadow-xs',
                    components.length === 0 && 'min-w-48'
                )}
            >
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
                                layout="horizontal"
                            >
                                <BoxField
                                    comp={child}
                                    parentComp={comp}
                                    index={index}
                                    onEdit={() => handleEditClick(child, parentComponentName)}
                                    group="group/menubar-menu"
                                    className={cn(
                                        'left-0 right-auto opacity-0',
                                        'group-hover/menubar-menu:opacity-100'
                                    )}
                                >
                                    <div className="rounded-sm px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
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

export default IGRPStudioMenubar
