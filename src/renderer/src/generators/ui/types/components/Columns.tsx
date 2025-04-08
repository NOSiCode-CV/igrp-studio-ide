import React, { useEffect, useState } from 'react';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import { cn } from '@renderer/lib/utils';
import useStudio from '@renderer/hooks/use-studio';
import { DragEndResult, StructuredComponent } from '@renderer/lib/dnd/types';
import Draggable from '@renderer/lib/dnd/Draggable';
import { columnsVariants, columnVariants } from '../../utils/layout-mapping';
import BoxContainer from '../tools/BoxWrappertsx';

export interface ColProps {
    isDisabled?: boolean;
    comp: StructuredComponent;
    onDragEnd: (result: DragEndResult) => void;
}

const Columns: React.FC<ColProps> = ({ comp, onDragEnd }: ColProps) => {
    const { children, properties } = comp;

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
        return children.map((comp: StructuredComponent, index: number) => {
            const Component = loadedComponents[comp.id];
            const { properties } = comp;

            const { variant, className } = properties || {};

            return Component ? (
                <Draggable
                    key={comp.id}
                    item={comp}
                    index={index}
                    dropZone={false}
                    className={cn(columnVariants({ variant, className }))}
                >
                    <BoxContainer
                        comp={comp}
                        onEdit={() => handleEditClick(comp)}
                        group="group/comp"
                        className="opacity-0 group-hover/comp:opacity-100"
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
        <div className={cn('p-3', columnsVariants({ variant, className }))}>
            {renderColumns()}
        </div>
    );
};

export default Columns;
