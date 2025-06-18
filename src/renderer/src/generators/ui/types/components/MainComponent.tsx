import { DragEndResult, StructuredComponent, StructuredLayout } from '@renderer/lib/dnd/types';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import PageTools from '../tools/PageTools';
import { useEffect, useRef, useState } from 'react';
import useStudio from '@renderer/hooks/use-studio';
import { GenNoInfoComp } from '../../components/GenNoInfoComp';
import Droppable from '@renderer/lib/dnd/Droppable';
import { cn } from '@renderer/lib/utils';
import Draggable from '@renderer/lib/dnd/Draggable';
import BoxWrapper from '../tools/BoxWrapper';

interface PageProps {
    component: StructuredLayout;
    onDragEnd: (result: DragEndResult) => void;
}

const IGRPStudioMainComponent = ({ onDragEnd, component }: PageProps) => {
    const { children: components, id: componentId } = component;

    const { setEditingComponent } = useDroppedComponents();

    const { dynamicImport } = useStudio();

    const [loadedComponents, setLoadedComponents] = useState<{
        [key: string]: React.ComponentType<any>;
    }>({});

    const loadedComponentsRef = useRef<{
        [key: string]: React.ComponentType<any>;
    }>({});

    useEffect(() => {
        const loadComponents = async () => {
            for (const comp of components) {
                if (!loadedComponentsRef.current[comp.id]) {
                    const component = await dynamicImport(comp.componentName);
                    loadedComponentsRef.current[comp.id] = component;
                }
            }

            setLoadedComponents({ ...loadedComponentsRef.current });
        };

        if (components) loadComponents();
    }, [components, dynamicImport]);

    /*     useEffect(() => {
        if (components.length === 0) {
            const newRow = newStructuredComponent(COMPONENT.Section);
            setAllComponents({
                ...page,
                children: [newRow],
            });
        }
    }, [components]); */

    const handleEditClick = (component: StructuredComponent) => {
        setEditingComponent({ component: component });
    };

    return (
        <div className="group/page relative !bg-custom-pattern min-h-[calc(100svh-var(--header-height-three))] overflow-x-auto">
            <PageTools onEdit={()=>handleEditClick(component)} />
            <Droppable
                onDrop={onDragEnd}
                component={component}
                className={cn('space-y-1')}
            >
                <div className="overflow-y-auto flex flex-col">
                    <div className="grid py-6 px-2 gap-3">
                        {components.length > 0 ? (
                            components.map((row, index) => {
                                const Component = loadedComponents[row.id];

                                return (
                                    Component && (
                                        <Draggable
                                            key={row.id}
                                            item={row}
                                            index={index}
                                            dropTargetId={componentId}
                                            mode="MOVE"
                                        >
                                            <BoxWrapper
                                                parentComp={component}
                                                comp={row}
                                                onEdit={() =>
                                                    handleEditClick(row)
                                                }
                                                group="group/row-main"
                                                className={cn(
                                                    'left-0 right-auto opacity-0 group-hover/row-main:opacity-100'
                                                )}
                                            >
                                                <Component
                                                    key={row.id}
                                                    comp={row}
                                                    onDragEnd={onDragEnd}
                                                />
                                            </BoxWrapper>
                                        </Draggable>
                                    )
                                );
                            })
                        ) : (
                            <GenNoInfoComp />
                        )}
                    </div>
                </div>
            </Droppable>
        </div>
    );
};

export default IGRPStudioMainComponent;
