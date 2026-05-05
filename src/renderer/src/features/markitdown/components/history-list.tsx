import {
    IGRPButtonPrimitive,
    IGRPScrollAreaPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { cn } from '@renderer/lib/utils'
import { Clock, Trash2, X } from 'lucide-react'
import { type JSX, useMemo, useState } from 'react'
import { SearchInput } from '@renderer/components/shared-ui'

interface HistoryListProps {
    entries: MarkItDownHistoryEntry[]
    activeFilePath: string | null
    onSelect: (entry: MarkItDownHistoryEntry) => void
    onDelete: (id: string) => void
    onClear: () => void
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatRelative(timestamp: number): string {
    const diff = Date.now() - timestamp
    const minute = 60 * 1000
    const hour = 60 * minute
    const day = 24 * hour
    if (diff < minute) return 'just now'
    if (diff < hour) return `${Math.floor(diff / minute)}m ago`
    if (diff < day) return `${Math.floor(diff / hour)}h ago`
    if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`
    return new Date(timestamp).toLocaleDateString()
}

const HistoryList = ({
    entries,
    activeFilePath,
    onSelect,
    onDelete,
    onClear
}: HistoryListProps): JSX.Element => {
    const [search, setSearch] = useState('')

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase()
        if (!q) return entries
        return entries.filter(
            (e) => e.fileName.toLowerCase().includes(q) || e.filePath.toLowerCase().includes(q)
        )
    }, [entries, search])

    return (
        <aside className="flex flex-col w-64 border-r border-border bg-muted/30">
            <div className="p-3 border-b border-border">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        <Clock className="h-3.5 w-3.5" />
                        History
                    </div>
                    {entries.length > 0 && (
                        <IGRPButtonPrimitive
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs"
                            onClick={onClear}
                        >
                            <Trash2 className="h-3 w-3" />
                        </IGRPButtonPrimitive>
                    )}
                </div>
                <SearchInput
                    value={search}
                    placeholder="Search history"
                    onChange={(v) => setSearch(v)}
                />
            </div>
            <IGRPScrollAreaPrimitive className="flex-1">
                {filtered.length === 0 ? (
                    <div className="p-4 text-xs text-muted-foreground">
                        {entries.length === 0 ? 'No conversions yet.' : 'No matches.'}
                    </div>
                ) : (
                    <ul className="py-1">
                        {filtered.map((entry) => {
                            const isActive = activeFilePath === entry.filePath
                            return (
                                <li key={entry.id}>
                                    <button
                                        type="button"
                                        onClick={() => onSelect(entry)}
                                        className={cn(
                                            'w-full text-left px-3 py-2 flex items-start gap-2 group hover:bg-accent',
                                            isActive && 'bg-accent'
                                        )}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div
                                                className="text-sm font-medium truncate"
                                                title={entry.fileName}
                                            >
                                                {entry.fileName}
                                            </div>
                                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                                                <span>{formatRelative(entry.convertedAt)}</span>
                                                <span aria-hidden>·</span>
                                                <span>{formatSize(entry.sizeBytes)}</span>
                                            </div>
                                        </div>
                                        <span
                                            role="button"
                                            aria-label="Remove entry"
                                            tabIndex={0}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onDelete(entry.id)
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.stopPropagation()
                                                    onDelete(entry.id)
                                                }
                                            }}
                                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </span>
                                    </button>
                                </li>
                            )
                        })}
                    </ul>
                )}
            </IGRPScrollAreaPrimitive>
        </aside>
    )
}

export default HistoryList
