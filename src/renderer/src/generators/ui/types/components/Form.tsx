import React, { useEffect, useState } from 'react';
import { BasicElements } from '@renderer/generators/ui/ComponentTypes';
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
import BoxField from '../tools/BoxFields';
import { DragEndResult, StructuredComponent } from '@renderer/lib/dnd/types';
import Draggable from '@renderer/lib/dnd/Draggable';
import Droppable from '@renderer/lib/dnd/Droppable';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';

export interface FormComponentProps {
    comp: StructuredComponent;
    onDragEnd: (result: DragEndResult) => void;
}

const Form: React.FC<FormComponentProps> = ({ comp, onDragEnd }) => {
    const { id: componentId, componentName, props, children } = comp;
    const { title, gridCol } = props || {};

    const [formFields, setFormFields] = useState<StructuredComponent[]>([]);

    const [buttonComponents, setButtonComponents] = useState<
        StructuredComponent[]
    >([]);

    const [loadedComponents, setLoadedComponents] = useState<{
        [key: string]: React.ComponentType<any>;
    }>({});

    const [loading, setLoading] = useState(false);

    const { dynamicImport } = useStudio();

    const { setEditingComponent } = useDroppedComponents();

    useEffect(() => {
        if (children) {
            const buttons = children.filter(
                (field: any) => field.componentName === BasicElements.Button
            );
            const otherFields = children.filter(
                (field: any) => field.componentName !== BasicElements.Button
            );

            setFormFields(otherFields);
            setButtonComponents(buttons);
        }
    }, [comp, children]);

    useEffect(() => {
        const loadComponents = async () => {
            setLoading(true);
            const components: { [key: string]: React.ComponentType<any> } = {};

            // Load form fields
            for (const field of formFields) {
                const component = await dynamicImport(field.componentName);
                components[field.id] = component;
            }

            // Load buttons
            for (const button of buttonComponents) {
                const component = await dynamicImport(button.componentName);
                components[button.id] = component;
            }

            setLoadedComponents(components);
            setLoading(false);
        };

        loadComponents();
    }, [formFields, buttonComponents, dynamicImport]);

    const handleEditClick = (component: StructuredComponent) => {
        setEditingComponent({ ...component });
    };

    const renderFields = () => {
        const fields =
            formFields.length > 0 &&
            formFields.map((field: StructuredComponent, index: number) => {
                const Component = loadedComponents[field.id];
                return (
                    <Draggable
                        key={field.id}
                        item={field}
                        index={index}
                        dropTargetId={componentId}
                        layout="horizontal"
                        className="p-1"
                    >
                        {Component && (
                            <BoxField
                                id={field.id}
                                onEdit={() => handleEditClick(field)}
                                index={index}
                            >
                                <Component comp={field} onDragEnd={onDragEnd} />
                            </BoxField>
                        )}
                    </Draggable>
                );
            });

        const emptySlots = gridCol - formFields.length;
        const emptySlotComponents = Array.from(
            { length: emptySlots },
            (_, index) => (
                <div key={`empty-slot-${index}`}>
                    <EmptySlotComponent isComponent={false} />
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
            (button: StructuredComponent, index: number) => {
                const Component = loadedComponents[button.id];
                return (
                    <Draggable
                        key={button.id}
                        item={button}
                        index={index}
                        dropTargetId={componentId}
                        layout="horizontal"
                        className="p-1"
                    >
                        {Component && (
                            <BoxField
                                id={button.id}
                                onEdit={() => handleEditClick(button)}
                                index={index}
                            >
                                <Component
                                    comp={button}
                                    onDragEnd={onDragEnd}
                                    index={index}
                                />
                            </BoxField>
                        )}
                    </Draggable>
                );
            }
        );
    };

    return (
        <Card className="group/form hover:border-2 hover:border-gray-300 hover:border-dashed rounded-sm">
            <CardHeader>
                <CardTitle>{title || componentName}</CardTitle>
            </CardHeader>
            <CardContent>
                <Droppable
                    component={comp}
                    onDrop={onDragEnd}
                    layout="horizontal"
                >
                    <div
                        className={cn(
                            `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${gridCol} gap-4`
                        )}
                    >
                        {renderFields()}
                    </div>
                </Droppable>
            </CardContent>
            {buttonComponents.length > 0 && (
                <CardFooter className="w-full">
                    <Droppable
                        component={comp}
                        onDrop={onDragEnd}
                        layout="horizontal"
                    >
                        <div className={`flex flex-1 space-x-2 justify-end}`}>
                            {renderButtons()}
                        </div>
                    </Droppable>
                </CardFooter>
            )}
        </Card>
    );
};

export default Form;
