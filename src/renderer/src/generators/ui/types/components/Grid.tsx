import React, { useEffect, useState } from 'react';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import BoxContainer from '../BoxContainer';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import { DroppedComponent } from '@renderer/generators/ui/interfaces';
import { cn } from '@renderer/lib/utils';
import useStudio from '@renderer/hooks/useStudio';
import { EmptySlotComponent } from '../../components/EmptySlotComponent';

export interface ColProps {
    componentId: string;
    comp: DroppedComponent;
    onEdit: () => void;
}

const Grid: React.FC<ColProps> = ({ comp, componentId }: ColProps) => {
    const { children, config } = comp;

    const { gridCol } = config || {};

    const [loadedComponents, setLoadedComponents] = useState<{
        [key: string]: React.ComponentType<any>;
    }>({});

    const { setEditingComponent } = useDroppedComponents();

    const { dynamicImport } = useStudio();

    const handleEditClick = (component: Partial<DroppedComponent>) => {
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
        const columns =
            children.length > 0 &&
            children.map((comp: DroppedComponent, index: number) => {
                const Component = loadedComponents[comp.id];

                return Component ? (
                    <Draggable
                        key={comp.id}
                        draggableId={comp.id}
                        index={index}
                    >
                        {(provided: any) => (
                            <div
                                key={comp.id}
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                            >
                                <BoxContainer
                                    key={comp.id}
                                    id={comp.id}
                                    group='comp'
                                    onEdit={() => handleEditClick(comp)}
                                    dragHandleProps={provided.dragHandleProps}
                                >
                                    <Component
                                        comp={comp}
                                        componentId={comp.id}
                                    />
                                </BoxContainer>
                            </div>
                        )}
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
                {columns}
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
            <Droppable droppableId={componentId}>
                {(provided: any, snapshot: any) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                            `grid gap-4 grid-cols-${gridCol}`,
                            snapshot.isDraggingOver
                                ? 'border-2 border-dashed border-igrp p-2'
                                : ''
                        )}
                    >
                        {renderColumns()}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
};

export default Grid;
