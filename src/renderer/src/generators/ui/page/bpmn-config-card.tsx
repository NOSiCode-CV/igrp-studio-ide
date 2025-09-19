import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@renderer/components/ui/card';
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@renderer/components/ui/dropdown-menu';
import { Switch } from '@renderer/components/ui/switch';
import { Label } from '@renderer/components/ui/label';
import { 
    Settings, 
    TestTube, 
    Trash2, 
    Edit, 
    ExternalLink,
    Clock,
    Calendar,
    MoreHorizontal
} from 'lucide-react';
import { BPMNConfig } from 'src/main/types';

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

    

    const handleTestConnection = async () => {
        setIsTesting(true);
        try {
            await onTestConnection(config);
        } finally {
            setIsTesting(false);
        }
    };

    const handleToggleActive = async () => {
        setIsToggling(true);
        try {
            await onToggleActive(config.id, !isActive);
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
        <Card className={`transition-all duration-200 hover:shadow-md ${!isActive ? 'opacity-60' : ''}`}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-lg">{config.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center space-x-2">
                            <Switch
                                id={`active-${config.id}`}
                                checked={isActive}
                                onCheckedChange={handleToggleActive}
                                disabled={isToggling}
                            />
                            <Label htmlFor={`active-${config.id}`} className="text-xs">
                                Active
                            </Label>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <IGRPButtonPrimitive variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                </IGRPButtonPrimitive>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-40">
                                <DropdownMenuItem onClick={() => onEdit(config)}>
                                    <Edit className="h-3 w-3 mr-2" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleTestConnection} disabled={isTesting}>
                                    <TestTube className="h-3 w-3 mr-2" /> {isTesting ? 'Testing...' : 'Test'}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => window.open(config.apiUrl, '_blank')}>
                                    <ExternalLink className="h-3 w-3 mr-2" /> Open
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => onDelete(config.id)}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <Trash2 className="h-3 w-3 mr-2" /> Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
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

            <CardFooter className="pt-0" />
        </Card>
    );
}; 