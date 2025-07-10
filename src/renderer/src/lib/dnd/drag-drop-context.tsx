import React, { createContext, useState, useContext, useCallback } from 'react';
import type { DragEvent } from 'react';
import {
    StructuredComponent,
    DropZone,
    LayoutMode,
    DragEndResult,
} from './types';

interface DragDropContextType {
    // State
    draggingItem: any;
    draggedId: string | null;
    activeDropZone: DropZone | null;

    // Methods
    setComponents: React.Dispatch<React.SetStateAction<StructuredComponent[]>>;
    setLayoutMode: React.Dispatch<React.SetStateAction<LayoutMode>>;

    // Event handlers
    onDragEnd: () => void;
    onDragStart: (item: any) => void;
    handleDrop: (
        e: DragEvent<HTMLDivElement>,
        targetId?: string
    ) => DragEndResult;
    handleDragOver: (
        e: DragEvent<HTMLDivElement>,
        id?: string,
        index?: number,
        dropTargetId?: string
    ) => void;
    handleDragLeave: (e: DragEvent<HTMLDivElement>) => void;
    handleDragStartComponent: (
        _e: DragEvent<HTMLDivElement>,
        id: string
    ) => void;
}

// Create the Context
const DragDropContext = createContext<DragDropContextType | undefined>(
    undefined
);

export const DragProvider = ({ children }: { children: React.ReactNode }) => {
    const [layoutMode, setLayoutMode] = useState<LayoutMode>('vertical');
    const [components, setComponents] = useState<StructuredComponent[]>([]);
    const [draggingItem, setDraggingItem] = useState(null);
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [activeDropZone, setActiveDropZone] = useState<DropZone | null>(null);

    // Start dragging
    const onDragStart = useCallback((item: any) => {
        setDraggingItem(item);
    }, []);

    // End dragging
    const onDragEnd = useCallback(() => {
        setDraggingItem(null);
    }, []);

    const handleDragStartComponent = (
        _e: DragEvent<HTMLDivElement>,
        id: string
    ) => {
        setDraggedId(id);
    };

    // Handle drop - core functionality
    const handleDrop = (e: DragEvent<HTMLDivElement>, targetId?: string) => {
        e.preventDefault();
        e.stopPropagation();

        // Just collect the data and set state, business logic removed
        const droppedItem = JSON.parse(e.dataTransfer.getData('text/plain'));
        const type = JSON.parse(e.dataTransfer.getData('type'));
        const mode = JSON.parse(e.dataTransfer.getData('mode'));

        const dropTargetId =
            mode === 'MOVE'
                ? JSON.parse(e.dataTransfer.getData('dropTargetId'))
                : '';

        const draggableIndex = JSON.parse(
            e.dataTransfer.getData('draggableIndex')
        );

        const position =
            activeDropZone?.position ||
            (layoutMode === 'vertical' ? 'bottom' : 'right');

        const targetIndex = activeDropZone?.cellIndex || 0;

        /*const moveIndex =
            (position === 'top' || position === 'left') && targetIndex > 1
                ? targetIndex - 1
                : targetIndex; */

        const newIndex =
            activeDropZone?.position === 'right'
                ? targetIndex + 1
                : position === 'bottom'
                  ? targetIndex + 1
                  : targetIndex;

        setDraggedId(null);
        setActiveDropZone(null);

        return {
            source: {
                ...droppedItem,
                droppableId: dropTargetId,
                index: draggableIndex,
            },
            draggableId: droppedItem.id,
            position,
            destination: {
                droppableId: targetId || '',
                index: newIndex, // mode === 'MOVE' ? moveIndex : targetIndex,
            },
            type,
            mode,
        };
    };

    // Handle drag over - core functionality
    const handleDragOver = (
        e: DragEvent<HTMLDivElement>,
        id?: string,
        cellIndex?: number,
        dropTargetId?: string
    ) => {
        e.preventDefault();
        e.stopPropagation();

        if (id) {
            if (id === draggedId) {
                setActiveDropZone(null);
                return;
            }

            const targetRect = (
                e.currentTarget as HTMLElement
            ).getBoundingClientRect();
            const position = getDropPosition(e, targetRect, layoutMode);
            setActiveDropZone({ id, cellIndex, position, dropTargetId });
        } else if (components.length > 0) {
            const position = layoutMode === 'vertical' ? 'bottom' : 'right';
            setActiveDropZone({
                id: components[components.length - 1].id,
                cellIndex,
                position,
                dropTargetId,
            });
        }
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        const relatedTarget = e.relatedTarget as HTMLElement;
        if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
            setActiveDropZone(null);
        }
    };

    // Helper function to determine drop position
    const getDropPosition = (
        e: DragEvent<HTMLDivElement>,
        targetRect: DOMRect,
        layoutMode: LayoutMode
    ) => {
        if (layoutMode === 'vertical') {
            const mouseY = e.clientY;
            const targetY = targetRect.top;
            const targetHeight = targetRect.height;
            const threshold = targetY + targetHeight / 2;
            return mouseY < threshold ? 'top' : 'bottom';
        } else {
            const mouseX = e.clientX;
            const targetX = targetRect.left;
            const targetWidth = targetRect.width;
            const threshold = targetX + targetWidth / 2;
            return mouseX < threshold ? 'left' : 'right';
        }
    };

    const contextValue: DragDropContextType = {
        draggingItem,
        draggedId,
        activeDropZone,
        setComponents,
        setLayoutMode,
        onDragStart,
        onDragEnd,
        handleDrop,
        handleDragOver,
        handleDragLeave,
        handleDragStartComponent,
    };

    return (
        <DragDropContext.Provider value={contextValue}>
            {children}
        </DragDropContext.Provider>
    );
};

// Custom Hook to use DragDropContext
export const useDragDrop = () => {
    const context = useContext(DragDropContext);
    if (context === undefined) {
        throw new Error('useDragDrop must be used within a DragDropProvider');
    }
    return context;
};
