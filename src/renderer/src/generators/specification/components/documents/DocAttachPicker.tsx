import { IGRPButtonPrimitive, IGRPInputPrimitive } from '@igrp/igrp-framework-react-design-system'
import { cn } from '@renderer/lib/utils'
import type { DocNode } from '@renderer/redux/specDocs/reducer'
import { AtSign, Check, FileText, Search } from 'lucide-react'
import { type JSX, useEffect, useMemo, useRef, useState } from 'react'

interface DocAttachPickerProps {
    /** All doc nodes in the spec (folders are filtered out internally). */
    nodes: DocNode[]
    /** Doc id to hide from the list (the active doc — can't attach itself). */
    excludeDocId?: string | null
    /** Currently attached doc ids — drives the checkbox state. */
    attachedIds: string[]
    /** Toggle a doc id's attached status. */
    onToggle: (docId: string) => void
    /** Approximate label rendered next to each row (e.g. token estimate). */
    estimateTokens?: (docId: string) => number | null
}

/**
 * Compact popover-style picker mounted in the AIAssistant composer slot.
 * Lets the user attach other docs in the spec to the current chat session
 * as read-only context. Independent of the doc-level `kbRefs` field —
 * attachments live with the chat, not the doc.
 */
export function DocAttachPicker({
    nodes,
    excludeDocId,
    attachedIds,
    onToggle,
    estimateTokens
}: DocAttachPickerProps): JSX.Element {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (!open) return
        const handler = (e: MouseEvent) => {
            if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [open])

    useEffect(() => {
        if (open) inputRef.current?.focus()
    }, [open])

    const candidates = useMemo(() => {
        const files = nodes.filter((n) => n.type === 'file' && n.id !== excludeDocId)
        if (!query.trim()) return files
        const needle = query.toLowerCase()
        return files.filter((n) => n.name.toLowerCase().includes(needle))
    }, [nodes, excludeDocId, query])

    const attachedCount = attachedIds.length

    return (
        <div ref={containerRef} className="relative">
            <IGRPButtonPrimitive
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 gap-1 px-1.5 text-[10px]"
                onClick={() => setOpen((v) => !v)}
                title="Attach a doc to this chat"
            >
                <AtSign size={11} />
                Attach
                {attachedCount > 0 && (
                    <span className="rounded bg-primary/15 px-1 text-primary">
                        {attachedCount}
                    </span>
                )}
            </IGRPButtonPrimitive>
            {open && (
                <div className="absolute bottom-8 left-0 z-30 w-[280px] rounded-md border bg-popover p-2 shadow-lg">
                    <div className="relative mb-2">
                        <Search
                            size={11}
                            className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                        />
                        <IGRPInputPrimitive
                            ref={inputRef}
                            placeholder="Find docs in this spec…"
                            className="h-7 pl-7 text-[11px]"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                    <div className="max-h-[260px] overflow-y-auto">
                        {candidates.length === 0 ? (
                            <p className="p-2 text-[10px] italic text-muted-foreground">
                                No docs match.
                            </p>
                        ) : (
                            candidates.map((node) => {
                                const isAttached = attachedIds.includes(node.id)
                                const tokens = estimateTokens?.(node.id) ?? null
                                return (
                                    <button
                                        key={node.id}
                                        type="button"
                                        onClick={() => onToggle(node.id)}
                                        className={cn(
                                            'flex w-full items-center gap-2 rounded px-1.5 py-1 text-left text-[11px] transition-colors',
                                            'hover:bg-accent',
                                            isAttached && 'bg-secondary/40'
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border',
                                                isAttached
                                                    ? 'border-primary bg-primary text-primary-foreground'
                                                    : 'border-muted-foreground/30'
                                            )}
                                        >
                                            {isAttached && <Check size={9} />}
                                        </span>
                                        <FileText size={11} className="shrink-0 text-muted-foreground" />
                                        <span className="flex-1 truncate">{node.name}</span>
                                        {tokens !== null && (
                                            <span className="shrink-0 text-[9px] text-muted-foreground">
                                                ~{formatTokens(tokens)}
                                            </span>
                                        )}
                                    </button>
                                )
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

function formatTokens(n: number): string {
    if (n < 1000) return `${n}`
    return `${(n / 1000).toFixed(1)}K`
}
