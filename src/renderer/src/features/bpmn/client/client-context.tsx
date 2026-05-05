import {
    createContext,
    type JSX,
    type ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState
} from 'react'
import type { BPMNConfig } from 'src/main/types'
import { installBpmnFetchBridge } from './fetch-bridge'
import {
    buildProcessStudioClient,
    loadActiveBPMNConfig,
    type ProcessStudioClientBinding
} from './process-studio-client'

interface ProcessStudioClientContextValue {
    binding: ProcessStudioClientBinding | null
    activeConfig: BPMNConfig | null
    loading: boolean
    error: Error | null
    refresh: () => Promise<void>
}

const ProcessStudioClientContext = createContext<ProcessStudioClientContextValue | undefined>(
    undefined
)

interface ProcessStudioClientProviderProps {
    children: ReactNode
}

export function ProcessStudioClientProvider({
    children
}: ProcessStudioClientProviderProps): JSX.Element {
    const [activeConfig, setActiveConfig] = useState<BPMNConfig | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<Error | null>(null)

    const refresh = useCallback(async (): Promise<void> => {
        setLoading(true)
        setError(null)
        try {
            const next = await loadActiveBPMNConfig()
            setActiveConfig(next)
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)))
            setActiveConfig(null)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        void refresh()
    }, [refresh])

    const binding = useMemo<ProcessStudioClientBinding | null>(() => {
        if (!activeConfig) return null
        return buildProcessStudioClient(activeConfig)
    }, [activeConfig])

    // Route SDK requests through main IPC for the active host — bypasses the
    // renderer CSP and any missing CORS headers on the remote Process API.
    useEffect(() => {
        if (!binding) return
        const apiHost = binding.config.apiUrl.replace(/\/$/, '')
        const cleanup = installBpmnFetchBridge(apiHost)
        return cleanup
    }, [binding])

    const value = useMemo<ProcessStudioClientContextValue>(
        () => ({ binding, activeConfig, loading, error, refresh }),
        [binding, activeConfig, loading, error, refresh]
    )

    return (
        <ProcessStudioClientContext.Provider value={value}>
            {children}
        </ProcessStudioClientContext.Provider>
    )
}

export function useProcessStudioClient(): ProcessStudioClientContextValue {
    const ctx = useContext(ProcessStudioClientContext)
    if (!ctx) {
        throw new Error(
            'useProcessStudioClient must be used inside <ProcessStudioClientProvider>'
        )
    }
    return ctx
}
