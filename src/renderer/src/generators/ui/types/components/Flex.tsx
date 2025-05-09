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

export interface FlexProps {
    comp: StructuredComponent;
    onDragEnd: (result: DragEndResult) => void;
}

const Flex: React.FC<FlexProps> = ({ comp, onDragEnd }: FlexProps) => {
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

    const renderColumns = () => {
        const fields =
            children.length > 0 ?
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
                        className="p-1"
                    >
                        <BoxWrapper
                            comp={comp}
                            group="group/column-comp"
                            onEdit={() => handleEditClick(comp)}
                            className="opacity-0 group-hover/column-comp:opacity-100"
                        >
                            <Component comp={comp} onDragEnd={onDragEnd} />
                        </BoxWrapper>
                    </Draggable>
                ) : (
                    <div key={comp.id}>Loading...</div>
                );
            }): (<EmptySlotComponent></EmptySlotComponent>);

        return <>{fields}</>;
    };

    return (
        <Droppable
            component={comp}
            onDrop={onDragEnd}
            layout="horizontal"
            className="border-none"
        >
            <div className={cn(flexVariants({ variant, className }))}>
                {renderColumns()}
            </div>
        </Droppable>
    );
};

export default Flex;
