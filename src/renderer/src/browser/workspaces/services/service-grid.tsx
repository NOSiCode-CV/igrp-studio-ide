'use client'

import { Badge } from '@renderer/components/ui/badge'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@renderer/components/ui/card'
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
                    <Card key={index}>
                        <CardHeader>
                            <CardTitle>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                        <div
                                            className={`${getServiceColor(service.labels?.type)} rounded-sm p-1 text-white`}
                                        >
                                            {getServiceIcon(service.labels?.type)}
                                        </div>
                                        <Badge variant="outline" className="capitalize">
                                            {service.labels?.type}
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
                                            services={filteredServices}
                                        />
                                    </div>
                                </div>
                            </CardTitle>
                            <CardDescription className="truncate">{service.name}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1">
                                <PortsBadgeList ports={service.ports} />
                                <Dependency dependsOn={service.dependsOn} />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
