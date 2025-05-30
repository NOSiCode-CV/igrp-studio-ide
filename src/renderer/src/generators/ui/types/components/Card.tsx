import React, { useCallback, useEffect, useState } from 'react';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import useStudio from '@renderer/hooks/use-studio';
import { DragEndResult, StructuredComponent } from '@renderer/lib/dnd/types';
import Droppable from '@renderer/lib/dnd/Droppable';
import { COMPONENT } from '../../ComponentTypes';
import {
    IGRPCardContent,
    IGRPCardFooter,
    IGRPCardHeader,
} from '@igrp/igrp-framework-react-design-system';
import { getLabel } from '@renderer/utils';
import { GenNoInfoComp } from '../../components/GenNoInfoComp';
import { cn } from '@renderer/lib/utils';
import Draggable from '@renderer/lib/dnd/Draggable';
import BoxField from '../tools/BoxFields';
import TableTool from '../tools/tableTool';

export interface CardProps {
    isDisabled?: boolean;
    comp: StructuredComponent;
    onDragEnd: (result: DragEndResult) => void;
}

export const COMPONENT_MAP: Record<string, React.ElementType> = {
    [COMPONENT.CardFooter]: IGRPCardFooter,
    [COMPONENT.CardContent]: IGRPCardContent,
    [COMPONENT.CardHeader]: IGRPCardHeader,
};

const Card: React.FC<CardProps> = ({ comp, onDragEnd }) => {
    const {
        children: components,
        id: componentId,
        componentName: parentComponentName,
    } = comp;
    const [loadedComponents, setLoadedComponents] = useState<
        Record<string, React.ComponentType<any>>
    >({});
    const { setEditingComponent } = useDroppedComponents();
    const { dynamicImport } = useStudio();

    // Load components dynamically
    useEffect(() => {
        const loadComponents = async () => {
            const comps: Record<string, React.ComponentType<any>> = {};

            // Load all child components in parallel
            const loadPromises = components.flatMap((child) =>
                child.children.map(async (grandChild) => {
                    try {
                        const component = await dynamicImport(
                            grandChild.componentName
                        );
                        comps[grandChild.id] = component;
                    } catch (error) {
                        console.error(
                            `Failed to load component ${grandChild.componentName}:`,
                            error
                        );
                    }
                })
            );

            await Promise.all(loadPromises);
            setLoadedComponents(comps);
        };

        loadComponents();
    }, [dynamicImport, components]);

    const handleEdit = useCallback(
        (component: StructuredComponent, path: string) => {
            setEditingComponent({ path, component });
        },
        [setEditingComponent]
    );

    const renderChildComp = useCallback(
        (component: StructuredComponent) => {
            const { children: childComponents, componentName } = component;
            const path = parentComponentName;

            return (
                <Droppable
                    component={component}
                    onDrop={onDragEnd}
                    className="space-y-2"
                >
                    {childComponents.length === 0 ? (
                        <GenNoInfoComp
                            type={getLabel(componentName).toUpperCase()}
                        />
                    ) : (
                        childComponents.map((child, index) => {
                            const Component = loadedComponents[child.id];
                            if (!Component) return null;

                            return (
                                <Draggable
                                    key={child.id}
                                    item={child}
                                    index={index}
                                    mode="MOVE"
                                    dropTargetId={componentId}
                                    className="p-1"
                                >
                                    <BoxField
                                        index={index}
                                        parentComp={comp}
                                        comp={child}
                                        path={path}
                                        onEdit={() => handleEdit(child, path)}
                                        group="group/card-content-item"
                                        className="opacity-0 group-hover/card-content-item:opacity-100"
                                    >
                                        <Component
                                            comp={child}
                                            onDragEnd={onDragEnd}
                                        />
                                    </BoxField>
                                </Draggable>
                            );
                        })
                    )}
                </Droppable>
            );
        },
        [
            componentId,
            handleEdit,
            loadedComponents,
            onDragEnd,
            parentComponentName,
            comp,
        ]
    );

    return (
        <div className="w-full flex flex-col gap-3">
            {components.map((child, index) => {
                const { componentName, properties } = child;
                const { className, commonProperties, ...args } =
                    properties || {};
                const Component = COMPONENT_MAP[componentName];

                if (!Component) return null;

                return (
                    <div
                        key={index}
                        {...args}
                        className={cn(
                            'bg-card rounded-lg border border-dashed border-gray-400 p-2 group/table',
                            className
                        )}
                    >
                        <TableTool
                            parentComp={comp}
                            comp={child}
                            onEdit={() => handleEdit(child, componentName)}
                            group="group/card-comp"
                            className="opacity-0 group-hover/card-comp:opacity-100"
                        />
                        {renderChildComp(child)}
                    </div>
                );
            })}
        </div>
    );
};

export default Card;
