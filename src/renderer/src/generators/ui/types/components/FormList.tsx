import React, { useCallback, useEffect, useState } from 'react';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import useStudio from '@renderer/hooks/use-studio';
import { DragEndResult, StructuredComponent } from '@renderer/lib/dnd/types';
import Droppable from '@renderer/lib/dnd/Droppable';
import { getLabel } from '@renderer/utils';
import { GenNoInfoComp } from '../../components/GenNoInfoComp';
import { cn } from '@renderer/lib/utils';
import Draggable from '@renderer/lib/dnd/Draggable';
import BoxField from '../tools/BoxFields';
import { Button } from '@renderer/components/ui/button';
import { Plus } from 'lucide-react';
import { Badge } from '@renderer/components/ui/badge';
import BoxWrapper from '../tools/BoxWrapper';

export interface RepetitiveProps {
    isDisabled?: boolean;
    comp: StructuredComponent;
    onDragEnd: (result: DragEndResult) => void;
}

const IGRPStudioFormList: React.FC<RepetitiveProps> = ({ comp, onDragEnd }) => {
    const {
        children: components,
        id: componentId,
        componentName: parentComponentName,
        properties,
    } = comp;

    const { addButtonLabel, badgeValue, label, description } = properties || {};

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

    const renderChildComp = useCallback(
        (component: StructuredComponent) => {
            const { children: childComponents, componentName } = component;
            const path = parentComponentName;

            return (
                <div className="space-y-1">
                    <div className="flex flex-1 justify-between">
                        <div>
                            <p className="text-sm font-medium">{label}</p>
                            <p className="text-xs">{description}</p>
                        </div>
                        <Badge
                            variant="outline"
                            className="font-normal text-xs"
                        >
                            {badgeValue || 'Obrigatório'}
                        </Badge>
                    </div>
                    <Droppable
                        component={component}
                        onDrop={onDragEnd}
                        className="border"
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
                                        layout="horizontal"
                                        dropTargetId={componentId}
                                        className={cn('border-none')}
                                    >
                                        <BoxWrapper
                                            parentComp={comp}
                                            comp={child}
                                            onEdit={() =>
                                                handleEdit(child, path)
                                            }
                                            group="group/formlist"
                                            className="opacity-0 group-hover/formlist:opacity-100"
                                        >
                                            <Component
                                                comp={child}
                                                onDragEnd={onDragEnd}
                                            />
                                        </BoxWrapper>
                                    </Draggable>
                                );
                            })
                        )}
                    </Droppable>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => void 0}
                        className="w-full"
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        {addButtonLabel || 'Add'}
                    </Button>
                </div>
            );
        },
        [
            addButtonLabel,
            componentId,
            handleEdit,
            loadedComponents,
            onDragEnd,
            parentComponentName,
            comp,
        ]
    );

    return <>{renderChildComp(comp)}</>;
};

export default IGRPStudioFormList;
