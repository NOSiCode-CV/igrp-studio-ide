import React, { useEffect, useState } from 'react';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import { cn } from '@renderer/lib/utils';
import useStudio from '@renderer/hooks/use-studio';
import { EmptySlotComponent } from '../../components/EmptySlotComponent';
import { DragEndResult, StructuredComponent } from '@renderer/lib/dnd/types';
import Draggable from '@renderer/lib/dnd/Draggable';
import Droppable from '@renderer/lib/dnd/Droppable';
import BoxContainer from '../tools/BoxWrappertsx';

export interface ColProps {
    comp: StructuredComponent;
    onDragEnd: (result: DragEndResult) => void;
}

const Column: React.FC<ColProps> = ({ comp, onDragEnd }: ColProps) => {
    const { children, id: componentId } = comp;

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

    const renderComponents = () => {
        if (children.length === 0) return <EmptySlotComponent />;

        return children.map((comp: StructuredComponent, index: number) => {
            const Component = loadedComponents[comp.id];

            return Component ? (
                <Draggable
                    key={comp.id}
                    item={comp}
                    index={index}
                    dropTargetId={componentId}
                    mode="MOVE"
                >
                    <BoxContainer
                        comp={comp}
                        group="group/column-comp"
                        onEdit={() => handleEditClick(comp)}
                        className="top-0 opacity-0 group-hover/column-comp:opacity-100"
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
        <Droppable component={comp} onDrop={onDragEnd}>
            <div className={cn(`w-full flex flex-col p-0 gap-3`)}>
                {renderComponents()}
            </div>
        </Droppable>
    );
};

export default Column;
