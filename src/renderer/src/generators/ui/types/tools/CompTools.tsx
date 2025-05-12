import { Copy, Move, Settings, Trash } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@renderer/components/ui/tooltip';
import StructureDropdown from '../../components/StructureDropdown';
import { StructuredComponent } from '@renderer/lib/dnd/types';
import { COMPONENT } from '../../ComponentTypes';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();

    const isGrids = [COMPONENT.Columns].includes(componentName);

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
                        <p>{t('move')}</p>
                    </TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <button className="container-clone cursor-pointer p-1 hover:bg-white hover:text-black rounded">
                            <Copy className="h-4" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{t('clone')}</p>
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
                        <p>{t('edit')}</p>
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
                        <p>{t('delete')}</p>
                    </TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    );
};

export default CompTools;
