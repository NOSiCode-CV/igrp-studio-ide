import React, { useCallback } from 'react';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import { StructuredComponent } from '@renderer/lib/dnd/types';
import Droppable from '@renderer/lib/dnd/Droppable';
import { COMPONENT } from '../../ComponentTypes';
import {
    IGRPCardContent,
    IGRPCardFooter,
    IGRPCardHeader,
} from '@igrp/igrp-framework-react-design-system';
import { getLabel } from '@renderer/utils';
import { GenNoInfoComp } from '../../components/GenNoInfoComp';
import { cn } from '@renderer/lib/utils';
import Draggable from '@renderer/lib/dnd/Draggable';
import TableTool from '../tools/tableTool';
import { generateAllClasses } from '../../components/settings/style/utils';
import BoxWrapper from '../tools/BoxWrapper';
import CardComponent, { CardComponentProps } from '../CardComponent';

const IGRPStudioCard: React.FC<CardComponentProps> = ({ comp, onDragEnd }) => {
    const { children: components, componentName: parentComponentName } = comp;

    const { setEditingComponent } = useDroppedComponents();

    const COMPONENT_MAP: Record<string, React.ElementType> = {
        [COMPONENT.CardFooter]: IGRPCardFooter,
        [COMPONENT.CardContent]: IGRPCardContent,
        [COMPONENT.CardHeader]: IGRPCardHeader,
    };

    const handleEdit = useCallback(
        (component: StructuredComponent, path: string) => {
            setEditingComponent({ path, component });
        },
        [setEditingComponent]
    );

    const renderChildComp = useCallback(
        (
            component: StructuredComponent,
            className: string,
            childClassName: string
        ) => {
            const {
                children: childComponents,
                componentName,
                id: componentId,
            } = component;
            const path = parentComponentName;

            return (
                <Droppable
                    component={component}
                    onDrop={onDragEnd}
                    className={cn('space-y-2 p-2', className)}
                >
                    {childComponents.length === 0 ? (
                        <GenNoInfoComp
                            type={getLabel(componentName).toUpperCase()}
                        />
                    ) : (
                        childComponents.map((child, index) => {
                            return (
                                <Draggable
                                    key={child.id}
                                    item={child}
                                    index={index}
                                    mode="MOVE"
                                    dropTargetId={componentId}
                                    layout="horizontal"
                                    className={cn('p-1', childClassName)}
                                >
                                    <BoxWrapper
                                        parentComp={comp}
                                        comp={child}
                                        onEdit={() => handleEdit(child, path)}
                                        group="group/card-content-item"
                                        className="opacity-0 group-hover/card-content-item:opacity-100"
                                    >
                                        <CardComponent
                                            comp={child}
                                            onDragEnd={onDragEnd}
                                        />
                                    </BoxWrapper>
                                </Draggable>
                            );
                        })
                    )}
                </Droppable>
            );
        },
        [handleEdit, onDragEnd, parentComponentName, comp]
    );

    return (
        <div className="w-full flex flex-col gap-3">
            {components.map((child, index) => {
                const { componentName, properties, style, childProperties } =
                    child;
                const { className, commonProperties, ...args } =
                    properties || {};

                const { className: childClassName } = childProperties || {};

                const Component = COMPONENT_MAP[componentName];

                const classes = generateAllClasses(style);

                if (!Component) return null;

                return (
                    <div
                        key={index}
                        {...args}
                        className={cn(
                            'bg-card rounded-lg border border-dashed border-gray-400 p-2 group/table'
                        )}
                    >
                        <TableTool
                            parentComp={comp}
                            comp={child}
                            onEdit={() =>
                                handleEdit(child, parentComponentName)
                            }
                            group="group/card-comp"
                            className="opacity-0 group-hover/card-comp:opacity-100"
                        />
                        {renderChildComp(
                            child,
                            `${classes}, ${className}`,
                            childClassName
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default IGRPStudioCard;
