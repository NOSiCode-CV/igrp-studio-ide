import Droppable from '@renderer/lib/dnd/Droppable';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import { DragEndResult, StructuredComponent } from '@renderer/lib/dnd/types';
import { cn } from '@renderer/lib/utils';
import Draggable from '@renderer/lib/dnd/Draggable';
import SectionTool from '../tools/SectionTool';
import { useTranslation } from 'react-i18next';
import { newStructuredComponent } from '../../dnd/helpers';
import { COMPONENT } from '../../ComponentTypes';
import BoxWrapper from '../tools/BoxWrapper';
import CardComponent, { CardComponentProps } from '../CardComponent';

const IGRPStudioSection = ({ comp, onDragEnd, className }: CardComponentProps) => {
    useTranslation();
    const { children: components, id: componentId } = comp || {};

    const {
        removeRow,
        setEditingComponent,
        setAllComponents,
        components: allComponents,
    } = useDroppedComponents();

    const handleAddControl = (type: string, componentId: string) => {
        const newRow = newStructuredComponent(COMPONENT.Section);
        const rowIndex = allComponents.children.findIndex(
            (section) => section.id === componentId
        );

        if (rowIndex !== -1) {
            const newRows = [...allComponents.children];
            if (type === 'top') {
                newRows.splice(rowIndex, 0, newRow);
            } else if (type === 'bottom') {
                newRows.splice(rowIndex + 1, 0, newRow);
            }
            setAllComponents({
                ...allComponents,
                children: newRows,
            });
        }
    };

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
        <div className="group/section relative hover:border-2 hover:border-primary rounded-lg px-1">
            <SectionTool
                onClickAddControl={(type) => {
                    handleAddControl?.(type, componentId);
                }}
                onClickDeleteSection={handleDeleteSection}
                onEdit={() => handleEdit(comp)}
            />
            <Droppable
                onDrop={handleDrop}
                component={comp}
                className={className}
            >
                {components.length > 0 &&
                    components.map(
                        (childComp: StructuredComponent, index: number) => {
                            return (
                                <Draggable
                                    key={childComp.id}
                                    item={childComp}
                                    index={index}
                                    dropTargetId={componentId}
                                    mode="MOVE"
                                >
                                    <BoxWrapper
                                        parentComp={comp}
                                        comp={childComp}
                                        onEdit={() => handleEdit(childComp)}
                                        group="group/row-section"
                                        className={cn(
                                            'left-0 right-auto opacity-0 group-hover/row-section:opacity-100'
                                        )}
                                    >
                                        <CardComponent
                                            comp={childComp}
                                            onDragEnd={onDragEnd}
                                        />
                                    </BoxWrapper>
                                </Draggable>
                            );
                        }
                    )}
            </Droppable>
        </div>
    );
};

export default IGRPStudioSection;
