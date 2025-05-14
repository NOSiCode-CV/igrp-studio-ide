import { useDragDrop } from './drag-drop-context';

import { useEffect, type DragEvent } from 'react';
import { LayoutMode, StructuredComponent } from './types';
import { cn } from '../utils';

interface DroppableProps {
    onDrop: (result: any) => void;
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
    const { id: componentId } = component || {};

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
        const droppedItem = handleDrop(e, componentId);
        onDrop(droppedItem);
    };

    useEffect(() => {
        if (component) {
            handleLayoutChange;
            setComponents(component.children);
        }
    }, [component]);

    return (
        <div
            onDragOver={(e) => handleDragOver(e, componentId)}
            onDrop={handleDropItem}
            onDragLeave={handleDragLeave}
            id={componentId}
            className={cn(
                'min-h-12 p-3 rounded-lg bg-card', //border border-dashed border-gray-400
                draggingItem &&
                    activeDropZone?.dropTargetId === componentId &&
                    'bg-primary/35',
                className
            )}
        >
            {children}
        </div>
    );
};

export default Droppable;
