import { GenNoInfoComp } from '../../components/GenNoInfoComp';
import Droppable from '@renderer/lib/dnd/Droppable';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import { DragEndResult, StructuredComponent } from '@renderer/lib/dnd/types';
import { cn } from '@renderer/lib/utils';
import Draggable from '@renderer/lib/dnd/Draggable';
import BoxContainer from '../tools/BoxWrapper';
import CardComponent, { CardComponentProps } from '../CardComponent';

const IGRPStudioFragment = ({
    comp,
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

    return (
        <Droppable
            onDrop={handleDrop}
            component={comp}
            className={cn(
                'space-y-1 group/row relative hover:border-1 hover:border-primary rounded-lg p-1',
            )}
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
                                group="group/row-container"
                                className={cn(
                                    'left-0 right-auto opacity-0',
                                )}
                            >
                                <CardComponent
                                    comp={comp}
                                    onDragEnd={onDragEnd}
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

export default IGRPStudioFragment;
