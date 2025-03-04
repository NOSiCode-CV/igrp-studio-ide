import { Copy, Move, Settings, Trash } from 'lucide-react';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@renderer/components/ui/tooltip'; // Adjust the import path based on your project structure

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
        <TooltipProvider>
            <div className="shadow-lg flex justify-end p-0 space-x-0">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button className="container-mover cursor-pointer p-1 hover:bg-white hover:text-black rounded">
                            <Move className="h-4" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Move</p>
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            className="flex items-center justify-center p-1 hover:bg-white hover:text-black rounded"
                            title="Clone"
                        >
                            <Copy className="h-4" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Clone</p>
                    </TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            className="flex items-center justify-center p-1 hover:bg-white hover:text-black rounded"
                            title="Edit"
                            onClick={onEdit}
                        >
                            <Settings className="h-4" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Edit</p>
                    </TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            className="flex items-center justify-center p-1 hover:bg-white hover:text-black rounded"
                            title="Delete"
                            onClick={onClickDeleteField}
                        >
                            <Trash className="h-4" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Delete</p>
                    </TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    );
};

export default RowTools;
