import React, { useEffect, useState } from 'react';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import useStudio from '@renderer/hooks/use-studio';
import { DragEndResult, StructuredComponent } from '@renderer/lib/dnd/types';
import Droppable from '@renderer/lib/dnd/Droppable';
import { cn } from '@renderer/lib/utils';
import Draggable from '@renderer/lib/dnd/Draggable';
import BoxField from '../tools/BoxFields';
import { IGRPPageHeader } from '@igrp/igrp-framework-react-design-system';
import GenNoInfoField from '../../components/GenNoInfoField';

export interface FormComponentProps {
    comp: StructuredComponent;
    onDragEnd: (result: DragEndResult) => void;
    isDisabled?: boolean;
}

const PageHeader: React.FC<FormComponentProps> = ({ comp, onDragEnd }) => {
    const {
        id: componentId,
        children: fields,
        componentName,
        label,
        properties,
    } = comp;
    const { title, description } = properties;

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
        setEditingComponent({
            path: '',
            component,
        });
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

    const renderButtons = () => {
        return buttonComponents.length === 0 ? (
            <GenNoInfoField />
        ) : (
            buttonComponents.map(
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
                                    comp={button}
                                    parentComp={comp}
                                    onEdit={() => handleEditClick(button)}
                                    index={index}
                                >
                                    <Component
                                        comp={button}
                                        onDragEnd={onDragEnd}
                                    />
                                </BoxField>
                            )}
                        </Draggable>
                    );
                }
            )
        );
    };

    return (
        <Droppable component={comp} onDrop={onDragEnd} layout="horizontal">
            <IGRPPageHeader
                title={title || label || componentName}
                description={description}
            >
                <div className={cn('flex flex-1 justify-end gap-3')}>
                    {renderButtons()}
                </div>
            </IGRPPageHeader>
        </Droppable>
    );
};

export default PageHeader;
