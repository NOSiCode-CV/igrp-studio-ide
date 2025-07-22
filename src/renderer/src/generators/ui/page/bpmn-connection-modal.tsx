import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@renderer/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@renderer/components/ui/dialog';
import { Input } from '@renderer/components/ui/input';
import { Label } from '@renderer/components/ui/label';
import { Textarea } from '@renderer/components/ui/textarea';
import { Switch } from '@renderer/components/ui/switch';
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
    const { t } = useTranslation();
    const [formData, setFormData] = useState<Partial<BPMNConfig>>({
        name: config?.name || '',
        apiUrl: config?.apiUrl || '',
        token: config?.token || '',
        description: config?.description || '',
        isActive: config?.isActive ?? true,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isTesting, setIsTesting] = useState(false);

    const handleInputChange = (field: keyof BPMNConfig, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleTestConnection = async () => {
        if (!formData.apiUrl || !formData.token) {
            toast.error('Please fill in API URL and token');
            return;
        }

        setIsTesting(true);
        try {
            const result = await bpmnService.testConnection({
                name: formData.name || '',
                apiUrl: formData.apiUrl,
                token: formData.token,
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
        if (!formData.name || !formData.apiUrl || !formData.token) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsLoading(true);
        try {
            const configData: BPMNConfig = {
                id: config?.id || uuidv4(),
                name: formData.name,
                apiUrl: formData.apiUrl,
                token: formData.token,
                description: formData.description,
                isActive: formData.isActive ?? true,
                createdAt: config?.createdAt || new Date().toISOString(),
                lastConnected: config?.lastConnected,
                status: 'disconnected',
            };

            await bpmnService.setConfig(configData);
            toast.success(config ? 'API configuration updated successfully' : 'API configuration saved successfully');
            onConfirm();
        } catch (error) {
            toast.error('Failed to save API configuration');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {config ? 'Edit BPMN API Configuration' : 'BPMN API Configuration'}
                    </DialogTitle>
                    <DialogDescription>
                        Configure connection to your BPMN REST API (Camunda, Flowable, etc.)
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Configuration Name *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="My BPMN API"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="apiUrl">API URL *</Label>
                        <Input
                            id="apiUrl"
                            value={formData.apiUrl}
                            onChange={(e) => handleInputChange('apiUrl', e.target.value)}
                            placeholder="https://my-bpmn-server.com"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="token">Access Token *</Label>
                        <Input
                            id="token"
                            type="password"
                            value={formData.token}
                            onChange={(e) => handleInputChange('token', e.target.value)}
                            placeholder="Bearer token or API key"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            placeholder="Optional description for this API configuration"
                            rows={3}
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="isActive"
                            checked={formData.isActive}
                            onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                        />
                        <Label htmlFor="isActive">Active Configuration</Label>
                    </div>
                </div>
                <DialogFooter className="flex justify-between">
                    <Button
                        variant="outline"
                        onClick={handleTestConnection}
                        disabled={isTesting || !formData.apiUrl || !formData.token}
                    >
                        {isTesting ? 'Testing...' : 'Test Connection'}
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={isLoading}>
                            {isLoading ? 'Saving...' : (config ? 'Update' : 'Save')}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}; 