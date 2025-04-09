'use client';

import { Button } from '@renderer/components/ui/button';
import { ExternalLink, Play, Square, Edit } from 'lucide-react';
import { ServiceConfigurationDialog } from './service-configuration-dialog';
import { useDocker } from '@renderer/hooks/use-docker';

interface ServiceActionsProps {
    service: any;
    services: any[];
    onEdit?: (service: any) => void;
}

export const ServiceActions = ({
    service,
    services,
    onEdit,
}: ServiceActionsProps) => {
    const { getServiceUrl, stopService, restartService } = useDocker();

    const handleServiceUrl = (service: any) => {
        const url = getServiceUrl(service);
        if (url) {
            window.electron.ipcRenderer.send('open-external-url', url);
        }
    };

    return (
        <div className="flex gap-1">
            {service.status === 'running' ? (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    title="Stop"
                    onClick={(e) => {
                        e.stopPropagation();
                        stopService([service.name]);
                    }}
                >
                    <Square className="h-4 w-4 text-red-500" />
                </Button>
            ) : (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    title="Start"
                    onClick={(e) => {
                        e.stopPropagation();
                        restartService([service.name], 300);
                    }}
                >
                    <Play className="h-4 w-4 text-green-500" />
                </Button>
            )}

            {onEdit && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    title="Edit"
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit(service);
                    }}
                >
                    <Edit className="h-4 w-4" />
                </Button>
            )}

            <ServiceConfigurationDialog
                service={service}
                services={services}
                isNew={false}
            >
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    title="Edit"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Edit className="h-4 w-4" />
                </Button>
            </ServiceConfigurationDialog>

            {getServiceUrl(service) && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    title="Open"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleServiceUrl(service);
                    }}
                >
                    <ExternalLink className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
};
