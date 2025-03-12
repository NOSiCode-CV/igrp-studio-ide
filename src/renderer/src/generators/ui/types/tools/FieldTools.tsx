import { Copy, Move, Settings, Trash } from 'lucide-react';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@renderer/components/ui/tooltip';
import { StructuredComponent } from '@renderer/lib/dnd/types';
import { COMPONENT } from '../../ComponentTypes';
import { EditComponent } from '../../components/EditComponent';

interface ToolsProps {
    onEdit: () => void;
    comp: StructuredComponent;
    index: number;
}

const FieldTools = ({ comp, index, onEdit }: ToolsProps) => {
    const { id, componentName } = comp;
    const { handleRemoveChildFromComponent } = useDroppedComponents();

    const onClickDeleteField = () => {
        handleRemoveChildFromComponent({ droppableId: id, index });
    };

    const isAddField = [COMPONENT.Dropdown].includes(componentName);

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
                            onClick={(e) => {
                                e.preventDefault();
                                onEdit();
                            }}
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
                {isAddField && <EditComponent comp={comp} />}
            </div>
        </TooltipProvider>
    );
};

export default FieldTools;
