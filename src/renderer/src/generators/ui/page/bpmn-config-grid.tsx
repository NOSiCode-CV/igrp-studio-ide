import React from 'react';
import { BPMNConfigCard } from './bpmn-config-card';
import { EmptyList } from '../../../components/empty-list';
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
import { Plus, Loader2 } from 'lucide-react';
import { BPMNConfig } from 'src/main/types';

interface BPMNConfigGridProps {
    configs: BPMNConfig[];
    activeConfigId?: string;
    isLoading?: boolean;
    onAddNew: () => void;
    onEdit: (config: BPMNConfig) => void;
    onDelete: (configId: string) => void;
    onToggleActive: (configId: string, isActive: boolean) => void;
    onTestConnection: (config: BPMNConfig) => void;
}

export const BPMNConfigGrid: React.FC<BPMNConfigGridProps> = ({
    configs,
    activeConfigId,
    isLoading = false,
    onAddNew,
    onEdit,
    onDelete,
    onToggleActive,
    onTestConnection,
}) => {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[200px]">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading BPMN configurations...</span>
                </div>
            </div>
        );
    }

    if (configs.length === 0) {
        return (
            <EmptyList
                icon="settings"
                title="No BPMN Configurations"
                description="Get started by adding your first BPMN API configuration to connect to your workflow engine."
                onAction={onAddNew}
            />
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">
                        BPMN Configurations
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Manage your BPMN API connections ({configs.length}{' '}
                        configuration{configs.length !== 1 ? 's' : ''})
                    </p>
                </div>
                <IGRPButtonPrimitive
                    onClick={onAddNew}
                    className="flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Add Configuration
                </IGRPButtonPrimitive>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {configs.map((config) => (
                    <BPMNConfigCard
                        key={config.id}
                        config={config}
                        isActive={activeConfigId === config.id}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onToggleActive={onToggleActive}
                        onTestConnection={onTestConnection}
                    />
                ))}
            </div>

            {configs.length > 0 && (
                <div className="text-center text-sm text-muted-foreground">
                    <p>
                        {configs.filter((c) => c.isActive).length} of{' '}
                        {configs.length} configuration
                        {configs.length !== 1 ? 's' : ''} active
                    </p>
                </div>
            )}
        </div>
    );
};
