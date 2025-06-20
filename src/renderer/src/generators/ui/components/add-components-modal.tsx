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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@renderer/components/ui/dropdown-menu';
import { SidebarInset } from '@renderer/components/ui/sidebar';
import { useTagManager } from '../hooks/useTagManager';
import * as LucideIcons from 'lucide-react';
import SidebarRight from './sidebar/sidebar-right';
import { cn } from '@renderer/lib/utils';
import Draggable from '@renderer/lib/dnd/Draggable';
import Droppable from '@renderer/lib/dnd/Droppable';

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
        handleReorderChildInComponent,
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

    const handleOrderComponent = useCallback(
        (result: DragEndResult) => {
            handleDragEnd(result, {
                handleReorderChildInComponent,
                generateTag,
            });
        },
        [generateTag, handleReorderChildInComponent]
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
                                            parentComp={comp}
                                            components={children}
                                            registryComponents={components}
                                            onEdit={onEditComponent}
                                            onOrderComponent={
                                                handleOrderComponent
                                            }
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

                            {/* Helper Section */}
                            <div className="p-2 text-xs text-muted-foreground border-b bg-muted rounded-t mt-6">
                                <p className="mb-2">
                                    <strong>rowData</strong> is a variable
                                    provided by the table that contains all the
                                    data from the current row. Use it in your
                                    click handlers to access row information.
                                </p>
                                <p className="mb-2">
                                    Available data in rowData:
                                </p>
                                <ul className="list-disc list-inside mt-1 space-y-1">
                                    <li>
                                        <code>rowData.id</code> - Row identifier
                                    </li>
                                    <li>
                                        <code>rowData.nome</code> - Name field
                                    </li>
                                    <li>
                                        <code>rowData.status</code> - Status
                                        field
                                    </li>
                                    <li>
                                        <code>rowData.data</code> - Date field
                                    </li>
                                </ul>
                                <p className="mt-2 mb-2">
                                    Example usage in table actions:
                                </p>
                                <ul className="list-disc list-inside mt-1 space-y-1">
                                    <li>
                                        <code>handleView</code>
                                    </li>
                                    <li>
                                        <code>
                                            () =&gt; handleView(rowData.id)
                                        </code>
                                    </li>
                                    <li>
                                        <code>
                                            () =&gt; handleEdit(rowData)
                                        </code>
                                    </li>
                                </ul>
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
    parentComp,
    components,
    registryComponents,
    onEdit,
    handleAddComponent,
    level = 0,
    parentComponent,
    handleRemoveChildFromComponent,
    onOrderComponent,
}: {
    parentComp: StructuredComponent;
    components: StructuredComponent[];
    registryComponents: ComponentRegisterConfig[];
    onEdit: (comp: StructuredComponent, parentComponent?: string) => void;
    handleAddComponent: (item: any, droppableId: string) => void;
    level?: number; // Add a level parameter to track nesting depth
    parentComponent?: string;
    handleRemoveChildFromComponent?: (destination: Destination) => void;
    onOrderComponent: (result: DragEndResult) => void;
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
        return IconComponent ? <IconComponent className="h-4 w-4" /> : null;
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
        parentComp,
        children,
        level,
        parentComponent,
    }: {
        parentComp: StructuredComponent;
        children: StructuredComponent[];
        level: number;
        parentComponent: string;
    }) => {
        return (
            <RenderCreatedComponents
                parentComp={parentComp}
                components={children}
                registryComponents={registryComponents}
                onEdit={onEdit}
                handleAddComponent={handleAddComponent}
                level={level + 1}
                parentComponent={parentComponent}
                handleRemoveChildFromComponent={handleRemoveChildFromComponent}
                onOrderComponent={onOrderComponent}
            />
        );
    };

    return (
        <Droppable
            component={parentComp}
            onDrop={onOrderComponent}
            className="w-full bg-none"
        >
            {components.map((component, index) => {
                const { properties, label, id } = component;
                return (
                    <React.Fragment key={index}>
                        <div className="grid grid-cols-[1fr_auto] px-3 py-1 border-b last:border-b-0 hover:bg-muted/50">
                            <div
                                className="font-medium"
                                style={{ paddingLeft: `${level * 20}px` }}
                            >
                                <Draggable
                                    item={component}
                                    index={index}
                                    mode="MOVE"
                                    layout="vertical"
                                    dropTargetId={parentComp?.id}
                                    className={cn(
                                        'border-none flex flex-1 items-center space-x-3'
                                    )}
                                >
                                    <button disabled>
                                        <LucideIcons.GripVertical className="h-4 w-4 text-muted-foreground" />
                                    </button>
                                    <div className="flex items-center gap-2">
                                        {renderIcon(
                                            properties?.iconProperties?.iconName
                                        )}
                                        <span className='text-sm'>{`${label} (${properties.labelTrigger})`}</span>
                                    </div>
                                </Draggable>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                        handleEditComponent(
                                            component,
                                            parentComponent
                                        )
                                    }
                                >
                                    <LucideIcons.Edit />
                                    <span className="sr-only">Edit</span>
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
                                    <LucideIcons.Trash />
                                    <span className="sr-only">Delete</span>
                                </Button>
                                {canAcceptChildren(component) &&
                                    renderAddComponents(
                                        getAcceptedChildren(component),
                                        id,
                                        handleAddComponent
                                    )}
                            </div>
                        </div>
                        {component.children &&
                            component.children.length > 0 && (
                                <RenderChildComponents
                                    parentComp={component}
                                    children={component.children}
                                    level={level}
                                    parentComponent={component.componentName}
                                />
                            )}
                    </React.Fragment>
                );
            })}
        </Droppable>
    );
};

// Main component that renders the table with a single header
const ComponentTable = ({
    parentComp,
    components,
    registryComponents,
    onEdit,
    handleAddComponent,
    handleRemoveChildFromComponent,
    onOrderComponent,
}: {
    parentComp: StructuredComponent;
    components: StructuredComponent[];
    registryComponents: ComponentRegisterConfig[];
    onEdit: (comp: StructuredComponent, parentComponent?: string) => void;
    onOrderComponent: (result: DragEndResult) => void;
    handleAddComponent: (item: any, droppableId: string) => void;
    handleRemoveChildFromComponent: (destination: Destination) => void;
}) => {
    return (
        <div className="border rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="bg-muted/50 border-b">
                <div className="grid grid-cols-[1fr_auto] gap-4 p-3 mx-6">
                    <div className="font-medium text-sm">Label</div>
                    <div className="font-medium text-sm">Actions</div>
                </div>
            </div>
            {/* Table Body */}
            <div>
                <RenderCreatedComponents
                    parentComp={parentComp}
                    components={components}
                    registryComponents={registryComponents}
                    onEdit={onEdit}
                    handleAddComponent={handleAddComponent}
                    handleRemoveChildFromComponent={
                        handleRemoveChildFromComponent
                    }
                    onOrderComponent={onOrderComponent}
                />
            </div>
        </div>
    );
};
