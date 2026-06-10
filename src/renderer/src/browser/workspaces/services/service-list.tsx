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

export const SERVICE_LIST_GRID = '1.5fr 1fr 1fr 80px 36px'

interface ServiceListProps {
    services: any[]
    workspaceId?: string
    showFilter?: boolean
    showHeader?: boolean
    stickyHeader?: boolean
    onActionComplete?: () => Promise<void> | void
}

export function ServiceList({
    services,
    showFilter = true,
    showHeader = true,
    stickyHeader = false,
    onActionComplete
}: ServiceListProps) {
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

            {/* Services Table */}
            <div className="w-full overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                {showHeader ? (
                    <div
                        className={`grid items-center gap-3 border-b border-slate-200 bg-slate-50/70 p-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400 ${
                            stickyHeader ? 'sticky top-0 z-20' : ''
                        }`}
                        style={{ gridTemplateColumns: SERVICE_LIST_GRID }}
                    >
                        <div>{t('name')}</div>
                        <div>{t('ports')}</div>
                        <div>{t('dependencies')}</div>
                        <div className="w-[80px]">{t('status')}</div>
                        <div className="w-[36px]" />
                    </div>
                ) : null}

                {/* Body */}
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredServices.map((service, index) => {
                        const visualType = resolveServiceVisualType(service)
                        const serviceTypeLabel =
                            service.labels?.type ||
                            (visualType !== 'other' ? visualType : t('type'))

                        return (
                            <div
                                key={index}
                                className="group grid cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                                style={{ gridTemplateColumns: SERVICE_LIST_GRID }}
                            >
                                <div className="min-w-0 font-medium">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`h-1.5 w-1.5 rounded-full ${getStatusDotColor(
                                                service.status
                                            )}`}
                                        />
                                        <div
                                            className={`${getServiceColor(visualType)} rounded-sm p-1 text-white`}
                                        >
                                            {getServiceIcon(visualType)}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="truncate text-xs font-semibold text-slate-800 transition-colors duration-200 group-hover:text-primary dark:text-slate-100 dark:group-hover:text-primary">
                                                {service.name}
                                            </div>
                                            <div className="text-[11px] text-slate-500 capitalize dark:text-slate-400">
                                                {serviceTypeLabel}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="min-w-0">
                                    <div className="flex flex-wrap gap-1 overflow-hidden">
                                        {service.ports &&
                                            service.ports.map((port: string, i: number) => (
                                                <Badge
                                                    key={i}
                                                    variant="outline"
                                                    className="border-slate-200 bg-slate-50 text-[11px] text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                                >
                                                    {port}
                                                </Badge>
                                            ))}
                                        {(!service.ports || service.ports.length === 0) && (
                                            <span className="text-xs text-slate-400 dark:text-slate-500">
                                                {t('none')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="min-w-0">
                                    <DependencySummary dependsOn={service.dependsOn} />
                                </div>
                                <div className="w-[80px]">
                                    <Badge
                                        variant="outline"
                                        className={`w-fit border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getStatusColor(
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
                                </div>
                                <div
                                    className="flex w-[36px] items-center justify-end"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <ServiceActions
                                        service={service}
                                        services={filteredServices}
                                        onActionComplete={onActionComplete}
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
