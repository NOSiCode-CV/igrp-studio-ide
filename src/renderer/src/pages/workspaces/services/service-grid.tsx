'use client';

import { useState, useMemo } from 'react';
import { IGRPBadgePrimitive } from '@igrp/igrp-framework-react-design-system';
import {
    IGRPCardPrimitive,
    IGRPCardContentPrimitive,
    IGRPCardDescriptionPrimitive,
    IGRPCardHeaderPrimitive,
    IGRPCardTitlePrimitive,
} from '@igrp/igrp-framework-react-design-system';
import Dependency from '../components/dependency';
import { ServiceActions } from './service-actions';
import { ServiceFilter } from './service-filter';
import { 
    getServiceColor, 
    getServiceIcon, 
    getStatusColor,
    filterServicesByCategory,
    filterServicesBySearch
} from '.';
import { PortsBadgeList } from '../components/ports-badge-list';

interface ServiceGridProps {
    services: any[];
    workspaceId?: string;
}

export function ServiceGrid({ services }: ServiceGridProps) {
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredServices = useMemo(() => {
        let filtered = services;
        
        // Apply category filter
        filtered = filterServicesByCategory(filtered, activeCategory);
        
        // Apply search filter
        filtered = filterServicesBySearch(filtered, searchQuery);
        
        return filtered;
    }, [services, activeCategory, searchQuery]);

    const handleFilterChange = (category: string, query: string) => {
        setActiveCategory(category);
        setSearchQuery(query);
    };
    return (
        <div className="space-y-4">
            {/* Filter Component */}
            <ServiceFilter 
                onFilterChange={handleFilterChange}
                totalServices={filteredServices.length}
            />
            
            {/* Services Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredServices.map((service, index) => (
                    <IGRPCardPrimitive key={index}>
                        <IGRPCardHeaderPrimitive>
                            <IGRPCardTitlePrimitive>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                        <div
                                            className={`${getServiceColor(service.labels?.type)} rounded-sm p-1 text-white`}
                                        >
                                            {getServiceIcon(
                                                service.labels?.type
                                            )}
                                        </div>
                                        <IGRPBadgePrimitive
                                            variant="outline"
                                            className="capitalize"
                                        >
                                            {service.labels?.type}
                                        </IGRPBadgePrimitive>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <IGRPBadgePrimitive
                                            variant="outline"
                                            className={`capitalize ${getStatusColor(service.status)}`}
                                        >
                                            {service.status}
                                        </IGRPBadgePrimitive>
                                        <ServiceActions
                                            service={service}
                                            services={filteredServices}
                                        />
                                    </div>
                                </div>
                            </IGRPCardTitlePrimitive>
                            <IGRPCardDescriptionPrimitive className="truncate">
                                {service.name}
                            </IGRPCardDescriptionPrimitive>
                        </IGRPCardHeaderPrimitive>
                        <IGRPCardContentPrimitive>
                            <div className="grid grid-cols-1">
                                <PortsBadgeList ports={service.ports} />
                                <Dependency dependsOn={service.dependsOn} />
                            </div>
                        </IGRPCardContentPrimitive>
                    </IGRPCardPrimitive>
                ))}
            </div>
        </div>
    );
}
