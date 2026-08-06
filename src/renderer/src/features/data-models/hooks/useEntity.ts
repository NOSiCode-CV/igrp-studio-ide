import { useCallback, useEffect, useState } from 'react'
import type { Entity } from '../types/entity'

/**
 * Loads a single entity by id and re-fetches whenever the project broadcasts
 * a `spec:data:changed` event.
 */
export function useEntity(basePath: string | undefined, entityId: string | undefined) {
    const [entity, setEntity] = useState<Entity | null>(null)
    const [loading, setLoading] = useState<boolean>(Boolean(basePath && entityId))
    const [error, setError] = useState<Error | null>(null)

    const refresh = useCallback(async () => {
        if (!basePath || !entityId) {
            setEntity(null)
            setLoading(false)
            return
        }
        setLoading(true)
        try {
            setEntity(await window.specData.get(basePath, entityId))
            setError(null)
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)))
        } finally {
            setLoading(false)
        }
    }, [basePath, entityId])

    useEffect(() => {
        void refresh()
    }, [refresh])

    useEffect(() => {
        if (!basePath) return
        return window.specData.onChanged(() => {
            void refresh()
        })
    }, [basePath, refresh])

    return { entity, loading, error, refresh }
}
