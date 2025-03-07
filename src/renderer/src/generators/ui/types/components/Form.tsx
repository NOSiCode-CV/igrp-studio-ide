import React, { useEffect, useState } from 'react';
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
import { layoutMapping } from '../../utils/layout-mapping';
import { BASIC_ELEMENTS, STRUCTURES } from '../../ComponentTypes';

export interface FormComponentProps {
    isDisabled?: boolean;
    comp: StructuredComponent;
    onDragEnd: (result: DragEndResult) => void;
}

const Form: React.FC<FormComponentProps> = ({
    comp,
    isDisabled,
    onDragEnd,
}) => {
    const { id: componentId, properties, label, children } = comp;
    const { title, className, variant } = properties || {};

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
                (field: any) => field.componentName === BASIC_ELEMENTS.Button
            );
            const otherFields = children.filter(
                (field: any) => field.componentName !== BASIC_ELEMENTS.Button
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
                        className="p-0 border-none"
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

        const emptySlots =
            variant && variant.replace('cols', 0) - children.length;
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
                {!isDisabled && emptySlotComponents}
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
                        mode="MOVE"
                        layout="horizontal"
                        className="p-0 border-none"
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

    let baseClass = className;
    if (
        layoutMapping[STRUCTURES.Grid] &&
        layoutMapping[STRUCTURES.Grid][variant] &&
        variant !== 'custom'
    ) {
        baseClass = layoutMapping[STRUCTURES.Grid][variant];
    }

    return (
        <Card className="rounded-sm">
            <CardHeader>
                <CardTitle>{title || label}</CardTitle>
            </CardHeader>
            <CardContent>
                <Droppable
                    component={comp}
                    onDrop={onDragEnd}
                    layout="horizontal"
                    className="border-none hover:border-dashed p-1"
                >
                    <div className={cn(baseClass)}>{renderFields()}</div>
                </Droppable>
            </CardContent>
            {buttonComponents.length > 0 && (
                <CardFooter className="w-full justify-end">
                    <Droppable
                        component={comp}
                        onDrop={onDragEnd}
                        layout="horizontal"
                        className="border-none hover:border-dashed p-1"
                    >
                        <div className={`flex flex-1 space-x-2 justify-end w-full`}>
                            {renderButtons()}
                        </div>
                    </Droppable>
                </CardFooter>
            )}
        </Card>
    );
};

export default Form;
