import { useCallback, useEffect, useState } from 'react'
import type { EntitySummary } from '../types/entity'

/**
 * Subscribes to the project's entity list, refreshing whenever the main
 * process broadcasts a `spec:data:changed` event.
 */
export function useEntities(basePath: string | undefined) {
    const [entities, setEntities] = useState<EntitySummary[]>([])
    const [loading, setLoading] = useState<boolean>(Boolean(basePath))
    const [error, setError] = useState<Error | null>(null)

    const refresh = useCallback(async () => {
        if (!basePath) {
            setEntities([])
            setLoading(false)
            return
        }
        setLoading(true)
        try {
            const list = await window.specData.list(basePath)
            setEntities(list)
            setError(null)
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)))
        } finally {
            setLoading(false)
        }
    }, [basePath])

    useEffect(() => {
        void refresh()
    }, [refresh])

    useEffect(() => {
        if (!basePath) return
        return window.specData.onChanged(() => {
            void refresh()
        })
    }, [basePath, refresh])

    return { entities, loading, error, refresh }
}
