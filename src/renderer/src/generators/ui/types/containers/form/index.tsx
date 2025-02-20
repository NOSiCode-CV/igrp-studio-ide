import React, { useEffect, useState } from 'react';
import GenNoInfoField from '../../../components/GenNoInfoField';
import { DroppedComponent } from '../../../interfaces';
import { useDroppedComponents } from '../../../dnd/DroppedComponentsContext';
import BoxField from '../../fields/BoxFields';
import { ComponentRegistry } from '../../../data/ComponentRegistry';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import { FEILD, FIELDS } from '@renderer/generators/ui/ComponentTypes';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@renderer/components/ui/card';
import { cn } from '@renderer/lib/utils';

export interface FormComponentProps {
    componentName: string;
    componentId: string;
    acceptTypes: string[];
    comp: DroppedComponent;
    onEdit: () => void;
}

const FormLayout: React.FC<FormComponentProps> = ({ comp, componentId }) => {
    const [formFields, setFormFields] = useState<DroppedComponent[]>([]);
    const [buttonComponents, setButtonComponents] = useState<
        DroppedComponent[]
    >([]);

    const { setEditingComponent } = useDroppedComponents();
    const { title, colSize } = comp.config;

    useEffect(() => {
        if (comp.fields) {
            const fields = comp.fields;
            const buttons = fields.filter(
                (field: any) => field.componentName === FIELDS.BUTTON
            );
            const otherFields = fields.filter(
                (field: any) => field.componentName !== FIELDS.BUTTON
            );

            setFormFields(otherFields);
            setButtonComponents(buttons);
        }
    }, [comp]);

    const handleEditClick = (component: Partial<DroppedComponent>) => {
        setEditingComponent({ ...component, componentId: componentId });
    };

    const renderFields = (onDrop: boolean) =>
        formFields.length > 0
            ? formFields.map((field: DroppedComponent, index: number) => {
                  const component = ComponentRegistry[field.componentName];
                  return (
                      <Draggable
                          key={field.id}
                          draggableId={field.id}
                          index={index}
                      >
                          {(provided, _snapshot) =>
                              component && (
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
                          }
                      </Draggable>
                  );
              })
            : !onDrop && <GenNoInfoField />;

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
        <Card className="rounded-sm">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <Droppable
                    droppableId={`${componentId}`}
                    type={FEILD}
                    direction="horizontal"
                >
                    {(provided, snapshot) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={cn(`grid grid-cols-${colSize} gap-4 ${
                                snapshot.isDraggingOver
                                    ? 'border-2 border-dashed border-igrp p-2'
                                    : ''
                            }`)}
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
                        type={FEILD}
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
