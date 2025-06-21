import React from 'react';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import { cn } from '@renderer/lib/utils';
import { EmptySlotComponent } from '../../components/EmptySlotComponent';
import { StructuredComponent } from '@renderer/lib/dnd/types';
import Droppable from '@renderer/lib/dnd/Droppable';
import Draggable from '@renderer/lib/dnd/Draggable';
import { gridVariants } from '../../utils/layout-mapping';
import BoxWrapper from '../tools/BoxWrapper';
import CardComponent, { CardComponentProps } from '../CardComponent';

const IGRPStudioGrid: React.FC<CardComponentProps> = ({
    comp,
    onDragEnd,
    className,
}: CardComponentProps) => {
    const { children, properties, id: componentId } = comp;

    const { variant } = properties || {};

    const { setEditingComponent } = useDroppedComponents();

    const handleEditClick = (component: StructuredComponent) => {
        setEditingComponent({
            path: '',
            component,
        });
    };

    const renderChild = () => {
        const fields =
            children.length > 0 &&
            children.map((comp: StructuredComponent, index: number) => {
                return (
                    <Draggable
                        key={comp.id}
                        item={comp}
                        layout="horizontal"
                        index={index}
                        dropTargetId={componentId}
                        mode="MOVE"
                        className="border-none p-1"
                    >
                        <BoxWrapper
                            comp={comp}
                            group="group/column-grid"
                            onEdit={() => handleEditClick(comp)}
                            className="opacity-0 group-hover/column-grid:opacity-100  -top-4"
                        >
                            <CardComponent comp={comp} onDragEnd={onDragEnd} />
                        </BoxWrapper>
                    </Draggable>
                );
            });

        const emptySlots =
            variant && variant.replace('cols', 0) - children.length;
        const emptySlotComponents = Array.from(
            { length: emptySlots },
            (_, index) => (
                <div key={`empty-slot-${index}`}>
                    <EmptySlotComponent />
                </div>
            )
        );

        return (
            <>
                {fields}
                {emptySlotComponents}
            </>
        );
    };

    return (
        <Droppable
            component={comp}
            onDrop={onDragEnd}
            layout="horizontal"
            className="px-1 py-1.5"
        >
            <div className={cn(gridVariants({ variant, className }))}>
                {renderChild()}
            </div>
        </Droppable>
    );
};

export default IGRPStudioGrid;
