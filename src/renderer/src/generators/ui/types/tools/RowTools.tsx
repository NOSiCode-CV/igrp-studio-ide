import { Copy, Settings, Trash } from 'lucide-react';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';

interface ToolsProps {
    onEdit: () => void;
    id: string;
    index: number;
}
const RowTools = ({ id, index, onEdit }: ToolsProps) => {
    const { handleRemoveChildFromComponent } = useDroppedComponents();

    const onClickDeleteField = () => {
        handleRemoveChildFromComponent({ droppableId: id, index });
    };

    return (
        <div className="shadow-lg  flex justify-end">
            <button
                className=" flex align-items-center justify-center  field-clone gen-clone-btn"
                title=""
            >
                <Copy className="h-4" />
            </button>

            <button
                className=" flex align-center justify-center  field-edit gen-edition-btn"
                title=""
                onClick={onEdit}
            >
                <Settings className="h-4" />
            </button>

            <button
                className=" flex align-items-center justify-center  field-remove"
                onClick={onClickDeleteField}
            >
                <Trash className="h-4" />
            </button>
        </div>
    );
};

export default RowTools;
