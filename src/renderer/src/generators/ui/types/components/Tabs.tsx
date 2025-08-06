import React from 'react';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import { cn } from '@renderer/lib/utils';
import { StructuredComponent } from '@renderer/lib/dnd/types';
import Draggable from '@renderer/lib/dnd/Draggable';
import BoxWrapper from '../tools/BoxWrapper';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@renderer/components/ui/tabs';
import Droppable from '@renderer/lib/dnd/Droppable';
import CardComponent, { CardComponentProps } from '../CardComponent';
import BoxField from '../tools/BoxFields';

const IGRPStudioTabs: React.FC<CardComponentProps> = ({
    comp,
    onDragEnd,
}: CardComponentProps) => {
    const {
        children: components,
        componentName: parentComponentName,
        properties,
        id: componentId,
    } = comp;

    const { className } = properties || {};

    const { setEditingComponent } = useDroppedComponents();

    const handleEditClick = (
        component: StructuredComponent,
        componentName: string
    ) => {
        setEditingComponent({
            path: componentName,
            component,
        });
    };

    const renderTriggers = () => {
        //i want to break line when the trigger is too long
        return components.map((child: StructuredComponent, index: number) => {
            const { properties, componentName } = child;

            const { className, label } = properties || {};

            return (
                <Draggable
                    key={child.id}
                    item={child}
                    index={index}
                    dropTargetId={componentId}
                    dropZone={true}
                    className={cn('p-0 bg-muted/0', className)}
                    mode="MOVE"
                    layout="horizontal"
                >
                    <TabsTrigger
                        value={child.id}
                        key={index}
                        className="min-w-fit max-w-full flex-shrink-0 flex flex-wrap break-words h-auto min-h-[36px] px-3 py-2"
                        asChild
                    >
                        <div>
                            <BoxField
                                parentComp={comp}
                                index={index}
                                comp={child}
                                onEdit={() =>
                                    handleEditClick(child, parentComponentName)
                                }
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
            );
        });
    };

    const renderContent = () => {
        return components.map((child: StructuredComponent, index: number) => {
            const { children: components, id: componentId } = child;

            return (
                <TabsContent value={child.id} key={index} asChild className="mt-4">
                    <Droppable
                        onDrop={onDragEnd}
                        component={child}
                        className="rounded-lg border border-dashed min-h-[200px]"
                    >
                        {components.length > 0 &&
                            components.map(
                                (childTab: StructuredComponent, ii: number) => {

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
                                                onEdit={() =>
                                                    handleEditClick(
                                                        childTab,
                                                        ''
                                                    )
                                                }
                                                group="group/tab-content"
                                                className={cn(
                                                    'left-0 right-auto opacity-0 group-hover/tab-content:opacity-100'
                                                )}
                                            >
                                                <CardComponent
                                                    comp={childTab}
                                                    onDragEnd={onDragEnd}
                                                />
                                            </BoxWrapper>
                                        </Draggable>
                                    );
                                }
                            )}
                    </Droppable>
                </TabsContent>
            );
        });
    };

    return (
        <Droppable
            className={cn('flex w-full flex-col gap-6', className)}
            onDrop={onDragEnd}
            component={comp}
        >
            {components.length > 0 && (
                <Tabs defaultValue={components[0].id} className="w-full">
                    <TabsList className="flex-wrap overflow-x-auto max-w-full h-auto min-h-[40px]">
                        {renderTriggers()}
                    </TabsList>
                    {renderContent()}
                </Tabs>
            )}
        </Droppable>
    );
};

export default IGRPStudioTabs;
