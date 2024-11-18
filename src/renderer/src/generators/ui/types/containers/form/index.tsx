import React, { useEffect, useState } from 'react';
import GenNoInfoField from '../../../components/GenNoInfoField';
import { DroppedComponent } from '../../../interfaces';
import { useDroppedComponents } from '../../../dnd/DroppedComponentsContext';
import BoxField from '../../fields/BoxFields';
import { ComponentRegistry } from '../../../data/ComponentRegistry';
import { Draggable, Droppable } from 'react-beautiful-dnd';
import { FEILD, FIELDS } from '@renderer/generators/ui/ComponentTypes';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@renderer/components/ui/card';

export interface FormComponentProps {
    componentName: string;
    componentId: string;
    acceptTypes: string[];
    comp: DroppedComponent;
    onEdit: () => void;
}

const FormLayout: React.FC<FormComponentProps> = ({ comp, componentId }) => {
    const [formFields, setFormFields] = useState<DroppedComponent[]>([]);
    const [buttonComponents, setButtonComponents] = useState<DroppedComponent[]>([]);

    const { setEditingComponent } = useDroppedComponents();
    const { title } = comp.config;

    useEffect(() => {
        if (comp.fields) {
            const fields = comp.fields;
            const buttons = fields.filter((field: any) => field.componentName === FIELDS.BUTTON);
            const otherFields = fields.filter((field: any) => field.componentName !== FIELDS.BUTTON);

            setFormFields(otherFields);
            setButtonComponents(buttons);
        }
    }, [comp]);

    const handleEditClick = (component: Partial<DroppedComponent>) => {
        setEditingComponent(component);
    };

    const renderFields = () =>
        formFields.length > 0 ? (
            formFields.map((field: DroppedComponent, index: number) => {
                const component = ComponentRegistry[field.componentName];
                return (
                    <Draggable key={field.id} draggableId={field.id} index={index}>
                        {(provided, _snapshot) => (
                            component && (
                                <div
                                    className=""
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    style={{ ...provided.draggableProps.style }}
                                >
                                    <BoxField
                                        id={field.id}
                                        size={3}
                                        onEdit={() => handleEditClick(field)}
                                    >
                                        {React.createElement(component, {
                                            comp: field,
                                            componentId: field.id,
                                        })}
                                    </BoxField>
                                </div>
                            )
                        )}
                    </Draggable>
                );
            })
        ) : (
            <GenNoInfoField />
        );

    const renderButtons = () =>
        buttonComponents.map((button: DroppedComponent, index: number) => {
            const component = ComponentRegistry[button.componentName];
            return (
                <Draggable key={button.id} draggableId={`${button.id}`} index={index}>
                    {(provided, _snapshot) => (
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
                    )}
                </Draggable>
            );
        });


    return (
        <Card className="rounded-sm">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <Droppable droppableId={`${componentId}`} type={FEILD} direction="horizontal" isCombineEnabled>
                    {(provided, snapshot) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            role="form"
                            className={`grid grid-cols-4 gap-4 ${snapshot.isDraggingOver ? 'border-2 border-blue-500' : ''
                                }`}
                        >
                            {renderFields()}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </CardContent>
            {buttonComponents.length > 0 && (
                <CardFooter className="flex justify-end gap-2">
                    <Droppable droppableId={`${componentId}`} type={FEILD} direction="horizontal">
                        {(provided, snapshot) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`flex gap-2 ${snapshot.isDraggingOver ? 'border-2 border-green-500' : ''}`}
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