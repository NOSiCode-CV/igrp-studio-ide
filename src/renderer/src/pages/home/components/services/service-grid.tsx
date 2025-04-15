'use client';

import { Badge } from '@renderer/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@renderer/components/ui/card';
import Dependency from '../dependency';
import { ServiceActions } from './service-actions';
import { getServiceColor, getServiceIcon, getStatusColor } from '.';
interface ServiceGridProps {
    services: any[];
    workspaceId?: string;
}

export function ServiceGrid({ services }: ServiceGridProps) {
    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {services.map((service, index) => (
                    <Card
                        key={index}
                        className="group border rounded-lg shadow-sm gap-3"
                    >
                        <CardHeader>
                            <CardTitle>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                        <div
                                            className={`${getServiceColor(service.labels.type)} rounded-sm p-1 text-white`}
                                        >
                                            {getServiceIcon(service.labels.type)}
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className="capitalize"
                                        >
                                            {service.labels.type}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Badge
                                            variant="outline"
                                            className={`capitalize ${getStatusColor(service.status)}`}
                                        >
                                            {service.status}
                                        </Badge>
                                        <ServiceActions
                                            service={service}
                                            services={services}
                                        />
                                    </div>
                                </div>
                            </CardTitle>
                            <CardDescription className="truncate">
                                {service.name}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1">
                                {service.ports && service.ports.length > 0 && (
                                    <div className="p-1">
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
                    </Card>
                ))}
            </div>
        </>
    );
}
