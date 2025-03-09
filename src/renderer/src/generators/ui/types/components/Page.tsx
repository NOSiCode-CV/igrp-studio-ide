import {
    DragEndResult,
    StructuredComponent,
    StructuredLayout,
} from '@renderer/lib/dnd/types';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import PageTools from '../tools/PageTools';
import { useEffect, useState } from 'react';
import useStudio from '@renderer/hooks/useStudio';
import { STRUCTURES } from '../../ComponentTypes';

interface PageProps {
    page: StructuredLayout;
    onDragEnd: (result: DragEndResult) => void;
}

export const Page = ({ onDragEnd, page }: PageProps) => {
    const { setInitComponents, newStructure, setEditingComponent } =
        useDroppedComponents();

    const { children: components } = page;

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

    const handleAddControl = (type: string, componentId: string) => {
        const newRow = newStructure(STRUCTURES.Section);
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
            const newRow = newStructure(STRUCTURES.Section);
            setInitComponents({
                ...page,
                children: [newRow],
            });
        }
    }, [components]);

    const handleEditClick = () => {
        setEditingComponent({ ...page });
    };

    return (
        <div className="m-1 px-4 group/page relative hover:border-2 hover:rounded-sm h-[calc(100svh-var(--header-height-two))] !bg-custom-pattern">
            <PageTools onEdit={handleEditClick} />
            <div className="py-6 gap-3 grid">
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
                        <div key={row.id}>Loading...</div>
                    );
                })}
            </div>
        </div>
    );
};
