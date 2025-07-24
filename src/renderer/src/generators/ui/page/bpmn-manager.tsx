import { useEffect, useState } from 'react';
import { Button } from '@renderer/components/ui/button';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@renderer/components/ui/tabs';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
    BPMNConfig,
    BPMNConfigs,
    BPMNProcessDefinition,
    BPMNPageDefinition,
} from 'src/main/types';
import { bpmnService } from '@renderer/services/bpmn-service';
import { bpmnMockService } from '@renderer/services/bpmn-mock-service';
import { BPMNConfigModal } from './bpmn-connection-modal';
import { BPMNConfigSwitcher } from './bpmn-config-switcher';
import { EmptyList } from '@renderer/components/empty-list';
import { SubHeadline } from '@renderer/components/shared-ui';
import AlertDialogDelete from '@renderer/components/alert-dialog-delete';
import { BPMNProjectSelector } from './bpmn-project-selector';
import { BPMNConfigCard } from '@renderer/components/bpmn-config-card';

interface BPMNManagerProps {
    onPageClick?: (pageDefinition: BPMNPageDefinition) => void;
}

export const BPMNManager = ({ onPageClick }: BPMNManagerProps) => {
    const [configs, setConfigs] = useState<BPMNConfigs>({
        configs: [],
        activeConfigId: undefined,
    });
    const [activeConfig, setActiveConfig] = useState<BPMNConfig | null>(null);
    const [processDefinitions, setProcessDefinitions] = useState<
        BPMNProcessDefinition[]
    >([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [editingConfig, setEditingConfig] = useState<
        BPMNConfig | undefined
    >();
    const [deleteConfig, setDeleteConfig] = useState<BPMNConfig | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const [useMockService] = useState(true);

    // Get the appropriate service based on configuration
    const getService = () => {
        return useMockService ? bpmnMockService : bpmnService;
    };

    // Load initial data
    useEffect(() => {
        loadConfigs();
    }, []);

    // Load process definitions when active config changes
    useEffect(() => {
        if (activeConfig || useMockService) {
            loadProcessDefinitions();
        } else {
            setProcessDefinitions([]);
        }
    }, [activeConfig, useMockService]);

    const loadConfigs = async () => {
        try {
            const configsData =
                await window.igrpStudioSettings.getBPMNConfigs();
            console.log('configsData', configsData);
            setConfigs(configsData);

            // Set active config
            if (configsData.activeConfigId) {
                const active = configsData.configs.find(
                    (c: BPMNConfig) => c.id === configsData.activeConfigId
                );
                setActiveConfig(active || null);
            } else {
                setActiveConfig(null);
            }
        } catch (error) {
            toast.error('Failed to load API configurations');
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

    const handleConfigSave = async () => {
        await loadConfigs();
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
            await window.igrpStudioSettings.deleteBPMNConfig(deleteConfig.id);
            await loadConfigs();
            setProcessDefinitions([]);
            toast.success('API configuration deleted successfully');
        } catch (error) {
            toast.error('Failed to delete API configuration');
        } finally {
            setDeleteConfig(null);
        }
    };

    const handleConfigChange = () => {
        loadConfigs();
        loadProcessDefinitions();
    };

    return (
        <div className="container mx-auto p-4 space-y-6">
            <div className="flex justify-between items-center">
                <SubHeadline
                    title="BPMN Process Manager"
                    description="Connect to BPMN REST API and manage process definitions"
                />
                <Button onClick={() => setShowConfigModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Configuration
                </Button>
            </div>

            <Tabs defaultValue="projects" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="projects">Projects</TabsTrigger>
                    <TabsTrigger value="configuration">
                        API Configuration
                    </TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="projects" className="space-y-4">
                    <BPMNProjectSelector
                        onPageClick={onPageClick}
                        useMockService={useMockService}
                    />
                </TabsContent>

                <TabsContent value="configuration" className="space-y-4">
                    {configs.configs.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                             {configs.configs.map((config) => (
                                <BPMNConfigCard
                                    key={config.id}
                                    config={config}
                                    isActive={
                                        configs.activeConfigId === config.id
                                    }
                                    onEdit={handleEditConfig}
                                    onDelete={(configId) => {
                                        const config = configs.configs.find(c => c.id === configId);
                                        setDeleteConfig(config || null);
                                    }}
                                    onToggleActive={async (configId: string, isActive: boolean) => {
                                        try {
                                            if (isActive) {
                                                await window.igrpStudioSettings.setActiveBPMNConfig(configId);
                                            }
                                            await loadConfigs();
                                            toast.success(
                                                `Configuration ${isActive ? 'activated' : 'deactivated'} successfully`
                                            );
                                        } catch (error) {
                                            toast.error(
                                                'Failed to update configuration'
                                            );
                                        }
                                    }}
                                    onTestConnection={async (config: BPMNConfig) => {
                                        try {
                                            const result = await bpmnService.testConnection(config);
                                            if (result.success) {
                                                toast.success('Connection test successful!');
                                            } else {
                                                toast.error(`Connection test failed: ${result.message}`);
                                            }
                                        } catch (error) {
                                            toast.error('Connection test failed');
                                        }
                                    }}
                                />
                            ))} 
                        </div>
                    ) : (
                        <EmptyList
                            title="No API configurations"
                            description="Add your BPMN REST API configurations to get started with process management."
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
