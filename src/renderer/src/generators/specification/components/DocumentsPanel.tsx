import { IGRPButtonPrimitive, IGRPInputPrimitive } from '@igrp/igrp-framework-react-design-system'
import { cn } from '@renderer/lib/utils'
import type { RootState } from '@renderer/redux'
import {
    docBufferChanged,
    docChatToggled,
    docInspectorToggled,
    docViewModeChanged,
    type DocNode
} from '@renderer/redux/specDocs/reducer'
import {
    createDocNode,
    loadDocs,
    removeDocNode,
    renameDocNode,
    saveDocBuffer,
    selectDoc,
    toggleDocKBRef
} from '@renderer/redux/specDocs/thunks'
import { addKBFile, addKBUrl } from '@renderer/redux/specKB/thunks'
import { FileText, FolderPlus, Plus, Search } from 'lucide-react'
import { useSpecification } from '../contexts/SpecificationContext'
import { AIAssistant } from './shared/AIAssistant'
import { type JSX, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DocEditor } from './documents/DocEditor'
import { DocFooter } from './documents/DocFooter'
import { DocInspector } from './documents/DocInspector'
import { DocPreview } from './documents/DocPreview'
import { DocToolbar } from './documents/DocToolbar'
import { FileTree } from './documents/FileTree'
import { NewNodeDialog, type DialogMode } from './documents/NewNodeDialog'

interface PanelProps {
    basePath?: string
    currentItem?: any
    variant?: 'list' | 'content'
}

const SAVE_DEBOUNCE_MS = 500

// ─── List variant (Explorer) ──────────────────────────────────────────────

const ListVariant = ({ basePath }: PanelProps): JSX.Element => {
    const dispatch = useDispatch<any>()
    const nodes = useSelector((s: RootState) => s.specDocs.nodes)
    const isLoading = useSelector((s: RootState) => s.specDocs.isLoading)
    const selectedId = useSelector((s: RootState) => s.specDocs.selectedId)

    const [search, setSearch] = useState('')
    const [dialogMode, setDialogMode] = useState<DialogMode | null>(null)

    useEffect(() => {
        if (basePath) dispatch(loadDocs(basePath))
    }, [basePath, dispatch])

    const filteredNodes = useMemo(() => {
        if (!search.trim()) return nodes
        const needle = search.toLowerCase()
        const matchingIds = new Set<string>()
        nodes.forEach((n) => {
            if (n.name.toLowerCase().includes(needle)) {
                matchingIds.add(n.id)
                // Include ancestors so the tree path stays visible.
                let cursor: DocNode | undefined = n
                while (cursor && cursor.parentId) {
                    matchingIds.add(cursor.parentId)
                    cursor = nodes.find((p) => p.id === cursor!.parentId)
                }
            }
        })
        return nodes.filter((n) => matchingIds.has(n.id))
    }, [nodes, search])

    const handleSelect = (id: string) => {
        if (basePath) dispatch(selectDoc(basePath, id))
    }

    const handleConfirmDialog = async ({
        name,
        template
    }: {
        name: string
        template?: { content: string }
    }) => {
        if (!basePath || !dialogMode) return
        if (dialogMode.kind === 'create') {
            await dispatch(
                createDocNode(basePath, {
                    name,
                    parentId: dialogMode.parentId ?? null,
                    type: dialogMode.type,
                    content: dialogMode.type === 'file' ? template?.content ?? '' : undefined
                })
            )
        } else {
            await dispatch(renameDocNode(basePath, dialogMode.nodeId, name))
        }
    }

    const handleRemove = (id: string) => {
        if (!basePath) return
        const node = nodes.find((n) => n.id === id)
        if (!node) return
        if (
            window.confirm(
                node.type === 'folder'
                    ? `Remove folder "${node.name}" and all its contents?`
                    : `Remove "${node.name}"?`
            )
        ) {
            dispatch(removeDocNode(basePath, id))
        }
    }

    return (
        <div className="flex h-full flex-col">
            <div className="flex flex-col gap-3 border-b p-3">
                <div className="flex items-center gap-2">
                    <h2 className="flex-1 text-sm font-semibold">Explorer</h2>
                    <IGRPButtonPrimitive
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        title="New document"
                        onClick={() => setDialogMode({ kind: 'create', type: 'file' })}
                        disabled={!basePath}
                    >
                        <Plus size={14} />
                    </IGRPButtonPrimitive>
                    <IGRPButtonPrimitive
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        title="New folder"
                        onClick={() => setDialogMode({ kind: 'create', type: 'folder' })}
                        disabled={!basePath}
                    >
                        <FolderPlus size={14} />
                    </IGRPButtonPrimitive>
                </div>
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3 w-3 text-muted-foreground" />
                    <IGRPInputPrimitive
                        placeholder="Find docs…"
                        className="h-8 pl-8 text-[11px]"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto">
                {isLoading && nodes.length === 0 ? (
                    <p className="p-4 text-xs text-muted-foreground">Loading…</p>
                ) : (
                    <FileTree
                        nodes={filteredNodes}
                        selectedId={selectedId}
                        onSelect={handleSelect}
                        onRename={(id) => {
                            const node = nodes.find((n) => n.id === id)
                            if (node) {
                                setDialogMode({
                                    kind: 'rename',
                                    nodeId: id,
                                    current: node.name
                                })
                            }
                        }}
                        onRemove={handleRemove}
                        onCreateInside={(parentId, type) =>
                            setDialogMode({ kind: 'create', type, parentId })
                        }
                    />
                )}
            </div>
            <NewNodeDialog
                open={dialogMode !== null}
                mode={dialogMode}
                onConfirm={handleConfirmDialog}
                onClose={() => setDialogMode(null)}
            />
        </div>
    )
}

// ─── Content variant (Editor + Preview + Inspector) ───────────────────────

const ContentVariant = ({ basePath }: PanelProps): JSX.Element => {
    const dispatch = useDispatch<any>()
    const { setActiveTab } = useSpecification()
    const nodes = useSelector((s: RootState) => s.specDocs.nodes)
    const selectedId = useSelector((s: RootState) => s.specDocs.selectedId)
    const buffer = useSelector((s: RootState) => s.specDocs.buffer)
    const dirty = useSelector((s: RootState) => s.specDocs.dirty)
    const saving = useSelector((s: RootState) => s.specDocs.saving)
    const viewMode = useSelector((s: RootState) => s.specDocs.viewMode)
    const inspectorOpen = useSelector((s: RootState) => s.specDocs.inspectorOpen)
    const chatOpen = useSelector((s: RootState) => s.specDocs.chatOpen)
    const kbItems = useSelector((s: RootState) => s.specKB.items)

    const node = useMemo(() => nodes.find((n) => n.id === selectedId) ?? null, [nodes, selectedId])
    const breadcrumbs = useMemo(() => buildBreadcrumbs(nodes, selectedId), [nodes, selectedId])

    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const flushSave = useCallback(
        (content: string) => {
            if (!basePath || !selectedId) return
            dispatch(saveDocBuffer(basePath, selectedId, content))
        },
        [basePath, selectedId, dispatch]
    )

    const handleEditorChange = useCallback(
        (next: string) => {
            dispatch(docBufferChanged(next))
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
            saveTimerRef.current = setTimeout(() => flushSave(next), SAVE_DEBOUNCE_MS)
        },
        [dispatch, flushSave]
    )

    // Flush pending save when switching docs / unmounting.
    useEffect(() => {
        return () => {
            if (saveTimerRef.current) {
                clearTimeout(saveTimerRef.current)
                if (dirty && selectedId && basePath) flushSave(buffer)
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedId])

    const handleDropFile = async (filePath: string) => {
        try {
            const { markdown } = await window.specDoc.convertAndInsert(filePath)
            const next = buffer ? `${buffer}\n\n${markdown}` : markdown
            dispatch(docBufferChanged(next))
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
            saveTimerRef.current = setTimeout(() => flushSave(next), SAVE_DEBOUNCE_MS)
        } catch (err) {
            console.error('[docs] convertAndInsert failed', err)
        }
    }

    if (!node) {
        return (
            <div className="flex h-full flex-col items-center justify-center bg-card/20 p-8 text-center">
                <FileText className="mb-4 text-muted-foreground/30" size={48} />
                <h3 className="mb-1 text-sm font-semibold">No document selected</h3>
                <p className="max-w-[260px] text-xs text-muted-foreground">
                    Select a file from the explorer or create a new one to start writing.
                </p>
            </div>
        )
    }

    return (
        <div className="flex h-full">
            <div className="flex min-w-0 flex-1 flex-col">
                <DocToolbar
                    breadcrumbs={breadcrumbs}
                    docName={node.name}
                    viewMode={viewMode}
                    onViewModeChange={(mode) => dispatch(docViewModeChanged(mode))}
                    chatOpen={chatOpen}
                    onToggleChat={() => dispatch(docChatToggled(undefined))}
                />
                <div className="flex min-h-0 flex-1 overflow-hidden">
                    {(viewMode === 'edit' || viewMode === 'split') && (
                        <div
                            className={cn(
                                'h-full flex-1 overflow-hidden',
                                viewMode === 'split' && 'border-r'
                            )}
                        >
                            <DocEditor
                                value={buffer}
                                onChange={handleEditorChange}
                                onDropFile={handleDropFile}
                            />
                        </div>
                    )}
                    {(viewMode === 'preview' || viewMode === 'split') && (
                        <div className="h-full flex-1 overflow-hidden">
                            <DocPreview content={buffer} />
                        </div>
                    )}
                    {chatOpen && (
                        <div className="flex w-[360px] shrink-0 flex-col border-l">
                            <AIAssistant
                                mode="docs"
                                supportsKB
                                onApplyToDocument={(applyMode, markdown) => {
                                    const next =
                                        applyMode === 'replace'
                                            ? markdown
                                            : buffer.trim()
                                              ? `${buffer}\n\n${markdown}`
                                              : markdown
                                    handleEditorChange(next)
                                }}
                                contextProvider={async ({ userMessage, useKB }) => {
                                    const refs = node.kbRefs ?? []
                                    const linked = kbItems.filter((k) => refs.includes(k.id))
                                    const isEmptyDoc = buffer.trim().length === 0

                                    // RAG step — when the user enabled KB context AND has
                                    // linked items AND there's a query to embed, fetch real
                                    // chunks from LanceDB and ground the prompt in them.
                                    let kbBlock = ''
                                    let labelSuffix = ''
                                    if (useKB && linked.length > 0 && userMessage.trim() && basePath) {
                                        try {
                                            const hits = await window.specKB.search(
                                                basePath,
                                                userMessage,
                                                6,
                                                { kbItemIds: linked.map((k) => k.id) }
                                            )
                                            if (hits.length > 0) {
                                                const lookup = new Map(linked.map((k) => [k.id, k.name]))
                                                const formatted = hits
                                                    .map((h, idx) => {
                                                        const ownerId = h.metadata?.kbItemId as
                                                            | string
                                                            | undefined
                                                        const ownerName = ownerId
                                                            ? (lookup.get(ownerId) ?? ownerId)
                                                            : 'Unknown'
                                                        return `### Chunk ${idx + 1} · score ${h.score.toFixed(3)} · from "${ownerName}"\n\n${h.text}`
                                                    })
                                                    .join('\n\n---\n\n')
                                                kbBlock = `## Knowledge Base context (top ${hits.length} chunks, retrieved from linked items)\n\n${formatted}`
                                                labelSuffix = ` · ${hits.length} chunks`
                                            } else {
                                                kbBlock =
                                                    '## Knowledge Base context\n_Search ran but found no chunks above relevance threshold._'
                                            }
                                        } catch (err) {
                                            kbBlock = `## Knowledge Base context\n_Search failed: ${err instanceof Error ? err.message : String(err)}_`
                                        }
                                    }

                                    const sections: string[] = []

                                    sections.push(
                                        [
                                            'You are the inline AI Assistant of an IGRP Studio "Specification" project, helping the user author the markdown document open in their editor.',
                                            '',
                                            'Output contract — VERY IMPORTANT:',
                                            '1. When the user asks you to draft, fill, generate, write or rewrite the document (or any section of it), respond with **only** a single fenced markdown block, opened with ```markdown and closed with ```. No prose before or after the block.',
                                            '2. When the user asks you to add or extend (e.g. "add a Risks section"), still emit a single fenced markdown block — but containing only the new fragment to be appended, without restating the rest of the document.',
                                            '3. When the user asks an analytical or conversational question ("what is missing?", "summarise this", "is this consistent?"), reply in plain prose. Do NOT wrap normal answers in a fenced block.',
                                            '4. Never answer with both prose AND a markdown block. The Studio will copy/insert the block verbatim into the user\'s document — surrounding prose would leak into the file.',
                                            '5. Ground every factual claim in (a) the document, (b) the Knowledge Base chunks below when present, (c) the linked items list. Cite chunks inline as `[KB: <item name>]`. If the KB does not contain the answer, say so; do not invent.'
                                        ].join('\n')
                                    )

                                    sections.push(
                                        `## Active document: ${node.name}${isEmptyDoc ? ' (currently empty)' : ''}\n\n\`\`\`markdown\n${buffer}\n\`\`\``
                                    )

                                    if (linked.length > 0) {
                                        const names = linked.map((k) => `- ${k.name}`).join('\n')
                                        sections.push(
                                            `## Linked Knowledge Base items (${linked.length})\n${names}`
                                        )
                                    } else {
                                        sections.push(
                                            '## Linked Knowledge Base items\n_None — answers will not be grounded in external sources. Encourage the user to link KB items if accuracy matters._'
                                        )
                                    }

                                    if (kbBlock) sections.push(kbBlock)

                                    const baseLabel = `Editing "${node.name}"`
                                    let label: string
                                    if (linked.length === 0) {
                                        label = `${baseLabel} · no KB linked`
                                    } else if (useKB) {
                                        label = `${baseLabel} · KB grounded${labelSuffix}`
                                    } else {
                                        label = `${baseLabel} · ${linked.length} KB linked (KB off)`
                                    }

                                    return {
                                        systemPrompt: sections.join('\n\n'),
                                        contextLabel: label
                                    }
                                }}
                            />
                        </div>
                    )}
                </div>
                <DocFooter
                    content={buffer}
                    saving={saving}
                    dirty={dirty}
                    onToggleInspector={() => dispatch(docInspectorToggled(undefined))}
                />
            </div>
            {inspectorOpen && (
                <DocInspector
                    content={buffer}
                    docId={node.id}
                    selectedKBRefs={node.kbRefs ?? []}
                    kbItems={kbItems}
                    onToggleKBRef={(kbItemId) =>
                        basePath && dispatch(toggleDocKBRef(basePath, node.id, kbItemId))
                    }
                    onAddKBFile={async () => {
                        if (!basePath) return
                        const filePath = await window.specKB.pickFile()
                        if (filePath) dispatch(addKBFile(basePath, filePath))
                    }}
                    onAddKBUrl={(url) => {
                        if (!basePath) return
                        const isYoutube = /youtube\.com|youtu\.be/.test(url)
                        dispatch(addKBUrl(basePath, url, isYoutube))
                    }}
                    onUseInPrototype={() => setActiveTab('prototype')}
                />
            )}
        </div>
    )
}

function buildBreadcrumbs(nodes: DocNode[], id: string | null): string[] {
    if (!id) return []
    const out: string[] = []
    let cursor = nodes.find((n) => n.id === id)
    while (cursor && cursor.parentId) {
        const parent = nodes.find((n) => n.id === cursor!.parentId)
        if (!parent) break
        out.unshift(parent.name)
        cursor = parent
    }
    return out
}

const DocumentsPanel = ({ variant = 'content', ...rest }: PanelProps): JSX.Element => {
    return variant === 'list' ? <ListVariant {...rest} /> : <ContentVariant {...rest} />
}

export default DocumentsPanel
