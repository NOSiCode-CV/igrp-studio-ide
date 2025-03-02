import { useDragDrop } from './drag-drop-context';

import { useEffect, type DragEvent } from 'react';
import { StructuredComponent } from './types';
import { cn } from '../utils';

interface DroppableProps {
    onDrop: (result: any) => void;
    component: StructuredComponent;
    layout?: string;
    children: React.ReactNode;
    className?: string;
}

const Droppable = ({
    onDrop,
    component,
    children,
    className,
}: DroppableProps) => {
    const {
        draggingItem,
        setComponents,
        handleDrop,
        handleDragLeave,
        handleDragOver,
    } = useDragDrop();

    const handleDropItem = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const droppedItem = handleDrop(
            e,
            component.id,
            component.children.length === 0
        );
        onDrop(droppedItem);
    };

    useEffect(() => {
        setComponents(component.children);
    }, [component.children]);

    return (
        <div
            onDragOver={(e) => handleDragOver(e)}
            onDrop={handleDropItem}
            onDragLeave={handleDragLeave}
            id={component.id}
            className={cn(
                'min-h-12 p-5 border-2 border-dashed border-gray-400',
                draggingItem ? 'bg-gray-200' : 'bg-card',
              /*   activeDropZone?.dropTargetId === component.id ? 'border-igrp' : '', */
                className
            )}
        >
            {children}
        </div>
    );
};

export default Droppable;
