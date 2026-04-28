import {
    IGRPButtonPrimitive,
    IGRPInputPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { cn } from '@renderer/lib/utils'
import type { RootState } from '@renderer/redux'
import {
    kbSearchQueryChanged,
    kbSelected,
    type KBItem,
    type KBItemStatus,
    type KBItemType
} from '@renderer/redux/specKB/reducer'
import {
    addKBFile,
    addKBUrl,
    loadKB,
    reindexKBItem,
    removeKBItem,
    semanticSearchKB
} from '@renderer/redux/specKB/thunks'
import {
    AlertCircle,
    CheckCircle2,
    Eye,
    File as FileIcon,
    FileAudio,
    FileText,
    Globe,
    Image as ImageIcon,
    Layout as LayoutIcon,
    Link as LinkIcon,
    MoreHorizontal,
    Plus,
    RefreshCw,
    Search,
    Trash2,
    Youtube
} from 'lucide-react'
import { type FormEvent, type JSX, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DropZone } from './shared/DropZone'

interface PanelProps {
    basePath?: string
    currentItem?: any
    variant?: 'list' | 'content'
}

const KNOWN_STATUS_LABEL: Record<KBItemStatus, string> = {
    pending: 'Pending',
    converting: 'Converting',
    indexing: 'Indexing',
    indexed: 'Indexed',
    error: 'Error'
}

function typeIcon(type: KBItemType, size = 16): JSX.Element {
    switch (type) {
        case 'pdf':
            return <FileText className="text-red-500" size={size} />
        case 'docx':
            return <FileIcon className="text-blue-500" size={size} />
        case 'pptx':
            return <FileIcon className="text-orange-500" size={size} />
        case 'xlsx':
            return <FileIcon className="text-emerald-500" size={size} />
        case 'html':
            return <Globe className="text-cyan-500" size={size} />
        case 'url':
            return <Globe className="text-emerald-500" size={size} />
        case 'youtube':
            return <Youtube className="text-red-600" size={size} />
        case 'image':
            return <ImageIcon className="text-purple-500" size={size} />
        case 'audio':
            return <FileAudio className="text-amber-500" size={size} />
        default:
            return <FileIcon size={size} />
    }
}

function statusIcon(status: KBItemStatus): JSX.Element {
    if (status === 'indexed') return <CheckCircle2 className="text-emerald-500" size={14} />
    if (status === 'error') return <AlertCircle className="text-red-500" size={14} />
    return <RefreshCw className="text-blue-500 animate-spin" size={14} />
}

function relativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60_000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    return `${days}d ago`
}

function formatBytes(size?: number): string {
    if (!size) return 'N/A'
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

const SkeletonRow = (): JSX.Element => (
    <div className="flex items-center gap-3 px-3 py-2.5">
        <div className="h-8 w-8 animate-pulse rounded-md bg-muted" />
        <div className="flex-1 space-y-2">
            <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-2 w-1/2 animate-pulse rounded bg-muted" />
        </div>
    </div>
)

// ─── List variant ─────────────────────────────────────────────────────────

const ListVariant = ({ basePath }: PanelProps): JSX.Element => {
    const dispatch = useDispatch<any>()
    const items = useSelector((s: RootState) => s.specKB.items)
    const isLoading = useSelector((s: RootState) => s.specKB.isLoading)
    const selectedId = useSelector((s: RootState) => s.specKB.selectedId)
    const searchQuery = useSelector((s: RootState) => s.specKB.searchQuery)

    const [urlInputOpen, setUrlInputOpen] = useState(false)
    const [urlValue, setUrlValue] = useState('')

    useEffect(() => {
        if (basePath) dispatch(loadKB(basePath))
    }, [basePath, dispatch])

    const visible = useMemo(() => {
        if (!searchQuery.trim()) return items
        const needle = searchQuery.toLowerCase()
        return items.filter(
            (item) =>
                item.name.toLowerCase().includes(needle) ||
                item.origin.toLowerCase().includes(needle)
        )
    }, [items, searchQuery])

    const handlePickFile = async () => {
        if (!basePath) return
        const filePath = await window.specKB.pickFile()
        if (filePath) dispatch(addKBFile(basePath, filePath))
    }

    const handleAddUrl = (event: FormEvent) => {
        event.preventDefault()
        if (!basePath || !urlValue.trim()) return
        const isYoutube = /youtube\.com|youtu\.be/.test(urlValue)
        dispatch(addKBUrl(basePath, urlValue.trim(), isYoutube))
        setUrlValue('')
        setUrlInputOpen(false)
    }

    return (
        <div className="flex h-full flex-col">
            <div className="flex flex-col gap-3 border-b p-3">
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <IGRPInputPrimitive
                            placeholder="Search KB…"
                            className="h-8 pl-7"
                            value={searchQuery}
                            onChange={(e) => dispatch(kbSearchQueryChanged(e.target.value))}
                        />
                    </div>
                    <IGRPButtonPrimitive
                        size="sm"
                        variant="outline"
                        className="h-8 px-2"
                        onClick={handlePickFile}
                        disabled={!basePath}
                        title="Add file"
                    >
                        <Plus className="h-3.5 w-3.5" />
                    </IGRPButtonPrimitive>
                    <IGRPButtonPrimitive
                        size="sm"
                        variant="outline"
                        className="h-8 px-2"
                        onClick={() => setUrlInputOpen((v) => !v)}
                        disabled={!basePath}
                        title="Add URL"
                    >
                        <LinkIcon className="h-3.5 w-3.5" />
                    </IGRPButtonPrimitive>
                </div>
                {urlInputOpen && (
                    <form onSubmit={handleAddUrl} className="flex gap-2">
                        <IGRPInputPrimitive
                            autoFocus
                            placeholder="https://… or youtube.com/…"
                            className="h-8 text-xs"
                            value={urlValue}
                            onChange={(e) => setUrlValue(e.target.value)}
                        />
                        <IGRPButtonPrimitive type="submit" size="sm" className="h-8 px-3 text-xs">
                            Add
                        </IGRPButtonPrimitive>
                    </form>
                )}
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="space-y-0.5 p-2">
                    {isLoading && items.length === 0 ? (
                        <>
                            <SkeletonRow />
                            <SkeletonRow />
                            <SkeletonRow />
                        </>
                    ) : visible.length === 0 ? (
                        <p className="px-3 py-4 text-xs text-muted-foreground">
                            {searchQuery
                                ? 'No items match your search.'
                                : 'No knowledge yet — add a file or URL.'}
                        </p>
                    ) : (
                        visible.map((item) => (
                            <KBRow
                                key={item.id}
                                item={item}
                                active={item.id === selectedId}
                                onSelect={() => dispatch(kbSelected(item.id))}
                                onReindex={() =>
                                    basePath && dispatch(reindexKBItem(basePath, item.id))
                                }
                                onRemove={() => basePath && dispatch(removeKBItem(basePath, item.id))}
                            />
                        ))
                    )}

                    <div className="px-2 pt-2">
                        <DropZone
                            onFile={(filePath) =>
                                basePath && dispatch(addKBFile(basePath, filePath))
                            }
                            onUrl={(url) =>
                                basePath &&
                                dispatch(addKBUrl(basePath, url, /youtube\.com|youtu\.be/.test(url)))
                            }
                            label="Drop files or URLs to index"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

interface KBRowProps {
    item: KBItem
    active: boolean
    onSelect: () => void
    onReindex: () => void
    onRemove: () => void
}

const KBRow = ({ item, active, onSelect, onReindex, onRemove }: KBRowProps): JSX.Element => {
    const [menuOpen, setMenuOpen] = useState(false)
    return (
        <div
            onClick={onSelect}
            className={cn(
                'group flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
                active ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
            )}
        >
            {typeIcon(item.type)}
            <div className="min-w-0 flex-1">
                <div className="truncate font-medium leading-tight" title={item.name}>
                    {item.name}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <span>{relativeTime(item.updatedAt)}</span>
                    <span>•</span>
                    <span className="truncate" title={item.origin}>
                        {KNOWN_STATUS_LABEL[item.status]}
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-1">
                {statusIcon(item.status)}
                <div className="relative">
                    <IGRPButtonPrimitive
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                            e.stopPropagation()
                            setMenuOpen((v) => !v)
                        }}
                    >
                        <MoreHorizontal size={14} />
                    </IGRPButtonPrimitive>
                    {menuOpen && (
                        <div
                            className="absolute right-0 top-7 z-10 w-32 rounded-md border bg-popover p-1 shadow-md"
                            onMouseLeave={() => setMenuOpen(false)}
                        >
                            <button
                                type="button"
                                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-accent"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setMenuOpen(false)
                                    onReindex()
                                }}
                            >
                                <RefreshCw size={12} /> Reindex
                            </button>
                            <button
                                type="button"
                                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-red-500 hover:bg-accent"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setMenuOpen(false)
                                    onRemove()
                                }}
                            >
                                <Trash2 size={12} /> Remove
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── Content variant ──────────────────────────────────────────────────────

const ContentVariant = ({ basePath }: PanelProps): JSX.Element => {
    const dispatch = useDispatch<any>()
    const selectedId = useSelector((s: RootState) => s.specKB.selectedId)
    const item = useSelector((s: RootState) =>
        s.specKB.items.find((i) => i.id === selectedId) ?? null
    )
    const lastSearch = useSelector((s: RootState) => s.specKB.lastSearch)

    const [markdown, setMarkdown] = useState<string | null>(null)
    const [viewRaw, setViewRaw] = useState(false)
    const [searchInput, setSearchInput] = useState('')
    const [searchPending, setSearchPending] = useState(false)

    useEffect(() => {
        let cancelled = false
        if (!basePath || !selectedId) {
            setMarkdown(null)
            return
        }
        window.specKB.get(basePath, selectedId).then((res) => {
            if (cancelled) return
            setMarkdown(res?.markdown ?? null)
        })
        return () => {
            cancelled = true
        }
    }, [basePath, selectedId])

    if (!item) {
        return (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent">
                    <LayoutIcon className="text-muted-foreground/40" size={28} />
                </div>
                <h3 className="mb-1 text-sm font-semibold">Select an item</h3>
                <p className="max-w-[260px] text-xs text-muted-foreground">
                    Pick a resource from the list to preview its indexed content and metadata.
                </p>
            </div>
        )
    }

    const handleSearch = async (event: FormEvent) => {
        event.preventDefault()
        if (!basePath || !searchInput.trim()) return
        setSearchPending(true)
        try {
            await dispatch(semanticSearchKB(basePath, searchInput, 5))
        } finally {
            setSearchPending(false)
        }
    }

    return (
        <div className="flex h-full flex-col">
            <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background/50 px-6">
                <div className="flex items-center gap-3 min-w-0">
                    {typeIcon(item.type)}
                    <h3 className="truncate text-sm font-semibold" title={item.name}>
                        {item.name}
                    </h3>
                </div>
                <div className="flex items-center gap-2">
                    <IGRPButtonPrimitive
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-xs"
                        onClick={() => setViewRaw((v) => !v)}
                    >
                        <Eye size={14} /> {viewRaw ? 'Rendered' : 'View Raw'}
                    </IGRPButtonPrimitive>
                    <IGRPButtonPrimitive
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => basePath && dispatch(removeKBItem(basePath, item.id))}
                        title="Remove from KB"
                    >
                        <Trash2 size={14} className="text-red-500" />
                    </IGRPButtonPrimitive>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto">
                <div className="mx-auto max-w-3xl p-8">
                    <div className="mb-8 grid grid-cols-2 gap-4">
                        <MetadataCard
                            label="Metadata"
                            rows={[
                                ['Origin', item.origin],
                                ['Size', formatBytes(item.size)],
                                ['Created', relativeTime(item.createdAt)]
                            ]}
                        />
                        <MetadataCard
                            label="Indexing"
                            rows={[
                                ['Status', KNOWN_STATUS_LABEL[item.status]],
                                ['Chunks', String(item.chunks ?? 0)],
                                ['Last update', relativeTime(item.updatedAt)]
                            ]}
                        />
                    </div>

                    {item.error && (
                        <div className="mb-6 flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-500">
                            <AlertCircle size={14} className="mt-0.5 shrink-0" />
                            <span>{item.error}</span>
                        </div>
                    )}

                    {markdown === null ? (
                        <p className="text-xs text-muted-foreground">No converted content yet.</p>
                    ) : viewRaw ? (
                        <pre className="whitespace-pre-wrap rounded-md border bg-card/40 p-4 font-mono text-[11px] leading-relaxed">
                            {markdown}
                        </pre>
                    ) : (
                        // Phase 1: minimal renderer — react-markdown lands in M2.
                        <article className="prose prose-sm max-w-none whitespace-pre-wrap font-sans text-sm leading-relaxed">
                            {markdown}
                        </article>
                    )}
                </div>
            </div>

            {/* Semantic Search */}
            <div className="border-t bg-background p-4">
                <div className="mb-3 flex items-center gap-2">
                    <Search size={14} className="text-primary" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Semantic Search
                    </span>
                </div>
                <form onSubmit={handleSearch} className="flex gap-3">
                    <IGRPInputPrimitive
                        placeholder="Ask the KB…"
                        className="h-9 flex-1 text-xs"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                    <IGRPButtonPrimitive
                        type="submit"
                        size="sm"
                        className="h-9 px-4 text-xs"
                        disabled={searchPending || !searchInput.trim()}
                    >
                        {searchPending ? 'Searching…' : 'Search'}
                    </IGRPButtonPrimitive>
                </form>
                {lastSearch && lastSearch.hits.length > 0 && (
                    <div className="mt-3 max-h-40 space-y-1.5 overflow-y-auto">
                        {lastSearch.hits.map((hit) => (
                            <div
                                key={hit.id}
                                className="rounded-md border bg-card/50 p-2 text-[11px]"
                            >
                                <div className="mb-1 flex items-center justify-between text-muted-foreground">
                                    <span>score {hit.score.toFixed(3)}</span>
                                    <span className="truncate">
                                        {(hit.metadata?.headings as string[] | undefined)?.join(
                                            ' › '
                                        ) ?? ''}
                                    </span>
                                </div>
                                <p className="line-clamp-3 leading-snug">{hit.text}</p>
                            </div>
                        ))}
                    </div>
                )}
                {lastSearch && lastSearch.hits.length === 0 && (
                    <p className="mt-3 text-[11px] text-muted-foreground">
                        No results for "{lastSearch.query}".
                    </p>
                )}
            </div>
        </div>
    )
}

const MetadataCard = ({
    label,
    rows
}: {
    label: string
    rows: Array<[string, string]>
}): JSX.Element => (
    <div className="rounded-lg border bg-card p-3">
        <div className="mb-2 text-[10px] font-bold uppercase text-muted-foreground">{label}</div>
        <div className="space-y-1.5 text-xs">
            {rows.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="truncate text-foreground" title={v}>
                        {v}
                    </span>
                </div>
            ))}
        </div>
    </div>
)

const KnowledgeBasePanel = ({ variant = 'content', ...rest }: PanelProps): JSX.Element => {
    return variant === 'list' ? <ListVariant {...rest} /> : <ContentVariant {...rest} />
}

export default KnowledgeBasePanel
