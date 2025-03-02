import { DropZone } from '@renderer/generators/ui/light/DropZone';
import { cn } from '../utils';
import { useDragDrop } from './drag-drop-context';
import { LayoutMode } from './types';

interface DraggableProps {
    index?: number;
    dropTargetId?: string;
    className?: string;
    item: any;
    layout?: LayoutMode;
    dropZone?: boolean;
    children: React.ReactNode;
    type?: string;
}

const Draggable = ({
    index = 0,
    item,
    dropTargetId,
    className,
    layout = 'vertical',
    children,
    dropZone = true,
    type = 'DEFAULT',
}: DraggableProps) => {

    const { id: componentId } = item;

    const {
        draggedId,
        onDragStart,
        onDragEnd,
        activeDropZone,
        handleDragLeave,
        handleDragOver,
        setLayoutMode,
    } = useDragDrop();

   

    const handleLayoutChange = (layout: LayoutMode) => {
        setLayoutMode(layout); // No error, since `layout` is of type `LayoutMode`
      };

    return (
        <div
            draggable
            onDragStart={(e) => {
                onDragStart(item);
                e.dataTransfer.setData('text/plain', JSON.stringify(item));
                e.dataTransfer.setData('type', JSON.stringify(type));
            }}
            onDragEnd={onDragEnd}
            onDragLeave={handleDragLeave}
            onDragOver={(e) => {
                handleDragOver(e, componentId, index, dropTargetId);
                handleLayoutChange(layout);
            }}
            className={cn(
                dropZone &&
                    'relative group border rounded-md bg-card transition-all',
                draggedId === componentId
                    ? 'opacity-50 border-primary'
                    : 'border-border',
                dropZone && 'hover:border-primary/50',
                className
            )}
            id={`drag-${componentId}`}
        >
            {dropZone && (
                <DropZone
                    layoutMode={layout}
                    activeDropZone={activeDropZone}
                    componentId={componentId}
                />
            )}
            {children}
        </div>
    );
};

export default Draggable;
