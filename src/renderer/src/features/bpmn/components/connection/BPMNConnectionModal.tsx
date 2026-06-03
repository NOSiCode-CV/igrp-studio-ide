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
import { type JSX, useEffect, useState } from 'react'
import type { BPMNConfig } from 'src/main/types'
import { v4 as uuidv4 } from 'uuid'

interface BPMNConnectionModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    config?: BPMNConfig
}

/**
 * Tests an API connection by hitting `<apiUrl><basePath>/projects` via the
 * main-process IPC (`window.api.fetchData`). Bypasses the renderer CSP and any
 * missing CORS headers, mirroring the runtime path used by the SDK once a
 * config is active (see `client/fetch-bridge.ts`).
 */
async function testApiConnection(
    config: Pick<BPMNConfig, 'apiUrl' | 'basePath' | 'token'>
): Promise<{ success: boolean; message: string }> {
    try {
        const url = `${config.apiUrl.replace(/\/$/, '')}${config.basePath || ''}/projects`
        const headers: Record<string, string> = {}
        if (config.token) headers.Authorization = `Bearer ${config.token}`
        const result = await window.api.fetchData(url, { headers })
        if (result?.error) return { success: false, message: result.error }
        return { success: true, message: 'Connection successful' }
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Connection failed'
        }
    }
}

export function BPMNConnectionModal({
    isOpen,
    onClose,
    onConfirm,
    config
}: BPMNConnectionModalProps): JSX.Element {
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

    const handleInputChange = (field: keyof BPMNConfig, value: any): void => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const handleTestConnection = async (): Promise<void> => {
        if (!formData.apiUrl) {
            igrpToast({ type: 'error', content: 'Please fill in API URL' })
            return
        }
        setIsTesting(true)
        try {
            const result = await testApiConnection({
                apiUrl: formData.apiUrl,
                basePath: formData.basePath || '',
                token: formData.token || ''
            })
            igrpToast({
                type: result.success ? 'success' : 'error',
                content: result.success
                    ? 'API connection test successful!'
                    : `API connection test failed: ${result.message}`
            })
        } finally {
            setIsTesting(false)
        }
    }

    const handleSave = async (): Promise<void> => {
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
                igrpToast({
                    type: 'success',
                    content: 'API configuration updated successfully'
                })
            } else {
                await window.igrpStudioSettings.addBPMNConfig(configData)
                igrpToast({
                    type: 'success',
                    content: 'API configuration saved successfully'
                })
            }

            if (formData.isActive) {
                await window.igrpStudioSettings.setActiveBPMNConfig(configData.id)
            }

            onConfirm()
            setRenderKey(0)
            handleClose()
        } catch {
            igrpToast({ type: 'error', content: 'Failed to save API configuration' })
        } finally {
            setIsLoading(false)
        }
    }

    const handleClose = (): void => {
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
                        <Label htmlFor="bpmn-name">Configuration Name *</Label>
                        <Input
                            id="bpmn-name"
                            value={formData.name || ''}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="My BPMN API"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="bpmn-apiUrl">API URL *</Label>
                        <Input
                            id="bpmn-apiUrl"
                            value={formData.apiUrl || ''}
                            onChange={(e) => handleInputChange('apiUrl', e.target.value)}
                            placeholder="https://my-bpmn-server.com"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="bpmn-basePath">Base Path</Label>
                        <Input
                            id="bpmn-basePath"
                            value={formData.basePath || ''}
                            onChange={(e) => handleInputChange('basePath', e.target.value)}
                            placeholder="/api/v1"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="bpmn-token">Access Token (Optional)</Label>
                        <Input
                            id="bpmn-token"
                            type="password"
                            value={formData.token || ''}
                            onChange={(e) => handleInputChange('token', e.target.value)}
                            placeholder="Bearer token or API key (optional)"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="bpmn-description">Description</Label>
                        <Textarea
                            id="bpmn-description"
                            value={formData.description || ''}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            placeholder="Optional description for this API configuration"
                            rows={3}
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="bpmn-isActive"
                            checked={formData.isActive ?? true}
                            onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                        />
                        <Label htmlFor="bpmn-isActive">Active Configuration</Label>
                    </div>
                </div>
                <DialogFooter className="flex justify-between">
                    <Button
                        variant="outline"
                        onClick={handleTestConnection}
                        disabled={isTesting || !formData.apiUrl}
                    >
                        {isTesting ? 'Testing…' : 'Test Connection'}
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={isLoading}>
                            {isLoading ? 'Saving…' : config ? 'Update' : 'Save'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
