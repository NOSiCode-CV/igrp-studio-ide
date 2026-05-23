import { IGRPButtonPrimitive, IGRPInputPrimitive } from '@igrp/igrp-framework-react-design-system'
import { cn } from '@renderer/lib/utils'
import type { KBItem } from '@renderer/redux/specKB/reducer'
import {
    Check,
    File as FileIcon,
    FileAudio,
    FileText,
    Globe,
    Hash,
    Image as ImageIcon,
    Library,
    Link as LinkIcon,
    Plus,
    RefreshCw,
    Search,
    Youtube
} from 'lucide-react'
import { type FormEvent, type JSX, useMemo, useState } from 'react'

interface DocInspectorProps {
    content: string
    docId: string
    /** Ids of the KBItems currently attached to the doc. */
    selectedKBRefs: string[]
    /** All KB items in the project (indexed + in-progress). */
    kbItems: KBItem[]
    onToggleKBRef: (kbItemId: string) => void
    /** Add a file to the KB without leaving the doc. Opens an OS picker upstream. */
    onAddKBFile: () => void
    onAddKBUrl: (url: string) => void
}

interface Heading {
    level: number
    text: string
    line: number
}

function parseHeadings(content: string): Heading[] {
    const out: Heading[] = []
    const lines = content.split('\n')
    let inFence = false
    lines.forEach((raw, idx) => {
        const line = raw.trimEnd()
        if (line.startsWith('```')) {
            inFence = !inFence
            return
        }
        if (inFence) return
        const match = /^(#{1,6})\s+(.+)$/.exec(line)
        if (match) {
            out.push({ level: match[1].length, text: match[2].trim(), line: idx })
        }
    })
    return out
}

function kbTypeIcon(type: KBItem['type']): JSX.Element {
    switch (type) {
        case 'pdf':
            return <FileText size={12} className="text-red-500" />
        case 'docx':
        case 'pptx':
        case 'xlsx':
        case 'html':
            return <FileIcon size={12} className="text-blue-500" />
        case 'url':
            return <Globe size={12} className="text-emerald-500" />
        case 'youtube':
            return <Youtube size={12} className="text-red-600" />
        case 'image':
            return <ImageIcon size={12} className="text-purple-500" />
        case 'audio':
            return <FileAudio size={12} className="text-amber-500" />
        default:
            return <FileIcon size={12} />
    }
}

export function DocInspector({
    content,
    selectedKBRefs,
    kbItems,
    onToggleKBRef,
    onAddKBFile,
    onAddKBUrl
}: DocInspectorProps): JSX.Element {
    const [filter, setFilter] = useState('')
    const [urlInputOpen, setUrlInputOpen] = useState(false)
    const [urlValue, setUrlValue] = useState('')

    const headings = useMemo(() => parseHeadings(content), [content])
    const selectedSet = useMemo(() => new Set(selectedKBRefs), [selectedKBRefs])
    const indexedKB = useMemo(() => kbItems.filter((k) => k.status === 'indexed'), [kbItems])
    const indexingKB = useMemo(
        () => kbItems.filter((k) => k.status !== 'indexed' && k.status !== 'error'),
        [kbItems]
    )

    const visible = useMemo(() => {
        const list = filter.trim()
            ? indexedKB.filter((k) => k.name.toLowerCase().includes(filter.toLowerCase()))
            : indexedKB
        return [...list].sort((a, b) => {
            const aSel = selectedSet.has(a.id) ? 0 : 1
            const bSel = selectedSet.has(b.id) ? 0 : 1
            if (aSel !== bSel) return aSel - bSel
            return a.name.localeCompare(b.name)
        })
    }, [indexedKB, filter, selectedSet])

    const handleSubmitUrl = (event: FormEvent) => {
        event.preventDefault()
        const trimmed = urlValue.trim()
        if (!trimmed) return
        onAddKBUrl(trimmed)
        setUrlValue('')
        setUrlInputOpen(false)
    }

    return (
        // Embedded inside the DocTabPane right pane — the parent owns the
        // width, border, and header tabs, so we render just the scroll body.
        <div className="flex h-full flex-col bg-background">
            <div className="flex-1 space-y-8 overflow-y-auto p-4">
                <section>
                    <h3 className="mb-3 flex items-center gap-2 text-xs font-bold">
                        <Hash size={14} className="text-primary" /> Table of Contents
                    </h3>
                    {headings.length === 0 ? (
                        <p className="text-[11px] italic text-muted-foreground">No headings yet.</p>
                    ) : (
                        <div className="space-y-1.5 text-[11px] text-muted-foreground">
                            {headings.map((h) => (
                                <div
                                    key={`${h.line}-${h.text}`}
                                    style={{ paddingLeft: `${(h.level - 1) * 8}px` }}
                                    className="cursor-pointer truncate hover:text-foreground"
                                    title={h.text}
                                >
                                    {h.text}
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section>
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="flex items-center gap-2 text-xs font-bold">
                            <Library size={14} className="text-primary" /> Knowledge Base
                        </h3>
                        <div className="flex items-center gap-1">
                            <span className="text-[10px] text-muted-foreground">
                                {selectedSet.size} selected
                            </span>
                            <button
                                type="button"
                                onClick={onAddKBFile}
                                title="Add file to KB"
                                className="rounded p-1 hover:bg-accent"
                            >
                                <Plus size={12} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setUrlInputOpen((v) => !v)}
                                title="Add URL to KB"
                                className={cn(
                                    'rounded p-1 hover:bg-accent',
                                    urlInputOpen && 'bg-accent'
                                )}
                            >
                                <LinkIcon size={12} />
                            </button>
                        </div>
                    </div>

                    {urlInputOpen && (
                        <form onSubmit={handleSubmitUrl} className="mb-2 flex gap-1.5">
                            <IGRPInputPrimitive
                                autoFocus
                                placeholder="https://… or youtube.com/…"
                                value={urlValue}
                                onChange={(e) => setUrlValue(e.target.value)}
                                className="h-7 text-[11px]"
                            />
                            <IGRPButtonPrimitive
                                type="submit"
                                size="sm"
                                className="h-7 px-2 text-[10px]"
                            >
                                Add
                            </IGRPButtonPrimitive>
                        </form>
                    )}

                    {indexingKB.length > 0 && (
                        <div className="mb-2 space-y-1">
                            {indexingKB.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center gap-2 rounded border border-dashed border-border p-2 text-[10px] text-muted-foreground"
                                >
                                    <RefreshCw size={10} className="animate-spin text-primary" />
                                    <span className="flex-1 truncate" title={item.name}>
                                        {item.name}
                                    </span>
                                    <span className="capitalize">{item.status}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {indexedKB.length === 0 && indexingKB.length === 0 ? (
                        <p className="text-[11px] italic text-muted-foreground">
                            No KB items yet — use <Plus size={10} className="inline" /> or
                            <LinkIcon size={10} className="inline" /> above to add references.
                        </p>
                    ) : (
                        <>
                            {indexedKB.length > 0 && (
                                <>
                                    <div className="relative mb-2">
                                        <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                                        <IGRPInputPrimitive
                                            placeholder="Filter KB…"
                                            value={filter}
                                            onChange={(e) => setFilter(e.target.value)}
                                            className="h-7 pl-7 text-[11px]"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        {visible.length === 0 ? (
                                            <p className="text-[11px] italic text-muted-foreground">
                                                No KB items match your filter.
                                            </p>
                                        ) : (
                                            visible.map((item) => {
                                                const selected = selectedSet.has(item.id)
                                                return (
                                                    <button
                                                        type="button"
                                                        key={item.id}
                                                        onClick={() => onToggleKBRef(item.id)}
                                                        className={cn(
                                                            'flex w-full items-center gap-2 rounded border p-2 text-left text-[10px] transition-colors',
                                                            selected
                                                                ? 'border-primary bg-primary/5'
                                                                : 'border-border bg-card hover:border-primary/30'
                                                        )}
                                                    >
                                                        <span
                                                            className={cn(
                                                                'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border',
                                                                selected
                                                                    ? 'border-primary bg-primary text-primary-foreground'
                                                                    : 'border-muted-foreground/40'
                                                            )}
                                                        >
                                                            {selected && <Check size={10} />}
                                                        </span>
                                                        {kbTypeIcon(item.type)}
                                                        <span
                                                            className="flex-1 truncate"
                                                            title={item.name}
                                                        >
                                                            {item.name}
                                                        </span>
                                                    </button>
                                                )
                                            })
                                        )}
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </section>
            </div>
        </div>
    )
}
