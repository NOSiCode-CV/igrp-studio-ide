import { useDragDrop } from './drag-drop-context';

import { useEffect, useState, type DragEvent } from 'react';
import { DragEndResult, LayoutMode, StructuredComponent } from './types';
import { cn } from '../utils';

interface DroppableProps {
    onDrop: (result: any) => DragEndResult;
    component: StructuredComponent;
    layout?: string;
    children: React.ReactNode;
    className?: string;
    accept?: string[];
}

const Droppable = ({
    onDrop,
    component,
    children,
    className,
}: DroppableProps) => {
    const { id: componentId, componentName } = component || {};

    const [targetHovered, setTargetHovered] = useState<string>('');

    const {
        activeDropZone,
        draggingItem,
        setComponents,
        handleDrop,
        handleDragLeave,
        handleDragOver,
        setLayoutMode,
    } = useDragDrop();

    const handleLayoutChange = (layout: LayoutMode) => {
        setLayoutMode(layout);
    };

    const handleDropItem = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const droppedItem = handleDrop(e, componentId, componentName);
        onDrop(droppedItem);
    };

    const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        handleDragLeave(e);
        setTargetHovered('');
    };

    const onDragOverCapture = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setTargetHovered((e.target as HTMLElement)?.id);
    };

    const onDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        handleDragOver(e, componentId);
    };

    useEffect(() => {
        if (component) {
            handleLayoutChange;
            setComponents(component.children);
        }
    }, [component]);

    return (
        <div
            onDrop={handleDropItem}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDragOverCapture={onDragOverCapture}
            id={componentId}
            className={cn(
                'p-3 min-h-12 rounded-lg bg-card', //border border-dashed border-gray-400 hover:border
                draggingItem &&
                (activeDropZone?.dropTargetId === componentId ||
                    targetHovered === componentId) &&
                'bg-primary/35',
                className
            )}
        >
            {children}
        </div>
    );
};

export default Droppable;
