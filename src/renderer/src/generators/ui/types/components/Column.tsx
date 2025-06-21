import React from 'react';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import { cn } from '@renderer/lib/utils';
import { EmptySlotComponent } from '../../components/EmptySlotComponent';
import { StructuredComponent } from '@renderer/lib/dnd/types';
import Draggable from '@renderer/lib/dnd/Draggable';
import Droppable from '@renderer/lib/dnd/Droppable';
import BoxWrapper from '../tools/BoxWrapper';
import CardComponent, { CardComponentProps } from '../CardComponent';

const IGRPStudioColumn: React.FC<CardComponentProps> = ({
    comp,
    onDragEnd,
}: CardComponentProps) => {
    const { children, id: componentId } = comp;

    const { setEditingComponent } = useDroppedComponents();

    const handleEditClick = (component: StructuredComponent) => {
        setEditingComponent({
            path: '',
            component,
        });
    };

    const renderComponents = () => {
        if (children.length === 0) return <EmptySlotComponent />;

        return children.map((child: StructuredComponent, index: number) => {
            return (
                <Draggable
                    key={child.id}
                    item={child}
                    index={index}
                    dropTargetId={componentId}
                    mode="MOVE"
                >
                    <BoxWrapper
                        parentComp={comp}
                        comp={child}
                        group="group/column"
                        onEdit={() => handleEditClick(child)}
                        className="top-0 opacity-0 group-hover/column:opacity-100"
                    >
                        <CardComponent comp={child} onDragEnd={onDragEnd} />
                    </BoxWrapper>
                </Draggable>
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
