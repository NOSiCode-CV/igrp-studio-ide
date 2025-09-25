'use client';

import { IGRPBadgePrimitive } from '@igrp/igrp-framework-react-design-system';
import {
    IGRPTablePrimitive,
    IGRPTableBodyPrimitive,
    IGRPTableCellPrimitive,
    IGRPTableHeadPrimitive,
    IGRPTableHeaderPrimitive,
    IGRPTableRowPrimitive,
} from '@igrp/igrp-framework-react-design-system';
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
        <div className="grid w-full [&>div]:border [&>div]:rounded">
            <IGRPTablePrimitive className="">
                <IGRPTableHeaderPrimitive>
                    <IGRPTableRowPrimitive>
                        <IGRPTableHeadPrimitive>
                            {t('name')}
                        </IGRPTableHeadPrimitive>
                        <IGRPTableHeadPrimitive>
                            {t('type')}
                        </IGRPTableHeadPrimitive>
                        <IGRPTableHeadPrimitive>
                            {t('ports')}
                        </IGRPTableHeadPrimitive>
                        <IGRPTableHeadPrimitive>
                            {t('dependencies')}
                        </IGRPTableHeadPrimitive>
                        <IGRPTableHeadPrimitive>
                            {t('status')}
                        </IGRPTableHeadPrimitive>
                        <IGRPTableHeadPrimitive className="w-[100px]">
                            {t('actions')}
                        </IGRPTableHeadPrimitive>
                    </IGRPTableRowPrimitive>
                </IGRPTableHeaderPrimitive>
                <IGRPTableBodyPrimitive>
                    {services.map((service, index) => (
                        <IGRPTableRowPrimitive
                            key={index}
                            className="hover:bg-muted/50 group cursor-pointer"
                        >
                            <IGRPTableCellPrimitive className="font-medium">
                                <div className="flex items-center gap-1.5">
                                    <div
                                        className={`${getServiceColor(service.labels?.type)} rounded-sm p-1 text-white`}
                                    >
                                        {getServiceIcon(service.labels?.type)}
                                    </div>
                                    <div className="text-xs">
                                        {service.name}
                                    </div>
                                </div>
                            </IGRPTableCellPrimitive>
                            <IGRPTableCellPrimitive>
                                <IGRPBadgePrimitive
                                    variant="outline"
                                    className={`${getServiceColor(service.labels?.type)} bg-opacity-10  capitalize`}
                                >
                                    {service.labels?.type}
                                </IGRPBadgePrimitive>
                            </IGRPTableCellPrimitive>
                            <IGRPTableCellPrimitive>
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
                            </IGRPTableCellPrimitive>
                            <IGRPTableCellPrimitive>
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
                            </IGRPTableCellPrimitive>
                            <IGRPTableCellPrimitive>
                                <IGRPBadgePrimitive
                                    variant="outline"
                                    className={`capitalize ${getStatusColor(service.status)}`}
                                >
                                    {service.status}
                                </IGRPBadgePrimitive>
                            </IGRPTableCellPrimitive>
                            <IGRPTableCellPrimitive
                                onClick={(e) => e.stopPropagation()}
                            >
                                <ServiceActions
                                    service={service}
                                    services={services}
                                />
                            </IGRPTableCellPrimitive>
                        </IGRPTableRowPrimitive>
                    ))}
                </IGRPTableBodyPrimitive>
            </IGRPTablePrimitive>
        </div>
    );
}
