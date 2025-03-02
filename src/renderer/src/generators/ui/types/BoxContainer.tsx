import React from 'react';
import { useDroppedComponents } from '../dnd/DroppedComponentsContext';
import CompTools from './tools/CompTools';
import { cn } from '@renderer/lib/utils';

interface BoxContainerProps {
    children: React.ReactElement;
    id: string;
    group?: string;
    className?: string;
    onEdit: () => void;
    dragHandleProps?: any;
}

const BoxContainer = ({
    children,
    id,
    group,
    className,
    onEdit,
    dragHandleProps,
}: BoxContainerProps) => {
    const { removeComponent } = useDroppedComponents();

    const handleClickBtnEdition = () => {
        onEdit();
    };

    const handleClickDeleteComp = () => {
        removeComponent(id);
    };

    return (
        <div
            className={cn(`relative group/${group}`)}
            id={id}
        >
            <div
                className={cn(
                    `absolute -top-6 right-0 px-2 bg-gray-600 text-white rounded opacity-0 group-hover/${group}:opacity-100 transition-opacity duration-200 shadow-lg z-50`,
                    className
                )}
            >
                <CompTools
                    id={id}
                    handleClickDeleteComp={handleClickDeleteComp}
                    handleClickBtnEdition={handleClickBtnEdition}
                    dragHandleProps={dragHandleProps}
                />
            </div>
            {children}
        </div>
    );
};

export default BoxContainer;
