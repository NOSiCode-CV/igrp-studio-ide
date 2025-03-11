import { Copy, Move, Settings, Trash } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@renderer/components/ui/tooltip';
import { CONTAINERS, DATA_DISPLAY, STRUCTURES } from '../../ComponentTypes';
import StructureDropdown from '../../components/StructureDropdown';
import { AddField } from '../../components/add-fields';
import { StructuredComponent } from '@renderer/lib/dnd/types';

interface ToolsProps {
    handleClickBtnEdition: () => void;
    handleClickDeleteComp: () => void;
    handleClickStructComp: (layout: string) => void;
    comp: StructuredComponent;
}

const CompTools = ({
    handleClickBtnEdition,
    handleClickDeleteComp,
    handleClickStructComp,
    comp,
}: ToolsProps) => {
    const { componentName, label } = comp;

    const isGrids = [STRUCTURES.Columns].includes(componentName);
    const hasAddField = [DATA_DISPLAY.Table, CONTAINERS.Form].includes(componentName);

    return (
        <TooltipProvider>
            <div className="flex justify-end shadow-lg align-middle p-0 space-x-0 z-50">
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
                        <button className="container-clone cursor-pointer p-1 hover:bg-white hover:text-black rounded">
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
                            className="cursor-pointer p-1 hover:bg-white hover:text-black rounded"
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
                            onClick={handleClickDeleteComp}
                        >
                            <Trash className="h-4" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Delete</p>
                    </TooltipContent>
                </Tooltip>
                {hasAddField && <AddField comp={comp}/>}
            </div>
        </TooltipProvider>
    );
};

export default CompTools;
