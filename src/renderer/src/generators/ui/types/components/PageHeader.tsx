import React, { useEffect, useState } from 'react';
import { DroppedComponent } from '../../interfaces';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import { FIELD } from '@renderer/generators/ui/ComponentTypes';
import { PageHeader } from '@igrp/igrp-framework-react-design-system';
import GenNoInfoField from '@renderer/generators/ui/components/GenNoInfoField';
import useStudio from '@renderer/hooks/useStudio';

export interface FormComponentProps {
    componentName: string;
    componentId: string;
    acceptTypes: string[];
    comp: DroppedComponent;
    onEdit: () => void;
}

const PageHeaderLayout: React.FC<FormComponentProps> = ({
    comp,
    componentId,
}) => {
    const [buttonComponents, setButtonComponents] = useState<
        DroppedComponent[]
    >([]);

    const [loadedComponents, setLoadedComponents] = useState<{
        [key: string]: React.ComponentType<any>;
    }>({});

    const { dynamicImport } = useStudio();

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

    useEffect(() => {
        const loadComponents = async () => {
            const comps: { [key: string]: React.ComponentType<any> } = {};

            for (const comp of buttonComponents) {
                const component = await dynamicImport(comp.componentName);
                comps[comp.id] = component;
            }

            setLoadedComponents(comps);
        };

        loadComponents();
    }, [buttonComponents, dynamicImport]);

    const renderButtons = () =>
        buttonComponents.map((button: DroppedComponent, index: number) => {
            const Component = loadedComponents[button.id];
            return Component ? (
                <Draggable
                    key={button.id}
                    draggableId={`${button.id}`}
                    index={index}
                >
                    {(provided, _snapshot) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{ ...provided.draggableProps.style }}
                        >
                            <Component
                                comp={button}
                                componentId={button.id}
                                onEdit={() => handleEditClick(button)}
                            />
                        </div>
                    )}
                </Draggable>
            ) : (
                <div key={comp.id}>Loading...</div>
            );
        });

    return (
        <div className='bg-white rounded-sm p-3'>
        <PageHeader title={title}>
            <Droppable
                droppableId={`${componentId}`}
                type={FIELD}
                direction="horizontal"
            >
                {(provided, snapshot) => {
                    return (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`${
                                snapshot.isDraggingOver
                                    ? 'border-2 border-dashed border-igrp p-2'
                                    : ''
                            }`}
                        >
                            <div className="flex flex-1 space-x-2">
                                {buttonComponents.length > 0 ? (
                                    renderButtons()
                                ) : (
                                    <GenNoInfoField />
                                )}
                            </div>
                            {provided.placeholder}
                        </div>
                    );
                }}
            </Droppable>
        </PageHeader>
        </div>
    );
};

export default PageHeaderLayout;
