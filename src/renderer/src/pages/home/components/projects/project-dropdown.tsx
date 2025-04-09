import AlertDialogDelete from '@renderer/components/alert-dialog-delete';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from '@renderer/components/ui/dropdown-menu';
import useToast from '@renderer/components/useToast';
import { ENV_TYPES } from '@renderer/constants/appConstants';
import { Trash, Repeat, EllipsisVertical } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ProjectData } from 'src/main/types';

interface ProjectDropdownProps {
    onDelete: (success: boolean) => void;
    onConvertToSpringBoot?: () => void;
    onConvertToDotNet?: () => void;
    project: ProjectData;
    basePath: string;
}

export const ProjectDropdown: React.FC<ProjectDropdownProps> = ({
    onDelete,
    onConvertToSpringBoot,
    onConvertToDotNet,
    project,
    basePath,
}) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { showErrorToast, showSuccessToast } = useToast();
    const { t } = useTranslation();

    const handleDelete = async () => {
        setIsDialogOpen(false);

        try {
            await window.igrpStudio.workspace.deleteProject(
                project.id,
                basePath
            );
            showSuccessToast(t('deletedSuccess', { name: project.name }));
            onDelete(true);
        } catch (error: unknown) {
            showErrorToast(error);
            onDelete(false);
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center justify-center rounded-md p-2 hover:bg-igrp hover:text-white text-muted-foreground">
                    <EllipsisVertical className="w-4 h-4" />
                </DropdownMenuTrigger>

                <DropdownMenuContent>
                    {project.framework === ENV_TYPES.DOTNET && (
                        <DropdownMenuItem
                            onClick={onConvertToSpringBoot}
                            disabled
                        >
                            <Repeat className="mr-2 h-4 w-4 text-gray-500" />
                            {t('convertToSpringBoot')}
                            <span className="ml-auto text-xs text-muted-foreground">
                                {t('comingSoon')}
                            </span>
                        </DropdownMenuItem>
                    )}
                    {project.framework === ENV_TYPES.SPRING && (
                        <DropdownMenuItem onClick={onConvertToDotNet} disabled>
                            <Repeat className="mr-2 h-4 w-4 text-gray-500" />
                            {t('convertToDotNet')}
                            <span className="ml-auto text-xs text-muted-foreground">
                                {t('comingSoon')}
                            </span>
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsDialogOpen(true);
                        }}
                    >
                        <Trash className="mr-2 h-4 w-4 text-red-500" />
                        {t('removeProject')}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* AlertDialog */}
            <AlertDialogDelete
                onConfirm={handleDelete}
                onClose={() => setIsDialogOpen(false)}
                recordId={project.name}
                isOpen={isDialogOpen}
            />
        </>
    );
};
