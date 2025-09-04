import { Button } from '@renderer/components/ui/button';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from '@renderer/components/ui/tooltip'; // Adjust the import based on your UI library

interface RowOptionsProps {
    onClickAddControl: (type: string) => void;
    onClickDeleteSection: () => void;
    onEdit: () => void;
}

const SectionTool = ({
    onClickAddControl,
}: RowOptionsProps) => {
    const { t } = useTranslation();
    return (
        <div id="row-tools">
            {/* Top-aligned button */}
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        className="size-7 absolute left-1/2 transform -translate-x-1/2 top-[-20px] p-2 opacity-0 group-hover/section:opacity-100 transition-opacity duration-300 rounded-full z-50"
                        onClick={() => onClickAddControl('top')}
                    >
                        <Plus className="h-7 w-7" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{t('addNewRowTop')}</p>
                </TooltipContent>
            </Tooltip>

            {/* Bottom-aligned button */}
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        className="size-7 absolute left-1/2 transform -translate-x-1/2 bottom-[-15px] p-2 opacity-0 group-hover/section:opacity-100 transition-opacity duration-300 rounded-full z-50"
                        onClick={() => onClickAddControl('bottom')}
                    >
                        <Plus className="h-7 w-7" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{t('addNewRowBottom')}</p>
                </TooltipContent>
            </Tooltip>

            {/* Action buttons */}
          {/*   <div className="absolute z-10 left-0 -top-6 rounded opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 bg-gray-600 text-white">
                <div className="flex">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                className="flex items-center p-1 hover:bg-gray-700 rounded cursor-pointer"
                                onClick={(e) => e.preventDefault()}
                            >
                                <Move className="h-4" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{t('sort')}</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                className="flex items-center p-1 hover:bg-gray-700 rounded cursor-pointer"
                                onClick={(e) => e.preventDefault()}
                            >
                                <Copy className="h-4" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{t('clone')}</p>
                        </TooltipContent>
                    </Tooltip>

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
                            <p>{t('edit')}</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                className="flex items-center p-1 hover:bg-gray-700 rounded cursor-pointer"
                                onClick={(e) => {
                                    e.preventDefault();
                                    onClickDeleteSection();
                                }}
                            >
                                <Trash className="h-4" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{t('deleteSection')}</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            </div> */}
        </div>
    );
};

export default SectionTool;
