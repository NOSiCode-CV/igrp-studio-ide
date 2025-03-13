import React, { useEffect, useState } from 'react';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import { PageHeader as IGRPPageHeader} from '@igrp/igrp-framework-react-design-system';
import useStudio from '@renderer/hooks/useStudio';
import { DragEndResult, StructuredComponent } from '@renderer/lib/dnd/types';
import Droppable from '@renderer/lib/dnd/Droppable';
import { cn } from '@renderer/lib/utils';
import Draggable from '@renderer/lib/dnd/Draggable';
import BoxField from '../tools/BoxFields';

export interface FormComponentProps {
    comp: StructuredComponent;
    onDragEnd: (result: DragEndResult) => void;
    isDisabled?: boolean;
}

const PageHeader: React.FC<FormComponentProps> = ({
    comp,
    onDragEnd,
}) => {
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
            parentComp: comp,
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

    const renderButtons = () =>
        buttonComponents.map((button: StructuredComponent, index: number) => {
            const Component = loadedComponents[button.id];
            return (
                <Draggable
                    key={button.id}
                    item={button}
                    index={index}
                    dropTargetId={componentId}
                    layout="horizontal"
                    className="p-0 border-none"
                >
                    {Component && (
                        <BoxField
                            comp={button}
                            onEdit={() => handleEditClick(button)}
                            index={index}
                        >
                            <Component comp={button} onDragEnd={onDragEnd} />
                        </BoxField>
                    )}
                </Draggable>
            );
        });

    return (
        <Droppable
            component={comp}
            onDrop={onDragEnd}
            layout="horizontal"
            className="border-none"
        >
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
