import { useState, useEffect } from 'react';
import {
    IGRPButtonPrimitive,
    IGRPDialogContentPrimitive,
    IGRPDialogDescriptionPrimitive,
    IGRPDialogFooterPrimitive,
    IGRPDialogHeaderPrimitive,
    IGRPDialogPrimitive,
    IGRPDialogTitlePrimitive,
    IGRPInputPrimitive,
    IGRPSwitchPrimitive,
    IGRPTextAreaPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { IGRPLabelPrimitive } from '@igrp/igrp-framework-react-design-system';
import { toast } from 'sonner';
import { BPMNConfig } from 'src/main/types';
import { bpmnService } from '@renderer/services/bpmn-service';
import { v4 as uuidv4 } from 'uuid';

interface BPMNConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    config?: BPMNConfig;
}

export const BPMNConfigModal = ({
    isOpen,
    onClose,
    onConfirm,
    config,
}: BPMNConfigModalProps) => {
    const [formData, setFormData] = useState<Partial<BPMNConfig>>({
        name: '',
        apiUrl: '',
        basePath: '',
        token: '',
        description: '',
        isActive: true,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [renderKey, setRenderKey] = useState(0);

    // Update form data when config prop changes (for editing)
    useEffect(() => {
        if (config) {
            setFormData({
                name: config.name || '',
                apiUrl: config.apiUrl || '',
                basePath: config.basePath || '',
                token: config.token || '',
                description: config.description || '',
                isActive: config.isActive ?? true,
            });
        } else {
            // Reset form when creating new config
            setFormData({
                name: '',
                apiUrl: '',
                basePath: '',
                token: '',
                description: '',
                isActive: true,
            });
        }
    }, [config?.id, isOpen]);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setRenderKey((prev) => prev + 1);
            if (config) {
                setFormData({
                    name: config.name || '',
                    apiUrl: config.apiUrl || '',
                    basePath: config.basePath || '',
                    token: config.token || '',
                    description: config.description || '',
                    isActive: config.isActive ?? true,
                });
            } else {
                setFormData({
                    name: '',
                    apiUrl: '',
                    basePath: '',
                    token: '',
                    description: '',
                    isActive: true,
                });
            }
        }
    }, [isOpen, config?.id]);

    const handleInputChange = (field: keyof BPMNConfig, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleTestConnection = async () => {
        if (!formData.apiUrl) {
            toast.error('Please fill in API URL');
            return;
        }

        setIsTesting(true);
        try {
            const result = await bpmnService.testConnection({
                name: formData.name || '',
                apiUrl: formData.apiUrl,
                basePath: formData.basePath || '',
                token: formData.token || '',
                description: formData.description,
                isActive: formData.isActive ?? true,
            });

            if (result.success) {
                toast.success('API connection test successful!');
            } else {
                toast.error(`API connection test failed: ${result.message}`);
            }
        } catch (error) {
            toast.error('API connection test failed');
        } finally {
            setIsTesting(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name || !formData.apiUrl) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsLoading(true);
        try {
            const configData: BPMNConfig = {
                id: config?.id || uuidv4(),
                name: formData.name,
                apiUrl: formData.apiUrl,
                basePath: formData.basePath || '',
                token: formData.token || '',
                description: formData.description,
                isActive: formData.isActive ?? true,
                createdAt: config?.createdAt || new Date().toISOString(),
                lastConnected: config?.lastConnected,
                status: 'disconnected',
            };

            if (config) {
                await window.igrpStudioSettings.updateBPMNConfig(configData);
                toast.success('API configuration updated successfully');
            } else {
                await window.igrpStudioSettings.addBPMNConfig(configData);
                toast.success('API configuration saved successfully');
            }

            // If this is the first config or if it's set as active, make it the active config
            if (formData.isActive) {
                await window.igrpStudioSettings.setActiveBPMNConfig(
                    configData.id
                );
            }

            onConfirm();
            setRenderKey(0);
            handleClose();
        } catch (error) {
            toast.error('Failed to save API configuration');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        // Reset form when modal is closed
        if (!config) {
            setFormData({
                name: '',
                apiUrl: '',
                basePath: '',
                token: '',
                description: '',
                isActive: true,
            });
        }
        setRenderKey(0);
        onClose();
    };

    return (
        <IGRPDialogPrimitive open={isOpen} onOpenChange={handleClose}>
            <IGRPDialogContentPrimitive
                key={`${config?.id || 'new'}-${renderKey}`}
                className="max-w-[500px] w-[95vw] mx-auto"
            >
                <IGRPDialogHeaderPrimitive>
                    <IGRPDialogTitlePrimitive>
                        {config
                            ? 'Edit BPMN API Configuration'
                            : 'BPMN API Configuration'}
                    </IGRPDialogTitlePrimitive>
                    <IGRPDialogDescriptionPrimitive>
                        Configure connection to your BPMN REST API (Camunda,
                        Flowable, etc.)
                    </IGRPDialogDescriptionPrimitive>
                </IGRPDialogHeaderPrimitive>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <IGRPLabelPrimitive htmlFor="name">
                            Configuration Name *
                        </IGRPLabelPrimitive>
                        <IGRPInputPrimitive
                            id="name"
                            value={formData.name || ''}
                            onChange={(e) =>
                                handleInputChange('name', e.target.value)
                            }
                            placeholder="My BPMN API"
                        />
                    </div>
                    <div className="grid gap-2">
                        <IGRPLabelPrimitive htmlFor="apiUrl">API URL *</IGRPLabelPrimitive>
                        <IGRPInputPrimitive
                            id="apiUrl"
                            value={formData.apiUrl || ''}
                            onChange={(e) =>
                                handleInputChange('apiUrl', e.target.value)
                            }
                            placeholder="https://my-bpmn-server.com"
                        />
                    </div>
                    <div className="grid gap-2">
                        <IGRPLabelPrimitive htmlFor="basePath">Base Path</IGRPLabelPrimitive>
                        <IGRPInputPrimitive
                            id="basePath"
                            value={formData.basePath || ''}
                            onChange={(e) =>
                                handleInputChange('basePath', e.target.value)
                            }
                            placeholder="/api/v1"
                        />
                    </div>
                    <div className="grid gap-2">
                        <IGRPLabelPrimitive htmlFor="token">
                            Access Token (Optional)
                        </IGRPLabelPrimitive>
                        <IGRPInputPrimitive
                            id="token"
                            type="password"
                            value={formData.token || ''}
                            onChange={(e) =>
                                handleInputChange('token', e.target.value)
                            }
                            placeholder="Bearer token or API key (optional)"
                        />
                    </div>
                    <div className="grid gap-2">
                        <IGRPLabelPrimitive htmlFor="description">Description</IGRPLabelPrimitive>
                        <IGRPTextAreaPrimitive
                            id="description"
                            value={formData.description || ''}
                            onChange={(e) =>
                                handleInputChange('description', e.target.value)
                            }
                            placeholder="Optional description for this API configuration"
                            rows={3}
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <IGRPSwitchPrimitive
                            id="isActive"
                            checked={formData.isActive ?? true}
                            onCheckedChange={(checked) =>
                                handleInputChange('isActive', checked)
                            }
                        />
                        <IGRPLabelPrimitive htmlFor="isActive">
                            Active Configuration
                        </IGRPLabelPrimitive>
                    </div>
                </div>
                <IGRPDialogFooterPrimitive className="flex justify-between">
                    <IGRPButtonPrimitive
                        variant="outline"
                        onClick={handleTestConnection}
                        disabled={isTesting || !formData.apiUrl}
                    >
                        {isTesting ? 'Testing...' : 'Test Connection'}
                    </IGRPButtonPrimitive>
                    <div className="flex gap-2">
                        <IGRPButtonPrimitive
                            variant="outline"
                            onClick={handleClose}
                        >
                            Cancel
                        </IGRPButtonPrimitive>
                        <IGRPButtonPrimitive
                            onClick={handleSave}
                            disabled={isLoading}
                        >
                            {isLoading
                                ? 'Saving...'
                                : config
                                  ? 'Update'
                                  : 'Save'}
                        </IGRPButtonPrimitive>
                    </div>
                </IGRPDialogFooterPrimitive>
            </IGRPDialogContentPrimitive>
        </IGRPDialogPrimitive>
    );
};
