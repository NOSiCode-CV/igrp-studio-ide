import { StructuredComponent } from '@renderer/lib/dnd/types';
import { AddComponentPopover } from '../../components/add-components-popover';
import { Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BindingConfigurationFilterModal } from '../../components/binding-config-filter-modal';
import { useEffect, useState } from 'react';
import { IGRPBadgePrimitive, IGRPTooltipContentPrimitive, IGRPTooltipPrimitive, IGRPTooltipTriggerPrimitive } from '@igrp/igrp-framework-react-design-system';
import { cn } from '@renderer/lib/utils';
import { ComponentRegisterConfig } from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';
import useStudio from '@renderer/hooks/use-studio';

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

    const { componentName } = comp;
    const { componentName: parentComponentName } = parentComp || {};

    const [currentComponent, setCurrentComponent] =
        useState<StructuredComponent | null>(null);

    const [components, setComponents] = useState<ComponentRegisterConfig[]>([]);

    const { getAcceptedChildren } = useStudio();

    useEffect(() => {
        getAcceptedChildren(parentComponentName, componentName).then((data) => {
            setComponents(data);
        });
    }, [parentComponentName, componentName, getAcceptedChildren]);

    return (
        <div className={cn('table-tools relative', group)}>
            {/* Action buttons */}
            <div
                className={cn(
                    'absolute px-1 z-10 left-4 -mt-3 rounded opacity-0 group-hover/table:opacity-100 transition-opacity duration-200 bg-gray-600 text-white',
                    className
                )}
            >
                <div className="flex justify-end shadow-lg align-middle space-x-1 z-50 py-0.5 ">
                    <div className="flex align-middle items-center">
                        <span className="text-xs">
                            {comp.label || comp.componentName}
                        </span>
                    </div>
                    <IGRPTooltipPrimitive>
                        <IGRPTooltipTriggerPrimitive asChild>
                            <button
                                className="flex items-center p-1 hover:bg-gray-700 rounded cursor-pointer"
                                onClick={onEdit}
                            >
                                <Settings className="h-3.5" />
                            </button>
                        </IGRPTooltipTriggerPrimitive>
                        <IGRPTooltipContentPrimitive>
                            <p>{t('edit')}</p>
                        </IGRPTooltipContentPrimitive>
                    </IGRPTooltipPrimitive>

                    <div className="space-x-1">
                        {components.length > 0 && (
                            <AddComponentPopover
                                comp={comp}
                                components={components}
                            />
                        )}
                        {tableColumns.length > 0 && (
                            <>
                                <IGRPTooltipPrimitive>
                                    <IGRPTooltipTriggerPrimitive asChild>
                                        <IGRPBadgePrimitive
                                            variant={'soft'}
                                            className="rounded-sm cursor-pointer h-6"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setCurrentComponent(comp);
                                                setIsOpen(true);
                                            }}
                                        >
                                            <span className="text-xs">
                                                Binding Filter
                                            </span>
                                        </IGRPBadgePrimitive>
                                    </IGRPTooltipTriggerPrimitive>
                                    <IGRPTooltipContentPrimitive>
                                        <p>Binding Filter Configuration </p>
                                    </IGRPTooltipContentPrimitive>
                                </IGRPTooltipPrimitive>

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
