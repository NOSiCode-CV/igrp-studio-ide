import {
    Database,
    FileArchive,
    Globe,
    IdCard,
    Layers,
    Server,
} from 'lucide-react';

export const getServiceIcon = (type: string) => {
    switch (type) {
        case 'database':
            return <Database className="h-4 w-4" />;
        case 'web':
            return <Globe className="h-4 w-4" />;
        case 'cache':
            return <Server className="h-4 w-4" />;
        case 'file':
            return <FileArchive className="h-4 w-4" />;
        case 'auth':
            return <IdCard className="h-4 w-4" />;
        default:
            return <Layers className="h-4 w-4" />;
    }
};

export const getServiceColor = (type: string) => {
    switch (type) {
        case 'database':
            return 'bg-amber-500';
        case 'web':
            return 'bg-blue-500';
        case 'cache':
            return 'bg-purple-500';
        case 'file':
            return 'bg-red-500';
        default:
            return 'bg-muted';
    }
};

export const getStatusColor = (status: string) => {
    switch (status) {
        case 'running':
            return 'bg-green-500 text-white';
        case 'stopped':
            return 'bg-gray-500 text-white';
        case 'error':
            return 'bg-red-500 text-white';
        default:
            return 'bg-yellow-500 text-white';
    }
};

// Network types
export const networkTypes = [
    { id: 'bridge', name: 'Bridge' },
    { id: 'host', name: 'Host' },
    { id: 'none', name: 'None' },
    { id: 'overlay', name: 'Overlay' },
];

export const serviceTypes = [
    { value: 'database', label: 'Database' },
    { value: 'cache', label: 'Cache' },
    { value: 'web', label: 'Web Server' },
    { value: 'api', label: 'API' },
    { value: 'queue', label: 'Queue' },
    { value: 'file', label: 'File' },
    { value: 'auth', label: 'Auth' },
    { value: 'observability', label: 'Observability' },
    { value: 'messaging', label: 'Messaging' },
    { value: 'other', label: 'Other' },
];
