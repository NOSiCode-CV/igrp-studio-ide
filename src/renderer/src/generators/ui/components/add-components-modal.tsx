import { ComponentRegisterConfig } from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@renderer/components/ui/dialog';
import useStudio from '@renderer/hooks/use-studio';
import {
    Destination,
    DragEndResult,
    StructuredComponent,
} from '@renderer/lib/dnd/types';
import React, { useEffect, useState, useCallback } from 'react';
import { ICON_MAP } from '../ComponentTypes';
import { useDroppedComponents } from '../dnd/DroppedComponentsContext';
import { handleDragEnd } from '../dnd/DraggableItemManager';
import { Button } from '@renderer/components/ui/button';
import { EmptyList } from '@renderer/components/empty-list';
import { Plus } from 'lucide-react';
import { SidebarRight } from './sidebar/sidebar-right';
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
import { SidebarInset } from '@renderer/components/ui/sidebar';
import { useTagManager } from '../hooks/useTagManager';
import * as LucideIcons from 'lucide-react';

interface AddComponentProps {
    path: string;
    comp: StructuredComponent;
    parentComp: StructuredComponent;
    open: boolean;
    setOpen: (open: boolean) => void;
}

export const AddComponentModal = ({
    path,
    comp,
    parentComp,
    open,
    setOpen,
}: AddComponentProps) => {
    const { componentName, id, children } = comp;

    const [currentComponent, setCurrentComponent] =
        useState<StructuredComponent>(comp);

    const [currentPath, setCurrentPath] = useState<string>(path);

    const [components, setComponents] = useState<ComponentRegisterConfig[]>([]);

    const { getAcceptedChildren } = useStudio();

    const {
        handleAddChildToComponent,
        handleRemoveChildFromComponent,
        components: allComponents,
    } = useDroppedComponents();

    const { generateTag, rebuild } = useTagManager(allComponents);

    // Fetch and filter components on mount
    useEffect(() => {
        getAcceptedChildren(path, componentName).then((data) => {
            setComponents(data);
        });
    }, [componentName, getAcceptedChildren, path]);

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
                generateTag,
            });
        },
        [children.length, generateTag, handleAddChildToComponent]
    );

    const onEditComponent = (
        component: StructuredComponent,
        parentComponent?: string
    ) => {
        setCurrentComponent(component);
        setCurrentPath(
            `${path}/${comp.componentName}${parentComponent ? '/' + parentComponent : ''}`
        );
    };

    useEffect(() => {
        rebuild();
    }, [rebuild]);

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="p-0 flex overflow-hidden [--header-height-three:calc(--spacing(75))] !max-w-[80vw] !h-[80vh]">
                    <SidebarInset>
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
                                            handleRemoveChildFromComponent={
                                                handleRemoveChildFromComponent
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
                    </SidebarInset>
                    <SidebarRight
                        comp={currentComponent}
                        path={currentPath}
                        parentComp={parentComp}
                        className="h-full"
                    />
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
                    Add Component
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

const RenderCreatedComponents = ({
    components,
    registryComponents,
    onEdit,
    handleAddComponent,
    level = 0,
    parentComponent,
    handleRemoveChildFromComponent,
}: {
    components: StructuredComponent[];
    registryComponents: ComponentRegisterConfig[];
    onEdit: (comp: StructuredComponent, parentComponent?: string) => void;
    handleAddComponent: (item: any, droppableId: string) => void;
    level?: number; // Add a level parameter to track nesting depth
    parentComponent?: string;
    handleRemoveChildFromComponent?: (destination: Destination) => void;
}) => {
    const handleEditComponent = (
        component: StructuredComponent,
        parentComponent?: string
    ) => {
        onEdit(component, parentComponent);
    };

    // Render the icon for a component
    const renderIcon = (iconName: string) => {
        const IconComponent = LucideIcons[iconName] ?? ICON_MAP[iconName];
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
    const RenderChildComponents = ({
        children,
        level,
        parentComponent,
    }: {
        children: StructuredComponent[];
        level: number;
        parentComponent: string;
    }) => {
        return (
            <RenderCreatedComponents
                components={children}
                registryComponents={registryComponents}
                onEdit={onEdit}
                handleAddComponent={handleAddComponent}
                level={level + 1}
                parentComponent={parentComponent}
                handleRemoveChildFromComponent={handleRemoveChildFromComponent}
            />
        );
    };

    return (
        <>
            {components.map((component, index) => {
                const { properties, label, id } = component;
                return (
                    <React.Fragment key={index}>
                        <TableRow>
                            <TableCell
                                className="font-medium"
                                style={{ paddingLeft: `${level * 20}px` }}
                            >
                                <div className="flex items-center gap-2">
                                    {renderIcon(
                                        properties?.iconProperties?.iconName
                                    )}
                                    <span>{`${label} (${properties.labelTrigger})`}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            handleEditComponent(
                                                component,
                                                parentComponent
                                            )
                                        }
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive"
                                        onClick={() =>
                                            handleRemoveChildFromComponent?.({
                                                droppableId: id,
                                                index,
                                            })
                                        }
                                    >
                                        Delete
                                    </Button>
                                    {canAcceptChildren(component) &&
                                        renderAddComponents(
                                            getAcceptedChildren(component),
                                            id,
                                            handleAddComponent
                                        )}
                                </div>
                            </TableCell>
                        </TableRow>
                        {component.children &&
                            component.children.length > 0 && (
                                <RenderChildComponents
                                    children={component.children}
                                    level={level}
                                    parentComponent={component.componentName}
                                />
                            )}
                    </React.Fragment>
                );
            })}
        </>
    );
};

// Main component that renders the table with a single header
const ComponentTable = ({
    components,
    registryComponents,
    onEdit,
    handleAddComponent,
    handleRemoveChildFromComponent,
}: {
    components: StructuredComponent[];
    registryComponents: ComponentRegisterConfig[];
    onEdit: (comp: StructuredComponent, parentComponent?: string) => void;
    handleAddComponent: (item: any, droppableId: string) => void;
    handleRemoveChildFromComponent: (destination: Destination) => void;
}) => {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Label</TableHead>
                    <TableHead>Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                <RenderCreatedComponents
                    components={components}
                    registryComponents={registryComponents}
                    onEdit={onEdit}
                    handleAddComponent={handleAddComponent}
                    handleRemoveChildFromComponent={
                        handleRemoveChildFromComponent
                    }
                />
            </TableBody>
        </Table>
    );
};
