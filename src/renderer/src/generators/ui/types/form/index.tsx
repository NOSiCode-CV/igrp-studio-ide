import React, { useEffect, useState } from 'react';
import { DroppedComponent } from '../../interfaces';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import { BasicElements, FIELD } from '@renderer/generators/ui/ComponentTypes';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@renderer/components/ui/card';
import { cn } from '@renderer/lib/utils';
import { EmptySlotComponent } from '@renderer/generators/ui/components/EmptySlotComponent';
import useStudio from '@renderer/hooks/useStudio';
import BoxField from './BoxFields';

export interface FormComponentProps {
    componentId: string;
    comp: DroppedComponent;
    onEdit: () => void;
}

const FormLayout: React.FC<FormComponentProps> = ({ comp, componentId }) => {
    const [formFields, setFormFields] = useState<DroppedComponent[]>([]);
    const [buttonComponents, setButtonComponents] = useState<
        DroppedComponent[]
    >([]);
    const [loadedComponents, setLoadedComponents] = useState<{
        [key: string]: React.ComponentType<any>;
    }>({});
    const [loading, setLoading] = useState(false);

    const { dynamicImport } = useStudio();
    const { setEditingComponent } = useDroppedComponents();

    const { componentName, config } = comp;
    const { title, colSize } = config;

    useEffect(() => {
        const { fields } = comp;

        if (fields) {
            const buttons = fields.filter(
                (field: any) => field.componentName === BasicElements.Button
            );
            const otherFields = fields.filter(
                (field: any) => field.componentName !== BasicElements.Button
            );

            setFormFields(otherFields);
            setButtonComponents(buttons);
        }
    }, [comp]);

    useEffect(() => {
        const loadComponents = async () => {
            setLoading(true);
            const components: { [key: string]: React.ComponentType<any> } = {};

            // Load form fields
            for (const field of formFields) {
                const component = await dynamicImport(
                    field.componentName
                );
                components[field.id] = component;
            }

            // Load buttons
            for (const button of buttonComponents) {
                const component = await dynamicImport(
                    button.componentName
                );
                components[button.id] = component;
            }

            setLoadedComponents(components);
            setLoading(false);
        };

        loadComponents();
    }, [formFields, buttonComponents, dynamicImport]);

    const handleEditClick = (component: Partial<DroppedComponent>) => {
        setEditingComponent({ ...component, componentId: componentId });
    };

    const renderFields = (_onDrop: boolean) => {
        const fields =
            formFields.length > 0 &&
            formFields.map((field: DroppedComponent, index: number) => {
                const Component = loadedComponents[field.id];
                return (
                    <Draggable
                        key={field.id}
                        draggableId={field.id}
                        index={index}
                    >
                        {(provided, _snapshot) =>
                            Component && (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    style={{
                                        ...provided.draggableProps.style,
                                    }}
                                >
                                    <BoxField
                                        id={field.id}
                                        onEdit={() => handleEditClick(field)}
                                    >
                                        <Component
                                            {...field}
                                            componentId={field.id}
                                        />
                                    </BoxField>
                                </div>
                            )
                        }
                    </Draggable>
                );
            });

        const emptySlots = colSize - formFields.length;
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

    const renderButtons = () => {
        if (loading) {
            return <div>Loading...</div>;
        }

        return buttonComponents.map(
            (button: DroppedComponent, index: number) => {
                const Component = loadedComponents[button.id];
                return (
                    <Draggable
                        key={button.id}
                        draggableId={`${button.id}`}
                        index={index}
                    >
                        {(provided, _snapshot) =>
                            Component && (
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
                            )
                        }
                    </Draggable>
                );
            }
        );
    };

    return (
        <Card className="rounded-sm">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <Droppable
                    droppableId={`${componentId}`}
                    type={FIELD}
                    direction="horizontal"
                >
                    {(provided, snapshot) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={cn(
                                `grid auto-rows-min grid-cols-1 lg:grid-cols-${colSize} gap-4 ${
                                    snapshot.isDraggingOver
                                        ? 'border-2 border-dashed border-igrp p-2'
                                        : ''
                                }`
                            )}
                        >
                            {renderFields(snapshot.isDraggingOver)}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </CardContent>
            {buttonComponents.length > 0 && (
                <CardFooter className="w-full">
                    <Droppable
                        droppableId={`${componentId}`}
                        type={FIELD}
                        direction="horizontal"
                    >
                        {(provided, snapshot) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`flex flex-1 space-x-2 justify-end  ${snapshot.isDraggingOver ? 'border-2 border-dashed border-igrp p-2' : ''}`}
                            >
                                {renderButtons()}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </CardFooter>
            )}
        </Card>
    );
};

export default FormLayout;
