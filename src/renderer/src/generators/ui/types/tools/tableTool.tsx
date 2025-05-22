import { StructuredComponent } from '@renderer/lib/dnd/types';
import { AddComponentPopover } from '../../components/add-components-popover';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@renderer/components/ui/tooltip';
import { Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BindingConfigurationFilterModal } from '../../components/binding-config-filter-modal';
import { useState } from 'react';
import { Badge } from '@renderer/components/ui/badge';
import { cn } from '@renderer/lib/utils';

interface RowOptionsProps {
    comp: StructuredComponent;
    parentComp: StructuredComponent;
    tableColumns?: StructuredComponent[];
    onEdit: () => void;
    group?: string;
    className?: string;
}

const TableTool = ({
    comp,
    parentComp,
    tableColumns = [],
    onEdit,
    group,
    className,
}: RowOptionsProps) => {
    const { t } = useTranslation();

    const [isOpen, setIsOpen] = useState(false);

    const [currentComponent, setCurrentComponent] =
        useState<StructuredComponent | null>(null);

    return (
        <div className={cn('table-tools relative', group)}>
            {/* Action buttons */}
            <div
                className={cn(
                    'absolute px-1 z-10 left-4 -mt-3 rounded opacity-0 group-hover/table:opacity-100 transition-opacity duration-200 bg-gray-600 text-white',
                    className
                )}
            >
                <div className="flex justify-end shadow-lg align-middle p-0 space-x-0 z-50">
                    <div className="flex align-middle items-center">
                        <span className="text-xs">{comp.label}</span>
                    </div>
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

                    <div className="space-x-1">
                        <AddComponentPopover
                            comp={comp}
                            parentComp={parentComp}
                        />

                        {tableColumns.length > 0 && (
                            <>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Badge
                                            variant={'secondary'}
                                            className="rounded-sm cursor-pointer my-0.5"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setCurrentComponent(comp);
                                                setIsOpen(true);
                                            }}
                                        >
                                            <span className="text-xs">
                                                Binding Filter
                                            </span>
                                        </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Binding Filter Configuration </p>
                                    </TooltipContent>
                                </Tooltip>

                                {isOpen && currentComponent && (
                                    <BindingConfigurationFilterModal
                                        open={isOpen}
                                        setOpen={setIsOpen}
                                        comp={currentComponent}
                                        tableColumns={tableColumns}
                                        path=""
                                    />
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TableTool;
