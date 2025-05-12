'use client';

import { Button } from '@renderer/components/ui/button';


import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@renderer/components/ui/dropdown-menu';
import {
    ExternalLink,
    Play,
    Square,
    Edit,
    MoreVertical,
    Trash,
} from 'lucide-react';
import { ConfigurationDialog } from '../components/configuration-dialog';
import { useDocker } from '@renderer/hooks/use-docker';
import { useState } from 'react';
import useToast from '@renderer/hooks/useToast';
import { useWorkspace } from '@renderer/hooks/use-workspace';
import AlertDialogDelete from '@renderer/components/alert-dialog-delete';
import { useTranslation } from 'react-i18next';

interface ServiceActionsProps {
    service: any;
    services: any[];
}

export const ServiceActions = ({ service, services }: ServiceActionsProps) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditService, setEditService] = useState(false);
    const { showErrorToast } = useToast();
    const {
        workspace,
        actions: { removeService },
    } = useWorkspace();

    const { getServiceUrl, stopService, restartService } = useDocker({workspace});

    const { t } = useTranslation();

    const handleServiceUrl = () => {
        const url = getServiceUrl(service);
        if (url) {
            window.electron.ipcRenderer.send('open-external-url', url);
        }
    };

    const handleDelete = async () => {
        setIsDialogOpen(false);
        try {
            await removeService(service.labels.uuid);
        } catch (error: unknown) {
            showErrorToast(error);
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    {service.status === 'running' ? (
                        <DropdownMenuItem
                            onClick={() => {
                                stopService([service.name]);
                            }}
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                        >
                            <Square className="mr-2 h-4 w-4 text-red-600" />
                            {t('stopService')}
                        </DropdownMenuItem>
                    ) : (
                        <DropdownMenuItem
                            onClick={() => {
                                restartService([service.name], 300);
                            }}
                            className="text-green-600 focus:text-green-600 focus:bg-green-50"
                        >
                            <Play className="mr-2 h-4 w-4 text-green-600" />
                            {t('startService')}
                        </DropdownMenuItem>
                    )}

                    <DropdownMenuItem
                        className="focus:bg-accent"
                        onClick={() => {
                            setEditService(true);
                        }}
                    >
                        <Edit className="mr-2 h-4 w-4" />
                        {t('editService')}
                    </DropdownMenuItem>

                    {getServiceUrl(service) && (
                        <DropdownMenuItem onClick={handleServiceUrl}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            {t('openInBrowser')}
                        </DropdownMenuItem>
                    )}

                    {service.labels?.uuid && (
                        <DropdownMenuItem
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            onClick={() => {
                                setIsDialogOpen(true);
                            }}
                        >
                            <Trash className="mr-2 h-4 w-4 text-red-600" />
                            {t('removeService')}
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>


            <AlertDialogDelete
                onConfirm={handleDelete}
                onClose={() => setIsDialogOpen(false)}
                recordId={service.name}
                isOpen={isDialogOpen}
            />

            <ConfigurationDialog
                service={service}
                services={services}
                isNew={false}
                open={isEditService}
                setOpen={setEditService}
            >
                <span className='sr-only'>Edit</span>
            </ConfigurationDialog>
        </>
    );
};
