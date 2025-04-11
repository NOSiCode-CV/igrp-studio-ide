'use client';

import { Button } from '@renderer/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@renderer/components/ui/dropdown-menu';
import { ExternalLink, Play, Square, Edit, MoreVertical } from 'lucide-react';
import { ServiceConfigurationDialog } from './service-configuration-dialog';
import { useDocker } from '@renderer/hooks/use-docker';

interface ServiceActionsProps {
  service: any;
  services: any[];
  onEdit?: (service: any) => void;
}

export const ServiceActions = ({ service, services, onEdit }: ServiceActionsProps) => {
  const { getServiceUrl, stopService, restartService } = useDocker();

  const handleServiceUrl = () => {
    const url = getServiceUrl(service);
    if (url) {
      window.electron.ipcRenderer.send('open-external-url', url);
    }
  };

  return (
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

        {onEdit && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onEdit(service);
            }}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Service
          </DropdownMenuItem>
        )}

        <ServiceConfigurationDialog service={service} services={services} isNew={false}>
          <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            className="focus:bg-accent"
          >
            <Edit className="mr-2 h-4 w-4" />
            Configure Service
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
};