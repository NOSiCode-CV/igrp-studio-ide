import MonacoEditor, { DiffEditor } from '@monaco-editor/react'
import { IGRPButtonPrimitive, IGRPInputPrimitive } from '@igrp/igrp-framework-react-design-system'
import { cn } from '@renderer/lib/utils'
import type { RootState } from '@renderer/redux'
import {
    protoTurnApplied,
    protoTurnCommitted,
    protoTurnFailed,
    protoTurnFinished,
    protoTurnParseError,
    protoTurnStarted,
    type FileChangeKind,
    type PrototypeFile,
    type PrototypeLog,
    type PrototypeSnapshot
} from '@renderer/redux/specPrototype/reducer'
import {
    loadPrototypeFiles,
    loadPrototypeSnapshots,
    openPrototypeFile,
    refreshDevStatus,
    restorePrototypeSnapshot,
    startPrototypeDev,
    stopPrototypeDev
} from '@renderer/redux/specPrototype/thunks'
import { selectDocNodes, selectSelectedDocId } from '@renderer/redux/specDocs/reducer'
import {
    AlertCircle,
    Bug,
    Check,
    CheckCircle2,
    Copy,
    Download,
    ExternalLink,
    FileCode,
    FolderOpen,
    History,
    Layout as LayoutIcon,
    LayoutGrid,
    Loader2,
    MessageSquare,
    Monitor,
    MoveHorizontal,
    Pause,
    Play,
    RefreshCw,
    RotateCcw,
    Search,
    Smartphone,
    Tablet,
    Terminal,
    Trash2
} from 'lucide-react'
import {
    type CSSProperties,
    type JSX,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState
} from 'react'
import { useDispatch, useSelector, useStore } from 'react-redux'
import { Group, Panel, Separator } from 'react-resizable-panels'
import { AIAssistant, type ChatAttachment } from './shared/AIAssistant'
import { DocAttachPicker } from '@renderer/features/spec-attachments'
import {
    PALETTE,
    PALETTE_BY_ID,
    type PaletteComponent,
    readPersistedComponentIds,
    writePersistedComponentIds
} from '@renderer/features/component-palette'

interface PanelProps {
    basePath?: string
    currentItem?: any
    variant?: 'list' | 'content'
}

type DeviceFrame = 'desktop' | 'tablet' | 'mobile' | 'custom'
type PrototypeTab = 'preview' | 'files' | 'logs' | 'history'

const TABS: { id: PrototypeTab; label: string }[] = [
    { id: 'preview', label: 'Preview' },
    { id: 'files', label: 'Files' },
    { id: 'logs', label: 'Logs' },
    { id: 'history', label: 'History' }
]

type ChatPanelMode = 'chat' | 'palette'

// ─── Persistence helpers ──────────────────────────────────────────────────
//
// Chat width is global (all projects share the same comfortable size).
// Attached spec ids are per-project (each spec has its own picks).

const CHAT_WIDTH_KEY = 'spec.prototype.chatWidth'
const DEFAULT_CHAT_WIDTH = 480
const MIN_CHAT_WIDTH = 320

const readPersistedChatWidth = (): number => {
    if (typeof window === 'undefined') return DEFAULT_CHAT_WIDTH
    try {
        const raw = window.localStorage?.getItem(CHAT_WIDTH_KEY)
        const parsed = raw ? Number(raw) : NaN
        return Number.isFinite(parsed) && parsed >= MIN_CHAT_WIDTH ? parsed : DEFAULT_CHAT_WIDTH
    } catch {
        return DEFAULT_CHAT_WIDTH
    }
}

const attachedIdsKey = (basePath?: string): string =>
    basePath ? `spec.prototype.attachedSpecIds.${basePath}` : ''

const readPersistedAttachedIds = (basePath?: string): string[] => {
    if (!basePath || typeof window === 'undefined') return []
    try {
        const raw = window.localStorage?.getItem(attachedIdsKey(basePath))
        if (!raw) return []
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
    } catch {
        return []
    }
}

const writePersistedAttachedIds = (basePath: string | undefined, ids: string[]): void => {
    if (!basePath || typeof window === 'undefined') return
    try {
        window.localStorage?.setItem(attachedIdsKey(basePath), JSON.stringify(ids))
    } catch {
        // noop — private mode etc.
    }
}

// Pinned palette components (M4.28) live in `features/component-palette` so
// the persistence shape can be reused by future generators that want their
// own pinned-component vocabulary. We pass `namespace: 'prototype'` here.
const PALETTE_NAMESPACE = { namespace: 'prototype' as const }

// Custom viewport width (M4.19) — global preference, not per-project.
const CUSTOM_VIEWPORT_KEY = 'spec.prototype.customViewportWidth'
const DEFAULT_CUSTOM_VIEWPORT = 1024
const MIN_CUSTOM_VIEWPORT = 240
const MAX_CUSTOM_VIEWPORT = 2560

const readPersistedCustomViewport = (): number => {
    if (typeof window === 'undefined') return DEFAULT_CUSTOM_VIEWPORT
    try {
        const raw = window.localStorage?.getItem(CUSTOM_VIEWPORT_KEY)
        const parsed = raw ? Number(raw) : NaN
        if (
            Number.isFinite(parsed) &&
            parsed >= MIN_CUSTOM_VIEWPORT &&
            parsed <= MAX_CUSTOM_VIEWPORT
        ) {
            return parsed
        }
        return DEFAULT_CUSTOM_VIEWPORT
    } catch {
        return DEFAULT_CUSTOM_VIEWPORT
    }
}

// ─── List variant — placeholder; the rail hides the secondary panel here. ─

const ListVariant = (): JSX.Element => (
    <div className="flex flex-col gap-3 p-3 text-xs text-muted-foreground">
        Prototype builder is opened in the main area.
    </div>
)

// ─── Content variant ──────────────────────────────────────────────────────

const ContentVariant = ({ basePath }: PanelProps): JSX.Element => {
    const dispatch = useDispatch<any>()
    const store = useStore<RootState>()
    const docs = useSelector(selectDocNodes)
    const selectedId = useSelector(selectSelectedDocId)
    const kbItems = useSelector((s: RootState) => s.specKB.items)
    const devStatus = useSelector((s: RootState) => s.specPrototype.devStatus)
    const lastTurnId = useSelector((s: RootState) => s.specPrototype.lastTurnId)
    const turns = useSelector((s: RootState) => s.specPrototype.turns)

    const [activeTab, setActiveTab] = useState<PrototypeTab>('preview')
    const [device, setDevice] = useState<DeviceFrame>('desktop')
    const [customWidth, setCustomWidth] = useState<number>(() => readPersistedCustomViewport())
    const handleChangeCustomWidth = useCallback((next: number) => {
        const clamped = Math.max(MIN_CUSTOM_VIEWPORT, Math.min(MAX_CUSTOM_VIEWPORT, next))
        setCustomWidth(clamped)
        try {
            window.localStorage?.setItem(CUSTOM_VIEWPORT_KEY, String(Math.round(clamped)))
        } catch {
            // noop — private mode etc.
        }
    }, [])

    // Spec attachments — explicit picker drives chat context (M4.29).
    // No more implicit "active doc" path. Persisted per-project.
    const [attachedDocIds, setAttachedDocIds] = useState<string[]>(() =>
        readPersistedAttachedIds(basePath)
    )

    // Component palette pins (M4.28) — same shape as spec attachments.
    const [chatPanelMode, setChatPanelMode] = useState<ChatPanelMode>('chat')
    const [attachedComponentIds, setAttachedComponentIds] = useState<string[]>(() =>
        readPersistedComponentIds(basePath, PALETTE_NAMESPACE)
    )

    // Persist any change to component pins.
    useEffect(() => {
        writePersistedComponentIds(basePath, attachedComponentIds, PALETTE_NAMESPACE)
    }, [attachedComponentIds, basePath])

    const toggleAttachedComponent = useCallback((id: string) => {
        setAttachedComponentIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        )
    }, [])

    const removeAttachedComponent = useCallback((id: string) => {
        setAttachedComponentIds((prev) => prev.filter((x) => x !== id))
    }, [])

    const attachedComponents = useMemo<PaletteComponent[]>(
        () =>
            attachedComponentIds
                .map((id) => PALETTE_BY_ID.get(id))
                .filter((c): c is PaletteComponent => Boolean(c)),
        [attachedComponentIds]
    )

    const lastTurn = lastTurnId ? turns[lastTurnId] : null

    // Auto-seed once per (basePath, nodes-arrived). If the user has nothing
    // saved AND there's a doc currently selected in the Documents rail, use
    // it as a hint — but they remain free to remove it. We guard with a ref
    // so re-renders don't re-seed after the user explicitly empties the list.
    const seededRef = useRef(false)
    useEffect(() => {
        if (seededRef.current) return
        if (!basePath) return
        if (docs.length === 0) return
        seededRef.current = true
        const persisted = readPersistedAttachedIds(basePath)
        const validPersisted = persisted.filter((id) => docs.some((d) => d.id === id))
        if (validPersisted.length > 0) {
            setAttachedDocIds(validPersisted)
            return
        }
        if (selectedId && docs.some((d) => d.id === selectedId)) {
            setAttachedDocIds([selectedId])
        }
    }, [basePath, docs, selectedId])

    // Persist any change to attached ids.
    useEffect(() => {
        writePersistedAttachedIds(basePath, attachedDocIds)
    }, [attachedDocIds, basePath])

    // Auto-clean orphans (attached doc was deleted from disk).
    useEffect(() => {
        const validIds = new Set(docs.map((n) => n.id))
        setAttachedDocIds((prev) => {
            const next = prev.filter((id) => validIds.has(id))
            return next.length === prev.length ? prev : next
        })
    }, [docs])

    const toggleAttachedDoc = useCallback((id: string) => {
        setAttachedDocIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        )
    }, [])

    const removeAttachedDoc = useCallback((id: string) => {
        setAttachedDocIds((prev) => prev.filter((x) => x !== id))
    }, [])

    const chatAttachments = useMemo<ChatAttachment[]>(() => {
        const out: ChatAttachment[] = []
        for (const id of attachedDocIds) {
            const ref = docs.find((n) => n.id === id)
            if (!ref) continue
            const dirty = Boolean(store.getState().specDocs.byDoc[id]?.dirty)
            out.push({ id: `doc:${id}`, name: ref.name, kind: 'doc', dirty })
        }
        for (const comp of attachedComponents) {
            out.push({ id: `comp:${comp.id}`, name: comp.name, kind: 'component' })
        }
        return out
        // store is a stable ref — read inside; recompute when ids/docs change.
    }, [attachedDocIds, attachedComponents, docs, store])

    // Single removal entry-point — chips don't know whether they back a doc
    // or a palette component, so we route by the `kind:` prefix we encoded
    // when building the chip list above.
    const handleRemoveAttachment = useCallback(
        (chipId: string) => {
            if (chipId.startsWith('doc:')) {
                removeAttachedDoc(chipId.slice(4))
            } else if (chipId.startsWith('comp:')) {
                removeAttachedComponent(chipId.slice(5))
            }
        },
        [removeAttachedDoc, removeAttachedComponent]
    )

    const estimateAttachmentTokens = useCallback(
        (id: string): number | null => {
            const buf = store.getState().specDocs.byDoc[id]?.buffer
            if (typeof buf !== 'string') return null
            return Math.ceil(buf.length / 4)
        },
        [store]
    )

    // Chat width — resizable left pane (M4.30). Persisted globally.
    const [chatWidth, setChatWidth] = useState<number>(() => readPersistedChatWidth())
    const onResizeChat = useCallback((size: { inPixels: number }) => {
        if (size.inPixels >= MIN_CHAT_WIDTH) {
            setChatWidth(size.inPixels)
            try {
                window.localStorage?.setItem(CHAT_WIDTH_KEY, String(Math.round(size.inPixels)))
            } catch {
                // noop
            }
        }
    }, [])

    // Initial loads when basePath becomes available.
    useEffect(() => {
        if (!basePath) return
        dispatch(loadPrototypeFiles(basePath))
        dispatch(refreshDevStatus(basePath))
        dispatch(loadPrototypeSnapshots(basePath))
    }, [basePath, dispatch])

    // Lazy-start dev server the first time the user opens the Preview tab.
    const devStartedRef = useRef(false)
    useEffect(() => {
        if (!basePath || activeTab !== 'preview' || devStartedRef.current) return
        if (devStatus.running) {
            devStartedRef.current = true
            return
        }
        devStartedRef.current = true
        dispatch(startPrototypeDev(basePath))
    }, [activeTab, basePath, devStatus.running, dispatch])

    // First-run UX (M4.18) — when `npm install` starts (`installing` flips
    // false→true), auto-switch to the Logs tab so the user sees the live
    // download progress instead of a frozen Preview placeholder. Only on
    // the rising edge: if the user navigates away while installing, we
    // don't snap them back.
    const wasInstallingRef = useRef(false)
    useEffect(() => {
        if (devStatus.installing && !wasInstallingRef.current) {
            wasInstallingRef.current = true
            setActiveTab('logs')
        } else if (!devStatus.installing) {
            wasInstallingRef.current = false
        }
    }, [devStatus.installing])

    // Tree refresh + preview reload when the main process reports a turn
    // finished. The webview reload is best-effort: if the user is on another
    // tab the element is not mounted, so we just skip and the next time they
    // come back to Preview they'll see the latest state via the `src`.
    useEffect(() => {
        if (!basePath) return
        const off = window.specPrototype.onTreeChanged((payload) => {
            if (payload.basePath !== basePath) return
            dispatch(loadPrototypeFiles(basePath))
            dispatch(loadPrototypeSnapshots(basePath))
            const view = document.querySelector(
                'webview.spec-prototype-preview'
            ) as { reload?: () => void } | null
            view?.reload?.()
        })
        return off
    }, [basePath, dispatch])

    const contextProvider = useCallback(
        async ({ userMessage, useKB }: { userMessage: string; useKB: boolean }) => {
            void userMessage

            // ─── Read attached specs (buffer-first, IPC fallback) ───────
            const storeState = store.getState()
            const attachedSections: string[] = []
            for (const id of attachedDocIds) {
                const refNode = docs.find((n) => n.id === id)
                if (!refNode) continue
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
                attachedSections.push(
                    `### Spec: ${refNode.name}${tag}\n\n\`\`\`markdown\n${content ?? ''}\n\`\`\``
                )
            }

            // KB items: union of kbRefs across all attached specs.
            const linkedKbIds = new Set<string>()
            for (const id of attachedDocIds) {
                const ref = docs.find((n) => n.id === id)
                ref?.kbRefs?.forEach((kbId) => linkedKbIds.add(kbId))
            }
            const linkedKb = kbItems.filter((k) => linkedKbIds.has(k.id))

            const sections: string[] = []

            sections.push(
                [
                    'You are the Prototype Builder of an IGRP Studio "Specification" project. Your job is to translate the attached spec(s) into a working Next.js prototype by emitting file-ops (create/update/delete) that the host applies inside `<basePath>/prototype/`.',
                    '',
                    '## Document roles — STRICT',
                    '',
                    '- **Reference specifications** (`## Reference specifications`) — markdown docs the user pinned to this chat. Treat them as authoritative source material for what to build. Preserve their terminology when naming components, routes, and copy. Cite information from them inline as `[Spec: <name>]` when justifying a design choice.',
                    '- **Knowledge Base** (`## Knowledge Base context`) — external reference (PDFs, URLs). Lower authority than the specs. Cite as `[KB: <item name>]`.',
                    '',
                    'If no spec is attached, ask the user to attach at least one before generating substantial code — otherwise produce a small, generic placeholder and call out the gap.',
                    '',
                    'When generating components that need data, create a deterministic mock layer (e.g. `prototype/lib/mock-data.ts`) so the preview renders something useful without a backend.'
                ].join('\n')
            )

            if (attachedSections.length > 0) {
                sections.push(
                    `## Reference specifications (${attachedSections.length})\n\n${attachedSections.join('\n\n')}`
                )
            } else {
                sections.push(
                    '## Reference specifications\n_None attached. Ask the user to attach a spec via the @Attach button before generating substantial code._'
                )
            }

            // M4.28 — palette-pinned components: directive-only injection.
            // We don't ship the LLM the full shadcn registry; the model knows
            // shadcn already. We just say "use these as your building blocks
            // for this turn" so the user's clicks in the palette steer the
            // generator without spelling it out in prose every time.
            if (attachedComponents.length > 0) {
                const lines = attachedComponents
                    .map((c) => `- **${c.name}** (${c.category}) — ${c.hint}`)
                    .join('\n')
                sections.push(
                    `## UI components to use (pinned by user)\nWhen generating UI, prefer these components as the primary building blocks; pick others only when these don't fit. Don't dump every pinned component on every page — use them where they earn their place.\n\n${lines}`
                )
            }

            // KB block — search only when the user explicitly enables KB and
            // there are linked items to scope the search by.
            if (useKB && linkedKb.length > 0 && userMessage.trim() && basePath) {
                try {
                    const hits = await window.specKB.search(basePath, userMessage, 6, {
                        kbItemIds: linkedKb.map((k) => k.id)
                    })
                    if (hits.length > 0) {
                        const lookup = new Map(linkedKb.map((k) => [k.id, k.name]))
                        const formatted = hits
                            .map((h, idx) => {
                                const ownerId = h.metadata?.kbItemId as string | undefined
                                const ownerName = ownerId
                                    ? (lookup.get(ownerId) ?? ownerId)
                                    : 'Unknown'
                                return `### Chunk ${idx + 1} · score ${h.score.toFixed(3)} · from "${ownerName}"\n\n${h.text}`
                            })
                            .join('\n\n---\n\n')
                        sections.push(
                            `## Knowledge Base context (top ${hits.length} chunks, retrieved from linked items)\n\n${formatted}`
                        )
                    }
                } catch {
                    // Swallow — search failure shouldn't block generation.
                }
            }

            if (linkedKb.length > 0) {
                const names = linkedKb.map((k) => `- ${k.name}`).join('\n')
                sections.push(`## Linked Knowledge Base items (${linkedKb.length})\n${names}`)
            }

            if (lastTurn?.summary) {
                sections.push(
                    `## Previous turn\n- ${lastTurn.summary}${lastTurn.sha ? ` (${lastTurn.sha.slice(0, 7)})` : ''}`
                )
            }

            // Label for the composer footer.
            let label: string
            if (attachedDocIds.length === 0) {
                label = 'No spec attached'
            } else if (attachedDocIds.length === 1) {
                const only = docs.find((d) => d.id === attachedDocIds[0])
                label = `Spec: ${only?.name ?? 'attached'}`
            } else {
                label = `${attachedDocIds.length} specs attached`
            }
            if (linkedKb.length > 0) {
                label += ` · ${linkedKb.length} KB linked${useKB ? '' : ' (KB off)'}`
            }

            return {
                systemPrompt: sections.join('\n\n'),
                contextLabel: label
            }
        },
        [attachedDocIds, attachedComponents, basePath, docs, kbItems, lastTurn, store]
    )

    return (
        <Group orientation="horizontal" className="flex h-full w-full">
            {/* Build chat (resizable) */}
            <Panel
                id="proto-chat"
                defaultSize={`${chatWidth}px`}
                minSize="320px"
                maxSize="50%"
                onResize={onResizeChat}
            >
                <aside className="flex h-full w-full flex-col border-r bg-card/30">
                    <ChatPanelTabs
                        mode={chatPanelMode}
                        onChangeMode={setChatPanelMode}
                        pinnedCount={attachedComponentIds.length}
                    />
                    {/* Palette is overlaid on top while active so the chat
                        stays mounted (display:none); message history and
                        streaming state survive tab switches. */}
                    <div className="relative min-h-0 flex-1">
                        {/* Both panes are absolute-positioned over the same
                            relative slot so the AIAssistant and palette
                            mount once and toggle visibility — chat history,
                            streaming, and composer draft survive tab swaps.
                            `flex flex-col` ensures the inner pane stretches
                            to fill the panel width when the user resizes
                            the chat ↔ main divider. */}
                        <div
                            className={cn(
                                'absolute inset-0 flex-col',
                                chatPanelMode === 'chat' ? 'flex' : 'hidden'
                            )}
                        >
                            <AIAssistant
                                className="h-full w-full"
                                mode="prototype"
                                title="Prototype builder"
                                placeholder="Describe a feature or change…"
                                submitLabel="Build"
                                supportsKB
                                chatBackend={
                                    basePath
                                        ? {
                                              kind: 'prototype',
                                              basePath,
                                              onTurnEvent: (event) => dispatch(event)
                                          }
                                        : undefined
                                }
                                attachments={chatAttachments}
                                onRemoveAttachment={handleRemoveAttachment}
                                composerSlot={
                                    <DocAttachPicker
                                        nodes={docs}
                                        attachedIds={attachedDocIds}
                                        onToggle={toggleAttachedDoc}
                                        estimateTokens={estimateAttachmentTokens}
                                    />
                                }
                                onPrototypeRestore={(sha) => {
                                    if (!basePath) return
                                    dispatch(restorePrototypeSnapshot(basePath, sha))
                                }}
                                onPrototypeOpenFile={(path) => {
                                    if (!basePath) return
                                    setActiveTab('files')
                                    dispatch(openPrototypeFile(basePath, path))
                                }}
                                contextProvider={contextProvider}
                            />
                        </div>
                        <div
                            className={cn(
                                'absolute inset-0 flex-col',
                                chatPanelMode === 'palette' ? 'flex' : 'hidden'
                            )}
                        >
                            <ComponentPalettePane
                                attachedIds={attachedComponentIds}
                                onToggle={toggleAttachedComponent}
                            />
                        </div>
                    </div>
                </aside>
            </Panel>
            <Separator className="w-px cursor-col-resize bg-border transition-colors hover:bg-primary/40" />

            {/* Main */}
            <Panel id="proto-main" minSize="40%">
                <main className="flex h-full w-full flex-col bg-card/10">
                    {devStatus.installing && <FirstRunBanner />}
                    <header className="flex h-12 shrink-0 items-center justify-between border-b bg-background px-4">
                        <div className="flex items-center gap-1 rounded-md bg-accent/40 p-1">
                            {TABS.map((t) => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setActiveTab(t.id)}
                                    className={cn(
                                        'rounded px-2.5 py-1 text-[11px] font-medium transition-colors',
                                        activeTab === t.id
                                            ? 'bg-secondary text-secondary-foreground'
                                            : 'text-muted-foreground hover:bg-accent'
                                    )}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        {activeTab === 'preview' && (
                            <PreviewToolbar
                                device={device}
                                onChangeDevice={setDevice}
                                customWidth={customWidth}
                                onChangeCustomWidth={handleChangeCustomWidth}
                                url={devStatus.url}
                                running={devStatus.running}
                                onToggleDev={() => {
                                    if (!basePath) return
                                    if (devStatus.running) dispatch(stopPrototypeDev(basePath))
                                    else dispatch(startPrototypeDev(basePath))
                                }}
                            />
                        )}
                    </header>

                    <div className="relative flex-1 overflow-hidden p-6">
                        {activeTab === 'preview' && (
                            <PreviewPane
                                device={device}
                                customWidth={customWidth}
                                url={devStatus.url}
                                running={devStatus.running}
                                installing={devStatus.installing}
                                onSwitchToLogs={() => setActiveTab('logs')}
                            />
                        )}
                        {activeTab === 'files' && <FilesPane basePath={basePath} />}
                        {activeTab === 'logs' && <LogsPane />}
                        {activeTab === 'history' && <HistoryPane basePath={basePath} />}
                    </div>

                    <PrototypeFooter basePath={basePath} />
                </main>
            </Panel>
        </Group>
    )
}

// ─── First-run banner (M4.18) ─────────────────────────────────────────────
//
// Indeterminate progress bar shown while `npm install` runs the very first
// time the dev server is started for a project. The Logs tab is auto-focused
// in parallel so the user sees the actual download stream — this banner is
// just a thin reminder of what's happening so it stays out of the way.

// ─── Chat panel tabs (M4.28) ──────────────────────────────────────────────
//
// Two-way switch in the left panel header. Mounts both the chat and the
// palette but toggles `display`, so the AIAssistant's local state (message
// history, streaming chunks, composer draft) survives jumps between modes.

const ChatPanelTabs = ({
    mode,
    onChangeMode,
    pinnedCount
}: {
    mode: ChatPanelMode
    onChangeMode: (next: ChatPanelMode) => void
    pinnedCount: number
}): JSX.Element => (
    // Stronger contrast against the panel's `bg-card/30` so the tab row reads
    // as a control surface (not decoration). Solid background + thicker
    // bottom border + slightly taller (40px) makes it the first thing the
    // eye lands on when scanning the panel.
    <div className="flex h-10 shrink-0 items-center gap-1 border-b border-border/80 bg-background/60 px-2">
        <ChatPanelTabButton
            active={mode === 'chat'}
            onClick={() => onChangeMode('chat')}
            icon={<MessageSquare size={13} />}
            label="Chat"
        />
        <ChatPanelTabButton
            active={mode === 'palette'}
            onClick={() => onChangeMode('palette')}
            icon={<LayoutGrid size={13} />}
            label="Palette"
            badge={pinnedCount > 0 ? pinnedCount : undefined}
        />
    </div>
)

const ChatPanelTabButton = ({
    active,
    onClick,
    icon,
    label,
    badge
}: {
    active: boolean
    onClick: () => void
    icon: JSX.Element
    label: string
    badge?: number
}): JSX.Element => (
    <button
        type="button"
        onClick={onClick}
        className={cn(
            'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors',
            active
                ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
                : 'text-muted-foreground hover:bg-accent'
        )}
    >
        {icon}
        {label}
        {badge !== undefined && (
            <span
                className={cn(
                    'rounded-full px-1.5 py-px text-[9px] font-semibold',
                    active ? 'bg-primary/20 text-primary' : 'bg-muted-foreground/20'
                )}
            >
                {badge}
            </span>
        )}
    </button>
)

// ─── Component palette pane (M4.28) ───────────────────────────────────────

const ComponentPalettePane = ({
    attachedIds,
    onToggle
}: {
    attachedIds: string[]
    onToggle: (id: string) => void
}): JSX.Element => {
    const [query, setQuery] = useState('')
    const filtered = useMemo(() => {
        const needle = query.trim().toLowerCase()
        if (!needle) return PALETTE
        return PALETTE.filter(
            (c) =>
                c.name.toLowerCase().includes(needle) ||
                c.category.toLowerCase().includes(needle) ||
                c.hint.toLowerCase().includes(needle)
        )
    }, [query])
    const grouped = useMemo(() => {
        const out = new Map<PaletteComponent['category'], PaletteComponent[]>()
        for (const c of filtered) {
            const list = out.get(c.category) ?? []
            list.push(c)
            out.set(c.category, list)
        }
        return out
    }, [filtered])
    const attachedSet = useMemo(() => new Set(attachedIds), [attachedIds])

    return (
        <div className="flex h-full w-full flex-col">
            <div className="border-b px-3 py-2">
                <div className="relative">
                    <Search
                        size={11}
                        className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <IGRPInputPrimitive
                        placeholder="Find a component…"
                        className="h-7 pl-7 text-[11px]"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
                <p className="mt-1.5 text-[10px] leading-snug text-muted-foreground">
                    Click to pin · remove via chip in chat
                    {attachedIds.length > 0 && (
                        <span className="ml-1 font-medium text-primary">
                            · {attachedIds.length} pinned
                        </span>
                    )}
                </p>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
                {filtered.length === 0 ? (
                    <p className="px-2 py-3 text-[11px] italic text-muted-foreground">
                        No components match "{query}".
                    </p>
                ) : (
                    Array.from(grouped.entries()).map(([category, items]) => (
                        <section key={category} className="mb-3">
                            <h4 className="mb-1.5 px-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                                {category}
                            </h4>
                            <div className="grid grid-cols-2 gap-1.5">
                                {items.map((c) => (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => onToggle(c.id)}
                                        title={c.hint}
                                        className={cn(
                                            'flex flex-col items-start gap-0.5 rounded-md border px-2 py-1.5 text-left transition-colors',
                                            attachedSet.has(c.id)
                                                ? 'border-primary/40 bg-primary/5'
                                                : 'border-border bg-card hover:bg-accent'
                                        )}
                                    >
                                        <div className="flex w-full items-center justify-between">
                                            <span className="text-[11px] font-medium">
                                                {c.name}
                                            </span>
                                            {attachedSet.has(c.id) && (
                                                <Check size={10} className="text-primary" />
                                            )}
                                        </div>
                                        <span className="line-clamp-2 text-[9px] leading-tight text-muted-foreground">
                                            {c.hint}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </section>
                    ))
                )}
            </div>
        </div>
    )
}

const FirstRunBanner = (): JSX.Element => (
    <div className="relative overflow-hidden border-b bg-amber-500/5 px-4 py-2 text-[11px] text-amber-700 dark:text-amber-400">
        <div className="flex items-center gap-2">
            <Loader2 size={12} className="animate-spin" />
            <span className="font-medium">Installing dependencies…</span>
            <span className="text-muted-foreground">
                first-time setup, ~30s. Live progress in the Logs tab.
            </span>
        </div>
        <div className="absolute bottom-0 left-0 h-0.5 w-1/3 animate-[firstrun_1.4s_linear_infinite] bg-amber-500/60" />
        <style>{`@keyframes firstrun{0%{transform:translateX(-100%)}100%{transform:translateX(400%)}}`}</style>
    </div>
)

// ─── Preview ──────────────────────────────────────────────────────────────

const PreviewToolbar = ({
    device,
    onChangeDevice,
    customWidth,
    onChangeCustomWidth,
    url,
    running,
    onToggleDev
}: {
    device: DeviceFrame
    onChangeDevice: (d: DeviceFrame) => void
    customWidth: number
    onChangeCustomWidth: (next: number) => void
    url: string | null
    running: boolean
    onToggleDev: () => void
}): JSX.Element => {
    const reload = () => {
        const view = document.querySelector('webview.spec-prototype-preview') as {
            reload?: () => void
        } | null
        view?.reload?.()
    }
    const toggleDevTools = () => {
        // Each Electron <webview> has its own DevTools, decoupled from the
        // host window's DevTools. Useful when debugging the running prototype
        // without leaving the Studio.
        const view = document.querySelector('webview.spec-prototype-preview') as {
            isDevToolsOpened?: () => boolean
            openDevTools?: () => void
            closeDevTools?: () => void
        } | null
        if (!view) return
        if (view.isDevToolsOpened?.()) view.closeDevTools?.()
        else view.openDevTools?.()
    }
    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-md border bg-card p-1">
                <DeviceButton
                    active={device === 'desktop'}
                    onClick={() => onChangeDevice('desktop')}
                    icon={<Monitor size={13} />}
                    title="Desktop"
                />
                <DeviceButton
                    active={device === 'tablet'}
                    onClick={() => onChangeDevice('tablet')}
                    icon={<Tablet size={13} />}
                    title="Tablet"
                />
                <DeviceButton
                    active={device === 'mobile'}
                    onClick={() => onChangeDevice('mobile')}
                    icon={<Smartphone size={13} />}
                    title="Mobile"
                />
                <DeviceButton
                    active={device === 'custom'}
                    onClick={() => onChangeDevice('custom')}
                    icon={<MoveHorizontal size={13} />}
                    title="Custom width"
                />
            </div>
            {device === 'custom' && (
                <div className="flex items-center gap-1 rounded-md border bg-card px-2 py-1 text-[11px]">
                    <input
                        type="number"
                        value={customWidth}
                        min={MIN_CUSTOM_VIEWPORT}
                        max={MAX_CUSTOM_VIEWPORT}
                        onChange={(e) => {
                            const next = Number(e.target.value)
                            if (Number.isFinite(next)) onChangeCustomWidth(next)
                        }}
                        className="w-16 bg-transparent text-right outline-none"
                    />
                    <span className="text-muted-foreground">px</span>
                </div>
            )}
            <div
                className="flex h-8 w-56 items-center truncate rounded-md bg-muted px-3 text-[11px] text-muted-foreground"
                title={url ?? 'dev server stopped'}
            >
                {url ?? 'dev server stopped'}
            </div>
            <IGRPButtonPrimitive
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={reload}
                disabled={!running}
                title="Reload preview"
            >
                <RefreshCw size={14} />
            </IGRPButtonPrimitive>
            <IGRPButtonPrimitive
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onToggleDev}
                title={running ? 'Stop dev server' : 'Start dev server'}
            >
                {running ? <Pause size={14} /> : <Play size={14} />}
            </IGRPButtonPrimitive>
            <IGRPButtonPrimitive
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={toggleDevTools}
                disabled={!running}
                title="Toggle DevTools for the preview"
            >
                <Bug size={14} />
            </IGRPButtonPrimitive>
            <IGRPButtonPrimitive
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={!url}
                onClick={() => url && window.open(url, '_blank')}
                title="Open in browser"
            >
                <ExternalLink size={14} />
            </IGRPButtonPrimitive>
        </div>
    )
}

const DeviceButton = ({
    active,
    onClick,
    icon,
    title
}: {
    active: boolean
    onClick: () => void
    icon: JSX.Element
    title: string
}): JSX.Element => (
    <button
        type="button"
        onClick={onClick}
        title={title}
        className={cn(
            'flex h-6 w-6 items-center justify-center rounded transition-colors',
            active
                ? 'bg-secondary text-secondary-foreground'
                : 'text-muted-foreground hover:bg-accent'
        )}
    >
        {icon}
    </button>
)

const PreviewPane = ({
    device,
    customWidth,
    url,
    running,
    installing,
    onSwitchToLogs
}: {
    device: DeviceFrame
    customWidth: number
    url: string | null
    running: boolean
    installing: boolean
    onSwitchToLogs: () => void
}): JSX.Element => {
    // Surface the latest install/dev-server error inline. Without this, a
    // failed start would only show "Dev server is stopped" with no clue.
    const lastError = useSelector((s: RootState) => {
        const logs = s.specPrototype.logs
        for (let i = logs.length - 1; i >= 0; i--) {
            if (logs[i].level === 'error') return logs[i]
        }
        return null
    })
    const widthStyle: CSSProperties =
        device === 'desktop'
            ? { width: '100%' }
            : device === 'tablet'
              ? { width: 768 }
              : device === 'mobile'
                ? { width: 375 }
                : { width: customWidth, maxWidth: '100%' }
    return (
        <div className="flex h-full items-center justify-center">
            <div
                style={widthStyle}
                className={cn(
                    'relative h-full overflow-hidden rounded-xl border bg-white shadow-2xl transition-[width] duration-300'
                )}
            >
                <div className="flex h-8 items-center gap-1.5 border-b bg-gray-100 px-4">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                </div>
                <div className="h-[calc(100%-32px)] bg-gray-50">
                    {running && url ? (
                        <webview
                            src={url}
                            className="spec-prototype-preview"
                            style={{ width: '100%', height: '100%', border: 'none' }}
                        />
                    ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-gray-500">
                            <LayoutIcon size={48} className="opacity-20" />
                            <div className="max-w-md space-y-2 text-center text-sm">
                                {installing ? (
                                    <>
                                        <p className="font-medium text-gray-700">
                                            Installing dependencies…
                                        </p>
                                        <p className="text-[11px] italic text-gray-500">
                                            Running <code>npm install</code> for the first time.
                                            This can take a couple of minutes — see the Logs tab for
                                            live progress.
                                        </p>
                                    </>
                                ) : running ? (
                                    <>
                                        <p className="italic">Starting preview…</p>
                                        <p className="text-[11px] italic">
                                            Waiting for the dev server to bind to its port.
                                        </p>
                                    </>
                                ) : lastError ? (
                                    <>
                                        <p className="font-medium text-red-600">
                                            Dev server failed to start.
                                        </p>
                                        <pre className="max-h-32 overflow-y-auto rounded-md border border-red-200 bg-red-50 p-2 text-left text-[11px] text-red-700">
                                            {lastError.line}
                                        </pre>
                                        <button
                                            type="button"
                                            onClick={onSwitchToLogs}
                                            className="text-[11px] text-primary hover:underline"
                                        >
                                            Open Logs tab for details →
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <p className="italic">Dev server is stopped.</p>
                                        <p className="text-[11px] italic">
                                            Click ▶ in the toolbar to start, or describe a feature
                                            in the Build chat.
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── Files ────────────────────────────────────────────────────────────────

interface TreeNode {
    name: string
    path: string
    type: 'file' | 'folder'
    depth: number
    children?: TreeNode[]
    status?: FileChangeKind
}

function buildTree(files: PrototypeFile[], changes: Record<string, FileChangeKind>): TreeNode[] {
    const root: TreeNode[] = []
    const dirs = new Map<string, TreeNode>()

    for (const file of files) {
        const segments = file.path.split('/')
        const depth = segments.length - 1
        const node: TreeNode = {
            name: segments[segments.length - 1],
            path: file.path,
            type: file.type,
            depth,
            status: changes[file.path]
        }
        if (depth === 0) {
            root.push(node)
        } else {
            const parentPath = segments.slice(0, -1).join('/')
            const parent = dirs.get(parentPath)
            if (parent) {
                parent.children = parent.children ?? []
                parent.children.push(node)
            } else {
                root.push(node)
            }
        }
        if (file.type === 'folder') dirs.set(file.path, node)
    }
    return root
}

const FilesPane = ({ basePath }: { basePath?: string }): JSX.Element => {
    const dispatch = useDispatch<any>()
    const files = useSelector((s: RootState) => s.specPrototype.files)
    const changedPaths = useSelector((s: RootState) => s.specPrototype.changedPaths)
    const activeFile = useSelector((s: RootState) => s.specPrototype.activeFile)
    const activeFileContent = useSelector((s: RootState) => s.specPrototype.activeFileContent)
    const loading = useSelector((s: RootState) => s.specPrototype.activeFileLoading)

    const tree = useMemo(() => buildTree(files, changedPaths), [files, changedPaths])

    return (
        <div className="flex h-full overflow-hidden rounded-xl border bg-card/30">
            <aside className="flex w-64 shrink-0 flex-col border-r bg-card">
                <div className="flex items-center justify-between border-b p-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Project Explorer
                    </span>
                    <button
                        type="button"
                        onClick={() => basePath && dispatch(loadPrototypeFiles(basePath))}
                        title="Refresh"
                        className="rounded p-1 hover:bg-accent"
                    >
                        <RefreshCw size={11} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                    {tree.length === 0 ? (
                        <p className="px-2 py-3 text-[11px] text-muted-foreground">
                            No files yet — describe a feature in the Build chat to scaffold the
                            prototype.
                        </p>
                    ) : (
                        tree.map((node) => (
                            <FileTreeRow
                                key={node.path}
                                node={node}
                                allFiles={files}
                                changedPaths={changedPaths}
                                activeFile={activeFile}
                                onSelect={(path) =>
                                    basePath && dispatch(openPrototypeFile(basePath, path))
                                }
                            />
                        ))
                    )}
                </div>
            </aside>
            <FileViewer
                basePath={basePath}
                activeFile={activeFile}
                activeFileContent={activeFileContent}
                loading={loading}
                changedPaths={changedPaths}
            />
        </div>
    )
}

// ─── File viewer (Monaco read-only + optional diff vs HEAD~1) ────────────

const languageFromExt = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase() ?? ''
    switch (ext) {
        case 'ts':
        case 'tsx':
            return 'typescript'
        case 'js':
        case 'jsx':
        case 'mjs':
        case 'cjs':
            return 'javascript'
        case 'json':
            return 'json'
        case 'md':
        case 'markdown':
            return 'markdown'
        case 'css':
            return 'css'
        case 'scss':
        case 'sass':
            return 'scss'
        case 'html':
        case 'htm':
            return 'html'
        case 'yml':
        case 'yaml':
            return 'yaml'
        case 'sh':
        case 'bash':
        case 'zsh':
            return 'shell'
        case 'sql':
            return 'sql'
        case 'py':
            return 'python'
        case 'rb':
            return 'ruby'
        case 'go':
            return 'go'
        case 'rs':
            return 'rust'
        default:
            return 'plaintext'
    }
}

const monacoOptions = {
    readOnly: true,
    fontSize: 13,
    fontFamily:
        'JetBrains Mono, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    minimap: { enabled: false },
    wordWrap: 'on' as const,
    scrollBeyondLastLine: false,
    renderLineHighlight: 'none' as const,
    folding: true,
    glyphMargin: false,
    padding: { top: 12, bottom: 12 }
}

const FileViewer = ({
    basePath,
    activeFile,
    activeFileContent,
    loading,
    changedPaths
}: {
    basePath?: string
    activeFile: string | null
    activeFileContent: string | null
    loading: boolean
    changedPaths: Record<string, FileChangeKind>
}): JSX.Element => {
    const status = activeFile ? changedPaths[activeFile] : undefined
    const canDiff = Boolean(activeFile && status === 'modified')
    // If the active file isn't dirty in the last turn, force off — avoids
    // a stale diff sticking around when the user navigates to an untouched
    // file after viewing a modified one.
    const [diffOn, setDiffOn] = useState(false)
    useEffect(() => {
        if (!canDiff) setDiffOn(false)
    }, [canDiff, activeFile])

    const [previousContent, setPreviousContent] = useState<string | null>(null)
    const [diffLoading, setDiffLoading] = useState(false)
    useEffect(() => {
        if (!diffOn || !basePath || !activeFile) {
            setPreviousContent(null)
            return
        }
        let cancelled = false
        setDiffLoading(true)
        window.specPrototype
            .readFileAt(basePath, 'HEAD~1', activeFile)
            .then((res) => {
                if (cancelled) return
                setPreviousContent(res.content)
            })
            .catch(() => {
                if (cancelled) return
                setPreviousContent(null)
            })
            .finally(() => {
                if (cancelled) return
                setDiffLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [diffOn, basePath, activeFile])

    const language = activeFile ? languageFromExt(activeFile) : 'plaintext'

    return (
        <section className="flex flex-1 flex-col bg-background">
            <header className="flex h-10 items-center justify-between border-b bg-card px-4">
                <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] text-muted-foreground">
                        {activeFile ? `prototype/${activeFile}` : 'No file selected'}
                    </span>
                    {status && (
                        <span
                            className={cn(
                                'rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide',
                                status === 'new'
                                    ? 'bg-emerald-500/15 text-emerald-500'
                                    : status === 'modified'
                                      ? 'bg-blue-500/15 text-blue-500'
                                      : 'bg-red-500/15 text-red-500'
                            )}
                        >
                            {status}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    {canDiff && (
                        <button
                            type="button"
                            onClick={() => setDiffOn((v) => !v)}
                            className={cn(
                                'rounded px-2 py-1 text-[10px] font-medium transition-colors',
                                diffOn
                                    ? 'bg-secondary text-secondary-foreground'
                                    : 'text-muted-foreground hover:bg-accent'
                            )}
                            title="Compare with previous commit (HEAD~1)"
                        >
                            {diffOn ? 'Hide diff' : 'View diff'}
                        </button>
                    )}
                </div>
            </header>
            <div className="flex-1 overflow-hidden bg-background">
                {loading ? (
                    <p className="p-6 text-[11px] text-muted-foreground">Loading…</p>
                ) : activeFileContent === null ? (
                    <p className="p-6 text-[11px] text-muted-foreground">
                        Select a file from the explorer to preview its contents.
                    </p>
                ) : diffOn ? (
                    diffLoading ? (
                        <p className="p-6 text-[11px] text-muted-foreground">Loading diff…</p>
                    ) : (
                        <DiffEditor
                            height="100%"
                            language={language}
                            original={previousContent ?? ''}
                            modified={activeFileContent}
                            theme="vs-dark"
                            options={{ ...monacoOptions, renderSideBySide: false }}
                        />
                    )
                ) : (
                    <MonacoEditor
                        height="100%"
                        language={language}
                        value={activeFileContent}
                        theme="vs-dark"
                        options={monacoOptions}
                    />
                )}
            </div>
        </section>
    )
}

interface FileTreeRowProps {
    node: TreeNode
    allFiles: PrototypeFile[]
    changedPaths: Record<string, FileChangeKind>
    activeFile: string | null
    onSelect: (path: string) => void
}

const FileTreeRow = ({
    node,
    allFiles,
    changedPaths,
    activeFile,
    onSelect
}: FileTreeRowProps): JSX.Element => {
    const [open, setOpen] = useState(true)
    const isFolder = node.type === 'folder'
    const isActive = !isFolder && activeFile === node.path
    const status = changedPaths[node.path]

    return (
        <div>
            <button
                type="button"
                onClick={() => (isFolder ? setOpen((v) => !v) : onSelect(node.path))}
                className={cn(
                    'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors',
                    isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
                )}
                style={{ paddingLeft: `${node.depth * 12 + 8}px` }}
            >
                {isFolder ? (
                    <FolderOpen size={14} className="text-blue-500" />
                ) : (
                    <FileCode size={14} className="text-muted-foreground" />
                )}
                <span className="flex-1 truncate">{node.name}</span>
                {status && (
                    <span
                        className={cn(
                            'h-1.5 w-1.5 rounded-full',
                            status === 'new'
                                ? 'bg-emerald-500'
                                : status === 'modified'
                                  ? 'bg-blue-500'
                                  : 'bg-red-500'
                        )}
                        title={status}
                    />
                )}
            </button>
            {isFolder && open && node.children && (
                <div>
                    {node.children.map((child) => (
                        <FileTreeRow
                            key={child.path}
                            node={child}
                            allFiles={allFiles}
                            changedPaths={changedPaths}
                            activeFile={activeFile}
                            onSelect={onSelect}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── Logs ─────────────────────────────────────────────────────────────────

type LogFilter = 'all' | 'errors' | 'warns+errors'

const LogsPane = (): JSX.Element => {
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
                    <IGRPInputPrimitive
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
                    <IGRPButtonPrimitive
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Copy filtered logs to clipboard"
                        onClick={handleCopy}
                        disabled={filtered.length === 0}
                    >
                        <Copy size={12} />
                    </IGRPButtonPrimitive>
                    <IGRPButtonPrimitive
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Clear logs"
                        onClick={handleClear}
                        disabled={logs.length === 0}
                    >
                        <Trash2 size={12} />
                    </IGRPButtonPrimitive>
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

const LogFilterButton = ({
    active,
    onClick,
    label
}: {
    active: boolean
    onClick: () => void
    label: string
}): JSX.Element => (
    <button
        type="button"
        onClick={onClick}
        className={cn(
            'rounded px-2 py-0.5 text-[10px] font-medium transition-colors',
            active ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:bg-accent'
        )}
    >
        {label}
    </button>
)

const LogLine = ({ log }: { log: PrototypeLog }): JSX.Element => {
    const ts = new Date(log.timestamp).toLocaleTimeString()
    const colour =
        log.level === 'error'
            ? 'text-red-500'
            : log.level === 'warn'
              ? 'text-amber-500'
              : 'text-foreground'
    return (
        <div className="flex gap-3">
            <span className="select-none text-muted-foreground">[{ts}]</span>
            <span className={cn('whitespace-pre-wrap break-all', colour)}>{log.line}</span>
        </div>
    )
}

// ─── History ──────────────────────────────────────────────────────────────

const HistoryPane = ({ basePath }: { basePath?: string }): JSX.Element => {
    const dispatch = useDispatch<any>()
    const snapshots = useSelector((s: RootState) => s.specPrototype.snapshots)

    return (
        <div className="h-full overflow-y-auto p-2">
            <div className="mb-3 flex items-center justify-between px-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {snapshots.length} snapshot{snapshots.length === 1 ? '' : 's'}
                </span>
                <button
                    type="button"
                    onClick={() => basePath && dispatch(loadPrototypeSnapshots(basePath))}
                    title="Refresh"
                    className="rounded p-1 hover:bg-accent"
                >
                    <RefreshCw size={11} />
                </button>
            </div>
            {snapshots.length === 0 ? (
                <div className="rounded-xl border border-dashed bg-card/30 p-8 text-center">
                    <History size={28} className="mx-auto mb-3 text-muted-foreground/40" />
                    <p className="text-sm font-medium">No snapshots yet</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Each successful build turn creates a snapshot you can restore from.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {snapshots.map((snap) => (
                        <SnapshotCard
                            key={snap.hash}
                            snap={snap}
                            onRestore={() => {
                                if (!basePath) return
                                if (
                                    window.confirm(
                                        `Restore snapshot ${snap.hash}? Uncommitted changes will be lost.`
                                    )
                                ) {
                                    dispatch(restorePrototypeSnapshot(basePath, snap.hash))
                                }
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

const SnapshotCard = ({
    snap,
    onRestore
}: {
    snap: PrototypeSnapshot
    onRestore: () => void
}): JSX.Element => (
    <div className="group space-y-3 rounded-xl border bg-card p-4 transition-all hover:border-primary/30">
        <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <History size={12} />
                {snap.date} · {snap.author}
            </div>
            <IGRPButtonPrimitive
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px] opacity-0 transition-opacity group-hover:opacity-100"
                onClick={onRestore}
            >
                Restore version
            </IGRPButtonPrimitive>
        </div>
        <p className="text-xs leading-relaxed">{snap.message}</p>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1 font-mono">
                <FileCode size={12} /> {snap.hash}
            </span>
            <span className="flex items-center gap-1">
                <CheckCircle2 size={12} className="text-emerald-500" /> Committed
            </span>
        </div>
    </div>
)

// ─── Footer ──────────────────────────────────────────────────────────────

const PrototypeFooter = ({ basePath }: { basePath?: string }): JSX.Element => {
    const dispatch = useDispatch<any>()
    const lastError = useSelector((s: RootState) => s.specPrototype.error)

    const handleExport = useCallback(async () => {
        if (!basePath) return
        try {
            const result = await window.specPrototype.export(basePath)
            if (result.ok && result.path) {
                window.alert(`Exported to:\n${result.path}`)
            }
        } catch (err) {
            window.alert(`Export failed: ${err instanceof Error ? err.message : String(err)}`)
        }
    }, [basePath])

    const handleOpenFolder = useCallback(async () => {
        if (!basePath) return
        try {
            const result = await window.specPrototype.openFolder(basePath)
            if (!result.ok && result.error) {
                window.alert(`Open folder failed: ${result.error}`)
            }
        } catch (err) {
            window.alert(
                `Open folder failed: ${err instanceof Error ? err.message : String(err)}`
            )
        }
    }, [basePath])

    const handleReset = useCallback(async () => {
        if (!basePath) return
        if (!window.confirm('Stop the dev server and clear local prototype state?')) return
        await window.specPrototype.stopDev(basePath)
        dispatch({ type: 'specPrototype/protoReset' })
    }, [basePath, dispatch])

    return (
        <footer className="flex h-12 shrink-0 items-center justify-between border-t bg-card px-4">
            <div className="flex items-center gap-2">
                <IGRPButtonPrimitive
                    variant="outline"
                    size="sm"
                    className="h-8 gap-2 text-xs"
                    onClick={handleExport}
                    disabled={!basePath}
                >
                    <Download size={14} /> Export project…
                </IGRPButtonPrimitive>
                <IGRPButtonPrimitive
                    variant="outline"
                    size="sm"
                    className="h-8 gap-2 text-xs"
                    onClick={handleOpenFolder}
                    disabled={!basePath}
                    title="Open the prototype folder in your file manager"
                >
                    <FolderOpen size={14} /> Open folder
                </IGRPButtonPrimitive>
                <span className="ml-2 truncate text-[10px] text-muted-foreground">
                    {basePath ?? '—'}
                </span>
                {lastError && (
                    <span className="ml-3 flex items-center gap-1 text-[10px] text-red-500">
                        <AlertCircle size={11} />
                        <span className="max-w-[280px] truncate" title={lastError}>
                            {lastError}
                        </span>
                    </span>
                )}
            </div>
            <IGRPButtonPrimitive
                variant="ghost"
                size="sm"
                className="h-8 gap-2 text-xs text-red-500 hover:bg-red-500/10"
                onClick={handleReset}
                disabled={!basePath}
            >
                <RotateCcw size={14} /> Reset prototype
            </IGRPButtonPrimitive>
        </footer>
    )
}

const PrototypePanel = ({ variant = 'content', ...rest }: PanelProps): JSX.Element => {
    return variant === 'list' ? <ListVariant /> : <ContentVariant {...rest} />
}

// Re-export the action creators we'll need from outside (used by the
// AIAssistant prototype dispatcher to push turn events into Redux).
export const prototypeChunkActions = {
    protoTurnStarted,
    protoTurnApplied,
    protoTurnFailed,
    protoTurnCommitted,
    protoTurnParseError,
    protoTurnFinished
}

export default PrototypePanel
