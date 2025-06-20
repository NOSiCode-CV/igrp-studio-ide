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
import { BindingConfigurationModal } from '../../components/binding-configuration-modal';
import { Badge } from '@renderer/components/ui/badge';
import { useEffect, useState } from 'react';
import { AddComponentPopover } from '../../components/add-components-popover';
import { useTranslation } from 'react-i18next';
import useStudio from '@renderer/hooks/use-studio';
import { ComponentRegisterConfig } from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';

interface ToolsProps {
    handleClickBtnEdition: () => void;
    handleClickDeleteComp: () => void;
    handleClickStructComp: (layout: string) => void;
    comp: StructuredComponent;
    parentComp?: StructuredComponent;
}

const CompTools = ({
    handleClickBtnEdition,
    handleClickDeleteComp,
    handleClickStructComp,
    comp,
    parentComp,
}: ToolsProps) => {
    const { t } = useTranslation();
    const { componentName, label, allowTypes } = comp;
    const { componentName: parentComponentName } = parentComp || {};

    const [isOpen, setIsOpen] = useState<boolean>(false);

    const isGrids = [COMPONENT.Columns].includes(componentName);

    const [components, setComponents] = useState<ComponentRegisterConfig[]>([]);

    const [currentComponent, setCurrentComponent] =
        useState<StructuredComponent | null>(null);

    const { getAcceptedChildren } = useStudio();

    useEffect(() => {
        getAcceptedChildren(parentComponentName, componentName).then((data) => {
            setComponents(data);
        });
    }, [parentComponentName, componentName, getAcceptedChildren]);

    useEffect(() => {
        if (!isOpen) {
            setCurrentComponent(null);
        }
    }, [isOpen, comp]);

    return (
        <TooltipProvider>
            <div className="flex justify-end shadow-lg align-middle p-0 space-x-0 z-50">
                <div className="flex align-middle items-center">
                    <span className="text-xs">{label || componentName}</span>
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
                        <p>{t('delete')}</p>
                    </TooltipContent>
                </Tooltip>

                {components.length > 0 && (
                    <AddComponentPopover components={components} comp={comp} />
                )}

                {allowTypes && (
                    <>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Badge
                                    variant={'secondary'}
                                    className="my-1 rounded-sm cursor-pointer ml-2"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCurrentComponent(comp);
                                        setIsOpen(true);
                                    }}
                                >
                                    <span className="text-xs">
                                        Binding Config
                                    </span>
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Binding Configuration</p>
                            </TooltipContent>
                        </Tooltip>

                        {currentComponent && (
                            <BindingConfigurationModal
                                comp={currentComponent}
                                path={''}
                                open={isOpen}
                                setOpen={setIsOpen}
                            />
                        )}
                    </>
                )}
            </div>
        </TooltipProvider>
    );
};

export default CompTools;
