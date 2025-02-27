import React, { useEffect, useState } from 'react';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import BoxContainer from '../BoxContainer';
import {
    Draggable,
    DraggableProvided,
    Droppable,
    DroppableProvided,
} from '@hello-pangea/dnd';
import {
    ComponentData,
    DroppedComponent,
} from '@renderer/generators/ui/interfaces';
import { cn } from '@renderer/lib/utils';
import useStudio from '@renderer/hooks/useStudio';
import { EmptySlotComponent } from '../../components/EmptySlotComponent';

export interface ColProps {
    componentId: string;
    comp: DroppedComponent;
    onEdit: () => void;
}

const Column: React.FC<ColProps> = ({ comp, componentId }: ColProps) => {
    const { children } = comp;

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

    const renderComponents = () => {
        if (children.length === 0) return <EmptySlotComponent />;

        return children.map((comp: ComponentData, index: number) => {
            const Component = loadedComponents[comp.id];

            return Component ? (
                <Draggable key={comp.id} draggableId={comp.id} index={index}>
                    {(provided: DraggableProvided) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                        >
                            <BoxContainer
                                id={comp.id}
                                group="comp"
                                onEdit={() => handleEditClick(comp)}
                                dragHandleProps={provided.dragHandleProps}
                                className="top-0"
                            >
                                <Component comp={comp} componentId={comp.id} />
                            </BoxContainer>
                        </div>
                    )}
                </Draggable>
            ) : (
                <div key={comp.id}>Loading...</div>
            );
        });
    };

    return (
        <div
            className={cn(
                `bg-muted/70 rounded-lg border hover:border-2 hover:border-gray-300 hover:border-dashed `
            )}
            id={componentId}
        >
            <Droppable droppableId={componentId}>
                {(provided: DroppableProvided, snapshot: any) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                            `w-full flex flex-col p-3 gap-3`,
                            snapshot.isDraggingOver &&
                                'border-2 border-dashed border-igrp'
                        )}
                    >
                        {renderComponents()}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
};

export default Column;
