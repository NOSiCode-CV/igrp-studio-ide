import React, { useEffect, useState } from 'react';
import { cn } from '@renderer/lib/utils';
import useStudio from '@renderer/hooks/use-studio';
import { DragEndResult, StructuredComponent } from '@renderer/lib/dnd/types';
import Draggable from '@renderer/lib/dnd/Draggable';
import Droppable from '@renderer/lib/dnd/Droppable';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import { formVariants } from '../../utils/layout-mapping';
import { GenNoInfoComp } from '../../components/GenNoInfoComp';
import BoxContainer from '../tools/BoxWrappertsx';

export interface FormComponentProps {
    isDisabled?: boolean;
    comp: StructuredComponent;
    onDragEnd: (result: DragEndResult) => void;
}

const Form: React.FC<FormComponentProps> = ({ comp, onDragEnd }) => {
    const { id: componentId, properties, children } = comp;
    const { className, variant } = properties || {};

    const [loadedComponents, setLoadedComponents] = useState<{
        [key: string]: React.ComponentType<any>;
    }>({});

    const { dynamicImport } = useStudio();

    const { setEditingComponent } = useDroppedComponents();

    useEffect(() => {
        const loadComponents = async () => {
            const components: { [key: string]: React.ComponentType<any> } = {};

            for (const field of children) {
                const component = await dynamicImport(field.componentName);
                components[field.id] = component;
            }

            setLoadedComponents(components);
        };

        loadComponents();
    }, [children, dynamicImport]);

    const handleEditClick = (component: StructuredComponent) => {
        setEditingComponent({
            path: '',
            component,
        });
    };

    const renderFields = () => {
        const fields =
            children.length > 0 ? (
                children.map((comp: StructuredComponent, index: number) => {
                    const Component = loadedComponents[comp.id];
                    return (
                        <Draggable
                            key={comp.id}
                            item={comp}
                            index={index}
                            dropTargetId={componentId}
                            className="p-0 border-none"
                            mode="MOVE"
                        >
                            {Component && (
                                <BoxContainer
                                    comp={comp}
                                    group="group/comp-form"
                                    onEdit={() => handleEditClick(comp)}
                                    className="opacity-0 group-hover/comp-form:opacity-100"
                                >
                                    <Component
                                        comp={comp}
                                        onDragEnd={onDragEnd}
                                    />
                                </BoxContainer>
                            )}
                        </Draggable>
                    );
                })
            ) : (
                <GenNoInfoComp />
            );

        return fields;
    };

    return (
        <Droppable
            component={comp}
            onDrop={onDragEnd}
            className="border-none hover:border-dashed"
        >
            <div className="border-gray-900/10">
                <div
                    className={cn(formVariants({ variant, className }), 'mt-2')}
                >
                    {renderFields()}
                </div>
            </div>
        </Droppable>
    );
};

export default Form;
