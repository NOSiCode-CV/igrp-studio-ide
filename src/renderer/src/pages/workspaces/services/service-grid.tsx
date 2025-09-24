'use client';

import { IGRPBadge } from '@igrp/igrp-framework-react-design-system';
import {
    IGRPCard,
    IGRPCardContent,
    IGRPCardDescription,
    IGRPCardHeader,
    IGRPCardTitle,
} from '@igrp/igrp-framework-react-design-system';
import Dependency from '../components/dependency';
import { ServiceActions } from './service-actions';
import { getServiceColor, getServiceIcon, getStatusColor } from '.';
import { PortsBadgeList } from '../components/ports-badge-list';
interface ServiceGridProps {
    services: any[];
    workspaceId?: string;
}

export function ServiceGrid({ services }: ServiceGridProps) {
    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {services.map((service, index) => (
                    <IGRPCard
                        key={index}
                        className="group border rounded-lg shadow-sm gap-3"
                    >
                        <IGRPCardHeader>
                            <IGRPCardTitle>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                        <div
                                            className={`${getServiceColor(service.labels?.type)} rounded-sm p-1 text-white`}
                                        >
                                            {getServiceIcon(service.labels?.type)}
                                        </div>
                                        <IGRPBadge
                                            variant="outline"
                                            className="capitalize"
                                        >
                                            {service.labels?.type}
                                        </IGRPBadge>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <IGRPBadge
                                            variant="outline"
                                            className={`capitalize ${getStatusColor(service.status)}`}
                                        >
                                            {service.status}
                                        </IGRPBadge>
                                        <ServiceActions
                                            service={service}
                                            services={services}
                                        />
                                    </div>
                                </div>
                            </IGRPCardTitle>
                            <IGRPCardDescription className="truncate">
                                {service.name}
                            </IGRPCardDescription>
                        </IGRPCardHeader>
                        <IGRPCardContent>
                            <div className="grid grid-cols-1">
                                <PortsBadgeList ports={service.ports} />    
                                <Dependency dependsOn={service.dependsOn} />
                            </div>
                        </IGRPCardContent>
                    </IGRPCard>
                ))}
            </div>
        </>
    );
}
