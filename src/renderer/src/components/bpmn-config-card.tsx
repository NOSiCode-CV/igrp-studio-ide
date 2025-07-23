import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@renderer/components/ui/card';
import { Badge } from '@renderer/components/ui/badge';
import { Button } from '@renderer/components/ui/button';
import { Switch } from '@renderer/components/ui/switch';
import { Label } from '@renderer/components/ui/label';
import { 
    Settings, 
    TestTube, 
    Trash2, 
    Edit, 
    ExternalLink, 
    Wifi, 
    WifiOff, 
    AlertCircle,
    Clock,
    Calendar
} from 'lucide-react';
import { BPMNConfig } from 'src/main/types';
import { toast } from 'sonner';
import { bpmnService } from '@renderer/services/bpmn-service';

interface BPMNConfigCardProps {
    config: BPMNConfig;
    isActive: boolean;
    onEdit: (config: BPMNConfig) => void;
    onDelete: (configId: string) => void;
    onToggleActive: (configId: string, isActive: boolean) => void;
    onTestConnection: (config: BPMNConfig) => void;
}

export const BPMNConfigCard: React.FC<BPMNConfigCardProps> = ({
    config,
    isActive,
    onEdit,
    onDelete,
    onToggleActive,
    onTestConnection,
}) => {
    const [isTesting, setIsTesting] = React.useState(false);
    const [isToggling, setIsToggling] = React.useState(false);

    const getStatusIcon = () => {
        switch (config.status) {
            case 'connected':
                return <Wifi className="h-4 w-4 text-green-500" />;
            case 'disconnected':
                return <WifiOff className="h-4 w-4 text-gray-500" />;
            case 'error':
                return <AlertCircle className="h-4 w-4 text-red-500" />;
            default:
                return <WifiOff className="h-4 w-4 text-gray-500" />;
        }
    };

    const getStatusBadgeVariant = () => {
        switch (config.status) {
            case 'connected':
                return 'default';
            case 'disconnected':
                return 'secondary';
            case 'error':
                return 'destructive';
            default:
                return 'secondary';
        }
    };

    const getStatusText = () => {
        switch (config.status) {
            case 'connected':
                return 'Connected';
            case 'disconnected':
                return 'Disconnected';
            case 'error':
                return 'Error';
            default:
                return 'Unknown';
        }
    };

    const handleTestConnection = async () => {
        setIsTesting(true);
        try {
            const result = await bpmnService.testConnection(config);
            if (result.success) {
                toast.success('Connection test successful!');
            } else {
                toast.error(`Connection test failed: ${result.message}`);
            }
        } catch (error) {
            toast.error('Connection test failed');
        } finally {
            setIsTesting(false);
        }
    };

    const handleToggleActive = async () => {
        setIsToggling(true);
        try {
            await onToggleActive(config.id, !config.isActive);
        } finally {
            setIsToggling(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Card className={`transition-all duration-200 hover:shadow-md ${!config.isActive ? 'opacity-60' : ''}`}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-lg">{config.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                            {getStatusIcon()}
                            <Badge variant={getStatusBadgeVariant()}>
                                {getStatusText()}
                            </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id={`active-${config.id}`}
                                checked={config.isActive}
                                onCheckedChange={handleToggleActive}
                                disabled={isToggling}
                            />
                            <Label htmlFor={`active-${config.id}`} className="text-xs">
                                Active
                            </Label>
                        </div>
                    </div>
                </div>
                {config.description && (
                    <CardDescription className="mt-2">
                        {config.description}
                    </CardDescription>
                )}
            </CardHeader>

            <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-muted-foreground">API URL:</span>
                        <span className="text-right font-mono text-xs truncate max-w-[200px]" title={config.apiUrl}>
                            {config.apiUrl}
                        </span>
                    </div>
                    {config.basePath && (
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-muted-foreground">Base Path:</span>
                            <span className="text-right font-mono text-xs">
                                {config.basePath}
                            </span>
                        </div>
                    )}
                    {config.token && (
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-muted-foreground">Token:</span>
                            <span className="text-right font-mono text-xs">
                                {config.token.substring(0, 8)}...
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Created: {formatDate(config.createdAt)}</span>
                    </div>
                    {config.lastConnected && (
                        <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Last: {formatDate(config.lastConnected)}</span>
                        </div>
                    )}
                </div>
            </CardContent>

            <CardFooter className="flex justify-between pt-3">
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(config)}
                        className="flex items-center gap-1"
                    >
                        <Edit className="h-3 w-3" />
                        Edit
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleTestConnection}
                        disabled={isTesting}
                        className="flex items-center gap-1"
                    >
                        <TestTube className="h-3 w-3" />
                        {isTesting ? 'Testing...' : 'Test'}
                    </Button>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(config.apiUrl, '_blank')}
                        className="flex items-center gap-1"
                    >
                        <ExternalLink className="h-3 w-3" />
                        Open
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(config.id)}
                        className="flex items-center gap-1 text-destructive hover:text-destructive"
                    >
                        <Trash2 className="h-3 w-3" />
                        Delete
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}; 