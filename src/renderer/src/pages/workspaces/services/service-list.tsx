'use client';

import { IGRPBadgePrimitive } from '@igrp/igrp-framework-react-design-system';
import { getServiceColor, getServiceIcon, getStatusColor } from '.';
import Dependency from '../components/dependency';
import { ServiceActions } from './service-actions';
import { useTranslation } from 'react-i18next';

interface ServiceListProps {
    services: any[];
    workspaceId?: string;
}

export function ServiceList({ services }: ServiceListProps) {
    const { t } = useTranslation();
    return (
        <div className="w-full border rounded-lg overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-6 gap-4 p-3 bg-muted/50 border-b text-sm font-medium text-muted-foreground">
                <div>{t('name')}</div>
                <div>{t('type')}</div>
                <div>{t('ports')}</div>
                <div>{t('dependencies')}</div>
                <div>{t('status')}</div>
                <div className="w-[100px]">{t('actions')}</div>
            </div>

            {/* Body */}
            <div className="divide-y">
                {services.map((service, index) => (
                    <div
                        key={index}
                        className="grid grid-cols-6 gap-4 p-3 hover:bg-muted/50 group cursor-pointer"
                    >
                        <div className="font-medium">
                            <div className="flex items-center gap-1.5">
                                <div
                                    className={`${getServiceColor(service.labels?.type)} rounded-sm p-1 text-white`}
                                >
                                    {getServiceIcon(service.labels?.type)}
                                </div>
                                <div className="text-xs">{service.name}</div>
                            </div>
                        </div>
                        <div>
                            <IGRPBadgePrimitive
                                variant="outline"
                                className={`${getServiceColor(service.labels?.type)} bg-opacity-10 capitalize`}
                            >
                                {service.labels?.type}
                            </IGRPBadgePrimitive>
                        </div>
                        <div>
                            <div className="flex flex-wrap gap-1">
                                {service.ports &&
                                    service.ports.map(
                                        (port: string, i: number) => (
                                            <IGRPBadgePrimitive
                                                key={i}
                                                variant="outline"
                                            >
                                                {port}
                                            </IGRPBadgePrimitive>
                                        )
                                    )}
                            </div>
                        </div>
                        <div>
                            <div className="flex flex-wrap gap-1">
                                {service.dependsOn &&
                                service.dependsOn.length > 0 ? (
                                    <Dependency
                                        dependsOn={service.dependsOn}
                                        isTable
                                    />
                                ) : (
                                    <span className="text-xs text-muted-foreground">
                                        {t('none')}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div>
                            <IGRPBadgePrimitive
                                variant="outline"
                                className={`capitalize ${getStatusColor(service.status)}`}
                            >
                                {service.status}
                            </IGRPBadgePrimitive>
                        </div>
                        <div onClick={(e) => e.stopPropagation()}>
                            <ServiceActions
                                service={service}
                                services={services}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
