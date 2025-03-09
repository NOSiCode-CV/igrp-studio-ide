import React from 'react';
import { useDroppedComponents } from '../dnd/DroppedComponentsContext';
import CompTools from './tools/CompTools';
import { cn } from '@renderer/lib/utils';
import { StructuredComponent } from '@renderer/lib/dnd/types';
import { generateId } from '@renderer/utils/helpers';
import { STRUCTURES } from '../ComponentTypes';

interface BoxContainerProps {
    children: React.ReactElement;
    id: string;
    label?:string,
    componentName: string;
    type?: string,
    group?: string;
    className?: string;
    components: StructuredComponent[];
    onEdit: () => void;
}

const BoxContainer = ({
    id,
    type,
    label,
    children,
    componentName,
    group,
    className,
    components,
    onEdit,
}: BoxContainerProps) => {
    const {
        handleRemoveChildFromComponent,
        handleAddChildToComponent,
        handleUpdateChildComponent,
    } = useDroppedComponents();

    const onClickBtnEdition = () => {
        onEdit();
    };

    const onClickDeleteComp = () => {
        handleRemoveChildFromComponent({ droppableId: id, index: 0 });
    };

    const onClickStructure = (layout: string) => {
        const newLayout = layout
            .split(',')
            .map((size) => parseInt(size.trim(), 10));

        if (componentName === STRUCTURES.Columns) {
            const currentSizes = components.length;
            newLayout.forEach((colSize, index) => {
                if (index < currentSizes) {
                    // if column exists, update size and move components
                    const currentCol = components[index];
                    const props = {
                        ...currentCol,
                        properties: {
                            variant: `span${colSize.toString()}`,
                        },
                    };

                    // move components from current column to new one
                    if (currentCol.children.length > 0) {
                        props.children = [...currentCol.children];
                    }

                    handleUpdateChildComponent(components[index].id, props);
                } else {
                    // Create  a new column if does not exist
                    const childColumnId = generateId(`column_${index + 1}`);
                    const childColumn: StructuredComponent = {
                        id: childColumnId,
                        componentName: `column`,
                        label: `Column ${index + 1}`,  
                        properties: {
                            variant: `span${colSize.toString()}`,
                        },
                        children: [],
                    };
                    handleAddChildToComponent(
                        { droppableId: id, index },
                        childColumn
                    );
                }
            });

            // Remove extra column
            if (newLayout.length < currentSizes) {
                const columnsToRemove = currentSizes - newLayout.length;
                for (let i = 0; i < columnsToRemove; i++) {
                    handleRemoveChildFromComponent({
                        droppableId: components[newLayout.length + i].id,
                        index: 0,
                    });
                }
            }
        }
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
                    label={label}
                    type={type}
                    handleClickDeleteComp={onClickDeleteComp}
                    handleClickBtnEdition={onClickBtnEdition}
                    handleClickStructComp={onClickStructure}
                />
            </div>
            {children}
        </div>
    );
};

export default BoxContainer;
