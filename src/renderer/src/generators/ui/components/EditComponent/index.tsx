import { ComponentRegisterConfig } from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';
import { Badge } from '@renderer/components/ui/badge';
import { useTranslation } from 'react-i18next';
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
import useStudio from '@renderer/hooks/use-studio';
import { DragEndResult, StructuredComponent } from '@renderer/lib/dnd/types';
import React, { useEffect, useState, useCallback } from 'react';
import { ICON_MAP } from '../../ComponentTypes';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import { handleDragEnd } from '../../dnd/DraggableItemManager';
import { Button } from '@renderer/components/ui/button';
import { EmptyList } from '@renderer/components/empty-list';
import { Plus } from 'lucide-react';
import { DialogTrigger } from '@radix-ui/react-dialog';
import { SidebarRight } from '../sidebar/sidebar-right';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@renderer/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@renderer/components/ui/dropdown-menu';

export const EditComponent = ({
    path,
    comp,
}: {
    path: string;
    comp: StructuredComponent;
}) => {
   
    
    const { componentName, id, children } = comp;

    const [currentComponent, setCurrentComponent] =
        useState<StructuredComponent>(comp);

    const [currentPath, setCurrentPath] = useState<string>(path);

    const [components, setComponents] = useState<ComponentRegisterConfig[]>([]);

    const { getAcceptedChildren } = useStudio();

    const { handleAddChildToComponent } = useDroppedComponents();

    // Fetch and filter components on mount
    useEffect(() => {
        getAcceptedChildren(path, componentName).then((data) => {
            setComponents(data);
        });
    }, [getAcceptedChildren]);

    // Handle adding a component
    
    const handleAddComponent = useCallback(
        (item: any, droppableId: string) => {
            const result: DragEndResult = {
                type: '',
                draggableId: item.name,
                source: item,
                destination: {
                    droppableId,
                    index: children.length + 1,
                },
                mode: 'DROP',
            };

            handleDragEnd(result, {
                handleAddChildToComponent,
            });
        },
        [handleAddChildToComponent]
    );

    const onEditComponent = (component: StructuredComponent) => {
        setCurrentComponent(component);
        setCurrentPath(`${path}/${comp.componentName}`);
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
                                <span className="text-xs">{t('addComponent')}</span>
                            </Badge>
                        </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>t{('addComponent')}</p>
                    </TooltipContent>
                </Tooltip>
                <DialogContent className="max-w-6xl h-[70vh] p-0 flex overflow-hidden [--header-height-three:calc(--spacing(75))]">
                    <div className="flex flex-1 flex-col overflow-auto order-first">
                        <DialogHeader className="p-4">
                            <div className="flex justify-between">
                                <div>
                                    <DialogTitle>{t('addComponent')}</DialogTitle>
                                    <DialogDescription>
                                    {t('selectComponent')}{' '}
                                        {componentName}
                                    </DialogDescription>
                                </div>
                                <div className="justify-end">
                                    {renderAddComponents(
                                        components,
                                        id,
                                        handleAddComponent
                                    )}
                                </div>
                            </div>
                        </DialogHeader>
                        <div className="flex-1 overflow-auto p-4">
                            <div className="space-y-3">
                                <div>
                                    {children.length > 0 ? (
                                        <ComponentTable
                                            components={children}
                                            registryComponents={components}
                                            onEdit={onEditComponent}
                                            handleAddComponent={
                                                handleAddComponent
                                            }
                                        />
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
                        <SidebarRight
                            comp={currentComponent}
                            path={currentPath}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

const renderAddComponents = (
    components: ComponentRegisterConfig[],
    droppableId: string,
    handleAddComponent: (
        comp: ComponentRegisterConfig,
        droppableId: string
    ) => void
) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size={'sm'}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('addComponent')}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                {components.map((comp) => (
                    <DropdownMenuItem
                        key={comp.name}
                        onSelect={() => handleAddComponent(comp, droppableId)}
                    >
                        {comp.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

const renderCreatedComponents = (
    components: StructuredComponent[],
    registryComponents: ComponentRegisterConfig[],
    onEdit: (comp: StructuredComponent) => void,
    handleAddComponent: (item: any, droppableId: string) => void,
    level: number = 0 // Add a level parameter to track nesting depth
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

    // Check if the component can accept children
    const canAcceptChildren = (component: StructuredComponent) => {
        const registryComponent = registryComponents.find(
            (rc) => rc.name === component.componentName
        );
        return (
            registryComponent && registryComponent.acceptedChildren.length > 0
        );
    };

    // Get the accepted children for a component
    const getAcceptedChildren = (component: StructuredComponent) => {
        const registryComponent = registryComponents.find(
            (rc) => rc.name === component.componentName
        );
        return registryComponent ? registryComponent.acceptedChildren : [];
    };

    // Recursively render child components
    const renderChildComponents = (
        children: StructuredComponent[],
        level: number
    ) => {
        return (
            <>
                {renderCreatedComponents(
                    children,
                    registryComponents,
                    onEdit,
                    handleAddComponent,
                    level + 1
                )}
            </>
        );
    };

    return (
        <>
            {components.map((component, index) => (
                <React.Fragment key={index}>
                    <TableRow>
                        <TableCell
                            className="font-medium"
                            style={{ paddingLeft: `${level * 20}px` }}
                        >
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
                                    {t('delete')}
                                </Button>
                                {canAcceptChildren(component) &&
                                    renderAddComponents(
                                        getAcceptedChildren(component),
                                        component.id,
                                        handleAddComponent
                                    )}
                            </div>
                        </TableCell>
                    </TableRow>
                    {component.children &&
                        component.children.length > 0 &&
                        renderChildComponents(component.children, level)}
                </React.Fragment>
            ))}
        </>
    );
};

// Main component that renders the table with a single header
const { t } = useTranslation();
const ComponentTable = ({
    components,
    registryComponents,
    onEdit,
    handleAddComponent,
}: {
    components: StructuredComponent[];
    registryComponents: ComponentRegisterConfig[];
    onEdit: (comp: StructuredComponent) => void;
    handleAddComponent: (item: any, droppableId: string) => void;
}) => {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>{t('label')}</TableHead>
                    <TableHead>{t('actions')}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {renderCreatedComponents(
                    components,
                    registryComponents,
                    onEdit,
                    handleAddComponent
                )}
            </TableBody>
        </Table>
    );
};
