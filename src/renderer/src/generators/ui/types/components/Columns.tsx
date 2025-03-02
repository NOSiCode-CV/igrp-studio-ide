import React, { useEffect, useState } from 'react';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import BoxContainer from '../BoxContainer';
import { cn } from '@renderer/lib/utils';
import useStudio from '@renderer/hooks/useStudio';
import { DragEndResult, StructuredComponent } from '@renderer/lib/dnd/types';
import Draggable from '@renderer/lib/dnd/Draggable';

export interface ColProps {
    comp: StructuredComponent;
    onDragEnd: (result: DragEndResult) => void;
}

const Columns: React.FC<ColProps> = ({ comp, onDragEnd }: ColProps) => {
    const { children, props, id: componentId } = comp;

    const { gridCol } = props || {};

    const [loadedComponents, setLoadedComponents] = useState<{
        [key: string]: React.ComponentType<any>;
    }>({});

    const { setEditingComponent } = useDroppedComponents();

    const { dynamicImport } = useStudio();

    const handleEditClick = (component: Partial<StructuredComponent>) => {
        setEditingComponent(component);
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

    const renderColumns = () => {
        return children.map((comp: StructuredComponent, index: number) => {
            const Component = loadedComponents[comp.id];

            return Component ? (
                <Draggable key={comp.id} item={comp} index={index} dropZone={false}>
                    <BoxContainer
                        key={comp.id}
                        id={comp.id}
                        onEdit={() => handleEditClick(comp)}
                        group="column"
                    >
                        <Component comp={comp} onDragEnd={onDragEnd} />
                    </BoxContainer>
                </Draggable>
            ) : (
                <div key={comp.id}>Loading...</div>
            );
        });
    };

    return (
        <>
            <div
                className={cn(
                    `grid grid-cols-${gridCol} gap-3 p-2`
                )}
            >
                {renderColumns()}
            </div>
        </>
    );
};

export default Columns;
