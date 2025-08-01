import React, { useCallback } from 'react';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import { StructuredComponent } from '@renderer/lib/dnd/types';
import Droppable from '@renderer/lib/dnd/Droppable';
import { getLabel } from '@renderer/utils';
import { GenNoInfoComp } from '../../components/GenNoInfoComp';
import { cn } from '@renderer/lib/utils';
import TableTool from '../tools/tableTool';
import Draggable from '@renderer/lib/dnd/Draggable';
import BoxField from '../tools/BoxFields';
import CardComponent, { CardComponentProps } from '../CardComponent';

const IGRPStudioRepetitive: React.FC<CardComponentProps> = ({
    comp,
    onDragEnd,
}) => {
    const { id: componentId, componentName: parentComponentName } = comp;

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
                <Droppable component={component} onDrop={onDragEnd}>
                    <TableTool
                        comp={component}
                        parentComp={comp}
                        onEdit={() => handleEdit(component, path)}
                    />
                    {childComponents.map((child, index) => {
                        return (
                            <Draggable
                                key={child.id}
                                item={child}
                                index={index}
                                mode="MOVE"
                                layout="horizontal"
                                dropTargetId={componentId}
                            >
                                <BoxField
                                    index={index}
                                    parentComp={comp}
                                    comp={child}
                                    path={path}
                                    onEdit={() => handleEdit(child, path)}
                                >
                                    <CardComponent
                                        comp={child}
                                        onDragEnd={onDragEnd}
                                    />
                                </BoxField>
                            </Draggable>
                        );
                    })}
                </Droppable>
            );
        },
        [componentId, handleEdit, onDragEnd, parentComponentName, comp]
    );

    return <>{renderChildComp(comp)}</>;
};

export default IGRPStudioRepetitive;
