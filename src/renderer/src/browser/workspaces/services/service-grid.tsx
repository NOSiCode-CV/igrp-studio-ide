'use client'

import { Badge } from '@renderer/components/ui/badge'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DependencySummary } from '../components/dependency'
import {
    filterServicesByCategory,
    filterServicesBySearch,
    getServiceColor,
    getServiceIcon,
    getServiceStatusText,
    getStatusColor,
    getStatusDotColor,
    resolveServiceVisualType
} from '.'
import { ServiceActions } from './service-actions'
import { ServiceFilter } from './service-filter'

interface ServiceGridProps {
    services: any[]
    workspaceId?: string
    showFilter?: boolean
    onActionComplete?: () => Promise<void> | void
}

export function ServiceGrid({ services, showFilter = true, onActionComplete }: ServiceGridProps) {
    const { t } = useTranslation()
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
                {filteredServices.map((service, index) => {
                    const visualType = resolveServiceVisualType(service)
                    const serviceTypeLabel =
                        service.labels?.type || (visualType !== 'other' ? visualType : t('type'))

                    return (
                        <div
                            key={index}
                            className="group relative overflow-visible rounded-lg border bg-card transition-all duration-200 hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-black/25"
                        >
                            <div className="relative z-10 flex items-start justify-between gap-2 border-b px-3 py-3">
                                <div className="flex min-w-0 items-center gap-2">
                                    <span
                                        className={`h-1.5 w-1.5 rounded-full ${getStatusDotColor(
                                            service.status
                                        )}`}
                                    />
                                    <div
                                        className={`${getServiceColor(visualType)} rounded-sm p-1 text-white transition-all duration-200 group-hover:-translate-y-0.5 group-hover:scale-110 group-hover:shadow-sm`}
                                    >
                                        {getServiceIcon(visualType)}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="truncate text-sm font-semibold text-foreground transition-colors duration-200 group-hover:text-primary dark:group-hover:text-primary">
                                            {service.name}
                                        </div>
                                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                            {serviceTypeLabel}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Badge
                                        variant="outline"
                                        className={`border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getStatusColor(
                                            service.status
                                        )}`}
                                    >
                                        <span
                                            className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${getStatusDotColor(
                                                service.status
                                            )}`}
                                        />
                                        {getServiceStatusText(service.status)}
                                    </Badge>
                                    <ServiceActions
                                        service={service}
                                        services={filteredServices}
                                        onActionComplete={onActionComplete}
                                    />
                                </div>
                            </div>

                            <div className="relative z-10 px-3 py-3">
                                <div className="rounded-lg bg-card p-2.5 transition-colors duration-200 group-hover:bg-card">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="min-w-0">
                                            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                {t('ports')}
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {service.ports && service.ports.length > 0 ? (
                                                    service.ports.map((port: string, i: number) => (
                                                        <Badge
                                                            key={i}
                                                            variant="outline"
                                                            className="border bg-card text-[10px] text-muted-foreground"
                                                        >
                                                            {port}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <span className="text-[11px] text-muted-foreground">
                                                        {t('none')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="min-w-0">
                                            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                {t('dependencies')}
                                            </div>
                                            <DependencySummary dependsOn={service.dependsOn} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
