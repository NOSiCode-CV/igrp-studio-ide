import { app } from 'electron'
import fs from 'fs'
import path from 'path'

export interface MarkItDownHistoryEntry {
    id: string
    fileName: string
    filePath: string
    sizeBytes: number
    markdown: string
    convertedAt: number
    durationMs: number
}

export const HISTORY_MAX_ENTRIES = 50

export interface HistoryStore {
    read(): Promise<MarkItDownHistoryEntry[]>
    add(entry: MarkItDownHistoryEntry): Promise<MarkItDownHistoryEntry[]>
    remove(id: string): Promise<MarkItDownHistoryEntry[]>
    clear(): Promise<void>
}

export function createHistoryStore(
    filePath: string,
    maxEntries = HISTORY_MAX_ENTRIES
): HistoryStore {
    const read = async (): Promise<MarkItDownHistoryEntry[]> => {
        try {
            const raw = await fs.promises.readFile(filePath, 'utf-8')
            const parsed = JSON.parse(raw)
            if (!Array.isArray(parsed)) return []
            return parsed.filter(
                (entry): entry is MarkItDownHistoryEntry =>
                    entry &&
                    typeof entry.id === 'string' &&
                    typeof entry.fileName === 'string' &&
                    typeof entry.markdown === 'string' &&
                    typeof entry.convertedAt === 'number'
            )
        } catch (err) {
            if ((err as NodeJS.ErrnoException).code === 'ENOENT') return []
            return []
        }
    }

    const write = async (entries: MarkItDownHistoryEntry[]): Promise<void> => {
        await fs.promises.mkdir(path.dirname(filePath), { recursive: true })
        await fs.promises.writeFile(filePath, JSON.stringify(entries, null, 2), 'utf-8')
    }

    const add = async (entry: MarkItDownHistoryEntry): Promise<MarkItDownHistoryEntry[]> => {
        const current = await read()
        const next = [entry, ...current.filter((e) => e.id !== entry.id)].slice(0, maxEntries)
        await write(next)
        return next
    }

    const remove = async (id: string): Promise<MarkItDownHistoryEntry[]> => {
        const current = await read()
        const next = current.filter((e) => e.id !== id)
        await write(next)
        return next
    }

    const clear = async (): Promise<void> => {
        await write([])
    }

    return { read, add, remove, clear }
}

let defaultStore: HistoryStore | null = null

export function getDefaultHistoryStore(): HistoryStore {
    if (!defaultStore) {
        const file = path.join(app.getPath('userData'), 'markitdown-history.json')
        defaultStore = createHistoryStore(file)
    }
    return defaultStore
}
