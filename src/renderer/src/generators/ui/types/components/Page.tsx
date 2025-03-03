import { DragEndResult, StructuredLayout } from '@renderer/lib/dnd/types';
import { Section } from './Section';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import PageTools from '../tools/PageTools';

interface PageProps {
    page: StructuredLayout;
    onDragEnd: (result: DragEndResult) => void;
}

export const Page = ({ onDragEnd, page }: PageProps) => {
    const { setInitComponents, newStructure } = useDroppedComponents();

    const { children: components } = page;

    const handleAddControl = (type: string, componentId: string) => {
        const newRow = newStructure('section');
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

    return (
        <div className="m-1 px-4  group/page relative hover:border-2 hover:rounded-sm h-[calc(100svh-var(--header-height-two))] !bg-custom-pattern">
            <PageTools onEdit={() => console.log()} />
            <div className="py-6 gap-3 grid">
                {components.map((row) => (
                    <Section
                        key={row.id}
                        component={row}
                        onDragEnd={onDragEnd}
                        onAddControl={handleAddControl}
                    />
                ))}
            </div>
        </div>
    );
};
