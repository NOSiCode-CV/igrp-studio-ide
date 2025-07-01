import React from 'react';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import { cn } from '@renderer/lib/utils';
import { StructuredComponent } from '@renderer/lib/dnd/types';
import Draggable from '@renderer/lib/dnd/Draggable';
import { columnsVariants, columnVariants } from '../../utils/layout-mapping';
import BoxWrapper from '../tools/BoxWrapper';
import { useIsMobile } from '@renderer/hooks/use-mobile';
import CardComponent, { CardComponentProps } from '../CardComponent';

const IGRPStudioColumns: React.FC<CardComponentProps> = ({
    comp,
    onDragEnd,
}: CardComponentProps) => {
    const { children, properties, componentName } = comp;

    const { variant, className } = properties || {};

    const { setEditingComponent } = useDroppedComponents();

    const isMobile = useIsMobile();

    const handleEditClick = (component: StructuredComponent) => {
        setEditingComponent({
            path: componentName,
            component,
        });
    };

    const renderColumns = () => {
        return children.map((comp: StructuredComponent, index: number) => {
            const { properties } = comp;

            const { variant, className } = properties || {};

            return (
                <Draggable
                    key={comp.id}
                    item={comp}
                    index={index}
                    dropZone={true}
                    className={cn(
                        columnVariants({ variant, className })
                    )}
                >
                    <BoxWrapper
                        comp={comp}
                        parentComp={comp}
                        onEdit={() => handleEditClick(comp)}
                        group="group/comp-columns"
                        className="opacity-0 group-hover/comp-columns:opacity-100"
                    >
                        <CardComponent comp={comp} onDragEnd={onDragEnd} />
                    </BoxWrapper>
                </Draggable>
            );
        });
    };

    return (
        <div
            className={cn(
                'p-2',
                columnsVariants({ variant, className }),
                isMobile && 'grid-cols-2 w-full space-y-3'
            )}
        >
            {renderColumns()}
        </div>
    );
};

export default IGRPStudioColumns;
