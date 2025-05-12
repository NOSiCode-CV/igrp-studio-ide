import { ComponentRegisterConfig } from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';
import { Badge } from '@renderer/components/ui/badge';
import { useTranslation } from 'react-i18next';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@renderer/components/ui/popover';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@renderer/components/ui/tooltip';
import useStudio from '@renderer/hooks/use-studio';
import { DragEndResult, StructuredComponent } from '@renderer/lib/dnd/types';
import { useEffect, useState } from 'react';
import { ICON_MAP } from '../ComponentTypes';
import { useDroppedComponents } from '../dnd/DroppedComponentsContext';
import { handleDragEnd } from '../dnd/DraggableItemManager';

export const AddField = ({
    comp,
    parentComp,
}: {
    parentComp: StructuredComponent;
    comp: StructuredComponent;
}) => {
    const { componentName, id: componentId, children } = comp;
    const { componentName: parentComponentName } = parentComp;

    const { getAcceptedChildren } = useStudio();
    const { handleAddChildToComponent } = useDroppedComponents();

    const [components, setComponents] = useState<ComponentRegisterConfig[]>([]);

    useEffect(() => {
        getAcceptedChildren(parentComponentName, componentName).then((data) => {
            setComponents(data);
        });
    }, [parentComponentName, componentName, getAcceptedChildren]);

    const handleAddComponent = (item: any) => {
        const result: DragEndResult = {
            type: '',
            draggableId: item.name,
            source: item,
            destination: {
                droppableId: componentId,
                index: children.length + 1,
            },
            mode: 'DROP',
        };
        handleDragEnd(result, {
            handleAddChildToComponent,
        });
    };

    const renderIcon = (iconName: string) => {
        const IconComponent = ICON_MAP[iconName];

        return IconComponent ? <IconComponent className="h-5 w-5" /> : null;
    };
    const { t } = useTranslation();

    return (
        <>
            {' '}
            {components.length > 0 ? (
                <Popover>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <PopoverTrigger asChild>
                                <Badge
                                    variant={'secondary'}
                                    className="my-1 rounded-sm cursor-pointer"
                                >
                                    <span className="text-xs">Add Comp</span>
                                </Badge>
                            </PopoverTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{t('addComp')}</p>
                        </TooltipContent>
                    </Tooltip>

                    <PopoverContent className="w-100 p-3 space-y-3">
                        <div className="p-2 border-b">
                            <h3 className="text-lg font-semibold">
                            {t('addComponent')}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                            {t('selectComponent')}{' '}
                                {componentName}
                            </p>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {components.map((component) => (
                                <button
                                    key={component.name}
                                    className="flex flex-col items-center justify-center rounded-md border bg-background p-2 text-xs transition-colors hover:bg-muted aspect-square"
                                    onClick={() =>
                                        handleAddComponent(component)
                                    }
                                >
                                    <div className="mb-1">
                                        {renderIcon(component.name)}
                                    </div>
                                    {component.label}
                                </button>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>
            ) : null}
        </>
    );
};
