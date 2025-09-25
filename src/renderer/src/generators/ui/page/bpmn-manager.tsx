import { useEffect, useState } from 'react';
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
import {
    IGRPTabsPrimitive,
    IGRPTabsContentPrimitive,
    IGRPTabsListPrimitive,
    IGRPTabsTriggerPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { BPMNConfig, BPMNConfigs, FileTree } from 'src/main/types';
import { bpmnService } from '@renderer/services/bpmn-service';
import { BPMNConfigModal } from './bpmn-connection-modal';
import { EmptyList } from '@renderer/components/empty-list';
import { SubHeadline } from '@renderer/components/shared-ui';
import AlertDialogDelete from '@renderer/components/alert-dialog-delete';
import { BPMNProjectSelector } from './bpmn-project-selector';
import { BPMNConfigCard } from '@renderer/generators/ui/page/bpmn-config-card';
import { PageDefinition } from './page-manager';

interface BPMNManagerProps {
    onPageClick?: (pageDefinition: PageDefinition) => void;
    bpmnProcesses: FileTree[];
    basePath: string;
}

export const BPMNManager = ({
    onPageClick,
    bpmnProcesses,
    basePath,
}: BPMNManagerProps) => {
    const [configs, setConfigs] = useState<BPMNConfigs>({
        configs: [],
        activeConfigId: undefined,
    });
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [editingConfig, setEditingConfig] = useState<
        BPMNConfig | undefined
    >();
    const [deleteConfig, setDeleteConfig] = useState<BPMNConfig | null>(null);

    const handleConfigSave = async () => {
        setShowConfigModal(false);
        setEditingConfig(undefined);
        // Clear BPMN service cache to force refresh
        bpmnService.clearConfig();
        // Reload configurations after save/update
        await loadConfigs();
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('bpmn-config-changed'));
    };

    const handleEditConfig = (currentConfig: BPMNConfig) => {
        setEditingConfig(currentConfig);
        setShowConfigModal(true);
    };

    const handleDeleteConfig = async () => {
        if (!deleteConfig) return;

        try {
            await window.igrpStudioSettings.deleteBPMNConfig(deleteConfig.id);
            // Clear BPMN service cache to force refresh
            bpmnService.clearConfig();
            // Reload configurations after delete
            await loadConfigs();
            // Dispatch custom event to notify other components
            window.dispatchEvent(new CustomEvent('bpmn-config-changed'));
            toast.success('API configuration deleted successfully');
        } catch (error) {
            toast.error('Failed to delete API configuration');
        } finally {
            setDeleteConfig(null);
        }
    };

    const loadConfigs = async () => {
        try {
            const configsData =
                await window.igrpStudioSettings.getBPMNConfigs();

            setConfigs(configsData);

            // Set active config
            /*  if (configsData.activeConfigId) {
                const active = configsData.configs.find(
                    (c: BPMNConfig) => c.id === configsData.activeConfigId
                );
                setActiveConfig(active || null);
            } else {
                console.log('No active config ID found');
                setActiveConfig(null);
            } */
        } catch (error) {
            toast.error('Failed to load API configurations');
        }
    };

    useEffect(() => {
        loadConfigs();
    }, []);

    return (
        <div className="container mx-auto p-4 space-y-6">
            <div className="flex justify-between items-center">
                <SubHeadline
                    title="BPMN Process Manager"
                    description="Connect to BPMN REST API and manage process definitions"
                />
                <IGRPButtonPrimitive
                    onClick={() => {
                        setEditingConfig(undefined);
                        setShowConfigModal(true);
                    }}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Configuration
                </IGRPButtonPrimitive>
            </div>

            <IGRPTabsPrimitive defaultValue="projects" className="space-y-4">
                <IGRPTabsListPrimitive>
                    <IGRPTabsTriggerPrimitive value="projects">
                        Projects
                    </IGRPTabsTriggerPrimitive>
                    <IGRPTabsTriggerPrimitive value="configuration">
                        API Configuration
                    </IGRPTabsTriggerPrimitive>
                </IGRPTabsListPrimitive>

                <IGRPTabsContentPrimitive
                    value="projects"
                    className="space-y-4"
                >
                    <BPMNProjectSelector
                        onPageClick={onPageClick}
                        bpmnProcesses={bpmnProcesses}
                        basePath={basePath}
                    />
                </IGRPTabsContentPrimitive>

                <IGRPTabsContentPrimitive
                    value="configuration"
                    className="space-y-4"
                >
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
                                        const config = configs.configs.find(
                                            (c) => c.id === configId
                                        );
                                        setDeleteConfig(config || null);
                                    }}
                                    onToggleActive={async (
                                        configId: string,
                                        isActive: boolean
                                    ) => {
                                        try {
                                            if (isActive) {
                                                await window.igrpStudioSettings.setActiveBPMNConfig(
                                                    configId
                                                );
                                            } else {
                                                // If deactivating, set no active config
                                                await window.igrpStudioSettings.setActiveBPMNConfig(
                                                    ''
                                                );
                                            }
                                            // Clear BPMN service cache to force refresh
                                            bpmnService.clearConfig();
                                            // Reload configurations to reflect changes
                                            await loadConfigs();
                                            // Dispatch custom event to notify other components
                                            window.dispatchEvent(
                                                new CustomEvent(
                                                    'bpmn-config-changed'
                                                )
                                            );
                                            toast.success(
                                                `Configuration ${isActive ? 'activated' : 'deactivated'} successfully`
                                            );
                                        } catch (error) {
                                            toast.error(
                                                'Failed to update configuration'
                                            );
                                        }
                                    }}
                                    onTestConnection={async (
                                        config: BPMNConfig
                                    ) => {
                                        try {
                                            const result =
                                                await bpmnService.testConnection(
                                                    config
                                                );
                                            if (result.success) {
                                                toast.success(
                                                    'Connection test successful!'
                                                );
                                            } else {
                                                toast.error(
                                                    `Connection test failed: ${result.message}`
                                                );
                                            }
                                        } catch (error) {
                                            toast.error(
                                                'Connection test failed'
                                            );
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
                </IGRPTabsContentPrimitive>
            </IGRPTabsPrimitive>

            <BPMNConfigModal
                key={`${editingConfig?.id || 'new'}-${showConfigModal ? 'open' : 'closed'}`}
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
