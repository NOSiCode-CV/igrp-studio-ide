import React, { useCallback, useEffect, useState } from 'react';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import useStudio from '@renderer/hooks/use-studio';
import { DragEndResult, StructuredComponent } from '@renderer/lib/dnd/types';
import Droppable from '@renderer/lib/dnd/Droppable';
import { COMPONENT } from '../../ComponentTypes';
import {
<<<<<<< HEAD
=======
    IGRPCard,
>>>>>>> parent of 8b487e9 (Revert "UI: component table and form")
    IGRPCardContent,
    IGRPCardFooter,
    IGRPCardHeader,
} from '@igrp/igrp-framework-react-design-system';
import { getLabel } from '@renderer/utils/helpers';
import { GenNoInfoComp } from '../../components/GenNoInfoComp';
<<<<<<< HEAD
import Draggable from '@renderer/lib/dnd/Draggable';
import BoxField from '../tools/BoxFields';

export interface ModalDialogProps {
=======
import { cn } from '@renderer/lib/utils';
import Draggable from '@renderer/lib/dnd/Draggable';
import BoxField from '../tools/BoxFields';
import TableTool from '../tools/tableTool';

export interface CardProps {
>>>>>>> parent of 8b487e9 (Revert "UI: component table and form")
    isDisabled?: boolean;
    comp: StructuredComponent;
    onDragEnd: (result: DragEndResult) => void;
}

export const COMPONENT_MAP: Record<string, React.ElementType> = {
    [COMPONENT.CardFooter]: IGRPCardFooter,
    [COMPONENT.CardContent]: IGRPCardContent,
    [COMPONENT.CardHeader]: IGRPCardHeader,
};

<<<<<<< HEAD
const ModalDialog: React.FC<ModalDialogProps> = ({ comp, onDragEnd }) => {
=======
const ModalDialog: React.FC<CardProps> = ({ comp, onDragEnd }) => {
>>>>>>> parent of 8b487e9 (Revert "UI: component table and form")
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
<<<<<<< HEAD
            const loadPromises = components.map(async (grandChild) => {
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
            });
=======
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
>>>>>>> parent of 8b487e9 (Revert "UI: component table and form")

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

<<<<<<< HEAD
    return (
        <Droppable component={comp} onDrop={onDragEnd} className="space-y-2">
            {components.length === 0 ? (
                <GenNoInfoComp
                    type={getLabel(parentComponentName).toUpperCase()}
                />
            ) : (
                components.map((child, index) => {
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
                                path={parentComponentName}
                                onEdit={() =>
                                    handleEdit(child, parentComponentName)
                                }
                                group="group/dialog"
                                className="opacity-0 group-hover/dialog:opacity-100"
                            >
                                <Component comp={child} onDragEnd={onDragEnd} />
                            </BoxField>
                        </Draggable>
                    );
                })
            )}
        </Droppable>
=======
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
                                        group="group/card"
                                        className="opacity-0 group-hover/card:opacity-100"
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
                            onEdit={() =>
                                handleEdit(child, parentComponentName)
                            }
                        />
                        {renderChildComp(child)}
                    </div>
                );
            })}
        </div>
>>>>>>> parent of 8b487e9 (Revert "UI: component table and form")
    );
};

export default ModalDialog;
