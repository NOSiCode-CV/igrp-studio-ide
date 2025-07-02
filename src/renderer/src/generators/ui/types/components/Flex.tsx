import React from 'react';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import { cn } from '@renderer/lib/utils';
import { StructuredComponent } from '@renderer/lib/dnd/types';
import Droppable from '@renderer/lib/dnd/Droppable';
import Draggable from '@renderer/lib/dnd/Draggable';
import BoxWrapper from '../tools/BoxWrapper';
import { flexVariants } from '../../utils/layout-mapping';
import { EmptySlotComponent } from '../../components/EmptySlotComponent';
import { COMPONENT } from '../../ComponentTypes';
import { getHoverClasses } from '../../utils/tailwindGroups';
import CardComponent, { CardComponentProps } from '../CardComponent';

const IGRPStudioFlex: React.FC<CardComponentProps> = ({
    comp,
    group,
    hoverClass,
    onDragEnd,
    className,
}) => {
    const { children, properties, id: componentId } = comp;

    const { variant } = properties || {};

    const { setEditingComponent } = useDroppedComponents();

    const handleEditClick = (component: StructuredComponent) => {
        setEditingComponent({
            path: '',
            component,
        });
    };

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
                    return (
                        <Draggable
                            key={comp.id}
                            item={comp}
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
                                <CardComponent
                                    comp={comp}
                                    onDragEnd={onDragEnd}
                                    group={`group/comp-flex-child`}
                                    hoverClass={`group-hover/comp-flex-child:opacity-100`}
                                />
                            </BoxWrapper>
                        </Draggable>
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
