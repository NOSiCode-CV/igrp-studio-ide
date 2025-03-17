import { cn } from '../utils';
import { useDragDrop } from './drag-drop-context';
import { DropZone } from './DropZone';
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
    isDisabled?: boolean
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
    isDisabled=false
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

      /*   const preview = document.createElement('div');
        preview.className = 'bg-blue-500/20 border-2 border-blue-500 rounded-lg absolute pointer-events-none';
        preview.style.width = '200px';
        preview.style.height = '100px';
        preview.style.display = 'none';
        document.body.appendChild(preview);
    
        e.dataTransfer.setDragImage(preview, 0, 0); */
    };

    return (
        <div
            draggable
            onDragStartCapture={(e) => {
                hadleDragStart(e);
            }}
             onDragStart={(_) => {
               
            }} 
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
                    'relative border rounded-lg bg-card transition-all',
                draggedId === componentId && dropZone
                    ? 'opacity-25 border-primary'
                    : 'border-border',
                dropZone && 'hover:border-primary/50',
                isDisabled && 'hover:border-red-500',
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
