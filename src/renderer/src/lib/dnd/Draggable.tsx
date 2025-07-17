import { cn } from '../utils';
import { useDragDrop } from './drag-drop-context';
import { DropZone } from './DropZone';
import { LayoutMode, StructuredComponent } from './types';
import type { DragEvent } from 'react';

interface DraggableProps {
    index?: number;
    dropTargetId?: string;
    className?: string;
    item: StructuredComponent;
    layout?: LayoutMode;
    dropZone?: boolean;
    children: React.ReactNode;
    type?: string;
    mode?: string;
    isDisabled?: boolean;
}

const Draggable = ({
    item,
    dropTargetId,
    className,
    index = 0,
    dropZone = true,
    layout = 'vertical',
    type = 'DEFAULT',
    mode = 'DROP',
    children,
    isDisabled = false,
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
        handleDragStartComponent,
    } = useDragDrop();

    const handleLayoutChange = (layout: LayoutMode) => {
        setLayoutMode(layout);
    };

    const hadleDragStart = (e: DragEvent<HTMLDivElement>) => {
        onDragStart(item);
        handleDragStartComponent(e, componentId);
        e.dataTransfer.setData('text/plain', JSON.stringify(item));
        e.dataTransfer.setData('type', JSON.stringify(type));
        e.dataTransfer.setData('mode', JSON.stringify(mode));
        e.dataTransfer.setData('draggableIndex', JSON.stringify(index));
        e.dataTransfer.setData('dropTargetId', JSON.stringify(dropTargetId));
    };

    return (
        <div
            draggable
            onDragStartCapture={hadleDragStart}
            onDragEnd={onDragEnd}
            onDragLeave={handleDragLeave}
            onDragOver={(e) => {
                handleDragOver({
                    e,
                    id: componentId,
                    cellIndex: index,
                    dropTargetId,
                    countItems: item.children?.length || 0,
                });
                handleLayoutChange(layout);
            }}
            className={cn(
                'min-w-32',
                dropZone &&
                    'relative border border-dashed  hover:border-primary/50 rounded-lg bg-card transition-all p-2',
                draggedId === componentId && dropZone
                    ? 'opacity-25 border-primary bg-primary/35'
                    : 'border-border',
                isDisabled && 'hover:border-destructive',
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
