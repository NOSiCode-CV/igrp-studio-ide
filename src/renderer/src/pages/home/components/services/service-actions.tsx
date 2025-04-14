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
import { ServiceConfigurationDialog } from './service-configuration-dialog';
import { useDocker } from '@renderer/hooks/use-docker';
import { useState } from 'react';
import useToast from '@renderer/hooks/useToast';
import { useWorkspace } from '@renderer/hooks/use-workspace';
import AlertDialogDelete from '@renderer/components/alert-dialog-delete';

interface ServiceActionsProps {
    service: any;
    services: any[];
}

export const ServiceActions = ({ service, services }: ServiceActionsProps) => {
    const { getServiceUrl, stopService, restartService } = useDocker();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { showErrorToast } = useToast();
    const {
        actions: { removeService },
    } = useWorkspace();

    const handleServiceUrl = () => {
        const url = getServiceUrl(service);
        if (url) {
            window.electron.ipcRenderer.send('open-external-url', url);
        }
    };

    const handleDelete = async () => {
        setIsDialogOpen(false);
        try {
            await removeService(service.id);
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
                            onClick={(e) => {
                                e.stopPropagation();
                                stopService([service.name]);
                            }}
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                        >
                            <Square className="mr-2 h-4 w-4 text-red-600" />
                            Stop Service
                        </DropdownMenuItem>
                    ) : (
                        <DropdownMenuItem
                            onClick={(e) => {
                                e.stopPropagation();
                                restartService([service.name], 300);
                            }}
                            className="text-green-600 focus:text-green-600 focus:bg-green-50"
                        >
                            <Play className="mr-2 h-4 w-4 text-green-600" />
                            Start Service
                        </DropdownMenuItem>
                    )}

                    <ServiceConfigurationDialog
                        service={service}
                        services={services}
                        isNew={false}
                    >
                        <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                            className="focus:bg-accent"
                        >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Service
                        </DropdownMenuItem>
                    </ServiceConfigurationDialog>

                    {getServiceUrl(service) && (
                        <DropdownMenuItem
                            onClick={(e) => {
                                e.stopPropagation();
                                handleServiceUrl();
                            }}
                        >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Open in Browser
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsDialogOpen(true);
                        }}
                    >
                        <Trash className="mr-2 h-4 w-4 text-red-600" />
                        Remove Service
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialogDelete
                onConfirm={handleDelete}
                onClose={() => setIsDialogOpen(false)}
                recordId={service.name}
                isOpen={isDialogOpen}
            />
        </>
    );
};
