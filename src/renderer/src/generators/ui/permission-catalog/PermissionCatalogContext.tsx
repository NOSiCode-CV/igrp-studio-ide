import useStudio from '@renderer/hooks/use-studio'
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode
} from 'react'
import {
    computePermissionUsage,
    removePermissionKeyFromProject,
    renamePermissionKeyInProject
} from './computePermissionUsage'
import { buildPermissionConfig, fromPermissionConfig, toPermissionConfig } from './mapPermission'
import {
    engineDeletePermission,
    engineGetPermissions,
    engineSavePermission
} from './permission-engine'
import type { CreatePermissionInput, PermissionCatalogEntry } from './types'

export interface DeletePermissionOptions {
    /** When the key is referenced by rules, strip it from layouts then delete. */
    removeFromRules?: boolean
}

interface PermissionCatalogContextValue {
    catalog: PermissionCatalogEntry[]
    recentKeys: string[]
    loading: boolean
    getByKey: (key: string) => PermissionCatalogEntry | undefined
    refresh: () => Promise<void>
    addPermission: (
        input: CreatePermissionInput,
        source?: string
    ) => Promise<PermissionCatalogEntry>
    updatePermission: (
        id: string,
        patch: Partial<Pick<PermissionCatalogEntry, 'key' | 'label' | 'description' | 'enabled'>>
    ) => Promise<void>
    deletePermission: (id: string, options?: DeletePermissionOptions) => Promise<void>
    ensureKeys: (keys: string[], source?: string) => Promise<void>
    touchRecent: (keys: string[]) => void
}

const PermissionCatalogContext = createContext<PermissionCatalogContextValue | null>(null)

const RECENT_STORAGE_KEY = 'igrp.studio.permission.recentKeys'

function readRecentKeys(): string[] {
    try {
        const raw = localStorage.getItem(RECENT_STORAGE_KEY)
        if (!raw) return []
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed.filter((k) => typeof k === 'string') : []
    } catch {
        return []
    }
}

function writeRecentKeys(keys: string[]): void {
    try {
        localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(keys.slice(0, 5)))
    } catch {
        /* ignore */
    }
}

async function withUsage(
    basePath: string,
    entries: PermissionCatalogEntry[]
): Promise<PermissionCatalogEntry[]> {
    try {
        const usage = await computePermissionUsage(basePath)
        return entries.map((entry) => {
            const info = usage.get(entry.key)
            return {
                ...entry,
                usageCount: info?.count ?? 0,
                sources: info?.sources ?? []
            }
        })
    } catch (error) {
        console.error('[PermissionCatalog] usage scan failed', error)
        return entries.map((entry) => ({
            ...entry,
            usageCount: entry.usageCount ?? 0,
            sources: entry.sources ?? []
        }))
    }
}

export function PermissionCatalogProvider({ children }: { children: ReactNode }) {
    const { basePath } = useStudio()
    const [catalog, setCatalog] = useState<PermissionCatalogEntry[]>([])
    const [recentKeys, setRecentKeys] = useState<string[]>(() => readRecentKeys())
    const [loading, setLoading] = useState(false)
    const catalogRef = useRef(catalog)
    catalogRef.current = catalog

    const refresh = useCallback(async () => {
        if (!basePath) {
            setCatalog([])
            catalogRef.current = []
            return
        }
        setLoading(true)
        try {
            const configs = await engineGetPermissions(basePath)
            const next = await withUsage(
                basePath,
                configs.map(fromPermissionConfig)
            )
            catalogRef.current = next
            setCatalog(next)
        } catch (error) {
            console.error('[PermissionCatalog] failed to load', error)
            catalogRef.current = []
            setCatalog([])
        } finally {
            setLoading(false)
        }
    }, [basePath])

    useEffect(() => {
        void refresh()
    }, [refresh])

    const getByKey = useCallback(
        (key: string) => catalog.find((e) => e.key === key),
        [catalog]
    )

    const addPermission = useCallback(
        async (input: CreatePermissionInput, source?: string) => {
            if (!basePath) throw new Error('No project base path')
            const trimmedKey = input.key.trim()
            const existing = catalogRef.current.find((e) => e.key === trimmedKey)
            if (existing) return existing

            const config = buildPermissionConfig(input)
            await engineSavePermission(config, basePath)
            const entry = fromPermissionConfig(config)
            if (source) {
                entry.sources = [source]
                entry.usageCount = 1
            }
            const next = [...catalogRef.current, entry]
            catalogRef.current = next
            setCatalog(next)
            return entry
        },
        [basePath]
    )

    const updatePermission = useCallback(
        async (
            id: string,
            patch: Partial<Pick<PermissionCatalogEntry, 'key' | 'label' | 'description' | 'enabled'>>
        ) => {
            if (!basePath) throw new Error('No project base path')
            const current = catalogRef.current.find((e) => e.id === id)
            if (!current) throw new Error(`Permission not found: ${id}`)

            const nextKey = patch.key?.trim() || current.key
            if (nextKey !== current.key) {
                const collision = catalogRef.current.find(
                    (e) => e.id !== id && e.key === nextKey
                )
                if (collision) {
                    throw new Error(`Permission key already exists: ${nextKey}`)
                }
            }

            const nextEntry: PermissionCatalogEntry = {
                ...current,
                ...patch,
                key: nextKey,
                label: patch.label?.trim() || current.label,
                description:
                    patch.description !== undefined
                        ? patch.description.trim() || undefined
                        : current.description
            }

            // Patch layout rules before catalog write so a failed rename
            // does not leave the catalog pointing at a new key with stale refs.
            if (nextKey !== current.key) {
                await renamePermissionKeyInProject(basePath, current.key, nextKey)
                setRecentKeys((prev) => {
                    if (!prev.includes(current.key)) return prev
                    const next = prev.map((k) => (k === current.key ? nextKey : k))
                    writeRecentKeys(next)
                    return next
                })
            }

            await engineSavePermission(toPermissionConfig(nextEntry), basePath)

            const withCounts = await withUsage(
                basePath,
                catalogRef.current.map((e) => (e.id === id ? nextEntry : e))
            )
            catalogRef.current = withCounts
            setCatalog(withCounts)
        },
        [basePath]
    )

    const deletePermissionFn = useCallback(
        async (id: string, options?: DeletePermissionOptions) => {
            if (!basePath) throw new Error('No project base path')
            const entry = catalogRef.current.find((e) => e.id === id)
            if (!entry) throw new Error(`Permission not found: ${id}`)

            if (entry.usageCount > 0 && !options?.removeFromRules) {
                throw new Error(
                    `Permission "${entry.key}" is used in ${entry.usageCount} rule(s). Remove from rules first or confirm cleanup.`
                )
            }

            if (entry.usageCount > 0 && options?.removeFromRules) {
                await removePermissionKeyFromProject(basePath, entry.key)
            }

            await engineDeletePermission(id, basePath)
            const next = catalogRef.current.filter((e) => e.id !== id)
            catalogRef.current = next
            setCatalog(next)
        },
        [basePath]
    )

    const ensureKeys = useCallback(
        async (keys: string[], source?: string) => {
            for (const key of keys) {
                const trimmed = key.trim()
                if (!trimmed) continue
                if (catalogRef.current.some((e) => e.key === trimmed)) continue
                await addPermission(
                    {
                        key: trimmed,
                        label: trimmed.replace(/[._]/g, ' '),
                        description: 'Auto-added from rule'
                    },
                    source
                )
            }
            // Re-scan so usage reflects the newly saved rule(s) on disk.
            if (basePath) {
                const next = await withUsage(basePath, catalogRef.current)
                catalogRef.current = next
                setCatalog(next)
            }
        },
        [addPermission, basePath]
    )

    const touchRecent = useCallback((keys: string[]) => {
        if (!keys.length) return
        setRecentKeys((prev) => {
            const next = [...keys, ...prev.filter((k) => !keys.includes(k))].slice(0, 5)
            writeRecentKeys(next)
            return next
        })
    }, [])

    const value = useMemo(
        () => ({
            catalog,
            recentKeys,
            loading,
            getByKey,
            refresh,
            addPermission,
            updatePermission,
            deletePermission: deletePermissionFn,
            ensureKeys,
            touchRecent
        }),
        [
            catalog,
            recentKeys,
            loading,
            getByKey,
            refresh,
            addPermission,
            updatePermission,
            deletePermissionFn,
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
