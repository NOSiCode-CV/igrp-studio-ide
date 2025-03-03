import React, { useEffect, useState } from 'react';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import BoxContainer from '../BoxContainer';
import { cn } from '@renderer/lib/utils';
import useStudio from '@renderer/hooks/useStudio';
import { EmptySlotComponent } from '../../components/EmptySlotComponent';
import { DragEndResult, StructuredComponent } from '@renderer/lib/dnd/types';
import Droppable from '@renderer/lib/dnd/Droppable';
import Draggable from '@renderer/lib/dnd/Draggable';

export interface GridProps {
    comp: StructuredComponent;
    onDragEnd: (result: DragEndResult) => void;
}

const Grid: React.FC<GridProps> = ({ comp, onDragEnd }: GridProps) => {
    const { children, properties, id: componentId } = comp;

    const { gridCol } = properties || {};

    const [loadedComponents, setLoadedComponents] = useState<{
        [key: string]: React.ComponentType<any>;
    }>({});

    const { setEditingComponent } = useDroppedComponents();

    const { dynamicImport } = useStudio();

    const handleEditClick = (component: StructuredComponent) => {
        setEditingComponent(component);
    };

    useEffect(() => {
        const loadComponents = async () => {
            const comps: { [key: string]: React.ComponentType<any> } = {};

            for (const comp of children) {
                const component = await dynamicImport(comp.componentName);
                comps[comp.id] = component;
            }

            setLoadedComponents(comps);
        };

        loadComponents();
    }, [children, dynamicImport]);

    const renderColumns = () => {
        const fields =
            children.length > 0 &&
            children.map((comp: StructuredComponent, index: number) => {
                const Component = loadedComponents[comp.id];

                return Component ? (
                    <Draggable
                        key={comp.id}
                        item={comp.id}
                        layout="horizontal"
                        index={index}
                        dropTargetId={componentId}
                    >
                        <div key={comp.id}>
                            <BoxContainer
                                key={comp.id}
                                id={comp.id}
                                group="comp"
                                onEdit={() => handleEditClick(comp)}
                                /*  dragHandleProps={provided.dragHandleProps} */
                            >
                                <Component comp={comp} onDragEnd={onDragEnd} />
                            </BoxContainer>
                        </div>
                    </Draggable>
                ) : (
                    <div key={comp.id}>Loading...</div>
                );
            });

        const emptySlots = gridCol - children.length;
        const emptySlotComponents = Array.from(
            { length: emptySlots },
            (_, index) => (
                <div key={`empty-slot-${index}`}>
                    <EmptySlotComponent />
                </div>
            )
        );

        return (
            <>
                {fields}
                {emptySlotComponents}
            </>
        );
    };

    return (
        <div
            className={cn(
                `hover:border-2 hover:border-gray-300 hover:border-dashed bg-white rounded-lg p-2`
            )}
            id={componentId}
        >
            <Droppable component={comp} onDrop={onDragEnd} layout="horizontal">
                <div
                    className={cn(
                        `grid gap-4 grid-cols-${gridCol}`
                        /*  snapshot.isDraggingOver
                            ? 'border-2 border-dashed border-igrp p-2'
                            : '' */
                    )}
                >
                    {renderColumns()}
                </div>
            </Droppable>
        </div>
    );
};

export default Grid;
