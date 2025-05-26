'use client';

import {
    SidebarContent,
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@renderer/components/ui/sidebar';
import {
    ChevronRight,
    Loader2,
    LucideWebhook,
    Workflow,
    AlertCircle,
} from 'lucide-react';
import { EmptyList } from '@renderer/components/empty-list';
import { Button } from '@renderer/components/ui/button';
import { useEffect, useState } from 'react';
import useCore from '@renderer/hooks/use-core';
import useToast from '@renderer/hooks/useToast';

interface Webhook {
    id: string;
    path: string;
    method?: string;
}

interface ApplogicItem {
    id: string;
    name: string;
    webhooks: Webhook[];
}

const SidebarAppLogic = ({ searchTerm = '' }: { searchTerm?: string }) => {
    const { fetchData } = useCore();
    const [applogics, setApplogics] = useState<ApplogicItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedApplogics, setExpandedApplogics] = useState<string[]>([]);
    const [retryCount, setRetryCount] = useState(0);
    const { showErrorToast } = useToast();

    const endpoint = import.meta.env.VITE_APPLOGIC_API_URL;
    const apiKey = import.meta.env.VITE__APPLOGIC_API_KEY;
    const appCode = import.meta.env.VITE__APP_CODE || 'APP_GPO';

    const filteredApplogics = applogics.filter((workflow) =>
        workflow.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getMethodColor = (method = 'GET') => {
        const colors = {
            POST: 'bg-green-100 text-green-800',
            PUT: 'bg-blue-100 text-blue-800',
            DELETE: 'bg-red-100 text-red-800',
            PATCH: 'bg-yellow-100 text-yellow-800',
            GET: 'bg-purple-100 text-purple-800',
        };
        return colors[method.toUpperCase()] || colors['GET'];
    };

    useEffect(() => {
        const fetchApplogics = async () => {
            setLoading(true);
            setError(null);

            try {
                console.log(
                    `Fetching applogics: ${endpoint}/${appCode}/endpoints`
                );

                const headers = {
                    'Content-Type': 'application/json',
                    ...(apiKey && { 'API-KEY': apiKey }),
                };

                const { result, error } = await fetchData(
                    `${endpoint}/${appCode}/endpoints`,
                    headers
                );
                console.log(result);
                if (error) {
                    showErrorToast(error);
                    throw new Error('Failed to fetch applogics: ' + error);
                }
                if (!Array.isArray(result))
                    throw new Error('Invalid API response format');

                const processedApplogics = result.map((item) => ({
                    id: String(item.id) || item.applogicId,
                    name: item.name + (item.tag ? ` (${item.tag})` : ''),
                    webhooks: Array.isArray(item.nodes)
                        ? item.nodes.map((node) => ({
                              id: node.resourceId || '',
                              path: node.path || '',
                              method: node.method,
                          }))
                        : [],
                }));

                setApplogics(processedApplogics);
            } catch (err) {
                console.error('Error fetching applogics:', err);
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        };

        fetchApplogics();
    }, [fetchData, endpoint, apiKey, appCode, retryCount]);

    const toggleWorkflow = (workflowId: string) => {
        setExpandedApplogics((prev) =>
            prev.includes(workflowId)
                ? prev.filter((id) => id !== workflowId)
                : [...prev, workflowId]
        );
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-8 h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-sm text-muted-foreground">
                    Loading applogics...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4">
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 mb-4">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                        <div>
                            <h3 className="font-medium text-destructive">
                                Error loading applogics
                            </h3>
                            <p className="text-sm text-destructive/80 mt-1">
                                {error}
                            </p>
                        </div>
                    </div>
                </div>
                <Button
                    onClick={() => setRetryCount((prev) => prev + 1)}
                    className="w-full"
                    variant="outline"
                >
                    Retry
                </Button>
            </div>
        );
    }

    if (filteredApplogics.length === 0) {
        return (
            <EmptyList
                title={
                    searchTerm ? 'No applogics found' : 'No applogics available'
                }
                description={
                    searchTerm
                        ? `No applogics matching "${searchTerm}"`
                        : 'No applogics available for this application'
                }
                icon={<Workflow className="h-12 w-12" />}
            />
        );
    }

    return (
        <SidebarContent>
            <SidebarGroup>
                <SidebarMenu>
                    {filteredApplogics.map((workflow) => (
                        <SidebarMenuItem key={workflow.id}>
                            <SidebarMenuButton
                                onClick={() => toggleWorkflow(workflow.id)}
                                className="flex justify-between w-full"
                            >
                                <div className="flex items-center gap-2">
                                    <Workflow className="h-4 w-4" />
                                    <span>{workflow.name}</span>
                                </div>
                                <div className="flex items-center">
                                    <span className="mr-2 text-xs text-muted-foreground">
                                        {workflow.webhooks.length}
                                    </span>
                                    <ChevronRight
                                        className={`h-4 w-4 transition-transform ${
                                            expandedApplogics.includes(
                                                workflow.id
                                            )
                                                ? 'rotate-90'
                                                : ''
                                        }`}
                                    />
                                </div>
                            </SidebarMenuButton>

                            {expandedApplogics.includes(workflow.id) && (
                                <SidebarMenuSub>
                                    {workflow.webhooks.length > 0 ? (
                                        workflow.webhooks.map(
                                            (webhook, index) => (
                                                <SidebarMenuSubItem
                                                    key={`${webhook.id}-${index}`}
                                                >
                                                    <SidebarMenuSubButton className="flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <LucideWebhook className="h-3.5 w-3.5" />
                                                            <span>
                                                                {webhook.path}
                                                            </span>
                                                        </div>
                                                        {webhook.method && (
                                                            <span
                                                                className={`px-1.5 py-0.5 text-[10px] rounded-full ${getMethodColor(webhook.method)}`}
                                                            >
                                                                {webhook.method}
                                                            </span>
                                                        )}
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            )
                                        )
                                    ) : (
                                        <SidebarMenuSubItem>
                                            <div className="py-2 px-2 text-sm text-muted-foreground">
                                                No webhooks available
                                            </div>
                                        </SidebarMenuSubItem>
                                    )}
                                </SidebarMenuSub>
                            )}
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroup>
        </SidebarContent>
    );
};

export { SidebarAppLogic };
