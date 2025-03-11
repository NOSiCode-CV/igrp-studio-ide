import { ComponentRegisterConfig } from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';
import { Badge } from '@renderer/components/ui/badge';
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
import useStudio from '@renderer/hooks/useStudio';
import {
    DragEndResult,
    StructuredComponent,
} from '@renderer/lib/dnd/types';
import { useEffect, useState } from 'react';
import { BASIC_ELEMENTS, FORM_ELEMENTS, ICON_MAP } from '../ComponentTypes';
import { useDroppedComponents } from '../dnd/DroppedComponentsContext';
import { handleDragEnd } from '../dnd/DraggableItemManager';

export const AddField = ({ comp }: { comp: StructuredComponent }) => {
    const { componentName, id, children } = comp;
    const { getRegistryComponent } = useStudio();
    const { handleAddChildToComponent } = useDroppedComponents();

    const [components, setComponents] = useState<ComponentRegisterConfig[]>([]);

    // Define the list of component names to filter by
    const allowedComponentNames = [
        FORM_ELEMENTS.InputField,
        FORM_ELEMENTS.Checkbox,
        FORM_ELEMENTS.Password,
        FORM_ELEMENTS.DatePicker,
        BASIC_ELEMENTS.Link,
        BASIC_ELEMENTS.Button,
    ];

    useEffect(() => {
        getRegistryComponent().then((data) => {
            // Filter the components based on the allowed names
            const filteredComponents = data.filter((item) =>
                allowedComponentNames.includes(item.name)
            );
            setComponents(filteredComponents);
        });
    }, [getRegistryComponent]);

    const handleAddComponent = (item: any) => {
        const result: DragEndResult = {
            type: '',
            draggableId: item.name,
            source: item,
            destination: {
                droppableId: id,
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

    return (
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
                    <p>Add Comp</p>
                </TooltipContent>
            </Tooltip>

            <PopoverContent className="w-100 p-3 space-y-3">
                <div className="p-2 border-b">
                    <h3 className="text-lg font-semibold">Add Component</h3>
                    <p className="text-sm text-muted-foreground">
                        Select a component to add to your {componentName}
                    </p>
                </div>
                <div className="grid grid-cols-4 gap-2">
                    {components.map((component) => (
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
