import React, { useEffect, useState } from 'react';
import { DroppedComponent } from '../../../interfaces';
import { useDroppedComponents } from '../../../dnd/DroppedComponentsContext';
import { ComponentRegistry } from '../../../data/ComponentRegistry';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import { FEILD } from '@renderer/generators/ui/ComponentTypes';
import { PageHeader } from '@igrp/igrp-design-system';

export interface FormComponentProps {
    componentName: string;
    componentId: string;
    acceptTypes: string[];
    comp: DroppedComponent;
    onEdit: () => void;
}

const PageHeaderLayout: React.FC<FormComponentProps> = ({ comp, componentId }) => {
    const [buttonComponents, setButtonComponents] = useState<
        DroppedComponent[]
    >([]);

    const { setEditingComponent } = useDroppedComponents();
    const { title } = comp.config;

    useEffect(() => {
        if (comp.fields) {
            const buttons = comp.fields;
            setButtonComponents(buttons);
        }
    }, [comp]);

    const handleEditClick = (component: Partial<DroppedComponent>) => {
        setEditingComponent({ ...component, componentId: componentId });
    };
    const renderButtons = () =>
        buttonComponents.map((button: DroppedComponent, index: number) => {
            const component = ComponentRegistry[button.componentName];
            return (
                <Draggable
                    key={button.id}
                    draggableId={`${button.id}`}
                    index={index}
                >
                    {(provided, _snapshot) =>
                        component && (
                            <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={{ ...provided.draggableProps.style }}
                            >
                                {React.createElement(component, {
                                    comp: button,
                                    componentId: button.id,
                                    onEdit: () => handleEditClick(button),
                                })}
                            </div>
                        )
                    }
                </Draggable>
            );
        });

    return (
        <PageHeader title={title}>
            <Droppable
                droppableId={`${componentId}`}
                type={FEILD}
                direction="horizontal"
            >
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`${
                            snapshot.isDraggingOver
                                ? 'border-2 border-dashed border-igrp p-2'
                                : ''
                        }`}
                    >
                        {renderButtons()}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </PageHeader>
    );
};

export default PageHeaderLayout;
