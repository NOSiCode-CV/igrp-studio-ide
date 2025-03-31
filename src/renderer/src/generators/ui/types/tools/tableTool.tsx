import { StructuredComponent } from '@renderer/lib/dnd/types';
import { AddField } from '../../components/add-fields';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@renderer/components/ui/tooltip';
import { Settings } from 'lucide-react';

interface RowOptionsProps {
    comp: StructuredComponent;
    parentComp: StructuredComponent;
    onEdit: () => void;
}

const TableTool = ({ comp, parentComp, onEdit }: RowOptionsProps) => {
    return (
        <div id="table-tools relative">
            {/* Action buttons */}
            <div className="absolute px-3 z-10 left-4 rounded opacity-0 group-hover/table:opacity-100 transition-opacity duration-200 bg-gray-600 text-white">
                <div className="flex justify-end shadow-lg align-middle p-0 space-x-0 z-50">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                className="flex items-center p-1 hover:bg-gray-700 rounded cursor-pointer"
                                onClick={onEdit}
                            >
                                <Settings className="h-4" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Editar</p>
                        </TooltipContent>
                    </Tooltip>

                    <AddField comp={comp} parentComp={parentComp} />
                </div>
            </div>
        </div>
    );
};

export default TableTool;
