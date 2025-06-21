import React, { useCallback } from 'react';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import { DragEndResult, StructuredComponent } from '@renderer/lib/dnd/types';
import Droppable from '@renderer/lib/dnd/Droppable';
import { getLabel } from '@renderer/utils';
import { GenNoInfoComp } from '../../components/GenNoInfoComp';
import Draggable from '@renderer/lib/dnd/Draggable';
import { cn } from '@renderer/lib/utils';
import BoxWrapper from '../tools/BoxWrapper';
import CardComponent from '../CardComponent';

export interface ModalDialogProps {
    isDisabled?: boolean;
    comp: StructuredComponent;
    onDragEnd: (result: DragEndResult) => void;
}

const IGRPStudioModalDialog: React.FC<ModalDialogProps> = ({
    comp,
    onDragEnd,
}) => {
    const { children: components, componentName: parentComponentName } = comp;

    const { setEditingComponent } = useDroppedComponents();

    const handleEdit = useCallback(
        (component: StructuredComponent, path: string) => {
            setEditingComponent({ path, component });
        },
        [setEditingComponent]
    );

    const renderChildComp = useCallback(
        (component: StructuredComponent, path: string) => {
            const {
                children: childComponents,
                componentName,
                id: componentId,
            } = component;

            return (
                <Droppable
                    component={component}
                    onDrop={onDragEnd}
                    className={cn('p-2  space-y-2')}
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
                                    dropTargetId={componentId}
                                    layout="horizontal"
                                    className={cn('p-1')}
                                >
                                    <BoxWrapper
                                        parentComp={component}
                                        comp={child}
                                        onEdit={() => handleEdit(child, path)}
                                        group="group/card-dialog-item"
                                        className="opacity-0 group-hover/card-dialog-item:opacity-100"
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
            );
        },
        [handleEdit, onDragEnd]
    );

    return (
        <div className="flex flex-col gap-3">
            {components.map((child, index) => {
                const { componentName } = child;
                const path = `${parentComponentName}/${componentName}`;
                return (
                    <div
                        key={index}
                        className={cn(
                            'bg-card rounded-lg border border-dashed border-gray-400'
                        )}
                    >
                        <BoxWrapper
                            key={index}
                            parentComp={comp}
                            comp={child}
                            onEdit={() =>
                                handleEdit(child, parentComponentName)
                            }
                            group="group/dialog"
                            className="opacity-0 group-hover/dialog:opacity-100"
                        >
                            {renderChildComp(child, path)}
                        </BoxWrapper>
                    </div>
                );
            })}
        </div>
    );
};

export default IGRPStudioModalDialog;
