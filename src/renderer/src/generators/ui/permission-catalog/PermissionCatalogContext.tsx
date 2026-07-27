import { getId } from '@renderer/utils'
import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    type ReactNode
} from 'react'
import { INITIAL_MOCK_PERMISSIONS } from './mock-data'
import type {
    CreatePermissionInput,
    PermissionCatalogEntry
} from './types'

interface PermissionCatalogContextValue {
    catalog: PermissionCatalogEntry[]
    recentKeys: string[]
    getByKey: (key: string) => PermissionCatalogEntry | undefined
    addPermission: (input: CreatePermissionInput, source?: string) => PermissionCatalogEntry
    updatePermission: (id: string, patch: Partial<PermissionCatalogEntry>) => void
    deletePermission: (id: string) => void
    ensureKeys: (keys: string[], source?: string) => void
    touchRecent: (keys: string[]) => void
}

const PermissionCatalogContext = createContext<PermissionCatalogContextValue | null>(null)

export function PermissionCatalogProvider({ children }: { children: ReactNode }) {
    const [catalog, setCatalog] = useState<PermissionCatalogEntry[]>(INITIAL_MOCK_PERMISSIONS)
    const [recentKeys, setRecentKeys] = useState<string[]>(['delete_invoice', 'audit_invoice'])

    const getByKey = useCallback(
        (key: string) => catalog.find((e) => e.key === key),
        [catalog]
    )

    const addPermission = useCallback(
        (input: CreatePermissionInput, source?: string) => {
            const trimmedKey = input.key.trim()
            const existing = catalog.find((e) => e.key === trimmedKey)
            if (existing) return existing

            const now = new Date().toISOString()
            const entry: PermissionCatalogEntry = {
                id: getId(),
                key: trimmedKey,
                label: input.label.trim(),
                description: input.description?.trim(),
                usageCount: 0,
                sources: source ? [source] : [],
                createdAt: now,
                updatedAt: now
            }
            setCatalog((prev) => [...prev, entry])
            return entry
        },
        [catalog]
    )

    const updatePermission = useCallback((id: string, patch: Partial<PermissionCatalogEntry>) => {
        setCatalog((prev) =>
            prev.map((e) =>
                e.id === id ? { ...e, ...patch, updatedAt: new Date().toISOString() } : e
            )
        )
    }, [])

    const deletePermission = useCallback((id: string) => {
        setCatalog((prev) => prev.filter((e) => e.id !== id))
    }, [])

    const ensureKeys = useCallback(
        (keys: string[], source?: string) => {
            keys.forEach((key) => {
                const trimmed = key.trim()
                if (!trimmed) return
                if (!catalog.some((e) => e.key === trimmed)) {
                    addPermission(
                        {
                            key: trimmed,
                            label: trimmed.replace(/[._]/g, ' '),
                            description: 'Auto-added from rule'
                        },
                        source
                    )
                }
            })
        },
        [addPermission, catalog]
    )

    const touchRecent = useCallback((keys: string[]) => {
        if (!keys.length) return
        setRecentKeys((prev) => {
            const next = [...keys, ...prev.filter((k) => !keys.includes(k))]
            return next.slice(0, 5)
        })
    }, [])

    const value = useMemo(
        () => ({
            catalog,
            recentKeys,
            getByKey,
            addPermission,
            updatePermission,
            deletePermission,
            ensureKeys,
            touchRecent
        }),
        [
            catalog,
            recentKeys,
            getByKey,
            addPermission,
            updatePermission,
            deletePermission,
            ensureKeys,
            touchRecent
        ]
    )

    return (
        <PermissionCatalogContext.Provider value={value}>
            {children}
        </PermissionCatalogContext.Provider>
    )
}

export function usePermissionCatalog(): PermissionCatalogContextValue {
    const ctx = useContext(PermissionCatalogContext)
    if (!ctx) {
        throw new Error('usePermissionCatalog must be used within PermissionCatalogProvider')
    }
    return ctx
}
