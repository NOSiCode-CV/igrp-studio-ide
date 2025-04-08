'use client';

import { Badge } from '@renderer/components/ui/badge';
import { Button } from '@renderer/components/ui/button';
import {
    Database,
    Server,
    Globe,
    ExternalLink,
    Play,
    Square,
    Power,
    Edit,
    Layers,
    FileArchive,
    IdCard,
} from 'lucide-react';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from '@renderer/components/ui/card';
import { ServiceConfigurationDialog } from './service-configuration-dialog';
import { useDocker } from '@renderer/hooks/use-docker';
interface ServiceGridProps {
    services: any[];
    onEdit?: (service: any) => void;
    workspaceId?: string;
}

export function ServiceGrid({ services, onEdit }: ServiceGridProps) {
    const { getServiceUrl, stopService, restartService } = useDocker();

    const handleServiceUrl = (service: any) => {
        const url = getServiceUrl(service);
        if (url) {
            window.electron.ipcRenderer.send('open-external-url', url);
        }
    };

    const getServiceIcon = (type: string) => {
        switch (type) {
            case 'database':
                return <Database className="h-4 w-4" />;
            case 'web':
                return <Globe className="h-4 w-4" />;
            case 'cache':
                return <Server className="h-4 w-4" />;
            case 'file':
                return <FileArchive className="h-4 w-4" />;
            case 'auth':
                return <IdCard className="h-4 w-4" />;
            default:
                return <Layers className="h-4 w-4" />;
        }
    };

    const getServiceColor = (type: string) => {
        switch (type) {
            case 'database':
                return 'bg-amber-500';
            case 'web':
                return 'bg-blue-500';
            case 'cache':
                return 'bg-purple-500';
            case 'file':
                return 'bg-red-500';
            default:
                return 'bg-green-500';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'running':
                return 'bg-green-500 text-white';
            case 'stopped':
                return 'bg-gray-500 text-white';
            case 'error':
                return 'bg-red-500 text-white';
            default:
                return 'bg-yellow-500 text-white';
        }
    };

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {services.map((service, index) => (
                    <Card key={index} className="group">
                        <CardHeader>
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1">
                                    <div
                                        className={`${getServiceColor(service.type)} rounded-sm p-1 text-white`}
                                    >
                                        {getServiceIcon(service.type)}
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className="text-xs h-4 px-1.5 capitalize"
                                    >
                                        {service.type}
                                    </Badge>
                                </div>
                                <Badge
                                    variant="outline"
                                    className={`text-xs h-4 px-1.5 capitalize ${getStatusColor(service.status)}`}
                                >
                                    {service.status}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <h3 className="text-xs font-medium mb-0.5">
                                {service.name}
                            </h3>
                            <p className="text-xs text-muted-foreground line-clamp-1 mb-1.5 font-mono">
                                {service.image}
                            </p>

                            <div className="grid grid-cols-1 gap-1 mb-1.5">
                                {service.ports && service.ports.length > 0 && (
                                    <div className="rounded-sm bg-muted p-1">
                                        <div className="text-xs text-muted-foreground">
                                            Ports
                                        </div>
                                        <div className="text-xs font-mono flex flex-wrap gap-1 mt-0.5">
                                            {service.ports.map(
                                                (port: string, i: number) => (
                                                    <Badge
                                                        key={i}
                                                        variant="outline"
                                                        className="text-xs h-4 px-1"
                                                    >
                                                        {port}
                                                    </Badge>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}

                                {service.dependsOn &&
                                    service.dependsOn.length > 0 && (
                                        <div className="rounded-sm bg-muted p-1">
                                            <div className="text-xs text-muted-foreground">
                                                Depends on
                                            </div>
                                            <div className="text-xs font-mono flex flex-wrap gap-1 mt-0.5">
                                                {service.dependsOn.map(
                                                    (
                                                        depId: string,
                                                        i: number
                                                    ) => {
                                                        const dep =
                                                            services.find(
                                                                (s) =>
                                                                    s.id ===
                                                                    depId
                                                            );
                                                        return (
                                                            <Badge
                                                                key={i}
                                                                variant="outline"
                                                                className="text-xs h-4 px-1"
                                                            >
                                                                {dep?.name ||
                                                                    depId}
                                                            </Badge>
                                                        );
                                                    }
                                                )}
                                            </div>
                                        </div>
                                    )}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-between">
                            <div className="text-xs text-muted-foreground flex items-center">
                                <Power className="mr-1 h-3 w-3" />
                                {service.enabled ? 'Enabled' : 'Disabled'}
                            </div>
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
                                        onClick={(e) => {
                                            e.stopPropagation();
                                        }}
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
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </>
    );
}
