'use client';

import { Badge } from '@renderer/components/ui/badge';
import {
    Power,
} from 'lucide-react';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from '@renderer/components/ui/card';
import Dependency from '../dependency';
import { ServiceActions } from './service-actions';
import { getServiceColor, getServiceIcon, getStatusColor } from '.';
interface ServiceGridProps {
    services: any[];
    onEdit?: (service: any) => void;
    workspaceId?: string;
}

export function ServiceGrid({ services, onEdit }: ServiceGridProps) {
  
    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4  xl:grid-cols-5 gap-3">
                {services.map((service, index) => (
                    <Card
                        key={index}
                        className="group border rounded-lg shadow-sm"
                    >
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                    <div
                                        className={`${getServiceColor(service.type)} rounded-sm p-1 text-white`}
                                    >
                                        {getServiceIcon(service.type)}
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className="capitalize"
                                    >
                                        {service.type}
                                    </Badge>
                                </div>
                                <Badge
                                    variant="outline"
                                    className={` capitalize ${getStatusColor(service.status)}`}
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
                                                    >
                                                        {port}
                                                    </Badge>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}

                                <Dependency dependsOn={service.dependsOn} />
                            </div>
                        </CardContent>
                        <CardFooter className="justify-between">
                            <div className="text-xs text-muted-foreground flex items-center">
                                <Power className="mr-1 h-3 w-3" />
                                {service.enabled ? 'Enabled' : 'Disabled'}
                            </div>
                            <ServiceActions
                                service={service}
                                services={services}
                                onEdit={onEdit}
                            />
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </>
    );
}
