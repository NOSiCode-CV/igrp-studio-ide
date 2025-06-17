import { GenNoInfoComp } from '../../components/GenNoInfoComp';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import { DragEndResult, StructuredComponent } from '@renderer/lib/dnd/types';
import { cn } from '@renderer/lib/utils';
import Draggable from '@renderer/lib/dnd/Draggable';
import BoxContainer from '../tools/BoxWrapper';
import { CardComponentProps } from '../CardComponent';
import { COMPONENT } from '../../ComponentTypes';
import { getHoverClasses } from '../../utils/tailwindGroups';
import { getLabel } from '@renderer/utils';
import BoxWrapper from '../tools/BoxWrapper';
import { useEffect, useState } from 'react';
import useStudio from '@renderer/hooks/use-studio';
import {
    IGRPHeadline,
    IGRPIcon,
} from '@igrp/igrp-framework-react-design-system';
import Droppable from '@renderer/lib/dnd/Droppable';

const IGRPStudioTextList = ({
    comp,
    group,
    hoverClass,
    onDragEnd,
}: CardComponentProps) => {
    const {
        children: components,
        id: componentId,
        componentName: parentComponentName,
        properties,
    } = comp || {};

    const { title } = properties;

    const { setEditingComponent } = useDroppedComponents();

    const handleDrop = (item: DragEndResult) => {
        onDragEnd(item);
    };

    const handleEdit = async (component: StructuredComponent, path: string) => {
        console.log("path ",path)
        setEditingComponent({
            path,
            component,
        });
    };

    //RESET Hover if parent is diff current component
    const { group: _group, hoverClass: _hoverClass } = getHoverClasses({
        group,
        hoverClass,
        componentName: COMPONENT.Container,
    });

    const [loadedComponents, setLoadedComponents] = useState<
        Record<string, React.ComponentType<any>>
    >({});
    const { dynamicImport } = useStudio();

    useEffect(() => {
        const loadComponents = async () => {
            const comps: Record<string, React.ComponentType<any>> = {};

            // Load all child components in parallel
            const loadPromises = components.flatMap((child) =>
                child.children.map(async (grandChild) => {
                    try {
                        const component = await dynamicImport(
                            grandChild.componentName
                        );
                        comps[grandChild.id] = component;
                    } catch (error) {
                        console.error(
                            `Failed to load component ${grandChild.componentName}:`,
                            error
                        );
                    }
                })
            );

            await Promise.all(loadPromises);
            setLoadedComponents(comps);
        };

        loadComponents();
    }, [dynamicImport, components]);

    const renderTextListItem = (comp: StructuredComponent, path:string) => {
        const { children: components, componentName } = comp;
        const { className } = properties;
        const newPath = `${path}/${componentName}`;
        return (
            <Droppable
                className={cn('flex w-full flex-col gap-2', className)}
                onDrop={onDragEnd}
                component={comp}
            >
                {components.length === 0 ? (
                    <GenNoInfoComp
                        type={getLabel(componentName).toUpperCase()}
                    />
                ) : (
                    components.map((child, index) => {
                        const { properties } = child;

                        return (
                            <Draggable
                                key={child.id}
                                item={child}
                                index={index}
                                mode="MOVE"
                                dropTargetId={componentId}
                                layout="horizontal"
                                className={cn('p-1')}
                            >
                                <BoxWrapper
                                    parentComp={comp}
                                    comp={child}
                                    onEdit={() => handleEdit(child, newPath)}
                                    group="group/info-section"
                                    className="top-0 opacity-0 group-hover/info-section:opacity-100"
                                >
                                    <IGRPInfoField
                                        item={properties}
                                    ></IGRPInfoField>
                                </BoxWrapper>
                            </Draggable>
                        );
                    })
                )}
            </Droppable>
        );
    };

    const renderTextList = (comp: StructuredComponent) => {
        const { children: components, componentName } = comp;
        const { className } = properties;
        const path = `${parentComponentName}/${componentName}`;
        return (
            <Droppable
                className={cn('flex w-full flex-col gap-2', className)}
                onDrop={onDragEnd}
                component={comp}
            >
                {components.length === 0 ? (
                    <GenNoInfoComp
                        type={getLabel(componentName).toUpperCase()}
                    />
                ) : (
                    components.map((child, index) => {

                        return (
                            <Draggable
                                key={child.id}
                                item={child}
                                index={index}
                                mode="MOVE"
                                dropTargetId={componentId}
                                layout="horizontal"
                                className={cn('p-1')}
                            >
                                <BoxWrapper
                                    parentComp={comp}
                                    comp={child}
                                    onEdit={() => handleEdit(child, path)}
                                    group="group/text-list-item"
                                    className="top-0 opacity-0 group-hover/text-list-item:opacity-100"
                                >
                                    {renderTextListItem(child, path)}
                                </BoxWrapper>
                            </Draggable>
                        );
                    })
                )}
            </Droppable>
        );
    };

    return (
        <div {...properties} className={cn('space-y-3 relative  p-3')}>
            {components && components.length > 0 ? (
                components.map((child: StructuredComponent, index: number) => {
                    return (
                        <Draggable
                            key={child.id}
                            item={child}
                            index={index}
                            dropTargetId={componentId}
                            mode="MOVE"
                            className="space-y-2 flex flex-col"
                        >
                            <BoxWrapper
                                comp={child}
                                parentComp={comp}
                                onEdit={() =>
                                    handleEdit(child, parentComponentName)
                                }
                                group={_group ?? `group/text-list`}
                                className={cn(
                                    'space-y-1 flex flex-col opacity-0',
                                    _hoverClass ??
                                        'group-hover/text-list:opacity-100'
                                )}
                            >
                                {renderTextList(child)}
                            </BoxWrapper>
                        </Draggable>
                    );
                })
            ) : (
                <GenNoInfoComp type="SECTIONS" />
            )}
        </div>
    );
};

function IGRPInfoField({ item }: any) {
    return (
        <div className={cn('flex flex-col space-y-0.5')}>
            <span className="text-sm font-medium">{item.label}</span>
            <div className="flex items-center gap-2">
                {item.icon && (
                    <div className="flex items-center gap-2">
                        <IGRPIcon
                            iconName={item.icon}
                            className={item.iconClassName}
                        />
                    </div>
                )}
                <span>{item.text}</span>
            </div>
        </div>
    );
}

export default IGRPStudioTextList;
