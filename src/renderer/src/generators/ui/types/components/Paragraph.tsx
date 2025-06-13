import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import { DragEndResult, StructuredComponent } from '@renderer/lib/dnd/types';
import Droppable from '@renderer/lib/dnd/Droppable';
import { cn } from '@renderer/lib/utils';
import Draggable from '@renderer/lib/dnd/Draggable';
import BoxWrapper from '../tools/BoxWrapper';

export interface PageHeaderProps {
    comp: StructuredComponent;
    onDragEnd: (result: DragEndResult) => void;
    isDisabled?: boolean;
}

const IGRPStudioParagraph = ({ comp, onDragEnd }: PageHeaderProps) => {
    const { id: componentId, properties, componentName } = comp;
    const { content, className } = properties;

    return (
        <Draggable
            key={comp.id}
            item={comp}
            index={0}
            dropTargetId={componentId}
            layout="horizontal"
            className="p-1"
        >
            <div className={cn('', className)}>{content || componentName}</div>
        </Draggable>
    );
};

export default IGRPStudioParagraph;
