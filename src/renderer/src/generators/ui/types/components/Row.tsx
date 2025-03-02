import { GenNoInfoComp } from '../../components/GenNoInfoComp';
import Droppable from '@renderer/lib/dnd/Droppable';
import RowOptions from '../rows/RowOptions';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import { DragEndResult, StructuredComponent } from '@renderer/lib/dnd/types';
import { cn } from '@renderer/lib/utils';
import useStudio from '@renderer/hooks/useStudio';
import { useEffect, useState } from 'react';
import Draggable from '@renderer/lib/dnd/Draggable';
import BoxContainer from '../BoxContainer';

export const Row = ({ component, onDragEnd, onAddControl }) => {
    const { children: components, id: componentId } = component;

    const { removeRow } = useDroppedComponents();

    const [loadedComponents, setLoadedComponents] = useState<{
        [key: string]: React.ComponentType<any>;
    }>({});

    const { dynamicImport } = useStudio();

    useEffect(() => {
        const loadComponents = async () => {
            const comps: { [key: string]: React.ComponentType<any> } = {};

            for (const comp of components) {
                const component = await dynamicImport(comp.componentName);
                comps[comp.id] = component;
            }

            setLoadedComponents(comps);
        };

        loadComponents();
    }, [components, dynamicImport]);

    const handleDrop = (item: DragEndResult) => {
        onDragEnd(item);
    };

    const handleDeleteSection = () => {
        removeRow(component.id);
    };

    const layoutMode = 'vertical';

    return (
        <div className="group/row relative hover:border-2 hover:border-igrp hover:rounded-sm ">
            <RowOptions
                onClickAddControl={(type) => onAddControl(type, componentId)}
                onClickDeleteSection={handleDeleteSection}
            />
            <Droppable onDrop={handleDrop} component={component} className='hover:border-none'>
                <div
                    id={component.id}
                    className={cn(
                        'relative ',
                        layoutMode === 'vertical'
                            ? 'space-y-2'
                            : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'
                    )}
                >
                    {components.length > 0 ? (
                        components.map(
                            (comp: StructuredComponent, index: number) => {
                                const Component = loadedComponents[comp.id];

                                return Component ? (
                                    <Draggable
                                        key={comp.id}
                                        item={comp}
                                        index={index}
                                        dropTargetId={componentId}
                                    >
                                        <BoxContainer
                                            key={comp.id}
                                            id={comp.id}
                                            group="components"
                                            onEdit={() => console.log()}
                                            className={
                                                'left-0 top-0 right-auto'
                                            }
                                        >
                                            <Component
                                                comp={comp}
                                                onDragEnd={onDragEnd}
                                            />
                                        </BoxContainer>
                                    </Draggable>
                                ) : (
                                    <div key={comp.id}>Loading...</div>
                                );
                            }
                        )
                    ) : (
                        <GenNoInfoComp />
                    )}
                </div>
            </Droppable>
        </div>
    );
};
