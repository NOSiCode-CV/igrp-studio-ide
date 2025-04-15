'use client';

import { Badge } from '@renderer/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@renderer/components/ui/table';
import { getServiceColor, getServiceIcon, getStatusColor } from '.';
import Dependency from '../dependency';
import { ServiceActions } from './service-actions';

interface ServiceListProps {
    services: any[];
    workspaceId?: string;
}

export function ServiceList({ services }: ServiceListProps) {
    return (
        <div className="grid w-full [&>div]:border [&>div]:rounded">
            <Table className="">
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Ports</TableHead>
                        <TableHead>Dependencies</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {services.map((service, index) => (
                        <TableRow
                            key={index}
                            className="hover:bg-muted/50 group cursor-pointer"
                        >
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-1.5">
                                    <div
                                        className={`${getServiceColor(service.labels.type)} rounded-sm p-1 text-white`}
                                    >
                                        {getServiceIcon(service.labels.type)}
                                    </div>
                                    <div className="text-xs">
                                        {service.name}
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge
                                    variant="outline"
                                    className={`${getServiceColor(service.labels.type)} bg-opacity-10  capitalize`}
                                >
                                    {service.labels.type}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-wrap gap-1">
                                    {service.ports &&
                                        service.ports.map(
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
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-wrap gap-1">
                                    {service.dependsOn &&
                                    service.dependsOn.length > 0 ? (
                                        <Dependency
                                            dependsOn={service.dependsOn}
                                            isTable
                                        />
                                    ) : (
                                        <span className="text-xs text-muted-foreground">
                                            None
                                        </span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge
                                    variant="outline"
                                    className={`capitalize ${getStatusColor(service.status)}`}
                                >
                                    {service.status}
                                </Badge>
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                                <ServiceActions
                                    service={service}
                                    services={services}
                                />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
