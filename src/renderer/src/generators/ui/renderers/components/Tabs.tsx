import { ScrollArea, ScrollBar } from '@renderer/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import Draggable from '@renderer/lib/dnd/Draggable'
import Droppable from '@renderer/lib/dnd/Droppable'
import type { StructuredComponent } from '@renderer/lib/dnd/types'
import { cn } from '@renderer/lib/utils'
import type React from 'react'
import { useDroppedComponents } from '../../contexts/EditorContext'
import CardComponent, { type CardComponentProps } from '../CardComponent'
import BoxField from '../tools/BoxFields'
import BoxWrapper from '../tools/BoxWrapper'

const IGRPStudioTabs: React.FC<CardComponentProps> = ({ comp, onDragEnd }: CardComponentProps) => {
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

    const renderTriggers = () => {
        return components.map((child: StructuredComponent, index: number) => {
            const { properties, componentName } = child

            const { className, label } = properties || {}

            return (
                <Draggable
                    key={child.id}
                    item={child}
                    index={index}
                    dropTargetId={componentId}
                    dropZone={true}
                    className={cn('shrink-0 p-0 bg-muted/0', className)}
                    mode="MOVE"
                    layout="horizontal"
                >
                    <TabsTrigger
                        value={child.id}
                        key={index}
                        className="h-auto min-h-9 shrink-0 grow-0 whitespace-nowrap px-3 py-2"
                        asChild
                    >
                        <div>
                            <BoxField
                                parentComp={comp}
                                index={index}
                                comp={child}
                                onEdit={() => handleEditClick(child, parentComponentName)}
                                group="group/tabitem-trigger"
                                className={cn(
                                    'opacity-0 group-hover/tabitem-trigger:opacity-100',
                                    'data-[state=active]:opacity-100 right-0 left-auto'
                                )}
                            >
                                <span>{label || componentName}</span>
                            </BoxField>
                        </div>
                    </TabsTrigger>
                </Draggable>
            )
        })
    }

    const renderContent = () => {
        return components.map((child: StructuredComponent, index: number) => {
            const { children: components, id: componentId } = child

            return (
                <TabsContent value={child.id} key={index} asChild className="mt-4">
                    <Droppable
                        onDrop={onDragEnd}
                        component={child}
                        className="rounded-lg border border-dashed min-h-[200px]"
                    >
                        {components.length > 0 &&
                            components.map((childTab: StructuredComponent, ii: number) => {
                                return (
                                    <Draggable
                                        key={childTab.id}
                                        item={childTab}
                                        index={ii}
                                        dropTargetId={componentId}
                                        mode="MOVE"
                                    >
                                        <BoxWrapper
                                            parentComp={child}
                                            comp={childTab}
                                            onEdit={() => handleEditClick(childTab, '')}
                                            group="group/tab-content"
                                            className={cn(
                                                'left-0 right-auto opacity-0 group-hover/tab-content:opacity-100'
                                            )}
                                        >
                                            <CardComponent comp={childTab} onDragEnd={onDragEnd} />
                                        </BoxWrapper>
                                    </Draggable>
                                )
                            })}
                    </Droppable>
                </TabsContent>
            )
        })
    }

    return (
        <Tabs defaultValue={components[0].id} className="w-full">
            <Droppable
                className={cn('flex w-full min-w-0 flex-col gap-6', className)}
                onDrop={onDragEnd}
                component={comp}
                path="tabs"
            >
                <ScrollArea className="w-full min-w-0 whitespace-nowrap pb-2.5 [&>[data-slot=scroll-area-scrollbar][data-orientation=vertical]]:hidden">
                    <TabsList className="inline-flex h-auto min-h-9 w-max max-w-none flex-nowrap justify-start gap-1">
                        {renderTriggers()}
                    </TabsList>
                    <ScrollBar orientation="horizontal" className="h-2" />
                </ScrollArea>
            </Droppable>
            {renderContent()}
        </Tabs>
    )
}

export default IGRPStudioTabs
