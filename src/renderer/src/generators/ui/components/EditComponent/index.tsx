import { ComponentRegisterConfig } from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';
import { Badge } from '@renderer/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@renderer/components/ui/dialog';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@renderer/components/ui/tooltip';
import useStudio from '@renderer/hooks/useStudio';
import { DragEndResult, StructuredComponent } from '@renderer/lib/dnd/types';
import { useEffect, useState, useCallback } from 'react';
import { COMPONENT, ICON_MAP } from '../../ComponentTypes';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import { handleDragEnd } from '../../dnd/DraggableItemManager';
import { Button } from '@renderer/components/ui/button';
import { EmptyList } from '@renderer/components/empty-list';
import { Plus } from 'lucide-react';
import { DialogTrigger } from '@radix-ui/react-dialog';
import { SidebarRight } from '../sidebar-right';
import { Separator } from '@renderer/components/ui/separator';

export const EditComponent = ({ comp }: { comp: StructuredComponent }) => {
    const { componentName, id, children } = comp;
    const { getRegistryComponent } = useStudio();
    const { handleAddChildToComponent } = useDroppedComponents();

    const [components, setComponents] = useState<ComponentRegisterConfig[]>([]);
    const [actionComps, setActionComps] = useState<ComponentRegisterConfig[]>(
        []
    );
    const [createdComponents, setCreatedComponents] = useState<
        ComponentRegisterConfig[]
    >([]);
    const [createdActions, setCreatedActions] = useState<
        ComponentRegisterConfig[]
    >([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Fetch and filter components on mount
    useEffect(() => {
        const fetchComponents = async () => {
            const data = await getRegistryComponent();
            console.log(data);
            const filteredComponents = data.filter(
                (item: ComponentRegisterConfig) => item.name === COMPONENT.Table
            );
            setComponents(filteredComponents);
        };

        fetchComponents();
    }, [getRegistryComponent]);

    // Handle adding a component
    const handleAddComponent = useCallback(
        (item: any, isAction: boolean = false) => {
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

            // Add the component to the created list
            if (isAction) {
                setCreatedActions((prev) => [...prev, item]);
            } else {
                setCreatedComponents((prev) => [...prev, item]);
            }
        },
        [id, children.length, handleAddChildToComponent]
    );

    // Render the icon for a component
    const renderIcon = useCallback((iconName: string) => {
        const IconComponent = ICON_MAP[iconName];
        return IconComponent ? <IconComponent className="h-5 w-5" /> : null;
    }, []);

    // Render a list of created components
    const renderCreatedComponents = (components: ComponentRegisterConfig[]) => (
        <div className="space-y-2">
            {components.map((component) => (
                <div key={component.name} className="flex items-center gap-2">
                    {renderIcon(component.name)}
                    <span>{component.label}</span>
                </div>
            ))}
        </div>
    );

    return (
        <>
            <Dialog>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                            <Badge
                                variant={'secondary'}
                                className="rounded-sm cursor-pointer"
                            >
                                <span className="text-xs">Add Comp</span>
                            </Badge>
                        </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Add Comp</p>
                    </TooltipContent>
                </Tooltip>
                <DialogContent className="max-w-6xl h-[70vh] p-0 flex overflow-hidden">
                    <div className="flex flex-1 flex-col overflow-auto order-first">
                        <DialogHeader className="p-4">
                            <DialogTitle>Add Component</DialogTitle>
                            <DialogDescription>
                                Select a component to add to your{' '}
                                {componentName}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex-1 overflow-auto p-4">
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <h3 className="text-lg font-semibold">
                                        Component Details
                                    </h3>
                                    <Button
                                        size={'sm'}
                                        onClick={() => {
                                            handleAddComponent(components[0]);
                                        }}
                                    >
                                        <Plus />
                                        <span>Add Component</span>
                                    </Button>
                                </div>
                                <Separator />
                                <div>
                                    {createdComponents.length > 0 ? (
                                        renderCreatedComponents(
                                            createdComponents
                                        )
                                    ) : (
                                        <>
                                            <EmptyList description="" />
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="order-last border-l">
                        <SidebarRight />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};
