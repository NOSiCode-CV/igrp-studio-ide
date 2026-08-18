import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import type { RootState } from '@renderer/redux'
import { Copy, Search, Terminal, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type JSX } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { LogFilterButton } from './LogFilterButton'
import { LogLine } from './LogLine'

type LogFilter = 'all' | 'errors' | 'warns+errors'

/**
 * "Logs" tab — dev-server stdout/stderr stream with filter + search +
 * copy + clear.
 *
 * Hover auto-pauses scroll so the viewport doesn't snap back to bottom
 * while the user reads older lines; releasing the hover resumes the
 * auto-scroll. The `paused` indicator surfaces in the toolbar so the
 * behaviour is discoverable.
 *
 * Counts are computed once over the unfiltered logs (so "Warn+Err
 * (12)" stays informative even when filtering hides those entries).
 *
 * Extracted from `PrototypePanel.tsx` as part of the prototype refactor
 * (P5 — panes).
 */
export const LogsPane = (): JSX.Element => {
    const dispatch = useDispatch<any>()
    const logs = useSelector((s: RootState) => s.specPrototype.logs)
    const scrollRef = useRef<HTMLDivElement>(null)

    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState<LogFilter>('all')
    // Pause auto-scroll while the user is hovering — stops the viewport
    // from snapping back to bottom while they read older lines.
    const [paused, setPaused] = useState(false)

    const filtered = useMemo(() => {
        const needle = search.trim().toLowerCase()
        return logs.filter((log) => {
            if (filter === 'errors' && log.level !== 'error') return false
            if (filter === 'warns+errors' && log.level === 'info') return false
            if (needle && !log.line.toLowerCase().includes(needle)) return false
            return true
        })
    }, [logs, search, filter])

    useEffect(() => {
        if (paused) return
        const el = scrollRef.current
        if (el) el.scrollTop = el.scrollHeight
    }, [filtered, paused])

    const handleClear = useCallback(() => {
        dispatch({ type: 'specPrototype/protoLogsReplaced', payload: [] })
    }, [dispatch])

    const handleCopy = useCallback(async () => {
        const text = filtered
            .map((l) => `[${new Date(l.timestamp).toISOString()}] ${l.level.padEnd(5)} ${l.line}`)
            .join('\n')
        try {
            await navigator.clipboard.writeText(text)
        } catch {
            // noop — not all envs grant clipboard access; failing silently
            // is fine since the user retains the logs visible on screen.
        }
    }, [filtered])

    const counts = useMemo(() => {
        let info = 0
        let warn = 0
        let error = 0
        for (const log of logs) {
            if (log.level === 'error') error++
            else if (log.level === 'warn') warn++
            else info++
        }
        return { info, warn, error }
    }, [logs])

    return (
        <div className="flex h-full flex-col rounded-xl border bg-background">
            <div className="flex items-center gap-3 border-b px-4 py-2.5">
                <div className="flex items-center gap-2 text-emerald-500">
                    <Terminal size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                        Dev Server Logs
                    </span>
                </div>
                <div className="flex items-center gap-1 rounded-md border bg-card p-0.5">
                    <LogFilterButton
                        active={filter === 'all'}
                        onClick={() => setFilter('all')}
                        label={`All (${logs.length})`}
                    />
                    <LogFilterButton
                        active={filter === 'warns+errors'}
                        onClick={() => setFilter('warns+errors')}
                        label={`Warn+Err (${counts.warn + counts.error})`}
                    />
                    <LogFilterButton
                        active={filter === 'errors'}
                        onClick={() => setFilter('errors')}
                        label={`Err (${counts.error})`}
                    />
                </div>
                <div className="relative flex-1 max-w-xs">
                    <Search
                        size={11}
                        className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                        placeholder="Search…"
                        className="h-7 pl-7 text-[11px]"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="ml-auto flex items-center gap-1">
                    {paused && (
                        <span className="text-[10px] text-amber-500" title="Auto-scroll paused">
                            paused
                        </span>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Copy filtered logs to clipboard"
                        onClick={handleCopy}
                        disabled={filtered.length === 0}
                    >
                        <Copy size={12} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Clear logs"
                        onClick={handleClear}
                        disabled={logs.length === 0}
                    >
                        <Trash2 size={12} />
                    </Button>
                </div>
            </div>
            <div
                ref={scrollRef}
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
                className="flex-1 overflow-y-auto p-4 font-mono text-[12px]"
            >
                {logs.length === 0 ? (
                    <p className="italic text-muted-foreground">
                        No logs yet. The dev server starts when you open the Preview tab or hit ▶.
                    </p>
                ) : filtered.length === 0 ? (
                    <p className="italic text-muted-foreground">
                        No entries match the current filter.
                    </p>
                ) : (
                    <div className="space-y-1">
                        {filtered.map((log, idx) => (
                            <LogLine key={idx} log={log} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
