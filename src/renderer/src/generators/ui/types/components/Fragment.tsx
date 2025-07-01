import { GenNoInfoComp } from '../../components/GenNoInfoComp';
import Droppable from '@renderer/lib/dnd/Droppable';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import { DragEndResult, StructuredComponent } from '@renderer/lib/dnd/types';
import Draggable from '@renderer/lib/dnd/Draggable';
import CardComponent, { CardComponentProps } from '../CardComponent';
import BoxWrapper from '../tools/BoxWrapper';

const IGRPStudioFragment = ({ comp, onDragEnd }: CardComponentProps) => {
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
        >
            {components && components.length > 0 ? (
                components.map((child: StructuredComponent, index: number) => {
                    return (
                        <Draggable
                            key={child.id}
                            item={child}
                            index={index}
                            dropTargetId={componentId}
                            mode="MOVE"
                        >
                            <BoxWrapper
                                comp={child}
                                parentComp={comp}
                                onEdit={() => handleEdit(child)}
                                group="group/comp-frag"
                                className="-top-4 pacity-0 group-hover/comp-frag:opacity-100"
                            >
                                <CardComponent
                                    comp={child}
                                    onDragEnd={onDragEnd}
                                />
                            </BoxWrapper>
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
