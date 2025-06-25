import { ComponentRegisterConfig } from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';
import { useTranslation } from 'react-i18next';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@renderer/components/ui/popover';
import { DragEndResult, StructuredComponent } from '@renderer/lib/dnd/types';
import { useEffect } from 'react';
import { ICON_MAP } from '../ComponentTypes';
import { useDroppedComponents } from '../dnd/DroppedComponentsContext';
import { handleDragEnd } from '../dnd/DraggableItemManager';
import { useTagManager } from '../hooks/useTagManager';
import { Badge } from '@renderer/components/ui/badge';
import useStudio from '@renderer/hooks/use-studio';

export const AddComponentPopover = ({
    comp,
    components,
}: {
    components: ComponentRegisterConfig[];
    comp: StructuredComponent;
}) => {
    const { t } = useTranslation();

    const { componentName, id: componentId, children } = comp;
    const {
        handleAddChildToComponent,
        handleReorderChildInComponent,
        components: availableComponents,
    } = useDroppedComponents();
    const { generateTag, rebuild } = useTagManager(availableComponents);
    const { findComponentById } = useStudio();

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
            handleReorderChildInComponent,
            generateTag,
            findComponentById,
        });
    };

    const renderIcon = (iconName: string) => {
        const IconComponent = ICON_MAP[iconName];

        return IconComponent ? <IconComponent className="h-5 w-5" /> : null;
    };

    useEffect(() => {
        rebuild();
    }, [rebuild]);

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Badge
                    variant={'secondary'}
                    className="rounded-sm cursor-pointer h-6"
                >
                    <span className="text-xs">Add Comp</span>
                </Badge>
            </PopoverTrigger>
            <PopoverContent className="w-100 p-3 space-y-3">
                <div className="p-2 border-b">
                    <h3 className="text-lg font-semibold">
                        {t('addComponent')}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {t('selectComponent')} {componentName}
                    </p>
                </div>
                <div className="grid grid-cols-4 gap-2">
                    {components &&
                        components.map((component) => (
                            <button
                                key={component.name}
                                className="flex flex-col items-center justify-center rounded-md border bg-background p-2 text-xs transition-colors hover:bg-muted aspect-square"
                                onClick={() => handleAddComponent(component)}
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
    );
};
