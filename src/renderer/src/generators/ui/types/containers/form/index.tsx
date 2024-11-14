import React, { useEffect, useState } from 'react';
import GenNoInfoField from '../../../components/GenNoInfoField';
import { DroppedComponent } from '../../../interfaces';
import { useDroppedComponents } from '../../../dnd/DroppedComponentsContext';
import BoxField from '../../fields/BoxFields';
import { ComponentRegistry } from '../../../data/ComponentRegistry';
import { Draggable, Droppable } from 'react-beautiful-dnd';
import { FEILD, FIELDS } from '@renderer/generators/ui/ComponentTypes';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@renderer/components/ui/card';

const getItemStyle = (isDragging, draggableStyle, index) => ({
    userSelect: 'none',
    background: isDragging ? 'lightgreen' : '',
    ...draggableStyle,
    maxWidth: index === 0 ? window.innerWidth : window.innerWidth / 2,
    // styles we need to apply on draggables
    ...draggableStyle,
    overflow: "hidden"
});

const getListStyle = isDraggingOver => ({
    background: isDraggingOver ? "lightblue" : "",
    border: isDraggingOver ? '2px dashed blue' : 'none',
    display: "flex"
});

export interface FormComponentProps {
    componentName: string,
    componentId: string,
    acceptTypes: string[],
    comp: DroppedComponent,
    onEdit: () => void
}

const FormLayout: React.FC<FormComponentProps> = ({ comp, componentId }) => {

    if (!componentId) return;

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

    return (
        <Card className='mb-0 rounded-sm'>
            <CardHeader className='pb-1'>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <Droppable droppableId={`${componentId}`}
                    type={FEILD}
                    direction='horizontal'
                    isCombineEnabled>
                    {(provided: any, snapshot: any) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            role="form"
                            className="space-x-3"
                            style={getListStyle(snapshot.isDraggingOver)}
                        >
                            {formFields.length > 0 ? formFields.map((comp: DroppedComponent, index: number) => {
                                const component = ComponentRegistry[comp.componentName];
                                return (
                                    <Draggable
                                        key={comp.id}
                                        draggableId={comp.id}
                                        index={index}
                                    >
                                        {(provided: any, snapshot: any) => (

                                            component && (

                                                <div
                                                    className={`col-md-${3} gen-fields-holder`}
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    style={getItemStyle(
                                                        snapshot.isDragging,
                                                        provided.draggableProps.style,
                                                        index
                                                    )}
                                                >
                                                    <BoxField key={comp.id}
                                                        id={comp.id}
                                                        size={3}
                                                        onEdit={() => handleEditClick(comp)}
                                                    >
                                                        {React.createElement(component, {
                                                            comp,
                                                            componentId: comp.id
                                                        })
                                                        }
                                                    </BoxField>
                                                </div>
                                            )

                                        )}
                                    </Draggable>
                                )
                            }) : (
                                <GenNoInfoField />
                            )}

                            {provided.placeholder}

                        </div>
                    )}
                </Droppable>
            </CardContent>
            {
                buttonComponents.length > 0 && (
                    <CardFooter className="flex justify-end gap-2">
                        {buttonComponents.map((comp: DroppedComponent) => (
                            <div key={comp.id}>
                                {React.createElement(ComponentRegistry[comp.componentName], {
                                    comp,
                                    componentId: comp.id,
                                    onEdit: () => handleEditClick(comp)
                                })}
                            </div>
                        ))}
                    </CardFooter>
                )
            }
        </Card >
    );
};

export default FormLayout;
