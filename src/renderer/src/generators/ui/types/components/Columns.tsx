import React, { useEffect, useState } from 'react';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import { cn } from '@renderer/lib/utils';
import useStudio from '@renderer/hooks/use-studio';
import { DragEndResult, StructuredComponent } from '@renderer/lib/dnd/types';
import Draggable from '@renderer/lib/dnd/Draggable';
import { columnsVariants, columnVariants } from '../../utils/layout-mapping';
import BoxWrapper from '../tools/BoxWrapper';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '@renderer/hooks/use-mobile';

export interface ColProps {
    isDisabled?: boolean;
    comp: StructuredComponent;
    onDragEnd: (result: DragEndResult) => void;
}

const IGRPStudioColumns: React.FC<ColProps> = ({
    comp,
    onDragEnd,
}: ColProps) => {
    const { children, properties } = comp;

    const { variant, className } = properties || {};

    const [loadedComponents, setLoadedComponents] = useState<{
        [key: string]: React.ComponentType<any>;
    }>({});

    const { setEditingComponent } = useDroppedComponents();

    const { dynamicImport } = useStudio();

    const isMobile = useIsMobile();

    const handleEditClick = (component: StructuredComponent) => {
        setEditingComponent({
            path: '',
            component,
        });
    };

    useEffect(() => {
        const loadComponents = async () => {
            const comps: { [key: string]: React.ComponentType<any> } = {};

            for (const comp of children) {
                const component = await dynamicImport(comp.componentName);
                comps[comp.id] = component;
            }

            setLoadedComponents(comps);
        };

        loadComponents();
    }, [children, dynamicImport]);

    const renderColumns = () => {
        return children.map((comp: StructuredComponent, index: number) => {
            const Component = loadedComponents[comp.id];
            const { properties } = comp;

            const { variant, className } = properties || {};

            return (
                Component && (
                    <Draggable
                        key={comp.id}
                        item={comp}
                        index={index}
                        dropZone={true}
                        className={cn(
                            'p-0',
                            columnVariants({ variant, className })
                        )}
                    >
                        <BoxWrapper
                            comp={comp}
                            onEdit={() => handleEditClick(comp)}
                            group="group/comp"
                            className="-top-4 opacity-0 group-hover/comp:opacity-100"
                        >
                            <Component comp={comp} onDragEnd={onDragEnd} />
                        </BoxWrapper>
                    </Draggable>
                )
            );
        });
    };

    return (
        <div
            className={cn(
                'p-2',
                columnsVariants({ variant, className }),
                isMobile && 'grid-cols-2 w-full'
            )}
        >
            {renderColumns()}
        </div>
    );
};

export default IGRPStudioColumns;
