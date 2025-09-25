'use client';

import {
    IGRPDropdownMenuPrimitive,
    IGRPDropdownMenuTriggerPrimitive,
    IGRPDropdownMenuContentPrimitive,
    IGRPDropdownMenuItemPrimitive,
    IGRPDropdownMenuSeparatorPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
import AlertDialogDelete from '@renderer/components/alert-dialog-delete';
import useToast from '@renderer/hooks/useToast';
import { ENV_TYPES } from '@renderer/constants/appConstants';
import { Trash, Repeat, MoreVertical, Edit, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ProjectData, ServiceInfo } from 'src/main/types';
import { ConfigurationDialog } from '../components/configuration-dialog';
import { useWorkspace } from '@renderer/hooks/use-workspace';
import { EditProjectModal } from './edit-project-modal';

interface ProjectDropdownProps {
    project: ProjectData;
    basePath: string;
    services?: ServiceInfo[];
    projects?: ProjectData[];
    onConvertToSpringBoot?: () => void;
    onConvertToDotNet?: () => void;
}

export const ProjectActions: React.FC<ProjectDropdownProps> = ({
    project,
    services = [],
    projects = [],
    onConvertToSpringBoot,
    onConvertToDotNet,
}) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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

    const handleEditProject = () => {
        setIsEditModalOpen(true);
    };

    const findServiceByProjectName = (
        uuid: string
    ): ServiceInfo | undefined => {
        return services.find((service) => service.labels?.uuid === uuid);
    };

    const service = findServiceByProjectName(project.id);

    return (
        <>
            <IGRPDropdownMenuPrimitive>
                <IGRPDropdownMenuTriggerPrimitive asChild>
                    <IGRPButtonPrimitive
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <MoreVertical className="h-4 w-4" />
                    </IGRPButtonPrimitive>
                </IGRPDropdownMenuTriggerPrimitive>
                <IGRPDropdownMenuContentPrimitive className="min-w-48">
                    <IGRPDropdownMenuItemPrimitive onClick={handleEditProject}>
                        <Edit className="mr-2 h-4 w-4" />
                        {t('editProject')}
                    </IGRPDropdownMenuItemPrimitive>

                    {service?.status === 'running' && (
                        <IGRPDropdownMenuItemPrimitive onClick={handleExternalLink}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            {t('openInBrowser')}
                        </IGRPDropdownMenuItemPrimitive>
                    )}
                 
                    {project.framework === ENV_TYPES.DOTNET && (
                        <IGRPDropdownMenuItemPrimitive
                            onClick={onConvertToSpringBoot}
                            disabled
                        >
                            <Repeat className="mr-2 h-4 w-4 text-gray-500" />
                            {t('convertToSpringBoot')}
                            <span className="ml-auto text-xs text-muted-foreground">
                                {t('comingSoon')}
                            </span>
                        </IGRPDropdownMenuItemPrimitive>
                    )}

                    {project.framework === ENV_TYPES.SPRING && (
                        <IGRPDropdownMenuItemPrimitive onClick={onConvertToDotNet} disabled>
                            <Repeat className="mr-2 h-4 w-4 text-gray-500" />
                            {t('convertToDotNet')}
                            <span className="ml-auto text-xs text-muted-foreground">
                                {t('comingSoon')}
                            </span>
                        </IGRPDropdownMenuItemPrimitive>
                    )}

                    {service && (
                        <ConfigurationDialog
                            service={service}
                            services={services}
                            projects={projects}
                            isNew={false}
                            project={project}
                        >
                            <IGRPDropdownMenuItemPrimitive
                                onSelect={(e) => e.preventDefault()}
                                className="focus:bg-accent"
                            >
                                <Edit className="mr-2 h-4 w-4" />
                               {t('configureService')}
                            </IGRPDropdownMenuItemPrimitive>
                        </ConfigurationDialog>
                    )}
                    <IGRPDropdownMenuSeparatorPrimitive />

                    <IGRPDropdownMenuItemPrimitive
                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                        onClick={() => {
                            setIsDialogOpen(true);
                        }}
                    >
                        <Trash className="mr-2 h-4 w-4 text-red-600" />
                        {t('removeProject')}
                    </IGRPDropdownMenuItemPrimitive>
                </IGRPDropdownMenuContentPrimitive>
            </IGRPDropdownMenuPrimitive>

            <AlertDialogDelete
                onConfirm={handleDelete}
                onClose={() => setIsDialogOpen(false)}
                recordId={project.name}
                isOpen={isDialogOpen}
            />

            <EditProjectModal
                project={project}
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSuccess={() => {
                    // Refresh the projects list or trigger a re-render
                    window.location.reload();
                }}
            />
        </>
    );
};
