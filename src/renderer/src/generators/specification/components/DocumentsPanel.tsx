import { IGRPButtonPrimitive, IGRPInputPrimitive } from '@igrp/igrp-framework-react-design-system'
import { TAB_DEFAULT, useTabs } from '@renderer/components/navigation/TabContext'
import TabsNavigation from '@renderer/components/navigation/tabs-navigation'
import { cn } from '@renderer/lib/utils'
import type { RootState } from '@renderer/redux'
import {
    docBufferChanged,
    docProposalEditToggled,
    docProposalResolved,
    docProposalStaged,
    docRightPaneSet,
    docTabClosed,
    docViewModeChanged,
    makeSelectDocProposalStatus,
    rightPaneWidthChanged,
    selectDocBuffer,
    selectDocDirty,
    selectDocNodes,
    selectDocPendingProposal,
    selectDocProposalSummaries,
    selectDocRightPane,
    selectDocSaving,
    selectDocViewMode,
    selectDocsLoading,
    selectRightPaneWidth,
    selectSelectedDocId,
    type DocNode,
    type DocRightPane
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
import { FileText, FolderPlus, MessageSquare, PanelRight, Plus, Search, X } from 'lucide-react'
import { type JSX, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector, useStore } from 'react-redux'
import { Group, Panel, Separator } from 'react-resizable-panels'
import type { editor as monacoEditorNs } from 'monaco-editor'
import { usePreviewToEditorScrollSync } from '../hooks/useDocScrollSync'
import { applyEdits, summariseEdits, type SREdit } from '../utils/searchReplaceParser'
import { DocAttachPicker } from './documents/DocAttachPicker'
import { DocDiffPreview } from './documents/DocDiffPreview'
import { DocEditor } from './documents/DocEditor'
import { DocFooter } from './documents/DocFooter'
import { DocInspector } from './documents/DocInspector'
import { DocPreview } from './documents/DocPreview'
import { DocToolbar } from './documents/DocToolbar'
import { FileTree } from './documents/FileTree'
import { NewNodeDialog, type DialogMode } from './documents/NewNodeDialog'
import { AIAssistant, type ChatAttachment } from './shared/AIAssistant'

interface PanelProps {
    basePath?: string
    currentItem?: any
    variant?: 'list' | 'content'
}

const SAVE_DEBOUNCE_MS = 500

// ─── List variant (Explorer) ──────────────────────────────────────────────

const ListVariant = ({ basePath }: PanelProps): JSX.Element => {
    const dispatch = useDispatch<any>()
    const { handleNewTab } = useTabs()
    const nodes = useSelector(selectDocNodes)
    const isLoading = useSelector(selectDocsLoading)
    const selectedId = useSelector(selectSelectedDocId)

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
                let cursor: DocNode | undefined = n
                while (cursor && cursor.parentId) {
                    matchingIds.add(cursor.parentId)
                    cursor = nodes.find((p) => p.id === cursor!.parentId)
                }
            }
        })
        return nodes.filter((n) => matchingIds.has(n.id))
    }, [nodes, search])

    const handleSelect = useCallback(
        (id: string) => {
            if (!basePath) return
            const node = nodes.find((n) => n.id === id)
            if (!node || node.type !== 'file') return
            handleNewTab({ id, title: node.name, open: 'none', item: { id } })
            dispatch(selectDoc(basePath, id))
        },
        [basePath, dispatch, handleNewTab, nodes]
    )

    const handleConfirmDialog = async ({
        name,
        template
    }: {
        name: string
        template?: { content: string }
    }) => {
        if (!basePath || !dialogMode) return
        if (dialogMode.kind === 'create') {
            const created = await dispatch(
                createDocNode(basePath, {
                    name,
                    parentId: dialogMode.parentId ?? null,
                    type: dialogMode.type,
                    content: dialogMode.type === 'file' ? (template?.content ?? '') : undefined
                })
            )
            if (created && created.type === 'file') {
                handleNewTab({
                    id: created.id,
                    title: created.name,
                    open: 'none',
                    item: { id: created.id }
                })
            }
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

// ─── Content variant (tabbed editor) ──────────────────────────────────────

const ContentVariant = ({ basePath }: PanelProps): JSX.Element => {
    const dispatch = useDispatch<any>()
    const { tabs, activeTab, setActiveTab, newTab } = useTabs()
    const selectedId = useSelector(selectSelectedDocId)

    // Real doc tabs (skip the placeholder 'tab-0').
    const docTabs = useMemo(() => tabs.filter((t) => t.id !== TAB_DEFAULT), [tabs])

    // Sync TabContext.activeTab → Redux.selectedId on tab header click.
    useEffect(() => {
        if (activeTab !== TAB_DEFAULT && activeTab !== selectedId && basePath) {
            dispatch(selectDoc(basePath, activeTab))
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, basePath])

    return (
        <div className="flex h-full min-h-0 flex-col">
            <TabsCleanup tabIds={docTabs.map((t) => t.id)} />
            <div className="border-b">
                <TabsNavigation
                    tabs={tabs}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    newTab={newTab}
                    btnNew={false}
                />
            </div>
            <div className="flex min-h-0 flex-1">
                {docTabs.length === 0 ? (
                    <EmptyState />
                ) : (
                    docTabs.map((tab) => (
                        <div
                            key={tab.id}
                            className={cn(
                                'flex min-h-0 flex-1',
                                activeTab === tab.id ? 'block' : 'hidden'
                            )}
                        >
                            <DocTabPane docId={tab.id} basePath={basePath} />
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

// ─── Tabs cleanup — drops per-doc Redux state when a tab closes ───────────

/**
 * Mirrors the `ui` generator's TabsCleanup pattern: tracks the tabs we've
 * seen and dispatches `docTabClosed` for any id that disappeared. Keeps the
 * `byDoc` map from leaking memory when users open/close many tabs.
 */
const TabsCleanup = ({ tabIds }: { tabIds: string[] }): null => {
    const dispatch = useDispatch<any>()
    const knownRef = useRef<Set<string>>(new Set())

    useEffect(() => {
        const current = new Set(tabIds)
        knownRef.current.forEach((id) => {
            if (!current.has(id)) dispatch(docTabClosed(id))
        })
        knownRef.current = current
    }, [tabIds, dispatch])

    return null
}

// ─── Empty state (no docs open) ───────────────────────────────────────────

const EmptyState = (): JSX.Element => (
    <div className="flex h-full w-full flex-col items-center justify-center bg-card/20 p-8 text-center">
        <FileText className="mb-4 text-muted-foreground/30" size={48} />
        <h3 className="mb-1 text-sm font-semibold">No document open</h3>
        <p className="max-w-[260px] text-xs text-muted-foreground">
            Pick a file from the explorer or create a new one to start writing. Open documents keep
            their state — edits, chat, and pending diffs — across tab switches.
        </p>
    </div>
)

// ─── Single doc pane (one per open tab) ───────────────────────────────────

interface DocTabPaneProps {
    docId: string
    basePath?: string
}

/**
 * Owns one open document. All Redux reads are scoped to `docId` so changes
 * in other tabs don't trigger re-renders here. The pane stays mounted while
 * the tab is open (TabsNavigation hides inactive tabs via display CSS), so
 * the AIAssistant's local message history is preserved across tab switches
 * without needing to live in Redux.
 */
const DocTabPane = ({ docId, basePath }: DocTabPaneProps): JSX.Element | null => {
    const dispatch = useDispatch<any>()

    const nodes = useSelector(selectDocNodes)
    const buffer = useSelector(selectDocBuffer(docId))
    const dirty = useSelector(selectDocDirty(docId))
    const saving = useSelector(selectDocSaving(docId))
    const viewMode = useSelector(selectDocViewMode(docId))
    const rightPane = useSelector(selectDocRightPane(docId))
    const rightPaneWidth = useSelector(selectRightPaneWidth)
    const pendingProposal = useSelector(selectDocPendingProposal(docId))
    const proposalSummaries = useSelector(selectDocProposalSummaries(docId))
    const proposalStatusSelector = useMemo(() => makeSelectDocProposalStatus(docId), [docId])
    const proposalStatus = useSelector(proposalStatusSelector)
    const kbItems = useSelector((s: RootState) => s.specKB.items)

    const node = useMemo(() => nodes.find((n) => n.id === docId) ?? null, [nodes, docId])
    const breadcrumbs = useMemo(() => buildBreadcrumbs(nodes, docId), [nodes, docId])

    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const flushSave = useCallback(
        (content: string) => {
            if (!basePath) return
            dispatch(saveDocBuffer(basePath, docId, content))
        },
        [basePath, docId, dispatch]
    )

    const handleEditorChange = useCallback(
        (next: string) => {
            dispatch(docBufferChanged({ id: docId, content: next }))
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
            saveTimerRef.current = setTimeout(() => flushSave(next), SAVE_DEBOUNCE_MS)
        },
        [dispatch, docId, flushSave]
    )

    // Flush pending save on unmount (tab close).
    useEffect(() => {
        return () => {
            if (saveTimerRef.current) {
                clearTimeout(saveTimerRef.current)
                if (dirty && basePath) flushSave(buffer)
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [docId])

    const handleProposeChange = useCallback(
        (messageId: string, edits: SREdit[]) => {
            const { result, ops } = applyEdits(buffer, edits)
            // Default selection: every successful edit is checked, every
            // failed one is unchecked (disabled in the UI). The `applied`
            // buffer already reflects this since `applyEdits` skips failed
            // ops anyway.
            const selected = ops.map((op) => op.ok)
            dispatch(
                docProposalStaged({
                    id: docId,
                    proposal: {
                        messageId,
                        edits,
                        snapshot: buffer,
                        selected,
                        applied: result,
                        ops
                    },
                    summary: summariseEdits(edits, ops)
                })
            )
        },
        [buffer, dispatch, docId]
    )

    const handleProposalEditToggle = useCallback(
        (messageId: string, editIndex: number) => {
            dispatch(docProposalEditToggled({ id: docId, messageId, editIndex }))
        },
        [dispatch, docId]
    )

    const handleApplyProposal = useCallback(() => {
        if (!pendingProposal) return
        handleEditorChange(pendingProposal.applied)
        dispatch(
            docProposalResolved({
                id: docId,
                messageId: pendingProposal.messageId,
                status: 'applied'
            })
        )
    }, [pendingProposal, handleEditorChange, dispatch, docId])

    const handleRejectProposal = useCallback(() => {
        if (!pendingProposal) return
        dispatch(
            docProposalResolved({
                id: docId,
                messageId: pendingProposal.messageId,
                status: 'rejected'
            })
        )
    }, [pendingProposal, dispatch, docId])

    const handleDropFile = useCallback(
        async (filePath: string) => {
            try {
                const { markdown } = await window.specDoc.convertAndInsert(filePath)
                const next = buffer ? `${buffer}\n\n${markdown}` : markdown
                dispatch(docBufferChanged({ id: docId, content: next }))
                if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
                saveTimerRef.current = setTimeout(() => flushSave(next), SAVE_DEBOUNCE_MS)
            } catch (err) {
                console.error('[docs] convertAndInsert failed', err)
            }
        },
        [buffer, dispatch, docId, flushSave]
    )

    // ─── Chat attachments (per-chat-session, lives with this DocTabPane) ──
    //
    // List of other doc ids the user attached as read-only context to the
    // current chat. Persists while the tab is mounted (= open) and is reset
    // when the tab closes — same lifetime as the AIAssistant message history.
    //
    // Need the store ref so the contextProvider closure can read the latest
    // buffer of attached docs without subscribing the component to byDoc
    // changes (which would re-render every keystroke in any tab).
    const store = useStore<RootState>()
    const [attachedDocIds, setAttachedDocIds] = useState<string[]>([])

    const toggleAttachedDoc = useCallback((id: string) => {
        setAttachedDocIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        )
    }, [])

    // Auto-clean orphans (attached doc was deleted from disk).
    useEffect(() => {
        const validIds = new Set(nodes.map((n) => n.id))
        setAttachedDocIds((prev) => prev.filter((id) => validIds.has(id)))
    }, [nodes])

    const chatAttachments = useMemo<ChatAttachment[]>(() => {
        const out: ChatAttachment[] = []
        for (const id of attachedDocIds) {
            const ref = nodes.find((n) => n.id === id)
            if (!ref) continue
            out.push({ id, name: ref.name, kind: 'doc' })
        }
        return out
    }, [attachedDocIds, nodes])

    const estimateAttachmentTokens = useCallback(
        (id: string): number | null => {
            const state = store.getState()
            const buf = state.specDocs.byDoc[id]?.buffer
            if (typeof buf !== 'string') return null
            return Math.ceil(buf.length / 4)
        },
        [store]
    )

    const contextProvider = useCallback(
        async ({ userMessage, useKB }: { userMessage: string; useKB: boolean }) => {
            const refs = node?.kbRefs ?? []
            const linked = kbItems.filter((k) => refs.includes(k.id))
            const isEmptyDoc = buffer.trim().length === 0

            // ─── Read attached docs (chat-level) ─────────────────────────
            //
            // Buffer-first: if the doc is also open in another tab, use the
            // live (potentially unsaved) buffer. Otherwise fall back to disk
            // via IPC. We deliberately don't memoise this across turns —
            // attached doc contents may have changed since last turn.
            const attachedSections: string[] = []
            if (attachedDocIds.length > 0) {
                const storeState = store.getState()
                const reads = await Promise.all(
                    attachedDocIds.map(async (id) => {
                        const refNode = nodes.find((n) => n.id === id)
                        if (!refNode) return null
                        const liveBuffer = storeState.specDocs.byDoc[id]?.buffer
                        const dirty = Boolean(storeState.specDocs.byDoc[id]?.dirty)
                        let content = liveBuffer
                        if (typeof content !== 'string') {
                            try {
                                if (basePath) {
                                    const result = await window.specDoc.read(basePath, id)
                                    content = result?.content ?? ''
                                }
                            } catch {
                                content = ''
                            }
                        }
                        const tag = dirty ? ' (unsaved buffer)' : ''
                        return `### Reference document: ${refNode.name}${tag}\n\n\`\`\`markdown\n${content ?? ''}\n\`\`\``
                    })
                )
                for (const section of reads) {
                    if (section) attachedSections.push(section)
                }
            }

            let kbBlock = ''
            let labelSuffix = ''
            if (useKB && linked.length > 0 && userMessage.trim() && basePath) {
                try {
                    const hits = await window.specKB.search(basePath, userMessage, 6, {
                        kbItemIds: linked.map((k) => k.id)
                    })
                    if (hits.length > 0) {
                        const lookup = new Map(linked.map((k) => [k.id, k.name]))
                        const formatted = hits
                            .map((h, idx) => {
                                const ownerId = h.metadata?.kbItemId as string | undefined
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
                    '## Document roles — STRICT',
                    '',
                    'Three categories of content can appear below — keep them straight in your head:',
                    '',
                    '1. **Active document** (`## Active document`) — the doc the user is editing. **Only this** can be modified via SEARCH/REPLACE blocks.',
                    '2. **Reference documents** (`## Reference documents`) — other docs from the same Specification project, attached by the user as read-only context for this chat. Treat them as authoritative source material for the active document. **Never emit SEARCH/REPLACE blocks against them.** Cite information from them inline as `[Doc: <name>]`.',
                    '3. **Knowledge Base** (`## Linked Knowledge Base items` / `## Knowledge Base context`) — external knowledge (PDFs, URLs, papers). Cite as `[KB: <item name>]`. Lower authority than reference documents.',
                    '',
                    'If a reference document contradicts the active document, surface the conflict to the user in prose **before** proposing edits — do not silently rewrite history.',
                    '',
                    'When deriving content from a reference (e.g. "from the PRD, generate user stories"), preserve its terminology — if the PRD says "customer", do not write "user".',
                    '',
                    '## Editing protocol — VERY IMPORTANT',
                    '',
                    'When the user asks you to MODIFY the document (add a section, fix a sentence, replace a heading, delete a paragraph, draft a new doc, etc.), reply with one or more SEARCH/REPLACE blocks in this EXACT format:',
                    '',
                    '<<<<<<< SEARCH',
                    '<exact text from the current document, including whitespace>',
                    '=======',
                    '<the new text>',
                    '>>>>>>> REPLACE',
                    '',
                    '### Rules',
                    '1. The text inside SEARCH must match the document VERBATIM — same characters, same whitespace, same line breaks. Quote enough surrounding context to be UNIQUE in the doc.',
                    '2. To INSERT new content (no existing text to replace) leave SEARCH empty:',
                    '   <<<<<<< SEARCH',
                    '   =======',
                    '   ## New section',
                    '   Content here.',
                    '   >>>>>>> REPLACE',
                    '   This appends to the end of the document. To insert at a specific spot, use a SEARCH block that matches a unique anchor (e.g. a heading) and put the new content before/after it inside REPLACE.',
                    '3. To DELETE content, leave REPLACE empty.',
                    '4. To REWRITE the whole document, emit a single block whose SEARCH matches the entire current doc.',
                    '5. Multiple blocks are allowed; they are applied in order. Each SEARCH must match the doc as it was BEFORE any edits in this turn (do not chain matches against your own previous REPLACE).',
                    '6. Do NOT wrap the blocks in a code fence. Emit the raw `<<<<<<< SEARCH … >>>>>>> REPLACE` lines.',
                    '7. Do NOT mix prose and edit blocks in the same reply. Either you are editing (only blocks) or you are answering a question (only prose).',
                    '',
                    '### When NOT to emit blocks',
                    'When the user asks an analytical or conversational question ("what is missing?", "summarise this", "is this consistent?", "explain X"), reply in plain prose. The Studio only opens the diff editor when blocks are present.',
                    '',
                    '### Grounding',
                    'Ground every factual claim in (a) the document, (b) the Knowledge Base chunks below when present, (c) the linked items list. Cite chunks inline as `[KB: <item name>]`. If the KB does not contain the answer, say so; do not invent.'
                ].join('\n')
            )

            if (attachedSections.length > 0) {
                sections.push(
                    `## Reference documents (${attachedSections.length}, read-only)\n\n${attachedSections.join('\n\n')}`
                )
            }

            sections.push(
                `## Active document: ${node?.name ?? 'Untitled'}${isEmptyDoc ? ' (currently empty)' : ''}\n\n\`\`\`markdown\n${buffer}\n\`\`\``
            )

            if (linked.length > 0) {
                const names = linked.map((k) => `- ${k.name}`).join('\n')
                sections.push(`## Linked Knowledge Base items (${linked.length})\n${names}`)
            } else {
                sections.push(
                    '## Linked Knowledge Base items\n_None — answers will not be grounded in external sources. Encourage the user to link KB items if accuracy matters._'
                )
            }

            if (kbBlock) sections.push(kbBlock)

            const baseLabel = `Editing "${node?.name ?? 'doc'}"`
            let label: string
            if (linked.length === 0) {
                label = `${baseLabel} · no KB linked`
            } else if (useKB) {
                label = `${baseLabel} · KB grounded${labelSuffix}`
            } else {
                label = `${baseLabel} · ${linked.length} KB linked (KB off)`
            }

            const attachLabel =
                attachedDocIds.length > 0 ? ` · ${attachedDocIds.length} attached` : ''
            return {
                systemPrompt: sections.join('\n\n'),
                contextLabel: label + attachLabel
            }
        },
        [attachedDocIds, basePath, buffer, kbItems, node, nodes, store]
    )

    const onSetRightPane = useCallback(
        (pane: DocRightPane) => dispatch(docRightPaneSet({ id: docId, pane })),
        [dispatch, docId]
    )

    // Remember the last non-null pane mode so the toolbar's collapse toggle
    // can restore it on re-open. State is per-tab and survives as long as the
    // tab is mounted (i.e. open). Default falls back to 'inspector' on first
    // open since that matches the slice's default rightPane.
    const [lastPane, setLastPane] = useState<Exclude<DocRightPane, null>>('inspector')
    useEffect(() => {
        if (rightPane) setLastPane(rightPane)
    }, [rightPane])

    const onTogglePane = useCallback(() => {
        onSetRightPane(rightPane ? null : lastPane)
    }, [onSetRightPane, rightPane, lastPane])

    // Refs for the editor instance + preview scroll container, used by the
    // scroll-sync hook below. The hook is a no-op unless we're in split mode
    // with no pending diff (the editor is replaced by DocDiffPreview during
    // a proposal review, breaking the ref).
    const editorRef = useRef<monacoEditorNs.IStandaloneCodeEditor | null>(null)
    const previewRef = useRef<HTMLDivElement | null>(null)
    const handleEditorMount = useCallback((instance: monacoEditorNs.IStandaloneCodeEditor) => {
        editorRef.current = instance
    }, [])
    usePreviewToEditorScrollSync(previewRef, editorRef, viewMode === 'split' && !pendingProposal)

    const onResizeRight = useCallback(
        (size: { inPixels: number }) => {
            // Skip persistence when the pane is collapsed (size becomes 0).
            if (size.inPixels >= 200) dispatch(rightPaneWidthChanged(size.inPixels))
        },
        [dispatch]
    )

    // Render guard — keep below all hooks so the hook count is stable when
    // the doc node was deleted (e.g. user removed the file from the
    // explorer while its tab was still open). React requires hooks to run
    // in the same order on every render; an early return above any hook
    // declaration breaks that contract and triggers
    // "Rendered fewer hooks than expected".
    if (!node) {
        return (
            <div className="flex h-full flex-col items-center justify-center bg-card/20 p-8 text-center">
                <FileText className="mb-4 text-muted-foreground/30" size={48} />
                <h3 className="mb-1 text-sm font-semibold">Document not found</h3>
                <p className="max-w-[260px] text-xs text-muted-foreground">
                    This document was removed. Close the tab to dismiss.
                </p>
            </div>
        )
    }

    const editorBody = (
        <div className="flex min-h-0 flex-1 overflow-hidden">
            {(viewMode === 'edit' || viewMode === 'split') && (
                <div
                    className={cn(
                        'h-full flex-1 overflow-hidden',
                        viewMode === 'split' && 'border-r'
                    )}
                >
                    {pendingProposal ? (
                        <DocDiffPreview
                            original={pendingProposal.snapshot}
                            proposed={pendingProposal.applied}
                            ops={pendingProposal.ops}
                            selected={pendingProposal.selected}
                            onApply={handleApplyProposal}
                            onReject={handleRejectProposal}
                        />
                    ) : (
                        <DocEditor
                            value={buffer}
                            onChange={handleEditorChange}
                            onDropFile={handleDropFile}
                            onMount={handleEditorMount}
                        />
                    )}
                </div>
            )}
            {(viewMode === 'preview' || viewMode === 'split') && (
                <div className="h-full flex-1 overflow-hidden">
                    <DocPreview content={buffer} ref={previewRef} />
                </div>
            )}
        </div>
    )

    const mdColumn = (
        <div className="flex h-full min-w-0 flex-col">
            <DocToolbar
                breadcrumbs={breadcrumbs}
                docName={node.name}
                viewMode={viewMode}
                onViewModeChange={(mode) => dispatch(docViewModeChanged({ id: docId, mode }))}
                paneOpen={rightPane !== null}
                onTogglePane={onTogglePane}
                canExport={Boolean(basePath)}
                onExport={async (format) => {
                    if (!basePath) return
                    try {
                        const result = await window.specDoc.exportDocument(
                            basePath,
                            node.id,
                            format
                        )
                        if (result.ok && result.path) {
                            window.alert(
                                `Exported "${node.name}" as ${format.toUpperCase()} to:\n${result.path}`
                            )
                        }
                    } catch (err) {
                        window.alert(
                            `Export failed: ${err instanceof Error ? err.message : String(err)}`
                        )
                    }
                }}
            />
            {editorBody}
            <DocFooter content={buffer} saving={saving} dirty={dirty} />
        </div>
    )

    if (!rightPane) {
        return <div className="h-full">{mdColumn}</div>
    }

    return (
        <Group orientation="horizontal" className="flex h-full w-full">
            <Panel id={`md-${docId}`} defaultSize="60%" minSize="30%">
                {mdColumn}
            </Panel>
            <Separator className="w-px bg-border transition-colors hover:bg-primary/40 cursor-col-resize" />
            <Panel
                id={`right-${docId}`}
                defaultSize={`${rightPaneWidth}px`}
                minSize="320px"
                maxSize="50%"
                onResize={onResizeRight}
            >
                <DocRightPane
                    activeTab={rightPane}
                    onSelectTab={onSetRightPane}
                    onClose={() => onSetRightPane(null)}
                >
                    {rightPane === 'chat' ? (
                        <AIAssistant
                            mode="docs"
                            supportsKB
                            onProposeChange={handleProposeChange}
                            proposalStatus={proposalStatus}
                            proposalSummaries={proposalSummaries}
                            pendingMessageId={pendingProposal?.messageId ?? null}
                            pendingSelected={pendingProposal?.selected}
                            onProposalEditToggle={handleProposalEditToggle}
                            contextProvider={contextProvider}
                            attachments={chatAttachments}
                            onRemoveAttachment={toggleAttachedDoc}
                            composerSlot={
                                <DocAttachPicker
                                    nodes={nodes}
                                    excludeDocId={docId}
                                    attachedIds={attachedDocIds}
                                    onToggle={toggleAttachedDoc}
                                    estimateTokens={estimateAttachmentTokens}
                                />
                            }
                        />
                    ) : (
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
                        />
                    )}
                </DocRightPane>
            </Panel>
        </Group>
    )
}

// ─── Right pane chrome (tabs header + body) ───────────────────────────────

interface DocRightPaneProps {
    activeTab: Exclude<DocRightPane, null>
    onSelectTab: (tab: Exclude<DocRightPane, null>) => void
    onClose: () => void
    children: React.ReactNode
}

const DocRightPane = ({
    activeTab,
    onSelectTab,
    onClose,
    children
}: DocRightPaneProps): JSX.Element => {
    return (
        <div className="flex h-full flex-col border-l bg-background">
            <div className="flex h-9 shrink-0 items-center justify-between border-b bg-card px-2">
                <div className="flex items-center gap-1">
                    <RightPaneTabButton
                        active={activeTab === 'chat'}
                        onClick={() => onSelectTab('chat')}
                        icon={<MessageSquare size={12} />}
                        label="Chat"
                    />
                    <RightPaneTabButton
                        active={activeTab === 'inspector'}
                        onClick={() => onSelectTab('inspector')}
                        icon={<PanelRight size={12} />}
                        label="Inspector"
                    />
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    title="Close panel"
                    className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                    <X size={12} />
                </button>
            </div>
            <div className="min-h-0 flex-1">{children}</div>
        </div>
    )
}

const RightPaneTabButton = ({
    active,
    onClick,
    icon,
    label
}: {
    active: boolean
    onClick: () => void
    icon: JSX.Element
    label: string
}): JSX.Element => (
    <button
        type="button"
        onClick={onClick}
        className={cn(
            'flex h-7 items-center gap-1.5 rounded px-2 text-[11px] font-medium transition-colors',
            active
                ? 'bg-secondary text-secondary-foreground'
                : 'text-muted-foreground hover:bg-accent'
        )}
    >
        {icon}
        {label}
    </button>
)

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
