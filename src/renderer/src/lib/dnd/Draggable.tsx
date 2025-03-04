import { DropZone } from '@renderer/generators/ui/light/DropZone';
import { cn } from '../utils';
import { useDragDrop } from './drag-drop-context';
import { LayoutMode } from './types';
import type { DragEvent } from 'react';

interface DraggableProps {
    index?: number;
    dropTargetId?: string;
    className?: string;
    item: any;
    layout?: LayoutMode;
    dropZone?: boolean;
    children: React.ReactNode;
    type?: string;
    mode?: string;
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
            onDragStartCapture={(e) => {
                hadleDragStart(e);
            }}
            /*  onDragStart={(e) => {
                
            }} */
            onDragEnd={onDragEnd}
            onDragLeave={(e) => {
                handleDragLeave(e);
            }}
            onDragOver={(e) => {
                handleDragOver(e, componentId, index, dropTargetId);
                handleLayoutChange(layout);
            }}
            className={cn(
                dropZone &&
                    'relative group border rounded-md bg-card transition-all',
                draggedId === componentId && dropZone
                    ? 'opacity-25 border-primary'
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
