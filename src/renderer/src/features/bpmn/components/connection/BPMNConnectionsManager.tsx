import {
    IGRPButtonPrimitive,
    useIGRPToast
} from '@igrp/igrp-framework-react-design-system'
import AlertDialogDelete from '@renderer/components/alert-dialog-delete'
import { EmptyList } from '@renderer/components/empty-list'
import { Plus } from 'lucide-react'
import { type JSX, useCallback, useEffect, useState } from 'react'
import type { BPMNConfig, BPMNConfigs } from 'src/main/types'
import { BPMNConfigCard } from './BPMNConfigCard'
import { BPMNConnectionModal } from './BPMNConnectionModal'

const BPMN_CONFIG_CHANGED_EVENT = 'bpmn-config-changed'

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

interface BPMNConnectionsManagerProps {
    /** Compact layout — single column, tighter density (for narrow side panels). */
    compact?: boolean
}

/**
 * Self-contained surface to add / edit / delete / activate / test BPMN API
 * configurations. Any change broadcasts the `bpmn-config-changed` window event
 * so other parts of the renderer (notably `ProcessStudioClientProvider`)
 * re-bind the SDK.
 */
export function BPMNConnectionsManager({
    compact = false
}: BPMNConnectionsManagerProps): JSX.Element {
    const [configs, setConfigs] = useState<BPMNConfigs>({
        configs: [],
        activeConfigId: undefined
    })
    const [showConfigModal, setShowConfigModal] = useState(false)
    const [editingConfig, setEditingConfig] = useState<BPMNConfig | undefined>()
    const [deleteConfig, setDeleteConfig] = useState<BPMNConfig | null>(null)
    const { igrpToast } = useIGRPToast()

    const loadConfigs = useCallback(async (): Promise<void> => {
        try {
            const next = await window.igrpStudioSettings.getBPMNConfigs()
            setConfigs(next)
        } catch {
            igrpToast({ type: 'error', content: 'Failed to load API configurations' })
        }
    }, [igrpToast])

    useEffect(() => {
        loadConfigs()
    }, [loadConfigs])

    // Refresh list whenever any other surface (legacy UI generator manager,
    // another window, etc.) edits a BPMN config.
    useEffect(() => {
        const handler = (): void => {
            void loadConfigs()
        }
        window.addEventListener(BPMN_CONFIG_CHANGED_EVENT, handler)
        return () => window.removeEventListener(BPMN_CONFIG_CHANGED_EVENT, handler)
    }, [loadConfigs])

    const broadcastChange = (): void => {
        window.dispatchEvent(new CustomEvent(BPMN_CONFIG_CHANGED_EVENT))
    }

    const handleConfigSave = async (): Promise<void> => {
        setShowConfigModal(false)
        setEditingConfig(undefined)
        await loadConfigs()
        broadcastChange()
    }

    const handleEditConfig = (currentConfig: BPMNConfig): void => {
        setEditingConfig(currentConfig)
        setShowConfigModal(true)
    }

    const handleDeleteConfig = async (): Promise<void> => {
        if (!deleteConfig) return
        try {
            await window.igrpStudioSettings.deleteBPMNConfig(deleteConfig.id)
            await loadConfigs()
            broadcastChange()
            igrpToast({ type: 'success', content: 'API configuration deleted' })
        } catch {
            igrpToast({ type: 'error', content: 'Failed to delete API configuration' })
        } finally {
            setDeleteConfig(null)
        }
    }

    const handleToggleActive = async (
        configId: string,
        isActive: boolean
    ): Promise<void> => {
        try {
            await window.igrpStudioSettings.setActiveBPMNConfig(isActive ? configId : '')
            await loadConfigs()
            broadcastChange()
            igrpToast({
                type: 'success',
                content: `Configuration ${isActive ? 'activated' : 'deactivated'}`
            })
        } catch {
            igrpToast({ type: 'error', content: 'Failed to update configuration' })
        }
    }

    const handleTestConnection = async (config: BPMNConfig): Promise<void> => {
        const result = await testApiConnection(config)
        igrpToast({
            type: result.success ? 'success' : 'error',
            content: result.success
                ? 'Connection test successful!'
                : `Connection test failed: ${result.message}`
        })
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h3 className="text-sm font-semibold">BPMN API connections</h3>
                    <p className="text-xs text-muted-foreground">
                        Add multiple Process API endpoints and switch between them. The
                        active connection is used by every BPMN view in the Studio.
                    </p>
                </div>
                <IGRPButtonPrimitive
                    size="sm"
                    onClick={() => {
                        setEditingConfig(undefined)
                        setShowConfigModal(true)
                    }}
                >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                </IGRPButtonPrimitive>
            </div>

            {configs.configs.length > 0 ? (
                <div
                    className={
                        compact
                            ? 'grid gap-3 sm:grid-cols-2'
                            : 'grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                    }
                >
                    {configs.configs.map((config) => (
                        <BPMNConfigCard
                            key={config.id}
                            config={config}
                            isActive={configs.activeConfigId === config.id}
                            onEdit={handleEditConfig}
                            onDelete={(configId) =>
                                setDeleteConfig(
                                    configs.configs.find((c) => c.id === configId) || null
                                )
                            }
                            onToggleActive={handleToggleActive}
                            onTestConnection={handleTestConnection}
                        />
                    ))}
                </div>
            ) : (
                <EmptyList
                    title="No API configurations"
                    description="Add your BPMN REST API connection to start managing process definitions."
                />
            )}

            <BPMNConnectionModal
                key={`${editingConfig?.id || 'new'}-${showConfigModal ? 'open' : 'closed'}`}
                isOpen={showConfigModal}
                onClose={() => {
                    setShowConfigModal(false)
                    setEditingConfig(undefined)
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
    )
}
