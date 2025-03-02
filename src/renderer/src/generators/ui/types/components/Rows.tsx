import { DragEndResult, StructuredRow } from '@renderer/lib/dnd/types';
import { Row } from './Row';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import { generateId } from '@renderer/utils/helpers';

interface RowsProps {
    components: StructuredRow[];
    onDragEnd: (result: DragEndResult) => void;
}

export const Rows = ({ onDragEnd, components }: RowsProps) => {
    const { setInitComponents } = useDroppedComponents();

    const handleAddControl = (type: string, componentId: string) => {
        const id = generateId('row');
        const newRow: StructuredRow = {
            id,
            children: [],
        };
        const rowIndex = components.findIndex((row) => row.id === componentId);

        if (rowIndex !== -1) {
            const newRows = [...components];
            if (type === 'top') {
                newRows.splice(rowIndex, 0, newRow);
            } else if (type === 'bottom') {
                newRows.splice(rowIndex + 1, 0, newRow);
            }
            setInitComponents(newRows);
        }
    };

    return (
        <>
            {components.map((row) => (
                <Row
                    key={row.id}
                    component={row}
                    onDragEnd={onDragEnd}
                    onAddControl={handleAddControl}
                />
            ))}
        </>
    );
};
