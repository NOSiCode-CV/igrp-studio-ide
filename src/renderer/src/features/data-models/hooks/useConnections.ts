import { useCallback, useEffect, useState } from 'react'
import type { Connection } from 'src/main/types'

/**
 * Thin wrapper over the existing `connection:*` IPC. Connections are global
 * (Studio-wide settings), not per-project.
 */
export function useConnections() {
    const [connections, setConnections] = useState<Connection[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<Error | null>(null)

    const refresh = useCallback(async () => {
        setLoading(true)
        try {
            setConnections(await window.igrpStudio.connection.findAll())
            setError(null)
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)))
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        void refresh()
    }, [refresh])

    return { connections, loading, error, refresh }
}
