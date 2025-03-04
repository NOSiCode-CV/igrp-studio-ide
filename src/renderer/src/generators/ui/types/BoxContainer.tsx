import React from 'react';
import { useDroppedComponents } from '../dnd/DroppedComponentsContext';
import CompTools from './tools/CompTools';
import { cn } from '@renderer/lib/utils';

interface BoxContainerProps {
    children: React.ReactElement;
    id: string;
    componentName: string;
    group?: string;
    className?: string;
    onEdit: () => void;
    dragHandleProps?: any;
}

const BoxContainer = ({
    children,
    id,
    componentName,
    group,
    className,
    dragHandleProps,
    onEdit,
}: BoxContainerProps) => {
    const { handleRemoveChildFromComponent } = useDroppedComponents();

    const onClickBtnEdition = () => {
        onEdit();
    };

    const onClickDeleteComp = () => {
        handleRemoveChildFromComponent({ droppableId: id, index: 0 });
    };

    const onClickStructure = (layout: string) => {
        console.log(layout);
    };

    return (
        <div className={cn('relative', group)} id={id}>
            <div
                className={cn(
                    `absolute -top-6 right-0 px-2 bg-gray-600 text-white rounded transition-opacity duration-200 shadow-lg z-50`,
                    className
                )}
            >
                <CompTools
                    id={componentName}
                    handleClickDeleteComp={onClickDeleteComp}
                    handleClickBtnEdition={onClickBtnEdition}
                    handleClickStructComp={onClickStructure}
                    dragHandleProps={dragHandleProps}
                />
            </div>
            {children}
        </div>
    );
};

export default BoxContainer;
