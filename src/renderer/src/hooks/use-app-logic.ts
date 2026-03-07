'use client'

import { useIGRPToast } from '@igrp/igrp-framework-react-design-system'
import { AppLogicIPCClient } from '@renderer/pages/applogic/client'
import { EnvironmentValidator } from '@renderer/pages/applogic/validation'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { AppLogicEnvironment, ConnectionTest } from 'src/main/types'

export function useAppLogic(): {
    environments: AppLogicEnvironment[]
    loading: boolean
    error: string | null
    isInitialized: boolean
    createEnvironment: (
        data: Omit<AppLogicEnvironment, 'id' | 'status' | 'createdAt'>
    ) => Promise<AppLogicEnvironment | null>
    updateEnvironment: (id: string, updates: Partial<AppLogicEnvironment>) => Promise<boolean>
    deleteEnvironment: (id: string) => Promise<boolean>
    testEnvironment: (id: string) => Promise<boolean>
    searchEnvironments: (query: string) => AppLogicEnvironment[]
    exportEnvironments: () => Promise<void>
    getEnvironmentHistory: (id: string) => Promise<ConnectionTest[]>
} {
    const [environments, setEnvironments] = useState<AppLogicEnvironment[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isInitialized, setIsInitialized] = useState(false)
    const initRef = useRef(false)
    const unsubscribeRef = useRef<(() => void) | null>(null)

    const { igrpToast } = useIGRPToast()

    // Initialize
    useEffect(() => {
        if (initRef.current) return
        initRef.current = true

        const initialize = async () => {
            try {
                setLoading(true)
                setError(null)

                const storedEnvironments = await AppLogicIPCClient.getEnvironments()
                setEnvironments(storedEnvironments)
                setIsInitialized(true)

                //toast.success("Storage initialized successfully")

                // Real-time updates
                const unsubscribe = AppLogicIPCClient.onEnvironmentsChanged((newEnvironments) => {
                    setEnvironments(newEnvironments)
                })
                unsubscribeRef.current = unsubscribe
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to initialize'
                setError(errorMessage)
                igrpToast({ type: 'error', content: 'Failed to initialize storage' })
            } finally {
                setLoading(false)
            }
        }

        initialize()

        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current()
            }
            AppLogicIPCClient.cleanup()
        }
    }, [])

    // Create environment
    const createEnvironment = useCallback(
        async (data: Omit<AppLogicEnvironment, 'id' | 'status' | 'createdAt'>) => {
            if (!isInitialized) {
                igrpToast({ type: 'error', content: 'Storage not initialized' })
                return null
            }

            try {
                const validation = EnvironmentValidator.validateEnvironment(data)
                if (!validation.isValid) {
                    igrpToast({
                        type: 'error',
                        content: `Validation failed: ${validation.errors.join(', ')}`
                    })
                    return null
                }

                validation.warnings.forEach((warning) =>
                    igrpToast({ type: 'warning', content: warning })
                )

                const sanitized = EnvironmentValidator.sanitizeEnvironment(data)
                const environment: AppLogicEnvironment = {
                    id: `env_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    ...sanitized,
                    status: 'disconnected',
                    createdAt: new Date().toISOString()
                } as AppLogicEnvironment

                const created = await AppLogicIPCClient.addEnvironment(environment)
                igrpToast({
                    type: 'success',
                    content: `Environment "${created.name}" created successfully`
                })
                return created
            } catch (err) {
                console.error('Error creating environment:', err)
                igrpToast({ type: 'error', content: 'Failed to create environment' })
                return null
            }
        },
        [isInitialized]
    )

    // Update environment
    const updateEnvironment = useCallback(
        async (id: string, updates: Partial<AppLogicEnvironment>) => {
            if (!isInitialized) {
                igrpToast({ type: 'error', content: 'Storage not initialized' })
                return false
            }

            try {
                await AppLogicIPCClient.updateEnvironment(id, updates)
                if (!updates.status) {
                    igrpToast({ type: 'success', content: 'Environment updated successfully' })
                }
                return true
            } catch (err) {
                console.error('Error updating environment:', err)
                igrpToast({ type: 'error', content: 'Failed to update environment' })
                return false
            }
        },
        [isInitialized]
    )

    // Delete environment
    const deleteEnvironment = useCallback(
        async (id: string) => {
            if (!isInitialized) {
                igrpToast({ type: 'error', content: 'Storage not initialized' })
                return false
            }

            try {
                const environment = await AppLogicIPCClient.getEnvironment(id)
                if (!environment) {
                    igrpToast({ type: 'error', content: 'Environment not found' })
                    return false
                }

                await AppLogicIPCClient.deleteEnvironment(id)
                igrpToast({
                    type: 'success',
                    content: `Environment "${environment.name}" deleted successfully`
                })
                return true
            } catch (err) {
                console.error('Error deleting environment:', err)
                igrpToast({ type: 'error', content: 'Failed to delete environment' })
                return false
            }
        },
        [isInitialized]
    )

    // Test environment
    const testEnvironment = useCallback(
        async (id: string) => {
            if (!isInitialized || !window.appLogicAPI) {
                igrpToast({ type: 'error', content: 'App Logic not initialized' })
                return false
            }

            try {
                const environment = await window.appLogicAPI.getEnvironment(id)
                if (!environment) {
                    igrpToast({ type: 'error', content: 'Environment not found' })
                    return false
                }

                await updateEnvironment(id, { status: 'testing' })
                const result = await window.appLogicAPI.testEnvironment(environment)
                console.log(result)
                const test: ConnectionTest = {
                    id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    environmentId: id,
                    success: result.isValid,
                    timestamp: new Date().toISOString(),
                    responseTime: result.responseTime,
                    error: result.error,
                    statusCode: result.statusCode,
                    endpoint: '/',
                    method: 'GET'
                }

                console.log(test)

                const newStatus = result.isValid ? 'connected' : 'error'
                await updateEnvironment(id, {
                    status: newStatus,
                    lastTested: new Date().toISOString()
                })

                if (result.isValid) {
                    igrpToast({
                        type: 'success',
                        content: `Environment tested successfully (${result.responseTime}ms)`
                    })
                } else {
                    igrpToast({
                        type: 'error',
                        content: `Environment test failed: ${result.error}`
                    })
                }

                return result.isValid
            } catch (err) {
                console.error('Error testing environment:', err)
                await updateEnvironment(id, { status: 'error' })
                igrpToast({ type: 'error', content: 'Failed to test environment' })
                return false
            }
        },
        [isInitialized, updateEnvironment]
    )

    // Search environments
    const searchEnvironments = useCallback(
        (query: string) => {
            if (!query.trim()) return environments

            const searchTerm = query.toLowerCase()
            return environments.filter(
                (env) =>
                    env.name.toLowerCase().includes(searchTerm) ||
                    env.description?.toLowerCase().includes(searchTerm) ||
                    env.url.toLowerCase().includes(searchTerm)
            )
        },
        [environments]
    )

    // Export
    const exportEnvironments = useCallback(async () => {
        if (!isInitialized) {
            igrpToast({ type: 'error', content: 'Storage not initialized' })
            return
        }

        try {
            const data = await AppLogicIPCClient.exportData()
            const blob = new Blob([data], { type: 'application/json' })
            const url = URL.createObjectURL(blob)

            const link = document.createElement('a')
            link.href = url
            link.download = `app-logic-backup-${new Date().toISOString().split('T')[0]}.json`
            link.click()

            URL.revokeObjectURL(url)
            igrpToast({ type: 'success', content: 'Data exported successfully' })
        } catch (err) {
            console.error('Export error:', err)
            igrpToast({ type: 'error', content: 'Failed to export data' })
        }
    }, [isInitialized])

    return {
        environments,
        loading,
        error,
        isInitialized,
        createEnvironment,
        updateEnvironment,
        deleteEnvironment,
        testEnvironment,
        searchEnvironments,
        exportEnvironments,
        getEnvironmentHistory: (id: string) => AppLogicIPCClient.getEnvironmentHistory(id)
    }
}
