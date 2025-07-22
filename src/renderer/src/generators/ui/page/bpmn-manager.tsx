import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@renderer/components/ui/button';
import { Badge } from '@renderer/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@renderer/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@renderer/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs';
import { Plus, RefreshCw, Settings, Database, Play, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { BPMNConfig, BPMNProcessDefinition, BPMNPageDefinition } from 'src/main/types';
import { bpmnService } from '@renderer/services/bpmn-service';
import { bpmnMockService } from '@renderer/services/bpmn-mock-service';
import { BPMNConfigModal } from './bpmn-connection-modal';
import { BPMNProcessCard } from './bpmn-process-card';
import { BPMNConfigSwitcher } from './bpmn-config-switcher';
import { EmptyList } from '@renderer/components/empty-list';
import { SearchInput, SubHeadline } from '@renderer/components/shared-ui';
import AlertDialogDelete from '@renderer/components/alert-dialog-delete';

interface BPMNManagerProps {
    onPageClick?: (pageDefinition: BPMNPageDefinition) => void;
}

export const BPMNManager = ({ onPageClick }: BPMNManagerProps) => {
    const { t } = useTranslation();
    const [config, setConfig] = useState<BPMNConfig | null>(null);
    const [processDefinitions, setProcessDefinitions] = useState<BPMNProcessDefinition[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [editingConfig, setEditingConfig] = useState<BPMNConfig | undefined>();
    const [deleteConfig, setDeleteConfig] = useState<BPMNConfig | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const [useMockService, setUseMockService] = useState(true);

    // Get the appropriate service based on configuration
    const getService = () => {
        return useMockService ? bpmnMockService : bpmnService;
    };

    // Load initial data
    useEffect(() => {
        loadConfig();
    }, []);

    // Load process definitions when config changes
    useEffect(() => {
        if (config || useMockService) {
            loadProcessDefinitions();
        } else {
            setProcessDefinitions([]);
        }
    }, [config, useMockService]);

    const loadConfig = async () => {
        try {
            const currentConfig = await getService().getConfig();
            setConfig(currentConfig);
        } catch (error) {
            toast.error('Failed to load API configuration');
        }
    };

    const loadProcessDefinitions = async () => {
        try {
            setLoading(true);
            const processes = await getService().getProcessDefinitions();
            setProcessDefinitions(processes);
        } catch (error) {
            toast.error('Failed to load process definitions');
        } finally {
            setLoading(false);
        }
    };



    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await loadProcessDefinitions();
            toast.success('Process definitions refreshed');
        } catch (error) {
            toast.error('Failed to refresh process definitions');
        } finally {
            setRefreshing(false);
        }
    };

    const handleConfigSave = async () => {
        await loadConfig();
        setShowConfigModal(false);
        setEditingConfig(undefined);
    };

    const handleEditConfig = (currentConfig: BPMNConfig) => {
        setEditingConfig(currentConfig);
        setShowConfigModal(true);
    };

    const handleDeleteConfig = async () => {
        if (!deleteConfig) return;
        
        try {
            await getService().deleteConfig();
            setConfig(null);
            setProcessDefinitions([]);
            toast.success('API configuration deleted successfully');
        } catch (error) {
            toast.error('Failed to delete API configuration');
        } finally {
            setDeleteConfig(null);
        }
    };

    const handleEditProcess = async (process: BPMNProcessDefinition) => {
        try {
            // Create a temporary page definition for the studio (not saved to settings)
            const pageDefinition: BPMNPageDefinition = {
                id: `bpmn-${process.id}-${Date.now()}`, // Unique ID with timestamp
                processDefinitionId: process.id,
                processDefinitionKey: process.key,
                pageName: `${process.name} - BPMN Process`,
                pagePath: `/bpmn/${process.key}`,
                description: process.description,
                isStartPage: true,
                isTaskPage: false,
                content: {
                    type: 'bpmn-process',
                    processKey: process.key,
                    processName: process.name,
                    processId: process.id,
                    processVersion: process.version.toString(),
                    processCategory: process.category || 'General',
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            
            // Open the page directly in the studio (no saving to settings)
            onPageClick?.(pageDefinition);
            
            toast.success(`Opening ${process.name} in page builder`);
        } catch (error) {
            toast.error('Failed to open process in page builder', {
                description: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };

    const handleViewProcess = (process: BPMNProcessDefinition) => {
        // TODO: Implement process details view
        toast.info('Process details view coming soon');
    };


    const handleDownloadXML = async (process: BPMNProcessDefinition) => {
        try {
            const xml = await getService().getProcessDefinitionXML(process.id);
            
            // Create and download file
            const blob = new Blob([xml], { type: 'application/xml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${process.key}-v${process.version}.bpmn`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            toast.success('BPMN XML downloaded successfully');
        } catch (error) {
            toast.error('Failed to download BPMN XML');
        }
    };

    const handleConfigChange = () => {
        loadConfig();
        loadProcessDefinitions();
    };

    const filteredProcesses = processDefinitions.filter(process =>
        process.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        process.key.toLowerCase().includes(searchTerm.toLowerCase())
    );



    return (
        <div className="container mx-auto p-4 space-y-6">
            <div className="flex justify-between items-center">
                <SubHeadline
                    title="BPMN Process Manager"
                    description="Connect to BPMN REST API and manage process definitions"
                />
                <Button onClick={() => setShowConfigModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {config ? 'Edit Configuration' : 'Add Configuration'}
                </Button>
            </div>

            <Tabs defaultValue="processes" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="processes">Process Definitions</TabsTrigger>
                    <TabsTrigger value="configuration">API Configuration</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="processes" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <SearchInput
                                placeholder="Search processes..."
                                value={searchTerm}
                                onChange={setSearchTerm}
                                className="w-64"
                            />
                            {(config || useMockService) && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleRefresh}
                                    disabled={refreshing}
                                >
                                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                                    Refresh
                                </Button>
                            )}
                        </div>
                    </div>

                    {!config && !useMockService ? (
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-center space-y-4">
                                    <Database className="h-12 w-12 mx-auto text-muted-foreground" />
                                    <div>
                                        <h3 className="text-lg font-semibold">No API Configuration</h3>
                                        <p className="text-muted-foreground">
                                            Configure your BPMN REST API to view process definitions
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : filteredProcesses.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {filteredProcesses.map((process) => (
                                <BPMNProcessCard
                                    key={process.id}
                                    process={process}
                                    onEdit={handleEditProcess}
                                    onView={handleViewProcess}
                                    onDownloadXML={handleDownloadXML}
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyList
                            title="No process definitions found"
                            description="No processes found for the configured API. Try refreshing or check your API configuration."
                        />
                    )}
                </TabsContent>

                <TabsContent value="configuration" className="space-y-4">
                    {config ? (
                        <Card>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-lg">{config.name}</CardTitle>
                                        <CardDescription className="mt-1">
                                            {config.description || 'No description'}
                                        </CardDescription>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                <Settings className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEditConfig(config)}>
                                                <Edit className="h-4 w-4 mr-2" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                                onClick={() => setDeleteConfig(config)}
                                                className="text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Status:</span>
                                        <Badge variant={config.status === 'connected' ? 'default' : 'secondary'}>
                                            {config.status}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">API URL:</span>
                                        <span className="text-sm text-muted-foreground truncate max-w-32">
                                            {config.apiUrl}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Active:</span>
                                        <Badge variant={config.isActive ? 'default' : 'secondary'}>
                                            {config.isActive ? 'Yes' : 'No'}
                                        </Badge>
                                    </div>
                                    {config.lastConnected && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Last Connected:</span>
                                            <span className="text-sm text-muted-foreground">
                                                {new Date(config.lastConnected).toLocaleDateString()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <EmptyList
                            title="No API configuration"
                            description="Add your BPMN REST API configuration to get started with process management."
                        />
                    )}
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                    <BPMNConfigSwitcher onConfigChange={handleConfigChange} />
                </TabsContent>
            </Tabs>

            <BPMNConfigModal
                isOpen={showConfigModal}
                onClose={() => {
                    setShowConfigModal(false);
                    setEditingConfig(undefined);
                }}
                onConfirm={handleConfigSave}
                config={editingConfig}
            />

            <AlertDialogDelete
                isOpen={!!deleteConfig}
                onClose={() => setDeleteConfig(null)}
                onConfirm={handleDeleteConfig}
                hasTrigger={false}
                recordId={deleteConfig?.name}
            />


        </div>
    );
}; 