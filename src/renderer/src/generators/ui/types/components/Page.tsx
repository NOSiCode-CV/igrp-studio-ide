import { DragEndResult, StructuredLayout } from '@renderer/lib/dnd/types';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import PageTools from '../tools/PageTools';
import { useEffect, useRef, useState } from 'react';
import useStudio from '@renderer/hooks/use-studio';
import { COMPONENT } from '../../ComponentTypes';
import { useTranslation } from 'react-i18next';

interface PageProps {
    page: StructuredLayout;
    onDragEnd: (result: DragEndResult) => void;
}

export const Page = ({ onDragEnd, page }: PageProps) => {
    const { t } = useTranslation();
    const { setInitComponents, newStructure, setEditingComponent } =
        useDroppedComponents();

    const { children: components } = page;
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

    const handleAddControl = (type: string, componentId: string) => {
        const newRow = newStructure(COMPONENT.Section);
        const rowIndex = components.findIndex(
            (section) => section.id === componentId
        );

        if (rowIndex !== -1) {
            const newRows = [...components];
            if (type === 'top') {
                newRows.splice(rowIndex, 0, newRow);
            } else if (type === 'bottom') {
                newRows.splice(rowIndex + 1, 0, newRow);
            }
            setInitComponents({
                ...page,
                children: newRows,
            });
        }
    };

    useEffect(() => {
        if (components.length === 0) {
            const newRow = newStructure(COMPONENT.Section);
            setInitComponents({
                ...page,
                children: [newRow],
            });
        }
    }, [components]);

    const handleEditClick = () => {
        setEditingComponent({ component: page });
    };

    return (
        <div className="group/page relative !bg-custom-pattern min-h-[calc(100svh-var(--header-height-three))] overflow-x-auto">
            <PageTools onEdit={handleEditClick} />
            <div className="overflow-y-auto flex flex-col">
                <div className="grid py-6 px-2 gap-3">
                    {components.map((row) => {
                        const Component = loadedComponents[row.id];
                        return Component ? (
                            <Component
                                key={row.id}
                                isDisabled={false}
                                comp={row}
                                onDragEnd={onDragEnd}
                                onAddControl={handleAddControl}
                            />
                        ) : (
                            <div
                                key={row.id}
                                className="animate-pulse h-20 w-full rounded-md"
                            >
                                {t('loading')}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
