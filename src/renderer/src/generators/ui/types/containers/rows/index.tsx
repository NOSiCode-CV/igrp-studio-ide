import React from 'react';
import RowOptions from './RowOptions';
import { useDroppedComponents } from '../../../dnd/DroppedComponentsContext';
import ColContainer, { ColProps } from './ColContainer';
import { generateId } from '@renderer/utils/helpers';
import { HierarchicalComponent } from '@renderer/generators/ui/interfaces';

interface RowContainerProps {
    id: string;
    onClickAddControl: (id: string, type: string) => void;
    onClickDeleteSection: (id: string) => void;
}

const RowContainer: React.FC<RowContainerProps> = ({ id, onClickAddControl, onClickDeleteSection }) => {

    const { getComponentsByRow, addDroppedComponent, removeColumn, getRow } = useDroppedComponents();
    const columns = getComponentsByRow(id);

    const handleClickStructure = (layout: string) => {
        const newLayout = layout.split(',').map(size => parseInt(size.trim(), 10));
        const currentRow: HierarchicalComponent[] = getRow(id); // Pega o primeiro elemento, pois `getRow` retorna um array
        const currentColumns = currentRow ? currentRow[0].columns : [];

        // Get current column sizes
        const currentSizes = currentColumns.map(col => parseInt(col.colSize.toString()));

        // Add new columns or update existing columns
        newLayout.forEach((colSize, index) => {
            if (index < currentSizes.length) {
                // if column exists, update size and move components
                const currentCol = currentColumns[index];
                const props = { ...currentCol, colSize: colSize.toString() };

                // move components from current column to new one
                if (currentCol.components.length > 0) {
                    props.components = [...currentCol.components];
                }

                const data: ColProps = { rowId: id, columnId: props.id, colSize }

                // update the column existing
                addDroppedComponent({ data, props: props });
            } else {
                // Create  a new column if does not exist
                const data: ColProps = { rowId: id, columnId: generateId("col"), colSize }
                addDroppedComponent({ data, props: { size: colSize.toString() } });
            }
        });

        // Remove extra column
        if (newLayout.length < currentSizes.length) {
            const columnsToRemove = currentSizes.length - newLayout.length;
            for (let i = 0; i < columnsToRemove; i++) {
                removeColumn(currentColumns[newLayout.length + i].id);
            }
        }

    };

    const handleClickAddControl = (type: string) => {
        onClickAddControl(id, type);
    };

    return (
        <div id={id} className="group/row relative hover:border-2 hover:border-igrp hover:rounded-sm">
            {/* RowOptions only visible on hover */}
            <RowOptions
                onClickAddControl={handleClickAddControl}
                onClickStructure={handleClickStructure}
                onClickDeleteSection={() => onClickDeleteSection(id)}
            />
            <div className='w-full p-3 flex flex-1 grip gap-4'>
                {columns.map((column, index) => {
                    return (
                        <ColContainer key={index} rowId={id} columnId={column.id} colSize={column.colSize} />
                    );
                })}
            </div>
        </div>
    );
};

export default RowContainer;
