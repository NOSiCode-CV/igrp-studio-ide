import React, { useEffect, useState } from 'react';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import { cn } from '@renderer/lib/utils';
import useStudio from '@renderer/hooks/use-studio';
import { EmptySlotComponent } from '../../components/EmptySlotComponent';
import { DragEndResult, StructuredComponent } from '@renderer/lib/dnd/types';
import Draggable from '@renderer/lib/dnd/Draggable';
import Droppable from '@renderer/lib/dnd/Droppable';
import BoxWrapper from '../tools/BoxWrapper';
import { useTranslation } from 'react-i18next';

export interface ColProps {
    comp: StructuredComponent;
    onDragEnd: (result: DragEndResult) => void;
}

const IGRPStudioColumn: React.FC<ColProps> = ({ comp, onDragEnd }: ColProps) => {
    const { children, id: componentId } = comp;
    const { t } = useTranslation();
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
                    <BoxWrapper
                        comp={comp}
                        group="group/column"
                        onEdit={() => handleEditClick(comp)}
                        className="top-0 opacity-0 group-hover/column:opacity-100"
                    >
                        <Component comp={comp} onDragEnd={onDragEnd} />
                    </BoxWrapper>
                </Draggable>
            ) : (
                <div key={comp.id}>{t('loading')}</div>
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

export default IGRPStudioColumn;
