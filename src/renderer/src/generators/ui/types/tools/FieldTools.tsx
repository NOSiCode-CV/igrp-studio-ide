import { Copy, Move, Settings, Trash } from 'lucide-react';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import {
    IGRPTooltipContentPrimitive,
    IGRPTooltipPrimitive,
    IGRPTooltipProviderPrimitive,
    IGRPTooltipTriggerPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { IGRPBadgePrimitive } from '@igrp/igrp-framework-react-design-system';
import { StructuredComponent } from '@renderer/lib/dnd/types';
import useStudio from '@renderer/hooks/use-studio';
import { ComponentRegisterConfig } from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';
import { useEffect, useState } from 'react';
import { AddComponentModal } from '../../components/add-components-modal';
import { useTranslation } from 'react-i18next';
import { generateId } from '@renderer/utils';
import AlertDialogDelete from '@renderer/components/alert-dialog-delete';

interface ToolsProps {
    onEdit: () => void;
    comp: StructuredComponent;
    parentComp: StructuredComponent;
    path?: string;
    index: number;
}

const FieldTools = ({ parentComp, comp, index, path, onEdit }: ToolsProps) => {
    const { id, componentName } = comp;
    const { componentName: parentComponentName } = parentComp;
    const [components, setComponents] = useState<ComponentRegisterConfig[]>([]);
    const { handleRemoveChildFromComponent, handleAddChildToComponent } =
        useDroppedComponents();
    const [deleteModal, setDeleteModal] = useState<boolean>(false);
    const { getAcceptedChildren } = useStudio();

    useEffect(() => {
        getAcceptedChildren(path || parentComponentName, componentName).then(
            (data) => {
                setComponents(data);
            }
        );
    }, [parentComponentName, componentName, getAcceptedChildren, path]);

    const onClickDeleteField = () => {
        handleRemoveChildFromComponent({ droppableId: id, index });
    };

    const onClickCloneField = () => {
        // Create a deep copy of the component
        const cloneComponent = (
            component: StructuredComponent
        ): StructuredComponent => {
            const newId = generateId(component.componentName);
            const newTag = `${component.tag}_copy`;

            return {
                ...component,
                id: newId,
                tag: newTag,
                children:
                    component.children?.map((child) => cloneComponent(child)) ||
                    [],
            };
        };

        const clonedComponent = cloneComponent(comp);

        // Add the cloned component to the same parent at the next index
        handleAddChildToComponent(
            { droppableId: parentComp.id, index: index + 1 },
            clonedComponent
        );
    };

    const [isOpen, setIsOpen] = useState(false);

    const [currentComponent, setCurrentComponent] =
        useState<StructuredComponent | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setCurrentComponent(null);
        }
    }, [isOpen, comp]);

    const { t } = useTranslation();

    return (
        <IGRPTooltipProviderPrimitive>
            <div className="shadow-lg flex justify-end p-0 space-x-0 py-0.5 px-1">
                <IGRPTooltipPrimitive>
                    <IGRPTooltipTriggerPrimitive asChild>
                        <button className="container-mover cursor-pointer p-1 hover:bg-white hover:text-black rounded">
                            <Move className="h-3.5" />
                        </button>
                    </IGRPTooltipTriggerPrimitive>
                    <IGRPTooltipContentPrimitive>
                        <p>{t('move')}</p>
                    </IGRPTooltipContentPrimitive>
                </IGRPTooltipPrimitive>
                <IGRPTooltipPrimitive>
                    <IGRPTooltipTriggerPrimitive asChild>
                        <button
                            className="flex items-center justify-center p-1 hover:bg-white hover:text-black rounded"
                            title="Clone"
                            onClick={onClickCloneField}
                        >
                            <Copy className="h-3.5" />
                        </button>
                    </IGRPTooltipTriggerPrimitive>
                    <IGRPTooltipContentPrimitive>
                        <p>{t('clone')}</p>
                    </IGRPTooltipContentPrimitive>
                </IGRPTooltipPrimitive>

                <IGRPTooltipPrimitive>
                    <IGRPTooltipTriggerPrimitive asChild>
                        <button
                            className="flex items-center justify-center p-1 hover:bg-white hover:text-black rounded"
                            title="Edit"
                            onClick={(e) => {
                                e.preventDefault();
                                onEdit();
                            }}
                        >
                            <Settings className="h-3.5" />
                        </button>
                    </IGRPTooltipTriggerPrimitive>
                    <IGRPTooltipContentPrimitive>
                        <p>{t('edit')}</p>
                    </IGRPTooltipContentPrimitive>
                </IGRPTooltipPrimitive>

                <IGRPTooltipPrimitive>
                    <IGRPTooltipTriggerPrimitive asChild>
                        <button
                            className="flex items-center justify-center p-1 hover:bg-white hover:text-black rounded"
                            title="Delete"
                            onClick={() => setDeleteModal(true)}
                        >
                            <Trash className="h-3.5" />
                        </button>
                    </IGRPTooltipTriggerPrimitive>
                    <IGRPTooltipContentPrimitive>
                        <p>{t('delete')}</p>
                    </IGRPTooltipContentPrimitive>
                </IGRPTooltipPrimitive>
                {components.length > 0 && path && (
                    <IGRPTooltipPrimitive>
                        <IGRPTooltipTriggerPrimitive asChild>
                            <IGRPBadgePrimitive
                                variant={'soft'}
                                className="rounded-sm cursor-pointer h-6"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentComponent(comp);
                                    setIsOpen(true);
                                }}
                            >
                                <span className="text-xs">Add Comp</span>
                            </IGRPBadgePrimitive>
                        </IGRPTooltipTriggerPrimitive>
                        <IGRPTooltipContentPrimitive>
                            <p>Add Comp</p>
                        </IGRPTooltipContentPrimitive>
                    </IGRPTooltipPrimitive>
                )}

                {isOpen && path && currentComponent && (
                    <AddComponentModal
                        path={path}
                        comp={comp}
                        parentComp={parentComp}
                        open={isOpen}
                        setOpen={setIsOpen}
                    />
                )}
            </div>
            <AlertDialogDelete
                isOpen={deleteModal}
                onClose={() => setDeleteModal(false)}
                onConfirm={onClickDeleteField}
                hasTrigger={false}
                recordId={componentName}
            />
        </IGRPTooltipProviderPrimitive>
    );
};

export default FieldTools;
