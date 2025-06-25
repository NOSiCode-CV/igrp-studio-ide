import React, { useCallback } from 'react';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import { StructuredComponent } from '@renderer/lib/dnd/types';
import Droppable from '@renderer/lib/dnd/Droppable';
import { getLabel } from '@renderer/utils';
import { GenNoInfoComp } from '../../components/GenNoInfoComp';
import { cn } from '@renderer/lib/utils';
import Draggable from '@renderer/lib/dnd/Draggable';
import { Button } from '@renderer/components/ui/button';
import { Plus } from 'lucide-react';
import { Badge } from '@renderer/components/ui/badge';
import BoxWrapper from '../tools/BoxWrapper';
import CardComponent, { CardComponentProps } from '../CardComponent';

const IGRPStudioFormList: React.FC<CardComponentProps> = ({
    comp,
    onDragEnd,
}) => {
    const {
        id: componentId,
        componentName: parentComponentName,
        properties,
    } = comp;

    const { addButtonLabel, badgeValue, label, description } = properties || {};

    const { setEditingComponent } = useDroppedComponents();

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
                            {badgeValue || 'nobadge'}
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
                                            <CardComponent
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
            parentComponentName,
            label,
            description,
            badgeValue,
            onDragEnd,
            addButtonLabel,
            componentId,
            comp,
            handleEdit,
        ]
    );

    return <>{renderChildComp(comp)}</>;
};

export default IGRPStudioFormList;
