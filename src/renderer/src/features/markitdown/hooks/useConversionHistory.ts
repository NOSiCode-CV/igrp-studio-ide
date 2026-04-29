import { useCallback, useEffect, useState } from 'react'

export function useConversionHistory(): {
    entries: MarkItDownHistoryEntry[]
    refresh: () => Promise<void>
    remove: (id: string) => Promise<void>
    clear: () => Promise<void>
} {
    const [entries, setEntries] = useState<MarkItDownHistoryEntry[]>([])

    const refresh = useCallback(async (): Promise<void> => {
        const list = await window.markitdown.getHistory()
        setEntries(list)
    }, [])

    const remove = useCallback(
        async (id: string): Promise<void> => {
            await window.markitdown.deleteHistoryItem(id)
            await refresh()
        },
        [refresh]
    )

    const clear = useCallback(async (): Promise<void> => {
        await window.markitdown.clearHistory()
        await refresh()
    }, [refresh])

    useEffect(() => {
        void refresh()
    }, [refresh])

    return { entries, refresh, remove, clear }
}
