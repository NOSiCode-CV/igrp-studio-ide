import { useCallback, useState } from 'react'

/**
 * Lazy drift check for a single imported entity. Caller triggers `check()`
 * and gets the latest diff back. We don't auto-poll because diff hits the
 * live DB and can be slow.
 */
export function useDrift(basePath: string | undefined, entityId: string | undefined) {
    const [diff, setDiff] = useState<SpecDataSchemaDiff | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const check = useCallback(async (): Promise<SpecDataSchemaDiff | null> => {
        if (!basePath || !entityId) return null
        setLoading(true)
        try {
            const result = await window.specData.diffWithDb(basePath, entityId)
            setDiff(result)
            setError(null)
            return result
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)))
            return null
        } finally {
            setLoading(false)
        }
    }, [basePath, entityId])

    const clear = useCallback(() => setDiff(null), [])

    return { diff, loading, error, check, clear }
}
