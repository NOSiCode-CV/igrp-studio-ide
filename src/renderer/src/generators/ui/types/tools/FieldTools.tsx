import { Copy, Move, Settings, Trash } from 'lucide-react';
import { useDroppedComponents } from '../../dnd/DroppedComponentsContext';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@renderer/components/ui/tooltip';
import { StructuredComponent } from '@renderer/lib/dnd/types';
import { EditComponent } from '../../components/EditComponent';
import useStudio from '@renderer/hooks/use-studio';
import { ComponentRegisterConfig } from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';
import { useEffect, useState } from 'react';

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
    const { handleRemoveChildFromComponent } = useDroppedComponents();

    const { getAcceptedChildren } = useStudio();

    useEffect(() => {
        getAcceptedChildren(path || parentComponentName, componentName).then(
            (data) => {
                setComponents(data);
            }
        );
    }, [parentComponentName, componentName, getAcceptedChildren]);

    const onClickDeleteField = () => {
        handleRemoveChildFromComponent({ droppableId: id, index });
    };

    return (
        <TooltipProvider>
            <div className="shadow-lg flex justify-end p-0 space-x-0">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button className="container-mover cursor-pointer p-1 hover:bg-white hover:text-black rounded">
                            <Move className="h-4" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Move</p>
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            className="flex items-center justify-center p-1 hover:bg-white hover:text-black rounded"
                            title="Clone"
                        >
                            <Copy className="h-4" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Clone</p>
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
                            <Settings className="h-4" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Edit</p>
                    </TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            className="flex items-center justify-center p-1 hover:bg-white hover:text-black rounded"
                            title="Delete"
                            onClick={onClickDeleteField}
                        >
                            <Trash className="h-4" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Delete</p>
                    </TooltipContent>
                </Tooltip>
                {components.length > 0 && path && (
                    <EditComponent path={path} comp={comp} />
                )}
            </div>
        </TooltipProvider>
    );
};

export default FieldTools;
