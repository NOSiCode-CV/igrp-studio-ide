import React, { useEffect, useState } from 'react';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import { cn } from '@renderer/lib/utils';
import useStudio from '@renderer/hooks/use-studio';
import { DragEndResult, StructuredComponent } from '@renderer/lib/dnd/types';
import Draggable from '@renderer/lib/dnd/Draggable';
import BoxWrapper from '../tools/BoxWrapper';
import { GenNoInfoComp } from '../../components/GenNoInfoComp';
import { getLabel } from '@renderer/utils';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@renderer/components/ui/tabs';
import Droppable from '@renderer/lib/dnd/Droppable';
import { Button } from '@renderer/components/ui/button';

export interface TabsProps {
    comp: StructuredComponent;
    onDragEnd: (result: DragEndResult) => void;
}

const IGRPStudioTabs: React.FC<TabsProps> = ({
    comp,
    onDragEnd,
}: TabsProps) => {
    const {
        children: components,
        componentName: parentComponentName,
        properties,
        id: componentId,
    } = comp;

    const { variant, className } = properties || {};

    const [loadedComponents, setLoadedComponents] = useState<{
        [key: string]: React.ComponentType<any>;
    }>({});

    const { setEditingComponent } = useDroppedComponents();

    const { dynamicImport } = useStudio();

    const handleEditClick = (
        component: StructuredComponent,
        componentName: string
    ) => {
        setEditingComponent({
            path: componentName,
            component,
        });
    };

    // Load components dynamically
    useEffect(() => {
        const loadComponents = async () => {
            const comps: Record<string, React.ComponentType<any>> = {};

            // Recursive function to load a component and all its children
            const loadComponentAndChildren = async (
                component: StructuredComponent
            ) => {
                try {
                    // Load the current component
                    const loadedComp = await dynamicImport(
                        component.componentName
                    );
                    comps[component.id] = loadedComp;

                    // Load all children recursively
                    if (component.children && component.children.length > 0) {
                        await Promise.all(
                            component.children.map(loadComponentAndChildren)
                        );
                    }
                } catch (error) {
                    console.error(
                        `Failed to load component ${component.componentName}:`,
                        error
                    );
                }
            };

            // Load all root components, filters, and columns in parallel
            await Promise.all([...components.map(loadComponentAndChildren)]);

            setLoadedComponents(comps);
        };

        loadComponents();
    }, [dynamicImport, components]);

    const renderTriggers = () => {
        return components.map((child: StructuredComponent, index: number) => {
            const Component = loadedComponents[child.id];
            const { properties, componentName } = child;

            const { className, label } = properties || {};

            return (
                Component && (
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
                            className="w-full"
                            asChild
                        >
                            <div>
                                <BoxWrapper
                                    comp={child}
                                    onEdit={() =>
                                        handleEditClick(
                                            child,
                                            parentComponentName
                                        )
                                    }
                                    group="group/tabitem-trigger"
                                    className={cn(
                                        'opacity-0 group-hover/tabitem-trigger:opacity-100',
                                        'data-[state=active]:opacity-100'
                                    )}
                                >
                                    <span>{label || componentName}</span>
                                </BoxWrapper>
                            </div>
                        </TabsTrigger>
                    </Draggable>
                )
            );
        });
    };

    const renderContent = () => {
        return components.map((child: StructuredComponent, index: number) => {
            const { children: components, componentName, properties } = child;

            const { label } = properties || {};

            return (
                <TabsContent value={child.id} key={index} asChild>
                    <Droppable
                        onDrop={onDragEnd}
                        component={child}
                        className="bg-card rounded-lg border border-dashed border-gray-400 w-full"
                    >
                        {components.length > 0 ? (
                            components.map(
                                (
                                    childTab: StructuredComponent,
                                    index: number
                                ) => {
                                    const Component =
                                        loadedComponents[childTab.id];

                                    const { id: componentId } = comp;

                                    return Component ? (
                                        <Draggable
                                            key={childTab.id}
                                            item={childTab}
                                            index={index}
                                            dropTargetId={componentId}
                                            mode="MOVE"
                                        >
                                            <BoxWrapper
                                                parentComp={child}
                                                comp={childTab}
                                                onEdit={() =>
                                                    handleEditClick(
                                                        childTab,
                                                        parentComponentName
                                                    )
                                                }
                                                group="group/tab-content"
                                                className={cn(
                                                    'left-0 right-auto opacity-0 group-hover/tab-content:opacity-100'
                                                )}
                                            >
                                                <Component
                                                    comp={childTab}
                                                    onDragEnd={onDragEnd}
                                                />
                                            </BoxWrapper>
                                        </Draggable>
                                    ) : null;
                                }
                            )
                        ) : (
                            <GenNoInfoComp type={label || componentName} />
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
            {components.length > 0 ? (
                <Tabs defaultValue={components[0].id}>
                    <TabsList>{renderTriggers()}</TabsList>
                    {renderContent()}
                </Tabs>
            ) : (
                <GenNoInfoComp
                    type={getLabel(parentComponentName).toUpperCase()}
                />
            )}
        </Droppable>
    );
};

export default IGRPStudioTabs;
