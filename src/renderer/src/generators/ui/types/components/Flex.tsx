import React, { useEffect, useState } from 'react';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import { cn } from '@renderer/lib/utils';
import useStudio from '@renderer/hooks/use-studio';
import { DragEndResult, StructuredComponent } from '@renderer/lib/dnd/types';
import Droppable from '@renderer/lib/dnd/Droppable';
import Draggable from '@renderer/lib/dnd/Draggable';
import BoxWrapper from '../tools/BoxWrapper';
import { flexVariants } from '../../utils/layout-mapping';
import { EmptySlotComponent } from '../../components/EmptySlotComponent';
import { COMPONENT } from '../../ComponentTypes';
import { nanoid } from '@reduxjs/toolkit';
import { getHoverClasses } from '../../utils/tailwindGroups';

export interface FlexProps {
    comp: StructuredComponent;
    onDragEnd: (result: DragEndResult) => void;
    group?: string;
    hoverClass?: string;
}

const IGRPStudioFlex: React.FC<FlexProps> = ({
    comp,
    group,
    hoverClass,
    onDragEnd,
}: FlexProps) => {
    const { children, properties, id: componentId } = comp;

    const { variant, className } = properties || {};

    const [loadedComponents, setLoadedComponents] = useState<{
        [key: string]: React.ComponentType<any>;
    }>({});

    const { setEditingComponent } = useDroppedComponents();

    const { dynamicImport } = useStudio();

    const handleEditClick = (component: StructuredComponent) => {
        setEditingComponent({
            path: '',
            component,
        });
    };

    useEffect(() => {
        const loadComponents = async () => {
            const comps: { [key: string]: React.ComponentType<any> } = {};

            for (const comp of children) {
                const component = await dynamicImport(comp.componentName);
                comps[comp.id] = component;
            }

            setLoadedComponents(comps);
        };

        loadComponents();
    }, [children, dynamicImport]);

    //RESET Hover if parent is diff current component
    const { group: _group, hoverClass: _hoverClass } = getHoverClasses({
        group,
        hoverClass,
        componentName: COMPONENT.Flex,
    });

    const renderColumns = () => {
        const fields =
            children.length > 0 ? (
                children.map((comp: StructuredComponent, index: number) => {
                    const Component = loadedComponents[comp.id];

                    return Component ? (
                        <Draggable
                            key={comp.id}
                            item={comp.id}
                            layout="horizontal"
                            index={index}
                            dropTargetId={componentId}
                            mode="MOVE"
                            className="p-1 min-w-32 text-center"
                        >
                            <BoxWrapper
                                comp={comp}
                                group={cn(_group ?? 'group/comp-flex')}
                                onEdit={() => handleEditClick(comp)}
                                className={cn(
                                    'opacity-0',
                                    _hoverClass ??
                                        'group-hover/comp-flex:opacity-100'
                                )}
                            >
                                <Component
                                    comp={comp}
                                    onDragEnd={onDragEnd}
                                    group={`group/comp-flex-child`}
                                    hoverClass={`group-hover/comp-flex-child:opacity-100`}
                                />
                            </BoxWrapper>
                        </Draggable>
                    ) : (
                        <div key={comp.id}>Loading...</div>
                    );
                })
            ) : (
                <EmptySlotComponent></EmptySlotComponent>
            );

        return <>{fields}</>;
    };

    return (
        <Droppable
            component={comp}
            onDrop={onDragEnd}
            layout="horizontal"
            className="p-2"
        >
            <div
                className={cn(
                    flexVariants({ variant, className }),
                    'space-y-2'
                )}
            >
                {renderColumns()}
            </div>
        </Droppable>
    );
};

export default IGRPStudioFlex;
