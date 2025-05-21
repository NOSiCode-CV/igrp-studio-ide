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
import { getLabel } from '@renderer/utils/helpers';
import { GenNoInfoComp } from '../../components/GenNoInfoComp';
import Draggable from '@renderer/lib/dnd/Draggable';
import BoxField from '../tools/BoxFields';

export interface ModalDialogProps {
    isDisabled?: boolean;
    comp: StructuredComponent;
    onDragEnd: (result: DragEndResult) => void;
}

export const COMPONENT_MAP: Record<string, React.ElementType> = {
    [COMPONENT.CardFooter]: IGRPCardFooter,
    [COMPONENT.CardContent]: IGRPCardContent,
    [COMPONENT.CardHeader]: IGRPCardHeader,
};

const ModalDialog: React.FC<ModalDialogProps> = ({ comp, onDragEnd }) => {
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
    );
};

export default ModalDialog;
