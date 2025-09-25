'use client';
import { useState } from 'react';
import {
    IGRPCardPrimitive,
    IGRPCardContentPrimitive,
    IGRPCardHeaderPrimitive,
    IGRPCardTitlePrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { IGRPBadge } from '@igrp/igrp-framework-react-design-system';
import { IGRPInputPrimitive } from '@igrp/igrp-framework-react-design-system';
import {
    IGRPDialogPrimitive,
    IGRPDialogContentPrimitive,
    IGRPDialogHeaderPrimitive,
    IGRPDialogTitlePrimitive,
    IGRPDialogTriggerPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import {
    IGRPDropdownMenuPrimitive,
    IGRPDropdownMenuContentPrimitive,
    IGRPDropdownMenuItemPrimitive,
    IGRPDropdownMenuTriggerPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import {
    Plus,
    MoreHorizontal,
    Trash2,
    Edit,
    Globe,
    Server,
    Search,
    TestTube,
    Copy,
    Eye,
    EyeOff,
    Download,
    Loader2,
    CheckCircle,
    XCircle,
    AlertCircle,
    Key,
    Loader,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppLogic } from '@renderer/hooks/use-app-logic';
import { EnvironmentForm } from './components/environment-form';
import type { AppLogicEnvironment } from 'src/main/types';
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';

export default function AppLogicPage() {
    const {
        environments,
        loading,
        error,
        createEnvironment,
        updateEnvironment,
        deleteEnvironment,
        testEnvironment,
        searchEnvironments,
        exportEnvironments,
    } = useAppLogic();

    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [editingEnvironment, setEditingEnvironment] =
        useState<AppLogicEnvironment | null>(null);
    const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
    const [testingEnvironments, setTestingEnvironments] = useState<Set<string>>(
        new Set()
    );
    const filteredEnvironments = searchTerm
        ? searchEnvironments(searchTerm)
        : environments;

    const getStatusIcon = (status: AppLogicEnvironment['status']) => {
        switch (status) {
            case 'connected':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'disconnected':
                return <XCircle className="h-4 w-4 text-gray-500" />;
            case 'testing':
                return (
                    <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />
                );
            case 'error':
                return <AlertCircle className="h-4 w-4 text-red-500" />;
            default:
                return <XCircle className="h-4 w-4 text-gray-500" />;
        }
    };

    const handleCreateEnvironment = async (
        data: Omit<AppLogicEnvironment, 'id' | 'status' | 'createdAt'>
    ) => {
        const result = await createEnvironment(data);
        if (result) {
            setIsCreateDialogOpen(false);
        }
    };

    const handleEditEnvironment = async (
        data: Omit<AppLogicEnvironment, 'id' | 'status' | 'createdAt'>
    ) => {
        if (!editingEnvironment) return;
        const success = await updateEnvironment(editingEnvironment.id, data);
        if (success) {
            setEditingEnvironment(null);
        }
    };

    const handleDeleteEnvironment = async (id: string) => {
        if (confirm('Are you sure you want to delete this environment?')) {
            await deleteEnvironment(id);
        }
    };

    const handleTestEnvironment = async (id: string) => {
        setTestingEnvironments((prev) => new Set(prev).add(id));
        try {
            await testEnvironment(id);
        } finally {
            setTestingEnvironments((prev) => {
                const newSet = new Set(prev);
                newSet.delete(id);
                return newSet;
            });
        }
    };

    const toggleApiKeyVisibility = (id: string) => {
        setShowApiKeys((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const copyApiKey = (apiKey: string) => {
        navigator.clipboard.writeText(apiKey);
        toast.success('API Key copied to clipboard!');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                        Failed to load environments
                    </h3>
                    <p className="text-muted-foreground">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">
                        App Logic Environments
                    </h1>
                    <p className="text-muted-foreground">
                        Manage your API environments
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <IGRPButtonPrimitive
                        variant="outline"
                        onClick={exportEnvironments}
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </IGRPButtonPrimitive>
                    <IGRPDialogPrimitive
                        open={isCreateDialogOpen}
                        onOpenChange={setIsCreateDialogOpen}
                    >
                        <IGRPDialogTriggerPrimitive asChild>
                            <IGRPButtonPrimitive variant={'default'}>
                                <Plus className="h-4 w-4 mr-2" />
                                New Environment
                            </IGRPButtonPrimitive>
                        </IGRPDialogTriggerPrimitive>
                        <IGRPDialogContentPrimitive
                            onInteractOutside={(e) => e.preventDefault()}
                            onEscapeKeyDown={(e) => e.preventDefault()}
                            className="max-w-2xl max-h-[90vh] overflow-y-auto"
                        >
                            <IGRPDialogHeaderPrimitive>
                                <IGRPDialogTitlePrimitive>
                                    Create New Environment
                                </IGRPDialogTitlePrimitive>
                            </IGRPDialogHeaderPrimitive>
                            <EnvironmentForm
                                onSubmit={handleCreateEnvironment}
                                onCancel={() => setIsCreateDialogOpen(false)}
                            />
                        </IGRPDialogContentPrimitive>
                    </IGRPDialogPrimitive>
                </div>
            </div>

            {/* Search */}
            <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <IGRPInputPrimitive
                    placeholder="Search environments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Environments Grid */}
            {filteredEnvironments.length === 0 ? (
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Server className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">
                        No environments found
                    </h3>
                    <p className="text-muted-foreground mb-4">
                        {searchTerm
                            ? 'Try adjusting your search terms'
                            : 'Start by creating your first API environment'}
                    </p>
                    {!searchTerm && (
                        <IGRPButtonPrimitive
                            onClick={() => setIsCreateDialogOpen(true)}
                            variant={'default'}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Environment
                        </IGRPButtonPrimitive>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredEnvironments.map((environment) => (
                        <IGRPCardPrimitive
                            key={environment.id}
                            className="relative group hover:shadow-md transition-shadow"
                        >
                            <IGRPCardHeaderPrimitive className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        {getStatusIcon(environment.status)}
                                        <IGRPCardTitlePrimitive className="text-lg">
                                            {environment.name}
                                        </IGRPCardTitlePrimitive>
                                    </div>
                                    <IGRPDropdownMenuPrimitive>
                                        <IGRPDropdownMenuTriggerPrimitive
                                            asChild
                                        >
                                            <IGRPButtonPrimitive
                                                variant="ghost"
                                                size="sm"
                                                className="opacity-0 group-hover:opacity-100"
                                            >
                                                <MoreHorizontal className="h-4 w-4" />
                                            </IGRPButtonPrimitive>
                                        </IGRPDropdownMenuTriggerPrimitive>
                                        <IGRPDropdownMenuContentPrimitive align="end">
                                            <IGRPDropdownMenuItemPrimitive
                                                onClick={() =>
                                                    handleTestEnvironment(
                                                        environment.id
                                                    )
                                                }
                                                disabled={testingEnvironments.has(
                                                    environment.id
                                                )}
                                            >
                                                <TestTube className="h-4 w-4 mr-2" />
                                                Test Connection
                                            </IGRPDropdownMenuItemPrimitive>
                                            <IGRPDropdownMenuItemPrimitive
                                                onClick={() =>
                                                    setEditingEnvironment(
                                                        environment
                                                    )
                                                }
                                            >
                                                <Edit className="h-4 w-4 mr-2" />
                                                Edit
                                            </IGRPDropdownMenuItemPrimitive>
                                            <IGRPDropdownMenuItemPrimitive
                                                className="text-red-600"
                                                onClick={() =>
                                                    handleDeleteEnvironment(
                                                        environment.id
                                                    )
                                                }
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete
                                            </IGRPDropdownMenuItemPrimitive>
                                        </IGRPDropdownMenuContentPrimitive>
                                    </IGRPDropdownMenuPrimitive>
                                </div>
                                <IGRPBadge variant="outline" className="w-fit">
                                    {environment.status}
                                </IGRPBadge>
                            </IGRPCardHeaderPrimitive>
                            <IGRPCardContentPrimitive>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Globe className="h-4 w-4" />
                                        <span className="truncate">
                                            {environment.url}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm">
                                        <Key className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">
                                            API Key:
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <span className="font-mono text-xs truncate max-w-[160px]">
                                                {showApiKeys[environment.id]
                                                    ? environment.apiKey
                                                    : '••••••••••••••••'}
                                            </span>
                                            <IGRPButtonPrimitive
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    toggleApiKeyVisibility(
                                                        environment.id
                                                    )
                                                }
                                                className="h-6 w-6 p-0"
                                            >
                                                {showApiKeys[environment.id] ? (
                                                    <EyeOff className="h-3 w-3" />
                                                ) : (
                                                    <Eye className="h-3 w-3" />
                                                )}
                                            </IGRPButtonPrimitive>
                                            <IGRPButtonPrimitive
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    copyApiKey(
                                                        environment.apiKey
                                                    )
                                                }
                                                className="h-6 w-6 p-0"
                                            >
                                                <Copy className="h-3 w-3" />
                                            </IGRPButtonPrimitive>
                                        </div>
                                    </div>

                                    {environment.description && (
                                        <p className="text-sm text-muted-foreground">
                                            {environment.description}
                                        </p>
                                    )}

                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>
                                            Created:{' '}
                                            {new Date(
                                                environment.createdAt
                                            ).toLocaleDateString()}
                                        </span>
                                        {environment.lastTested && (
                                            <span>
                                                Last tested:{' '}
                                                {new Date(
                                                    environment.lastTested
                                                ).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </IGRPCardContentPrimitive>
                        </IGRPCardPrimitive>
                    ))}
                </div>
            )}

            {/* Edit Dialog */}
            <IGRPDialogPrimitive
                open={!!editingEnvironment}
                onOpenChange={() => setEditingEnvironment(null)}
            >
                <IGRPDialogContentPrimitive className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <IGRPDialogHeaderPrimitive>
                        <IGRPDialogTitlePrimitive>
                            Edit Environment
                        </IGRPDialogTitlePrimitive>
                    </IGRPDialogHeaderPrimitive>
                    {editingEnvironment && (
                        <EnvironmentForm
                            environment={editingEnvironment}
                            onSubmit={handleEditEnvironment}
                            onCancel={() => setEditingEnvironment(null)}
                        />
                    )}
                </IGRPDialogContentPrimitive>
            </IGRPDialogPrimitive>
        </div>
    );
}
