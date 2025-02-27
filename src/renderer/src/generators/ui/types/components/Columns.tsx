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

export interface ColProps {
    componentId: string;
    comp: DroppedComponent;
    onEdit: () => void;
}

const Columns: React.FC<ColProps> = ({ comp, componentId }: ColProps) => {
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
        return children.map((comp: ComponentData, index: number) => {
            const Component = loadedComponents[comp.id];

            return Component ? (
                <Draggable key={comp.id} draggableId={comp.id} index={index}>
                    {(provided: DraggableProvided) => (
                        <div
                            key={comp.id}
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                        >
                            <BoxContainer
                                key={comp.id}
                                id={comp.id}
                                onEdit={() => handleEditClick(comp)}
                                dragHandleProps={provided.dragHandleProps}
                                group="column"
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
                `bg-card rounded-lg border p-4 hover:border-2 hover:border-dashed`
            )}
            id={componentId}
        >
            <Droppable droppableId={componentId}>
                {(provided: DroppableProvided, snapshot: any) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                            `grid grid-cols-${gridCol} gap-3`,
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

export default Columns;
