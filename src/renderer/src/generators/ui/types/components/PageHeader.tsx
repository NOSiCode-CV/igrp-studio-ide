import React, { useEffect, useState } from 'react';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import { PageHeader } from '@igrp/igrp-framework-react-design-system';
import useStudio from '@renderer/hooks/useStudio';
import { DragEndResult, StructuredComponent } from '@renderer/lib/dnd/types';

export interface FormComponentProps {
    comp: StructuredComponent;
    onDragEnd: (result: DragEndResult) => void;
}

const PageHeaderLayout: React.FC<FormComponentProps> = ({
    comp
}) => {
    const { id: componentId, children: fields, componentName } = comp;

    const [buttonComponents, setButtonComponents] = useState<
        StructuredComponent[]
    >([]);

    const [loadedComponents, setLoadedComponents] = useState<{
        [key: string]: React.ComponentType<any>;
    }>({});

    const { dynamicImport } = useStudio();

    const { setEditingComponent } = useDroppedComponents();

    useEffect(() => {
        if (fields) {
            const buttons = fields;
            setButtonComponents(buttons);
        }
    }, [comp]);

    const handleEditClick = (component: StructuredComponent) => {
        setEditingComponent({ ...component});
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

    /*  const renderButtons = () =>
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
        }); */

    return (
        <div className="rounded-lg shadow-xs border border-gray-200 p-4 bg-white">
            <PageHeader title={componentName} description={componentId}>
                {/* <Droppable component={comp} layout="horizontal">
                    <div>
                     <div className="flex flex-1 space-x-2">
                                    {buttonComponents.length > 0 ? (
                                        renderButtons()
                                    ) : (
                                        <GenNoInfoField />
                                    )}
                                </div>
                                {provided.placeholder}
                    </div>
                </Droppable> */}
            </PageHeader>
        </div>
    );
};

export default PageHeaderLayout;

