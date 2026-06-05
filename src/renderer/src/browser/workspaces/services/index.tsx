import {
    Compass,
    Database,
    Globe,
    HardDrive,
    Layers,
    Server,
    Shield,
    Stethoscope,
    Workflow
} from 'lucide-react'
import type { JSX } from 'react'

type NormalizedServiceStatus = 'running' | 'stopped' | 'error' | 'neutral'

interface ServiceVisualTarget {
    name?: string
    container_name?: string
    image?: string
    labels?: Record<string, string>
}

// Service type color map
const serviceColorMap: Record<string, string> = {
    database: 'bg-amber-500',
    web: 'bg-blue-500',
    api: 'bg-blue-500',
    cache: 'bg-purple-500',
    storage: 'bg-orange-500',
    file: 'bg-orange-500',
    auth: 'bg-red-500',
    'service-discovery': 'bg-indigo-500',
    discovery: 'bg-indigo-500',
    proxy: 'bg-teal-500',
    observability: 'bg-fuchsia-500',
    monitoring: 'bg-fuchsia-500',
    'init-task': 'bg-teal-500',
    init_task: 'bg-teal-500'
}

const monitoringServiceHints = [
    'prometheus',
    'tempo',
    'grafana',
    'loki',
    'jaeger',
    'zipkin',
    'otel',
    'opentelemetry',
    'alertmanager',
    'node-exporter',
    'cadvisor',
    'kibana',
    'elasticsearch',
    'fluentd',
    'fluent-bit'
]

const workflowServiceHints = ['init-task', 'init_task']

export const resolveServiceVisualType = (
    serviceOrType?: ServiceVisualTarget | string | null
): string => {
    if (!serviceOrType) return 'other'

    if (typeof serviceOrType === 'string') {
        const normalizedType = serviceOrType.toLowerCase().trim()
        return normalizedType || 'other'
    }

    const explicitType = (serviceOrType.labels?.type || '').toLowerCase().trim()
    if (explicitType) return explicitType

    const fingerprint = [
        serviceOrType.name,
        serviceOrType.container_name,
        serviceOrType.image
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

    if (!fingerprint) return 'other'

    if (workflowServiceHints.some((hint) => fingerprint.includes(hint))) {
        return 'proxy'
    }

    if (monitoringServiceHints.some((hint) => fingerprint.includes(hint))) {
        return 'observability'
    }

    return 'other'
}

export const getServiceIcon = (type: string): JSX.Element => {
    const normalizedType = (type || '').toLowerCase().trim()
    switch (normalizedType) {
        case 'database':
            return <Database className="h-4 w-4" />
        case 'web':
            return <Globe className="h-4 w-4" />
        case 'api':
            return <Server className="h-4 w-4" />
        case 'cache':
            return <Server className="h-4 w-4" />
        case 'storage':
            return <HardDrive className="h-4 w-4" />
        case 'file':
            return <HardDrive className="h-4 w-4" />
        case 'auth':
            return <Shield className="h-4 w-4" />
        case 'service-discovery':
        case 'discovery':
            return <Compass className="h-4 w-4" />
        case 'proxy':
        case 'init-task':
        case 'init_task':
            return <Workflow className="h-4 w-4" />
        case 'observability':
        case 'monitoring':
        case 'messaging':
            return <Stethoscope className="h-4 w-4" />
        default:
            return <Layers className="h-4 w-4" />
    }
}

export const getServiceColor = (type: string): string => {
    const normalizedType = (type || '').toLowerCase().trim()
    return serviceColorMap[normalizedType] || 'bg-muted'
}

export const normalizeServiceStatus = (status: string): NormalizedServiceStatus => {
    const value = (status || '').toLowerCase().trim()
    if (value === 'running') return 'running'
    if (value === 'error') return 'error'
    if (
        value === 'stopped' ||
        value === 'exited' ||
        value === 'dead' ||
        value === 'created' ||
        value === 'removing'
    ) {
        return 'stopped'
    }
    return 'neutral'
}

export const getServiceStatusText = (status: string): string => {
    const normalized = normalizeServiceStatus(status)
    if (normalized === 'running') return 'running'
    if (normalized === 'error') return 'error'
    if (normalized === 'stopped') return 'stopped'
    return status || 'unknown'
}

export const getStatusColor = (status: string): string => {
    const normalized = normalizeServiceStatus(status)
    if (normalized === 'running') {
        return 'bg-emerald-50/50 border-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800/70 dark:text-emerald-300'
    }
    if (normalized === 'error') {
        return 'bg-rose-50/50 border-rose-100 text-rose-700 dark:bg-rose-900/30 dark:border-rose-800/70 dark:text-rose-300'
    }
    return 'bg-slate-50/50 border-slate-100 text-slate-500 dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-300'
}

export const getStatusDotColor = (status: string): string => {
    const normalized = normalizeServiceStatus(status)
    if (normalized === 'running') {
        return 'bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.18)] animate-pulse'
    }
    if (normalized === 'error') {
        return 'bg-rose-500'
    }
    return 'bg-slate-300 dark:bg-slate-600'
}

// Network types
export const networkTypes = [
    { id: 'bridge', name: 'Bridge' },
    { id: 'host', name: 'Host' },
    { id: 'none', name: 'None' },
    { id: 'overlay', name: 'Overlay' }
]

export const serviceTypes = [
    { value: 'database', label: 'Database' },
    { value: 'cache', label: 'Cache' },
    { value: 'web', label: 'Web Server' },
    { value: 'api', label: 'API' },
    { value: 'queue', label: 'Queue' },
    { value: 'storage', label: 'Storage' },
    { value: 'file', label: 'File' },
    { value: 'auth', label: 'Auth' },
    { value: 'service-discovery', label: 'Service Discovery' },
    { value: 'proxy', label: 'Proxy' },
    { value: 'observability', label: 'Observability' },
    { value: 'monitoring', label: 'Monitoring' },
    { value: 'messaging', label: 'Messaging' },
    { value: 'other', label: 'Other' }
]

// Service filtering utilities
export const filterServicesByCategory = (services: any[], category: string): any[] => {
    if (category === 'all') return services

    const categoryTypeMap: Record<string, string[]> = {
        infrastructure: ['proxy', 'service-discovery', 'cache'],
        database: ['database'],
        web: ['web', 'api'],
        storage: ['storage', 'file'],
        security: ['auth'],
        monitoring: ['observability', 'monitoring', 'messaging']
    }

    const types = categoryTypeMap[category] || []
    return services.filter((service) => types.includes(service.labels?.type))
}

export const filterServicesBySearch = (services: any[], searchQuery: string): any[] => {
    if (!searchQuery.trim()) return services

    const query = searchQuery.toLowerCase()
    return services.filter(
        (service) =>
            service.name?.toLowerCase().includes(query) ||
            service.labels?.type?.toLowerCase().includes(query) ||
            service.container_name?.toLowerCase().includes(query)
    )
}

export const getServiceCountByCategory = (services: any[], category: string): number => {
    return filterServicesByCategory(services, category).length
}
