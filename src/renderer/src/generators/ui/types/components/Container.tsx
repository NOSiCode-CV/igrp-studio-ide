import { GenNoInfoComp } from '../../components/GenNoInfoComp';
import Droppable from '@renderer/lib/dnd/Droppable';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import { DragEndResult, StructuredComponent } from '@renderer/lib/dnd/types';
import { cn } from '@renderer/lib/utils';
import useStudio from '@renderer/hooks/use-studio';
import { useEffect, useState } from 'react';
import Draggable from '@renderer/lib/dnd/Draggable';
import BoxContainer from '../tools/BoxWrapper';
import { APP_COMPONENT } from '../../ComponentTypes';
import { ComponentRenderer } from '../ComponentRenderer';
import { useTabs } from '@renderer/components/navigation/TabContext';
import { useTranslation } from 'react-i18next';

export interface ContainerProps {
    isDisabled?: boolean;
    comp: StructuredComponent;
    onDragEnd: (result: DragEndResult) => void;
    onAddControl?: (type: string, componentId: string) => void;
    group?: string;
    className?: string;
}

const Container = ({
    isDisabled,
    comp,
    group,
    className,
    onDragEnd,
}: ContainerProps) => {
    const { t } = useTranslation();
    const { children: components, id: componentId } = comp || {};

    const { initializeTabFromCurrentItem } = useTabs();

    const { setEditingComponent } = useDroppedComponents();

    const [loadedComponents, setLoadedComponents] = useState<{
        [key: string]: React.ComponentType<any>;
    }>({});

    const { dynamicImport, getPageData } = useStudio();

    useEffect(() => {
        const loadComponents = async () => {
            const comps: { [key: string]: React.ComponentType<any> } = {};

            for (const comp of components) {
                const component = await dynamicImport(comp.componentName);
                comps[comp.id] = component;
            }

            setLoadedComponents(comps);
        };

        if (components) loadComponents();
    }, [components, dynamicImport]);

    const handleDrop = (item: DragEndResult) => {
        onDragEnd(item);
    };

    const handleEdit = async (component: StructuredComponent) => {
        if (component.type === APP_COMPONENT) {
            const page = await getPageData(component.componentName);
            initializeTabFromCurrentItem({
                ...page,
                id: page?.content.id,
                label: page?.content.name,
            });
        } else
            setEditingComponent({
                path: '',
                component,
            });
    };

    return (
        <Droppable
            onDrop={handleDrop}
            component={comp}
            className={cn(
                'space-y-3 relative  p-3',//hover:border-1 hover:border-primary rounded-lg
                isDisabled && 'border-none hover:border-destructive'
            )}
        >
            {components && components.length > 0 ? (
                components.map((comp: StructuredComponent, index: number) => {
                    const Component = loadedComponents[comp.id];

                    return Component ? (
                        <Draggable
                            key={comp.id}
                            item={comp}
                            index={index}
                            dropTargetId={componentId}
                            mode="MOVE"
                            isDisabled={isDisabled}
                            className={cn(
                                comp.type === APP_COMPONENT &&
                                    'hover:border-destructive'
                            )}
                        >
                            <BoxContainer
                                comp={comp}
                                onEdit={() => handleEdit(comp)}
                                group={group ?? `group/row-container`}
                                className={cn(
                                    'opacity-0',
                                    !isDisabled &&
                                        (className ??
                                            'group-hover/row-container:opacity-100')
                                )}
                            >
                                {comp.type === APP_COMPONENT ? (
                                    <ComponentRenderer
                                        comp={comp}
                                        onDragEnd={onDragEnd}
                                    />
                                ) : (
                                    <Component
                                        comp={comp}
                                        onDragEnd={onDragEnd}
                                        isDisabled={isDisabled}
                                        group={`group/row-container-child`}
                                        className={
                                            'opacity-0 group-hover/row-container-child:opacity-100 left-0 right-auto'
                                        }
                                    />
                                )}
                            </BoxContainer>
                        </Draggable>
                    ) : (
                        <div key={comp.id}>{t('loading')}</div>
                    );
                })
            ) : (
                <GenNoInfoComp />
            )}
        </Droppable>
    );
};

export default Container;
