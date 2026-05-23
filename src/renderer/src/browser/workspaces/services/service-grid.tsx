'use client'

import {
    IGRPBadgePrimitive,
    IGRPCardContentPrimitive,
    IGRPCardDescriptionPrimitive,
    IGRPCardHeaderPrimitive,
    IGRPCardPrimitive,
    IGRPCardTitlePrimitive
} from '@igrp/igrp-framework-react-design-system'
import { useMemo, useState } from 'react'
import Dependency from '../components/dependency'
import { PortsBadgeList } from '../components/ports-badge-list'
import {
    filterServicesByCategory,
    filterServicesBySearch,
    getServiceColor,
    getServiceIcon,
    getStatusColor
} from '.'
import { ServiceActions } from './service-actions'
import { ServiceFilter } from './service-filter'

interface ServiceGridProps {
    services: any[]
    workspaceId?: string
    showFilter?: boolean
}

export function ServiceGrid({ services, showFilter = true }: ServiceGridProps) {
    const [activeCategory, setActiveCategory] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')

    const filteredServices = useMemo(() => {
        let filtered = services

        // Apply category filter
        filtered = filterServicesByCategory(filtered, activeCategory)

        // Apply search filter
        filtered = filterServicesBySearch(filtered, searchQuery)

        return filtered
    }, [services, activeCategory, searchQuery])

    const handleFilterChange = (category: string, query: string) => {
        setActiveCategory(category)
        setSearchQuery(query)
    }
    return (
        <div className="space-y-4">
            {/* Filter Component */}
            {showFilter ? (
                <ServiceFilter
                    onFilterChange={handleFilterChange}
                    totalServices={filteredServices.length}
                />
            ) : null}

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
                                            {getServiceIcon(service.labels?.type)}
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
    )
}
