import { GenNoInfoComp } from '../../components/GenNoInfoComp';
import Droppable from '@renderer/lib/dnd/Droppable';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import { DragEndResult, StructuredComponent } from '@renderer/lib/dnd/types';
import { cn } from '@renderer/lib/utils';
import Draggable from '@renderer/lib/dnd/Draggable';
import BoxContainer from '../tools/BoxWrapper';
import CardComponent, { CardComponentProps } from '../CardComponent';
import { COMPONENT } from '../../ComponentTypes';
import { getHoverClasses } from '../../utils/tailwindGroups';

const IGRPStudioInfoCard = ({
    comp,
    group,
    hoverClass,
    onDragEnd,
}: CardComponentProps) => {
    const { children: components, id: componentId } = comp || {};

    const { setEditingComponent } = useDroppedComponents();

    const handleDrop = (item: DragEndResult) => {
        onDragEnd(item);
    };

    const handleEdit = async (component: StructuredComponent) => {
        setEditingComponent({
            path: '',
            component,
        });
    };

    //RESET Hover if parent is diff current component
    const { group: _group, hoverClass: _hoverClass } = getHoverClasses({
        group,
        hoverClass,
        componentName: COMPONENT.Container,
    });

    return (
        <Droppable
            onDrop={handleDrop}
            component={comp}
            className={cn('space-y-3 relative  p-3')}
        >
            {components && components.length > 0 ? (
                components.map((comp: StructuredComponent, index: number) => {
                    return (
                        <Draggable
                            key={comp.id}
                            item={comp}
                            index={index}
                            dropTargetId={componentId}
                            mode="MOVE"
                        >
                            <BoxContainer
                                comp={comp}
                                onEdit={() => handleEdit(comp)}
                                group={_group ?? `group/row-container`}
                                className={cn(
                                    'opacity-0',
                                    _hoverClass ??
                                        'group-hover/row-container:opacity-100'
                                )}
                            >
                                <CardComponent
                                    comp={comp}
                                    onDragEnd={onDragEnd}
                                    group="group/row-container-child"
                                    hoverClass="group-hover/row-container-child:opacity-100 left-0 right-auto"
                                />
                            </BoxContainer>
                        </Draggable>
                    );
                })
            ) : (
                <GenNoInfoComp />
            )}
        </Droppable>
    );
};

export default IGRPStudioInfoCard;
