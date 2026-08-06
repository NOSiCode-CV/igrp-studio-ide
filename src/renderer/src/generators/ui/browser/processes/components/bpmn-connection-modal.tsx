import { Button } from '@renderer/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@renderer/components/ui/dialog'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Switch } from '@renderer/components/ui/switch'
import { Textarea } from '@renderer/components/ui/textarea'
import { useIGRPToast } from '@igrp/igrp-framework-react-design-system'
import { bpmnService } from '@renderer/services/bpmn-service'
import { useEffect, useState } from 'react'
import type { BPMNConfig } from 'src/main/types'
import { v4 as uuidv4 } from 'uuid'

interface BPMNConfigModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    config?: BPMNConfig
}

export const BPMNConfigModal = ({ isOpen, onClose, onConfirm, config }: BPMNConfigModalProps) => {
    const [formData, setFormData] = useState<Partial<BPMNConfig>>({
        name: '',
        apiUrl: '',
        basePath: '',
        token: '',
        description: '',
        isActive: true
    })
    const [isLoading, setIsLoading] = useState(false)
    const [isTesting, setIsTesting] = useState(false)
    const [renderKey, setRenderKey] = useState(0)
    const { igrpToast } = useIGRPToast()

    // Update form data when config prop changes (for editing)
    useEffect(() => {
        if (config) {
            setFormData({
                name: config.name || '',
                apiUrl: config.apiUrl || '',
                basePath: config.basePath || '',
                token: config.token || '',
                description: config.description || '',
                isActive: config.isActive ?? true
            })
        } else {
            // Reset form when creating new config
            setFormData({
                name: '',
                apiUrl: '',
                basePath: '',
                token: '',
                description: '',
                isActive: true
            })
        }
    }, [config?.id, isOpen])

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setRenderKey((prev) => prev + 1)
            if (config) {
                setFormData({
                    name: config.name || '',
                    apiUrl: config.apiUrl || '',
                    basePath: config.basePath || '',
                    token: config.token || '',
                    description: config.description || '',
                    isActive: config.isActive ?? true
                })
            } else {
                setFormData({
                    name: '',
                    apiUrl: '',
                    basePath: '',
                    token: '',
                    description: '',
                    isActive: true
                })
            }
        }
    }, [isOpen, config?.id])

    const handleInputChange = (field: keyof BPMNConfig, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const handleTestConnection = async () => {
        if (!formData.apiUrl) {
            igrpToast({ type: 'error', content: 'Please fill in API URL' })
            return
        }

        setIsTesting(true)
        try {
            const result = await bpmnService.testConnection({
                name: formData.name || '',
                apiUrl: formData.apiUrl,
                basePath: formData.basePath || '',
                token: formData.token || '',
                description: formData.description,
                isActive: formData.isActive ?? true
            })

            if (result.success) {
                igrpToast({ type: 'success', content: 'API connection test successful!' })
            } else {
                igrpToast({
                    type: 'error',
                    content: `API connection test failed: ${result.message}`
                })
            }
        } catch (error) {
            igrpToast({ type: 'error', content: 'API connection test failed' })
        } finally {
            setIsTesting(false)
        }
    }

    const handleSave = async () => {
        if (!formData.name || !formData.apiUrl) {
            igrpToast({ type: 'error', content: 'Please fill in all required fields' })
            return
        }

        setIsLoading(true)
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
                status: 'disconnected'
            }

            if (config) {
                await window.igrpStudioSettings.updateBPMNConfig(configData)
                igrpToast({ type: 'success', content: 'API configuration updated successfully' })
            } else {
                await window.igrpStudioSettings.addBPMNConfig(configData)
                igrpToast({ type: 'success', content: 'API configuration saved successfully' })
            }

            // If this is the first config or if it's set as active, make it the active config
            if (formData.isActive) {
                await window.igrpStudioSettings.setActiveBPMNConfig(configData.id)
            }

            onConfirm()
            setRenderKey(0)
            handleClose()
        } catch (error) {
            igrpToast({ type: 'error', content: 'Failed to save API configuration' })
        } finally {
            setIsLoading(false)
        }
    }

    const handleClose = () => {
        // Reset form when modal is closed
        if (!config) {
            setFormData({
                name: '',
                apiUrl: '',
                basePath: '',
                token: '',
                description: '',
                isActive: true
            })
        }
        setRenderKey(0)
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent
                key={`${config?.id || 'new'}-${renderKey}`}
                className="max-w-[500px] w-[95vw] mx-auto"
            >
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
                            value={formData.name || ''}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="My BPMN API"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="apiUrl">API URL *</Label>
                        <Input
                            id="apiUrl"
                            value={formData.apiUrl || ''}
                            onChange={(e) => handleInputChange('apiUrl', e.target.value)}
                            placeholder="https://my-bpmn-server.com"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="basePath">Base Path</Label>
                        <Input
                            id="basePath"
                            value={formData.basePath || ''}
                            onChange={(e) => handleInputChange('basePath', e.target.value)}
                            placeholder="/api/v1"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="token">Access Token (Optional)</Label>
                        <Input
                            id="token"
                            type="password"
                            value={formData.token || ''}
                            onChange={(e) => handleInputChange('token', e.target.value)}
                            placeholder="Bearer token or API key (optional)"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description || ''}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            placeholder="Optional description for this API configuration"
                            rows={3}
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="isActive"
                            checked={formData.isActive ?? true}
                            onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                        />
                        <Label htmlFor="isActive">Active Configuration</Label>
                    </div>
                </div>
                <DialogFooter className="flex justify-between">
                    <Button
                        variant="outline"
                        onClick={handleTestConnection}
                        disabled={isTesting || !formData.apiUrl}
                    >
                        {isTesting ? 'Testing...' : 'Test Connection'}
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={isLoading}>
                            {isLoading ? 'Saving...' : config ? 'Update' : 'Save'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
