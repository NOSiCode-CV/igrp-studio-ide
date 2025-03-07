import { Copy, Move, Settings, Trash } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@renderer/components/ui/tooltip';
import { STRUCTURES } from '../../ComponentTypes';
import StructureDropdown from '../../components/StructureDropdown';

interface ToolsProps {
    handleClickBtnEdition: () => void;
    handleClickDeleteComp: () => void;
    handleClickStructComp: (layout: string) => void;
    id: string;
    type?: string;
    label?: string;
}

const CompTools = ({
    handleClickBtnEdition,
    handleClickDeleteComp,
    handleClickStructComp,
    id,
    label,
}: ToolsProps) => {
    const isGrids = [STRUCTURES.Columns].includes(id);

    return (
        <TooltipProvider>
            <div className="flex justify-end shadow-lg align-middle p-0 space-x-0">
                <div className="flex align-middle items-center">
                    <span className="text-xs">{label}</span>
                </div>

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
                            className="container-clone cursor-pointer p-1 hover:bg-white hover:text-black rounded"
                            title="Clonar"
                        >
                            <Copy className="h-4" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Clone</p>
                    </TooltipContent>
                </Tooltip>

                {isGrids && (
                    <StructureDropdown
                        onClickStructure={handleClickStructComp}
                    />
                )}

                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            className="container-edit gen-edition-btn cursor-pointer p-1 hover:bg-white hover:text-black rounded"
                            title="Editar"
                            onClick={handleClickBtnEdition}
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
                            className="container-remove cursor-pointer p-1 hover:bg-white hover:text-black rounded"
                            title="Remover"
                            onClick={handleClickDeleteComp}
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

export default CompTools;
