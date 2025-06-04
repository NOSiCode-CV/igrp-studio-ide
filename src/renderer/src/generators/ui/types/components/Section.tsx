import { GenNoInfoComp } from '../../components/GenNoInfoComp';
import Droppable from '@renderer/lib/dnd/Droppable';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import { DragEndResult, StructuredComponent } from '@renderer/lib/dnd/types';
import { cn } from '@renderer/lib/utils';
import useStudio from '@renderer/hooks/use-studio';
import { useEffect, useState } from 'react';
import Draggable from '@renderer/lib/dnd/Draggable';
import BoxContainer from '../tools/BoxWrapper';
import SectionTool from '../tools/SectionTool';
import { useTranslation } from 'react-i18next';

export interface SectionProps {
    isDisabled?: boolean;
    comp: StructuredComponent;
    onDragEnd: (result: DragEndResult) => void;
    onAddControl?: (type: string, componentId: string) => void;
}

const IGRPStudioSection = ({
    isDisabled,
    comp,
    onDragEnd,
    onAddControl,
}: SectionProps) => {
    const { t } = useTranslation();
    const { children: components, id: componentId } = comp || {};

    const { removeRow, setEditingComponent } = useDroppedComponents();

    const [loadedComponents, setLoadedComponents] = useState<{
        [key: string]: React.ComponentType<any>;
    }>({});

    const { dynamicImport } = useStudio();

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

    const handleDeleteSection = () => {
        removeRow(componentId);
    };

    const handleEdit = async (component: StructuredComponent) => {
        setEditingComponent({
            path: '',
            component,
        });
    };

    return (
        <div className="group/row relative hover:border-2 hover:border-primary rounded-lg px-1">
            {!isDisabled && (
                <SectionTool
                    onClickAddControl={(type) =>
                        onAddControl?.(type, componentId)
                    }
                    onClickDeleteSection={handleDeleteSection}
                    onEdit={() => handleEdit(comp)}
                />
            )}
            <Droppable
                onDrop={handleDrop}
                component={comp}
                className={cn(
                    'hover:border-none space-y-1',
                    isDisabled && 'border-none hover:border-destructive'
                )}
            >
                {components && components.length > 0 ? (
                    components.map(
                        (comp: StructuredComponent, index: number) => {
                            const Component = loadedComponents[comp.id];

                            return Component ? (
                                <Draggable
                                    key={comp.id}
                                    item={comp}
                                    index={index}
                                    dropTargetId={componentId}
                                    mode="MOVE"
                                    isDisabled={isDisabled}
                                >
                                    <BoxContainer
                                        comp={comp}
                                        onEdit={() => handleEdit(comp)}
                                        group="group/row-comp"
                                        className={cn(
                                            'left-0 right-auto opacity-0',
                                            !isDisabled &&
                                                'group-hover/row-comp:opacity-100'
                                        )}
                                    >
                                        <Component
                                            comp={comp}
                                            onDragEnd={onDragEnd}
                                            isDisabled={isDisabled}
                                        />
                                    </BoxContainer>
                                </Draggable>
                            ) : (
                                <div key={comp.id}>{t('loading')}</div>
                            );
                        }
                    )
                ) : (
                    <GenNoInfoComp />
                )}
            </Droppable>
        </div>
    );
};

export default IGRPStudioSection;
