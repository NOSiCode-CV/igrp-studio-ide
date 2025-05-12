'use client';

import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from '@renderer/components/ui/dropdown-menu';
import { Button } from '@renderer/components/ui/button';
import AlertDialogDelete from '@renderer/components/alert-dialog-delete';
import useToast from '@renderer/hooks/useToast';
import { ENV_TYPES } from '@renderer/constants/appConstants';
import { Trash, Repeat, MoreVertical, Edit, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ProjectData, ServiceInfo } from 'src/main/types';
import { ConfigurationDialog } from '../components/configuration-dialog';
import { useWorkspace } from '@renderer/hooks/use-workspace';

interface ProjectDropdownProps {
    project: ProjectData;
    basePath: string;
    services?: ServiceInfo[];
    projects?: ProjectData[];
    onEdit?: () => void;
    onConvertToSpringBoot?: () => void;
    onConvertToDotNet?: () => void;
}

export const ProjectActions: React.FC<ProjectDropdownProps> = ({
    project,
    services = [],
    projects = [],
    onEdit,
    onConvertToSpringBoot,
    onConvertToDotNet,
}) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { showErrorToast } = useToast();
    const { t } = useTranslation();

    const {
        actions: { removeProject },
    } = useWorkspace();

    const handleDelete = async () => {
        try {
            await removeProject(project);
            setIsDialogOpen(false);
        } catch (error: unknown) {
            showErrorToast(error);
        }
    };

    const handleExternalLink = () => {
        // Implement your external link logic here
        console.log(t('openExternalLinkFor'), project.name, service);
    };

    const findServiceByProjectName = (
        uuid: string
    ): ServiceInfo | undefined => {
        return services.find((service) => service.labels?.uuid === uuid);
    };

    const service = findServiceByProjectName(project.id);

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="min-w-48">
                    {onEdit && (
                        <DropdownMenuItem onClick={onEdit}>
                            <Edit className="mr-2 h-4 w-4" />
                            {t('editProject')}
                        </DropdownMenuItem>
                    )}

                    {service?.status === 'running' && (
                        <DropdownMenuItem onClick={handleExternalLink}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            {t('openInBrowser')}
                        </DropdownMenuItem>
                    )}
                 
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

                    {service && (
                        <ConfigurationDialog
                            service={service}
                            services={services}
                            projects={projects}
                            isNew={false}
                            project={project}
                        >
                            <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                                className="focus:bg-accent"
                            >
                                <Edit className="mr-2 h-4 w-4" />
                               {t('configureService')}
                            </DropdownMenuItem>
                        </ConfigurationDialog>
                    )}
                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                        onClick={() => {
                            setIsDialogOpen(true);
                        }}
                    >
                        <Trash className="mr-2 h-4 w-4 text-red-600" />
                        {t('removeProject')}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialogDelete
                onConfirm={handleDelete}
                onClose={() => setIsDialogOpen(false)}
                recordId={project.name}
                isOpen={isDialogOpen}
            />
        </>
    );
};
