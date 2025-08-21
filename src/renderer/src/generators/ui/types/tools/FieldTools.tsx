import { Copy, Move, Settings, Trash } from 'lucide-react';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@renderer/components/ui/tooltip';
import { StructuredComponent } from '@renderer/lib/dnd/types';
import useStudio from '@renderer/hooks/use-studio';
import { ComponentRegisterConfig } from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';
import { useEffect, useState } from 'react';
import { AddComponentModal } from '../../components/add-components-modal';
import { Badge } from '@renderer/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { generateId } from '@renderer/utils';

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
    const { handleRemoveChildFromComponent, handleAddChildToComponent } = useDroppedComponents();

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
        const cloneComponent = (component: StructuredComponent): StructuredComponent => {
            const newId = generateId(component.componentName);
            const newTag = `${component.tag}_copy`;
            
            return {
                ...component,
                id: newId,
                tag: newTag,
                children: component.children?.map(child => cloneComponent(child)) || [],
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
        <TooltipProvider>
            <div className="shadow-lg flex justify-end p-0 space-x-0 py-0.5 px-1">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button className="container-mover cursor-pointer p-1 hover:bg-white hover:text-black rounded">
                            <Move className="h-3.5" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{t('move')}</p>
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            className="flex items-center justify-center p-1 hover:bg-white hover:text-black rounded"
                            title="Clone"
                            onClick={onClickCloneField}
                        >
                            <Copy className="h-3.5" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{t('clone')}</p>
                    </TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
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
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{t('edit')}</p>
                    </TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            className="flex items-center justify-center p-1 hover:bg-white hover:text-black rounded"
                            title="Delete"
                            onClick={onClickDeleteField}
                        >
                            <Trash className="h-3.5" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{t('delete')}</p>
                    </TooltipContent>
                </Tooltip>
                {components.length > 0 && path && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Badge
                                variant={'secondary'}
                                className="rounded-sm cursor-pointer h-6"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentComponent(comp);
                                    setIsOpen(true);
                                }}
                            >
                                <span className="text-xs">Add Comp</span>
                            </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Add Comp</p>
                        </TooltipContent>
                    </Tooltip>
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
        </TooltipProvider>
    );
};

export default FieldTools;
