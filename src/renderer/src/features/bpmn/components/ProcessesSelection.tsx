import {
    type JSX,
    type ReactNode,
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState
} from 'react'

interface ProcessesSelectionValue {
    projectId: string | undefined
    processId: string | undefined
    search: string
    setProjectId: (id: string | undefined) => void
    setProcessId: (id: string | undefined) => void
    setSearch: (term: string) => void
}

const ProcessesSelectionContext = createContext<ProcessesSelectionValue | undefined>(undefined)

/**
 * Lightweight selection store shared by the list and content variants of the
 * BPMN consumers (Specification rail tab, UI generator browser). Kept outside
 * Redux because the state is purely transient and scoped to one mounted view.
 */
export function ProcessesSelectionProvider({ children }: { children: ReactNode }): JSX.Element {
    const [projectId, setProjectIdState] = useState<string | undefined>(undefined)
    const [processId, setProcessIdState] = useState<string | undefined>(undefined)
    const [search, setSearch] = useState<string>('')

    const setProjectId = useCallback((id: string | undefined): void => {
        setProjectIdState(id)
        // Switching project drops the open process — it almost certainly does
        // not belong to the new project, and the editor would 404.
        setProcessIdState(undefined)
    }, [])

    const setProcessId = useCallback((id: string | undefined): void => {
        setProcessIdState(id)
    }, [])

    const value = useMemo<ProcessesSelectionValue>(
        () => ({ projectId, processId, search, setProjectId, setProcessId, setSearch }),
        [projectId, processId, search, setProjectId, setProcessId]
    )

    return (
        <ProcessesSelectionContext.Provider value={value}>
            {children}
        </ProcessesSelectionContext.Provider>
    )
}

export function useProcessesSelection(): ProcessesSelectionValue {
    const ctx = useContext(ProcessesSelectionContext)
    if (!ctx) {
        throw new Error('useProcessesSelection must be used inside <ProcessesSelectionProvider>')
    }
    return ctx
}
