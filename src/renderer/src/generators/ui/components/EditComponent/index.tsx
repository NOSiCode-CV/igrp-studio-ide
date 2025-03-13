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
import { ICON_MAP } from '../../ComponentTypes';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import { handleDragEnd } from '../../dnd/DraggableItemManager';
import { Button } from '@renderer/components/ui/button';
import { EmptyList } from '@renderer/components/empty-list';
import { Plus } from 'lucide-react';
import { DialogTrigger } from '@radix-ui/react-dialog';
import { SidebarRight } from '../sidebar-right';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@renderer/components/ui/table';

export const EditComponent = ({
    parentComp,
    comp,
}: {
    parentComp: StructuredComponent;
    comp: StructuredComponent;
}) => {
    const { componentName: parentComponentName } = parentComp;

    const { componentName, id, children } = comp;

    const [currentComponent, setCurrentComponent] =
        useState<StructuredComponent>(comp);

    const [components, setComponents] = useState<ComponentRegisterConfig[]>([]);

    const { getAcceptedChildren } = useStudio();

    const { handleAddChildToComponent } = useDroppedComponents();

    // Fetch and filter components on mount
    useEffect(() => {
        getAcceptedChildren(parentComponentName, componentName).then((data) => {
            setComponents(data);
        });
    }, [getAcceptedChildren]);

    // Handle adding a component
    const handleAddComponent = useCallback(
        (item: any) => {
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
        },
        [id, children.length, handleAddChildToComponent]
    );

    const onEdit = (component: StructuredComponent) => {
        setCurrentComponent(component);
    };

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
                            <div className="flex justify-between">
                                <div>
                                    <DialogTitle>Add Component</DialogTitle>
                                    <DialogDescription>
                                        Select a component to add to your{' '}
                                        {componentName}
                                    </DialogDescription>
                                </div>
                                <div className="justify-end">
                                    {components.map((comp) => {
                                        return (
                                            <Button
                                                key={comp.name}
                                                onClick={() =>
                                                    handleAddComponent(comp)
                                                }
                                            >
                                                <Plus />
                                                {comp.label}
                                            </Button>
                                        );
                                    })}
                                </div>
                            </div>
                        </DialogHeader>
                        <div className="flex-1 overflow-auto p-4">
                            <div className="space-y-3">
                                <div>
                                    {children.length > 0 ? (
                                        renderCreatedComponents(
                                            children,
                                            onEdit
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
                        <SidebarRight comp={currentComponent} />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};
const renderCreatedComponents = (
    components: StructuredComponent[],
    onEdit: (comp: StructuredComponent) => void
) => {
    const { handleRemoveChildFromComponent } = useDroppedComponents();

    const handleEditComponent = (component: StructuredComponent) => {
        onEdit(component);
    };

    // Render the icon for a component
    const renderIcon = (iconName: string) => {
        const IconComponent = ICON_MAP[iconName];
        return IconComponent ? <IconComponent className="h-5 w-5" /> : null;
    };

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Label</TableHead>
                    <TableHead>Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {components.map((component, index) => (
                    <TableRow key={index}>
                        <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                                {renderIcon(component.properties?.iconClass)}
                                <span>{component.label}</span>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                        handleEditComponent(component)
                                    }
                                >
                                    Edit
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-900"
                                    onClick={() =>
                                        handleRemoveChildFromComponent({
                                            droppableId: component.id,
                                            index,
                                        })
                                    }
                                >
                                    Delete
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};
