import {
    Compass,
    Database,
    FileArchive,
    Globe,
    HardDrive,
    Layers,
    Server,
    Shield,
    Workflow
} from 'lucide-react'
import type { JSX } from 'react'

// Service type color map
const serviceColorMap: Record<string, string> = {
    database: 'bg-amber-500',
    web: 'bg-blue-500',
    cache: 'bg-purple-500',
    storage: 'bg-orange-500',
    file: 'bg-red-500',
    auth: 'bg-red-500',
    'service-discovery': 'bg-indigo-500',
    proxy: 'bg-teal-500'
}

export const getServiceIcon = (type: string): JSX.Element => {
    switch (type) {
        case 'database':
            return <Database className="h-4 w-4" />
        case 'web':
            return <Globe className="h-4 w-4" />
        case 'cache':
            return <Server className="h-4 w-4" />
        case 'storage':
            return <HardDrive className="h-4 w-4" />
        case 'file':
            return <FileArchive className="h-4 w-4" />
        case 'auth':
            return <Shield className="h-4 w-4" />
        case 'service-discovery':
            return <Compass className="h-4 w-4" />
        case 'proxy':
            return <Workflow className="h-4 w-4" />
        default:
            return <Layers className="h-4 w-4" />
    }
}

export const getServiceColor = (type: string): string => {
    return serviceColorMap[type] || 'bg-muted'
}

export const getStatusColor = (status: string): string => {
    const statusColorMap: Record<string, string> = {
        running: 'bg-green-500 text-white',
        stopped: 'bg-gray-500 text-white',
        error: 'bg-red-500 text-white'
    }
    return statusColorMap[status] || 'bg-yellow-500 text-white'
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
        monitoring: ['observability', 'messaging']
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
