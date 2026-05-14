import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system'
import { cn } from '@renderer/lib/utils'
import {
    AlertCircle,
    ArrowDownToLine,
    Check,
    ChevronDown,
    ChevronRight,
    Copy,
    Library,
    Loader2,
    MessageSquare,
    RefreshCw,
    RotateCcw,
    Send,
    Sparkles,
    Square,
    Trash2,
    X
} from 'lucide-react'
import {
    type FormEvent,
    type JSX,
    type KeyboardEvent,
    type ReactNode,
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState
} from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
    parseSearchReplaceBlocks,
    type ProposalStatus,
    type ProposalSummary,
    type SREdit
} from '../../utils/searchReplaceParser'

// Re-export for the long-tail of callers that import ProposalStatus from
// AIAssistant — the canonical home is now `utils/searchReplaceParser`.
export type { ProposalStatus } from '../../utils/searchReplaceParser'

export type AIAssistantMode = 'docs' | 'prototype' | 'data' | 'process'

export interface AIAssistantContextInput {
    /** Latest user message — lets the host run RAG against it before replying. */
    userMessage: string
    /** Whether the host should ground the system prompt in linked KB items. */
    useKB: boolean
}

export interface AIAssistantContext {
    /** Composed system prompt — caller assembles spec/doc/KB content here. */
    systemPrompt?: string
    /** Optional helper text shown above the input ("Using N KB items"). */
    contextLabel?: string
}

/**
 * Per-message proposal status reported by the host. The assistant doesn't
 * own the diff itself — when a reply contains SEARCH/REPLACE blocks we fire
 * `onProposeChange` and the host renders a diff inside the document editor.
 * The host then mirrors back the resolution status so the chat bubble can
 * show a small badge.
 */

export interface PrototypeMessageOp {
    op: 'create' | 'update' | 'delete'
    path: string
    failed?: boolean
}

interface ChatMessage {
    id: string
    role: 'user' | 'assistant'
    content: string
    streaming?: boolean
    error?: string
    /** Prototype-only summary surfaced after a build turn finishes. */
    prototype?: {
        applied: number
        failed: number
        commitSha?: string | null
        summary?: string
        /**
         * Per-file ops applied/failed in this turn. Used by the snapshot
         * card to give the user a precise view of what changed without
         * leaving the chat.
         */
        ops?: PrototypeMessageOp[]
    }
    /** Data-models-only summary surfaced after an entity-ops turn finishes. */
    data?: {
        applied: number
        failed: number
        summary?: string
    }
}

/**
 * Routes chat requests through a different backend. Default is the LLM
 * router; prototype mode goes through `window.specPrototype.generateStart`
 * which performs the full file-ops pipeline + git commit.
 */
export type ChatBackend =
    | { kind: 'llm' }
    | {
          kind: 'prototype'
          basePath: string
          /** Dispatcher hook so the host can capture per-chunk events into Redux. */
          onTurnEvent?: (action: { type: string; payload?: unknown }) => void
      }
    | {
          kind: 'data'
          basePath: string
          /** Dispatcher hook for the `specData` slice — mirrors prototype. */
          onTurnEvent?: (action: { type: string; payload?: unknown }) => void
      }

interface AIAssistantProps {
    mode: AIAssistantMode
    /**
     * Resolves the context (system prompt) right before each request. Receives
     * the user message and the current "Use KB" toggle so the host can run
     * RAG and ground the prompt in real KB chunks.
     */
    contextProvider: (
        input: AIAssistantContextInput
    ) => AIAssistantContext | Promise<AIAssistantContext>
    title?: string
    placeholder?: string
    submitLabel?: string
    /** Slot rendered to the right of the title (e.g. RAG toggle, close button). */
    headerSlot?: ReactNode
    /** Optional handler invoked after each completed assistant message. */
    onAssistantOutput?: (msg: ChatMessage) => void
    /**
     * Fires when an assistant reply contains SEARCH/REPLACE edit blocks. The
     * host applies them onto the current document (via the parser util),
     * captures a snapshot, swaps the editor for a diff preview, and mirrors
     * resolution back through `proposalStatus`.
     */
    onProposeChange?: (messageId: string, edits: SREdit[]) => void
    /**
     * Per-message resolution status mirrored back from the host. Drives a
     * compact status badge on the assistant bubble (pending/applied/etc).
     */
    proposalStatus?: Record<string, ProposalStatus | undefined>
    /**
     * Per-message human-readable summary of the edits the assistant
     * proposed. When present, the bubble renders a checklist instead of
     * the raw reply (which contains SEARCH/REPLACE markup).
     */
    proposalSummaries?: Record<string, ProposalSummary[] | undefined>
    /**
     * The message id whose proposal is currently active in the editor (i.e.
     * diff is open and waiting for Apply/Reject). Only this message's
     * checklist gets interactive checkboxes; older messages render
     * read-only.
     */
    pendingMessageId?: string | null
    /** Per-edit selection for the active pending proposal. */
    pendingSelected?: boolean[]
    /** Toggle one edit's selection in the active pending proposal. */
    onProposalEditToggle?: (messageId: string, editIndex: number) => void
    /** Where requests are dispatched. Default `{ kind: 'llm' }`. */
    chatBackend?: ChatBackend
    /**
     * When true, shows the "Use KB" toggle in the header — the host's
     * `contextProvider` is expected to honour it (do RAG when on, fall back
     * to plain context otherwise).
     */
    supportsKB?: boolean
    /**
     * Read-only chat-level attachments (other docs in the spec). Rendered as
     * removable chips above the textarea. The host is responsible for
     * including them in the system prompt via `contextProvider`.
     */
    attachments?: ChatAttachment[]
    /** Remove a chip — host updates its attached-ids state. */
    onRemoveAttachment?: (id: string) => void
    /**
     * Slot rendered before the keyboard hint in the composer footer. Used to
     * mount an attach button (paperclip) without coupling the picker UI to
     * this component.
     */
    composerSlot?: ReactNode
    /**
     * When set, the message history is persisted to `localStorage` under
     * `spec.aiChat.<persistenceKey>` and reloaded on mount. Use it for
     * surfaces that get unmounted/remounted by parent navigation (rail
     * tabs in the Specification layout) — without this the chat resets to
     * empty whenever the user switches tabs and comes back.
     *
     * The key should include enough context to scope per-project so two
     * specs don't share chats (e.g. `prototype:<basePath>`).
     */
    persistenceKey?: string
    /**
     * Restore a prototype build snapshot inline from a chat bubble's snapshot
     * card. The host owns the destructive `git reset --hard <sha>` thunk —
     * the assistant only fires the intent. Required when `mode === 'prototype'`
     * to enable the Restore button in the snapshot card.
     */
    onPrototypeRestore?: (sha: string) => void
    /**
     * Click handler when the user opens a path from a snapshot card. The host
     * typically switches to the Files tab and selects the file. When omitted
     * the path becomes plain text (no link affordance).
     */
    onPrototypeOpenFile?: (path: string) => void
    className?: string
}

/**
 * Chat-level attachment: another doc in the same spec that the host has
 * pinned as read-only context for the current conversation. Distinct from
 * `kbRefs` (persistent on the doc) — these live with the chat session.
 */
export interface ChatAttachment {
    id: string
    name: string
    /** Visual hint in the chip: spec doc or UI component pinned to the turn. */
    kind: 'doc' | 'component'
    /** True when the attached doc has unsaved edits in another tab. */
    dirty?: boolean
}

interface ProviderModel {
    providerId: string
    providerLabel: string
    modelId: string
    modelLabel: string
}

export function AIAssistant({
    mode,
    contextProvider,
    title = 'AI Assistant',
    placeholder = mode === 'prototype'
        ? 'Add feature to prototype…'
        : mode === 'process'
          ? 'Ask about this process…'
          : 'Ask about this document…',
    submitLabel = mode === 'prototype' ? 'Build' : 'Send',
    headerSlot,
    onAssistantOutput,
    onProposeChange,
    proposalStatus,
    proposalSummaries,
    pendingMessageId,
    pendingSelected,
    onProposalEditToggle,
    chatBackend = { kind: 'llm' },
    supportsKB = false,
    attachments,
    onRemoveAttachment,
    composerSlot,
    persistenceKey,
    onPrototypeRestore,
    onPrototypeOpenFile,
    className
}: AIAssistantProps): JSX.Element {
    // Restore persisted message history when `persistenceKey` is provided.
    // Lazy init keeps the read off the render path. We treat parse failures
    // as "no history" — corrupt entries shouldn't break the chat surface.
    const [messages, setMessages] = useState<ChatMessage[]>(() =>
        readPersistedMessages(persistenceKey)
    )
    const [input, setInput] = useState('')
    const [streaming, setStreaming] = useState(false)
    const [activeRequestId, setActiveRequestId] = useState<string | null>(null)
    const [useKB, setUseKB] = useState<boolean>(supportsKB)

    // Persist message history to localStorage so the chat survives rail-tab
    // remounts (SpecificationLayout conditionally mounts each panel). We
    // skip persisting in-flight `streaming` flags on messages because they
    // refer to live requests that won't survive a remount anyway.
    useEffect(() => {
        if (!persistenceKey) return
        writePersistedMessages(persistenceKey, messages)
    }, [messages, persistenceKey])

    // When the host changes `persistenceKey` (different basePath after a
    // project switch), reload the relevant history for the new scope.
    const lastPersistenceKeyRef = useRef(persistenceKey)
    useEffect(() => {
        if (lastPersistenceKeyRef.current === persistenceKey) return
        lastPersistenceKeyRef.current = persistenceKey
        setMessages(readPersistedMessages(persistenceKey))
    }, [persistenceKey])

    const [models, setModels] = useState<ProviderModel[]>([])
    const [selected, setSelected] = useState<ProviderModel | null>(null)
    const [providersReady, setProvidersReady] = useState<boolean | null>(null)
    const [loadError, setLoadError] = useState<string | null>(null)

    const scrollRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Auto-grow the textarea up to a cap, then scroll. Reset on every input
    // change so deletes shrink the field too. Cap is roughly 8 lines at
    // 13px / 1.45 line-height ≈ 150px.
    useLayoutEffect(() => {
        const el = textareaRef.current
        if (!el) return
        el.style.height = 'auto'
        const next = Math.min(el.scrollHeight, 180)
        el.style.height = `${next}px`
    }, [input])

    // Load model list + provider readiness on mount.
    useEffect(() => {
        let cancelled = false
        ;(async () => {
            try {
                const [statuses, listed] = await Promise.all([
                    window.specLLM.statuses(),
                    window.specLLM.listModels()
                ])
                if (cancelled) return
                const ready = statuses.some((s) => s.ready)
                setProvidersReady(ready)

                const flat: ProviderModel[] = []
                for (const status of statuses) {
                    const provModels = listed[status.id] ?? []
                    for (const m of provModels) {
                        flat.push({
                            providerId: status.id,
                            providerLabel: status.label,
                            modelId: m.id,
                            modelLabel: m.label
                        })
                    }
                }
                setModels(flat)

                // Default selection: prefer Claude Sonnet 4.5 on OpenRouter, then first available.
                const preferred =
                    flat.find(
                        (m) => m.providerId === 'openrouter' && /claude.*sonnet/i.test(m.modelId)
                    ) ?? flat[0]
                if (preferred) setSelected(preferred)
            } catch (err) {
                if (!cancelled) {
                    setLoadError(err instanceof Error ? err.message : String(err))
                    setProvidersReady(false)
                }
            }
        })()
        return () => {
            cancelled = true
        }
    }, [])

    // Subscribe to streaming chunks. Two flows:
    //   - LLM (default): plain text deltas → message content.
    //   - Prototype: extra chunks (op-applied/failed, commit, parse-error)
    //     are forwarded to the host via `onTurnEvent` and summarised on the
    //     message bubble.
    const onTurnEventRef = useRef<ChatBackend>(chatBackend)
    useEffect(() => {
        onTurnEventRef.current = chatBackend
    }, [chatBackend])

    useEffect(() => {
        const offLLM = window.specLLM.onChunk(({ requestId, chunk }) => {
            setMessages((prev) => {
                const idx = prev.findIndex((m) => m.id === requestId)
                if (idx < 0) return prev
                const copy = [...prev]
                const target = { ...copy[idx] }
                if (chunk.type === 'delta') {
                    target.content = (target.content || '') + chunk.content
                } else if (chunk.type === 'error') {
                    target.error = chunk.message
                } else if (chunk.type === 'done') {
                    target.streaming = false
                }
                copy[idx] = target
                return copy
            })
            if (chunk.type === 'done') {
                setStreaming(false)
                setActiveRequestId(null)
            }
        })

        const offProto = window.specPrototype?.onChunk(({ requestId, chunk }) => {
            const dispatcher =
                onTurnEventRef.current?.kind === 'prototype'
                    ? onTurnEventRef.current.onTurnEvent
                    : undefined

            setMessages((prev) => {
                const idx = prev.findIndex((m) => m.id === requestId)
                if (idx < 0) return prev
                const copy = [...prev]
                const target = { ...copy[idx] }
                target.prototype = target.prototype ?? { applied: 0, failed: 0 }

                switch (chunk.type) {
                    case 'delta':
                        target.content = (target.content || '') + chunk.content
                        break
                    // M6 manifest-parsed: the JSON is valid and the engine
                    // is about to write code. UI shows "Applying…".
                    case 'manifest-parsed':
                        target.prototype.summary = `${chunk.manifest.pageName} · ${chunk.manifest.componentCount} components`
                        target.prototype.ops = [
                            ...(target.prototype.ops ?? []),
                            {
                                op: 'create',
                                path: chunk.manifest.outputPath
                            }
                        ]
                        break
                    // M6 manifest-applied: engine.createPage returned cleanly.
                    case 'manifest-applied':
                        target.prototype.applied += 1
                        dispatcher?.({
                            type: 'specPrototype/protoTurnApplied',
                            payload: {
                                requestId,
                                op: 'create',
                                path: chunk.manifest.outputPath
                            }
                        })
                        break
                    case 'op-applied':
                        target.prototype.applied += 1
                        target.prototype.ops = [
                            ...(target.prototype.ops ?? []),
                            { op: chunk.op.op, path: chunk.op.path }
                        ]
                        dispatcher?.({
                            type: 'specPrototype/protoTurnApplied',
                            payload: {
                                requestId,
                                op: chunk.op.op,
                                path: chunk.op.path
                            }
                        })
                        break
                    case 'op-failed':
                        target.prototype.failed += 1
                        target.prototype.ops = [
                            ...(target.prototype.ops ?? []),
                            { op: chunk.op.op, path: chunk.op.path, failed: true }
                        ]
                        dispatcher?.({
                            type: 'specPrototype/protoTurnFailed',
                            payload: {
                                requestId,
                                path: chunk.op.path,
                                error: chunk.error
                            }
                        })
                        break
                    case 'commit':
                        target.prototype.commitSha = chunk.sha ?? undefined
                        target.prototype.summary = chunk.summary
                        dispatcher?.({
                            type: 'specPrototype/protoTurnCommitted',
                            payload: {
                                requestId,
                                sha: chunk.sha,
                                summary: chunk.summary
                            }
                        })
                        break
                    case 'parse-error':
                        target.error = `Parse error: ${chunk.message}`
                        dispatcher?.({
                            type: 'specPrototype/protoTurnParseError',
                            payload: { requestId, message: chunk.message }
                        })
                        break
                    // M8 auto-retry — informational. The delta separator
                    // already streamed into the bubble; this dispatch
                    // is just for telemetry / future Redux integration.
                    case 'retry-attempt':
                        target.prototype.summary =
                            `attempt ${chunk.attempt}/${chunk.maxAttempts}`
                        break
                    // M7 preview seeding — informational only, no Redux
                    // dispatch. The ops list grows so the user sees that
                    // the Studio did seed (or skipped) automatically.
                    case 'mock-seeding':
                        target.prototype.summary =
                            (target.prototype.summary ?? '') + ' · seeding preview…'
                        break
                    case 'mock-seeded':
                        target.prototype.ops = [
                            ...(target.prototype.ops ?? []),
                            { op: 'create', path: chunk.mockJsonPath },
                            { op: 'create', path: chunk.previewTsPath }
                        ]
                        target.prototype.summary =
                            (target.prototype.summary ?? '').replace(
                                ' · seeding preview…',
                                ''
                            ) + ` · seeded ${chunk.rowCount} rows`
                        break
                    case 'mock-skipped':
                        target.prototype.summary =
                            (target.prototype.summary ?? '').replace(
                                ' · seeding preview…',
                                ''
                            ) + ' · no seed needed'
                        break
                    case 'error':
                        target.error = chunk.message
                        break
                    case 'done':
                        target.streaming = false
                        dispatcher?.({
                            type: 'specPrototype/protoTurnFinished',
                            payload: { requestId }
                        })
                        break
                }
                copy[idx] = target
                return copy
            })
            if (chunk.type === 'done') {
                setStreaming(false)
                setActiveRequestId(null)
            }
        })

        const offData = window.specData?.onChunk(({ requestId, chunk }) => {
            const dispatcher =
                onTurnEventRef.current?.kind === 'data'
                    ? onTurnEventRef.current.onTurnEvent
                    : undefined

            setMessages((prev) => {
                const idx = prev.findIndex((m) => m.id === requestId)
                if (idx < 0) return prev
                const copy = [...prev]
                const target = { ...copy[idx] }
                target.data = target.data ?? { applied: 0, failed: 0 }

                switch (chunk.type) {
                    case 'delta':
                        target.content = (target.content || '') + chunk.content
                        break
                    case 'op-applied':
                        target.data.applied += 1
                        dispatcher?.({
                            type: 'specData/dataTurnApplied',
                            payload: { requestId, op: chunk.op }
                        })
                        break
                    case 'op-failed':
                        target.data.failed += 1
                        dispatcher?.({
                            type: 'specData/dataTurnFailed',
                            payload: {
                                requestId,
                                op: { op: chunk.op.op, error: chunk.error }
                            }
                        })
                        break
                    case 'summary':
                        target.data.summary = chunk.summary
                        dispatcher?.({
                            type: 'specData/dataTurnSummary',
                            payload: { requestId, summary: chunk.summary }
                        })
                        break
                    case 'parse-error':
                        target.error = `Parse error: ${chunk.message}`
                        dispatcher?.({
                            type: 'specData/dataTurnParseError',
                            payload: { requestId, message: chunk.message }
                        })
                        break
                    case 'error':
                        target.error = chunk.message
                        break
                    case 'done':
                        target.streaming = false
                        dispatcher?.({
                            type: 'specData/dataTurnFinished',
                            payload: { requestId }
                        })
                        break
                }
                copy[idx] = target
                return copy
            })
            if (chunk.type === 'done') {
                setStreaming(false)
                setActiveRequestId(null)
            }
        })

        return () => {
            offLLM?.()
            offProto?.()
            offData?.()
        }
    }, [])

    // Auto-scroll on new content.
    useEffect(() => {
        const el = scrollRef.current
        if (el) el.scrollTop = el.scrollHeight
    }, [messages])

    // After an assistant message finishes streaming, parse the reply for
    // SEARCH/REPLACE blocks (Aider format). If any are present, hand them to
    // the host so it can apply them onto the current doc and show a diff in
    // the editor. Replies without blocks stay as conversation in the bubble.
    useEffect(() => {
        if (streaming) return
        const last = messages[messages.length - 1]
        if (!last || last.role !== 'assistant' || last.streaming || last.error) return

        onAssistantOutput?.(last)

        if (!onProposeChange || !last.content.trim()) return

        const edits = parseSearchReplaceBlocks(last.content)
        if (edits.length > 0) {
            onProposeChange(last.id, edits)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [streaming])

    /**
     * Fires a chat request with the given conversation history. The last entry
     * must be the user message (an assistant placeholder is appended here).
     * Used by both the composer and the Retry button on failed messages.
     */
    const dispatchChat = useCallback(
        async (history: ChatMessage[]) => {
            if (!selected || streaming) return
            const requestId = `r-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
            const assistantMsg: ChatMessage = {
                id: requestId,
                role: 'assistant',
                content: '',
                streaming: true
            }
            const nextMessages = [...history, assistantMsg]
            setMessages(nextMessages)
            setStreaming(true)
            setActiveRequestId(requestId)

            const lastUser = [...history].reverse().find((m) => m.role === 'user')
            const ctx = await contextProvider({
                userMessage: lastUser?.content ?? '',
                useKB
            })

            // The system prompt (assembled by the host's `contextProvider`)
            // already teaches the SEARCH/REPLACE format for Documents and
            // sets expectations for other modes — no extra directive needed.
            const wireMessages = history.map((m) => ({
                role: m.role,
                content: m.content
            }))

            // Route through the prototype pipeline when the host opted in.
            // The prototype generator wants the user message + spec context;
            // it ignores the conversational history (each turn is independent
            // by design — file ops are derived from the current state).
            const onError = (err: unknown) => {
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === requestId
                            ? {
                                  ...m,
                                  streaming: false,
                                  error: err instanceof Error ? err.message : String(err)
                              }
                            : m
                    )
                )
                setStreaming(false)
                setActiveRequestId(null)
            }

            if (chatBackend.kind === 'prototype') {
                chatBackend.onTurnEvent?.({
                    type: 'specPrototype/protoTurnStarted',
                    payload: { requestId }
                })
                window.specPrototype
                    .generateStart({
                        requestId,
                        basePath: chatBackend.basePath,
                        userMessage:
                            lastUser?.content ?? '',
                        specContext: ctx.systemPrompt,
                        providerId: selected.providerId,
                        model: selected.modelId
                    })
                    .catch(onError)
            } else if (chatBackend.kind === 'data') {
                chatBackend.onTurnEvent?.({
                    type: 'specData/dataTurnStarted',
                    payload: { requestId }
                })
                window.specData
                    .generateStart({
                        requestId,
                        basePath: chatBackend.basePath,
                        userMessage:
                            lastUser?.content ?? '',
                        specContext: ctx.systemPrompt,
                        providerId: selected.providerId,
                        model: selected.modelId
                    })
                    .catch(onError)
            } else {
                window.specLLM
                    .chatStart({
                        requestId,
                        providerId: selected.providerId,
                        model: selected.modelId,
                        systemPrompt: ctx.systemPrompt,
                        messages: wireMessages
                    })
                    .catch(onError)
            }
        },
        [chatBackend, contextProvider, selected, streaming, useKB]
    )

    const handleSubmit = useCallback(
        async (event: FormEvent) => {
            event.preventDefault()
            if (!selected || !input.trim() || streaming) return

            const userMsg: ChatMessage = {
                id: `u-${Date.now()}`,
                role: 'user',
                content: input.trim()
            }
            setInput('')
            await dispatchChat([...messages, userMsg])
        },
        [dispatchChat, input, messages, selected, streaming]
    )

    /**
     * Composer key bindings — Enter sends, Shift+Enter inserts a newline,
     * Cmd/Ctrl+Enter also sends (handy when the cursor is mid-line). IME
     * composition is respected so accents on macOS don't fire a send.
     */
    const handleComposerKeyDown = useCallback(
        (event: KeyboardEvent<HTMLTextAreaElement>) => {
            if (event.nativeEvent.isComposing) return
            const send = (event.key === 'Enter' && !event.shiftKey) ||
                (event.key === 'Enter' && (event.metaKey || event.ctrlKey))
            if (!send) return
            event.preventDefault()
            // Reuse the form submit path so guard logic stays in one place.
            const form = event.currentTarget.form
            form?.requestSubmit()
        },
        []
    )

    /**
     * Drops the failed assistant message and re-fires the chat with the same
     * user history that produced it. Useful after transient errors (login,
     * rate limit, network).
     */
    const handleRetry = useCallback(
        (failedMessageId: string) => {
            if (streaming) return
            const idx = messages.findIndex((m) => m.id === failedMessageId)
            if (idx < 0) return
            // The failed assistant must have a preceding user message.
            const previousUser = messages
                .slice(0, idx)
                .reverse()
                .find((m) => m.role === 'user')
            if (!previousUser) return
            const history = messages.slice(0, idx)
            dispatchChat(history)
        },
        [dispatchChat, messages, streaming]
    )

    /**
     * Smarter retry for prototype/data turns: re-fire the chat but inject
     * a synthetic user message describing the parse/apply error so the LLM
     * has the context needed to fix its own output. Used by the "Ask AI to
     * fix" button on bubbles that failed mid-pipeline (vs. transient errors
     * where plain Retry suffices).
     */
    const handleAskAIToFix = useCallback(
        (failedMessageId: string) => {
            if (streaming) return
            const idx = messages.findIndex((m) => m.id === failedMessageId)
            if (idx < 0) return
            const failed = messages[idx]
            const errText = failed.error ?? ''
            const failedOps =
                failed.prototype?.ops?.filter((o) => o.failed) ??
                ([] as PrototypeMessageOp[])
            const lines: string[] = []
            if (errText) lines.push(`The previous attempt failed: ${errText}`)
            if (failedOps.length > 0) {
                lines.push(
                    `Failed ops:\n${failedOps.map((o) => `  - ${o.op} ${o.path}`).join('\n')}`
                )
            }
            lines.push(
                'Please diagnose the cause and resend a corrected response in the same format.'
            )
            const fixId = `fix-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
            const synthetic: ChatMessage = {
                id: fixId,
                role: 'user',
                content: lines.join('\n\n')
            }
            const history = [...messages.slice(0, idx), synthetic]
            dispatchChat(history)
        },
        [dispatchChat, messages, streaming]
    )

    const handleCancel = useCallback(() => {
        if (!activeRequestId) return
        if (chatBackend.kind === 'prototype') {
            window.specPrototype.generateCancel(activeRequestId)
        } else {
            window.specLLM.chatCancel(activeRequestId)
        }
    }, [activeRequestId, chatBackend])

    const handleClear = () => {
        if (streaming) handleCancel()
        setMessages([])
    }

    // Refresh the context label whenever inputs that affect it change. We
    // pass an empty userMessage so the host knows it's a label-only call (no
    // need to run RAG just for the hint).
    const [ctxLabel, setCtxLabel] = useState<string | undefined>(undefined)
    useEffect(() => {
        let cancelled = false
        Promise.resolve(contextProvider({ userMessage: '', useKB })).then((c) => {
            if (!cancelled) setCtxLabel(c.contextLabel)
        })
        return () => {
            cancelled = true
        }
    }, [contextProvider, messages.length, useKB])

    return (
        <div className={cn('flex h-full flex-col bg-card/30', className)}>
            <header className="flex h-10 shrink-0 items-center justify-between border-b px-3">
                <div className="flex items-center gap-2 text-xs">
                    <MessageSquare size={12} className="text-primary" />
                    <span className="font-semibold">{title}</span>
                </div>
                <div className="flex items-center gap-1">
                    {supportsKB && (
                        <button
                            type="button"
                            onClick={() => setUseKB((v) => !v)}
                            title={
                                useKB
                                    ? 'Knowledge Base context: ON · click to disable'
                                    : 'Knowledge Base context: OFF · click to ground answers in KB'
                            }
                            className={cn(
                                'flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors',
                                useKB
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:bg-accent'
                            )}
                        >
                            <Library size={11} />
                            {useKB ? 'KB on' : 'KB off'}
                        </button>
                    )}
                    {messages.length > 0 && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="rounded p-1 text-muted-foreground hover:bg-accent"
                            title="Clear conversation"
                        >
                            <Trash2 size={12} />
                        </button>
                    )}
                    {headerSlot}
                </div>
            </header>

            {/* Provider/model picker */}
            <div className="flex items-center gap-2 border-b bg-background/50 px-3 py-2 text-[11px]">
                {providersReady === false ? (
                    <span className="flex items-center gap-1 text-amber-600">
                        <AlertCircle size={11} /> No provider configured.{' '}
                        <span className="text-muted-foreground">Open Settings → AI Providers.</span>
                    </span>
                ) : models.length === 0 ? (
                    <span className="flex items-center gap-1 text-muted-foreground">
                        <Loader2 size={11} className="animate-spin" /> Loading models…
                    </span>
                ) : (
                    <select
                        value={selected ? `${selected.providerId}::${selected.modelId}` : ''}
                        onChange={(e) => {
                            const [providerId, modelId] = e.target.value.split('::')
                            const m = models.find(
                                (x) => x.providerId === providerId && x.modelId === modelId
                            )
                            if (m) setSelected(m)
                        }}
                        className="flex-1 truncate rounded border bg-card px-2 py-1 text-[11px]"
                    >
                        {Object.entries(groupBy(models, (m) => m.providerLabel)).map(
                            ([providerLabel, list]) => (
                                <optgroup key={providerLabel} label={providerLabel}>
                                    {list.map((m) => (
                                        <option
                                            key={`${m.providerId}::${m.modelId}`}
                                            value={`${m.providerId}::${m.modelId}`}
                                        >
                                            {m.modelLabel}
                                        </option>
                                    ))}
                                </optgroup>
                            )
                        )}
                    </select>
                )}
            </div>

            {/* Messages */}
            <div
                ref={scrollRef}
                className="flex-1 divide-y divide-border/40 overflow-y-auto px-3"
            >
                {loadError && (
                    <div className="flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/5 p-2 text-[11px] text-red-500">
                        <AlertCircle size={12} className="mt-0.5 shrink-0" />
                        {loadError}
                    </div>
                )}
                {messages.length === 0 && (
                    <p className="px-2 py-8 text-center text-[11px] italic text-muted-foreground">
                        {mode === 'prototype'
                            ? 'Describe a feature or paste a mockup to get started.'
                            : 'Ask anything about this document or your KB.'}
                    </p>
                )}
                {messages.map((m) => (
                    <MessageBubble
                        key={m.id}
                        message={m}
                        streaming={streaming}
                        onRetry={
                            m.role === 'assistant' && m.error && !streaming
                                ? () => handleRetry(m.id)
                                : undefined
                        }
                        onAskAIToFix={
                            m.role === 'assistant' &&
                            !streaming &&
                            (m.error || (m.prototype?.failed ?? 0) > 0) &&
                            (chatBackend.kind === 'prototype' ||
                                chatBackend.kind === 'data')
                                ? () => handleAskAIToFix(m.id)
                                : undefined
                        }
                        proposalStatus={proposalStatus?.[m.id]}
                        proposalSummary={proposalSummaries?.[m.id]}
                        editToggles={
                            pendingMessageId === m.id && pendingSelected && onProposalEditToggle
                                ? {
                                      selected: pendingSelected,
                                      onToggle: (idx) =>
                                          onProposalEditToggle(m.id, idx)
                                  }
                                : undefined
                        }
                        onPrototypeRestore={onPrototypeRestore}
                        onPrototypeOpenFile={onPrototypeOpenFile}
                    />
                ))}
            </div>

            {/* Composer — Claude-Code-style textarea: Enter sends, Shift+Enter
                inserts a newline, Cmd/Ctrl+Enter sends from anywhere. */}
            <form onSubmit={handleSubmit} className="border-t p-3">
                {ctxLabel && <p className="mb-1.5 text-[10px] text-muted-foreground">{ctxLabel}</p>}

                <div
                    className={cn(
                        'flex flex-col gap-1.5 rounded-md border bg-background px-2.5 py-2 transition-shadow',
                        'focus-within:border-primary/60 focus-within:shadow-[0_0_0_2px_hsl(var(--primary)/0.15)]',
                        (!selected || streaming) && 'opacity-60'
                    )}
                >
                    {attachments && attachments.length > 0 && (
                        <div className="-mx-1 flex flex-wrap gap-1">
                            {attachments.map((att) => (
                                <span
                                    key={att.id}
                                    className="inline-flex items-center gap-1 rounded border bg-muted/40 px-1.5 py-0.5 text-[10px]"
                                    title={att.dirty ? `${att.name} (unsaved)` : att.name}
                                >
                                    <span className="text-muted-foreground">
                                        {att.kind === 'component' ? '◾' : '@'}
                                    </span>
                                    <span className="max-w-[140px] truncate">
                                        {att.name}
                                        {att.dirty && (
                                            <span className="ml-1 text-amber-500">●</span>
                                        )}
                                    </span>
                                    {onRemoveAttachment && (
                                        <button
                                            type="button"
                                            onClick={() => onRemoveAttachment(att.id)}
                                            className="ml-0.5 rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                                            title="Remove"
                                        >
                                            <X size={9} />
                                        </button>
                                    )}
                                </span>
                            ))}
                        </div>
                    )}
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleComposerKeyDown}
                        placeholder={placeholder}
                        disabled={!selected || streaming}
                        rows={2}
                        className="resize-none bg-transparent text-[12.5px] leading-relaxed outline-none placeholder:text-muted-foreground/70 disabled:cursor-not-allowed"
                        spellCheck={false}
                    />
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            {composerSlot}
                            <span className="text-[10px] text-muted-foreground">
                                <kbd className="rounded border bg-muted/40 px-1 py-px font-mono text-[9px]">
                                    Enter
                                </kbd>{' '}
                                send ·{' '}
                                <kbd className="rounded border bg-muted/40 px-1 py-px font-mono text-[9px]">
                                    Shift+Enter
                                </kbd>{' '}
                                new line
                            </span>
                        </div>
                        {streaming ? (
                            <IGRPButtonPrimitive
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-7 gap-1 text-[11px]"
                                onClick={handleCancel}
                                title="Stop"
                            >
                                <Square size={11} /> Stop
                            </IGRPButtonPrimitive>
                        ) : (
                            <IGRPButtonPrimitive
                                type="submit"
                                size="sm"
                                className="h-7 gap-1 text-[11px]"
                                disabled={!selected || !input.trim()}
                            >
                                <Send size={11} />
                                {submitLabel}
                            </IGRPButtonPrimitive>
                        )}
                    </div>
                </div>
            </form>
        </div>
    )
}

function MessageBubble({
    message,
    streaming,
    onRetry,
    onAskAIToFix,
    proposalStatus,
    proposalSummary,
    editToggles,
    onPrototypeRestore,
    onPrototypeOpenFile
}: {
    message: ChatMessage
    /** Global streaming flag — used to show "applying…" spinners only on the active turn. */
    streaming?: boolean
    onRetry?: () => void
    /** Smarter retry that ships the previous error as a follow-up user message. */
    onAskAIToFix?: () => void
    proposalStatus?: ProposalStatus
    proposalSummary?: ProposalSummary[]
    /** When set, the checklist renders interactive checkboxes wired to this. */
    editToggles?: {
        selected: boolean[]
        onToggle: (editIndex: number) => void
    }
    onPrototypeRestore?: (sha: string) => void
    onPrototypeOpenFile?: (path: string) => void
}): JSX.Element {
    const [copied, setCopied] = useState(false)
    const isUser = message.role === 'user'
    const canApply =
        !isUser && !message.streaming && !message.error && message.content.trim().length > 0
    // While streaming, the partial reply may contain raw SEARCH/REPLACE
    // markup; show a clean placeholder so the user doesn't see ugly
    // delimiters mid-stream.
    const looksLikeEdits =
        !isUser && /<{5,}\s*SEARCH/.test(message.content)
    const showChecklist = !isUser && proposalSummary && proposalSummary.length > 0

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(message.content)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        } catch {
            // ignore — most desktop builds allow clipboard.
        }
    }

    return (
        <div
            className={cn(
                'group flex py-2.5 text-[12px]',
                isUser ? 'justify-end' : 'justify-start'
            )}
        >
            {/* Assistant messages flow as prose against the panel background
                with a subtle left guideline; user messages stay as a tight
                primary-tinted chip on the right. */}
            <div
                className={cn(
                    isUser
                        ? 'max-w-[85%] rounded-md bg-primary/90 px-2.5 py-1.5 text-primary-foreground'
                        : 'min-w-0 flex-1 border-l-2 border-primary/30 pl-2.5',
                    message.error && !isUser && 'border-red-500/50'
                )}
            >
                {isUser ? (
                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                ) : showChecklist ? (
                    <ProposalChecklist
                        items={proposalSummary!}
                        status={proposalStatus}
                        editToggles={editToggles}
                    />
                ) : looksLikeEdits ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 size={12} className="animate-spin" />
                        <span className="text-[11px] italic">
                            {message.streaming
                                ? 'Drafting edits…'
                                : 'Parsing edits…'}
                        </span>
                    </div>
                ) : (
                    <div className="prose prose-sm max-w-none leading-snug dark:prose-invert">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content || (message.streaming ? '_…thinking_' : '')}
                        </ReactMarkdown>
                        {message.streaming && (
                            <span className="inline-block h-3 w-1 animate-pulse bg-primary align-baseline" />
                        )}
                    </div>
                )}

                {proposalStatus === 'pending' && (
                    <p className="mt-1.5 flex items-center gap-1 text-[10px] text-primary/80">
                        <ArrowDownToLine size={10} />
                        Diff open in editor — review on the left.
                    </p>
                )}

                {message.prototype &&
                    (message.prototype.applied > 0 ||
                        message.prototype.failed > 0 ||
                        message.prototype.commitSha) && (
                        <PrototypeSnapshotCard
                            data={message.prototype}
                            streaming={Boolean(message.streaming)}
                            globalStreaming={Boolean(streaming)}
                            onRestore={onPrototypeRestore}
                            onOpenFile={onPrototypeOpenFile}
                        />
                    )}

                {message.data && (message.data.applied > 0 || message.data.failed > 0) && (
                    <div className="mt-2 rounded-md border bg-background/60 p-2 text-[10px]">
                        <div className="font-medium text-foreground">
                            {message.data.summary ?? 'Data turn'}
                        </div>
                        <div className="mt-1 flex gap-3 text-muted-foreground">
                            <span>{message.data.applied} applied</span>
                            {message.data.failed > 0 && (
                                <span className="text-red-500">{message.data.failed} failed</span>
                            )}
                        </div>
                    </div>
                )}

                {canApply && (
                    <div className="mt-2 flex flex-wrap items-center gap-1 border-t border-border pt-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <BubbleAction
                            icon={<Copy size={10} />}
                            label={copied ? 'Copied' : 'Copy'}
                            onClick={handleCopy}
                        />
                    </div>
                )}

                {(message.error || (message.prototype?.failed ?? 0) > 0) && (
                    <div className="mt-2 space-y-1.5">
                        {message.error && (
                            <p className="flex items-start gap-1 text-[10px] text-red-500">
                                <AlertCircle size={10} className="mt-0.5 shrink-0" />
                                <span className="break-words">{message.error}</span>
                            </p>
                        )}
                        <div className="flex flex-wrap gap-1">
                            {onRetry && (
                                <button
                                    type="button"
                                    onClick={onRetry}
                                    className="flex items-center gap-1 rounded-md border border-red-500/30 bg-red-500/5 px-2 py-1 text-[10px] font-medium text-red-500 hover:bg-red-500/10"
                                >
                                    <RefreshCw size={10} /> Retry
                                </button>
                            )}
                            {onAskAIToFix && (
                                <button
                                    type="button"
                                    onClick={onAskAIToFix}
                                    className="flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/5 px-2 py-1 text-[10px] font-medium text-amber-500 hover:bg-amber-500/10"
                                    title="Re-fire the turn with the failure as context so the AI can self-correct"
                                >
                                    <Sparkles size={10} /> Ask AI to fix
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

/**
 * Claude-Code-style tool-use card: a collapsible header summarising the
 * edits the assistant proposed, with a checklist body when expanded.
 * Defaults open while pending review, auto-collapses once resolved so the
 * chat history stays scannable.
 */
function ProposalChecklist({
    items,
    status,
    editToggles
}: {
    items: ProposalSummary[]
    status?: ProposalStatus
    /** When set, the checklist is interactive — each ok edit gets a checkbox. */
    editToggles?: {
        selected: boolean[]
        onToggle: (editIndex: number) => void
    }
}): JSX.Element {
    const ok = items.filter((i) => i.ok).length
    const failed = items.length - ok
    // Active proposals have selected[]; show "selected of total ok" so the
    // user knows the impact of toggling.
    const selectedOk = editToggles
        ? items.reduce(
              (acc, item, idx) =>
                  acc + (item.ok && editToggles.selected[idx] ? 1 : 0),
              0
          )
        : ok
    const [expanded, setExpanded] = useState(status === 'pending' || !status)

    const statusBadge =
        status === 'applied'
            ? { text: 'applied', tone: 'text-emerald-600 bg-emerald-500/10' }
            : status === 'rejected'
              ? { text: 'rejected', tone: 'text-muted-foreground bg-muted/40' }
              : status === 'stale'
                ? { text: 'stale', tone: 'text-muted-foreground bg-muted/40' }
                : { text: 'pending', tone: 'text-primary bg-primary/10' }

    const allOn =
        editToggles &&
        items.every((item, idx) => !item.ok || editToggles.selected[idx])
    const handleToggleAll = () => {
        if (!editToggles) return
        // If everything is on, toggling means unselect all; else select all ok.
        items.forEach((item, idx) => {
            if (!item.ok) return
            const want = !allOn
            if (editToggles.selected[idx] !== want) editToggles.onToggle(idx)
        })
    }

    return (
        <div className="rounded-md border border-border/60 bg-background/40 font-mono">
            <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-[11px] hover:bg-muted/30"
            >
                <span className="text-muted-foreground">
                    {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                </span>
                <span className="font-semibold tracking-tight">Edit document</span>
                <span className="text-muted-foreground">
                    {ok > 0 && (
                        <span className="text-emerald-600">
                            ✓ {editToggles ? `${selectedOk}/${ok}` : ok}
                        </span>
                    )}
                    {ok > 0 && failed > 0 && ' · '}
                    {failed > 0 && (
                        <span className="text-amber-600">✗ {failed}</span>
                    )}
                </span>
                <span
                    className={cn(
                        'ml-auto rounded px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider',
                        statusBadge.tone
                    )}
                >
                    {statusBadge.text}
                </span>
            </button>
            {expanded && (
                <>
                    {editToggles && ok > 0 && (
                        <div className="flex items-center justify-between border-t border-border/40 px-2 py-1 text-[10px] text-muted-foreground">
                            <span>Toggle which edits to apply.</span>
                            <button
                                type="button"
                                onClick={handleToggleAll}
                                className="rounded px-1.5 py-0.5 hover:bg-muted/40"
                            >
                                {allOn ? 'Unselect all' : 'Select all'}
                            </button>
                        </div>
                    )}
                    <ul className="border-t border-border/40 py-1">
                        {items.map((item, idx) => {
                            const interactive = Boolean(editToggles && item.ok)
                            const checked = editToggles
                                ? editToggles.selected[idx] && item.ok
                                : item.ok
                            return (
                                <li
                                    key={idx}
                                    className={cn(
                                        'flex items-start gap-1.5 px-2 py-0.5 text-[11px]',
                                        interactive &&
                                            'cursor-pointer hover:bg-muted/30'
                                    )}
                                    onClick={
                                        interactive
                                            ? () => editToggles!.onToggle(idx)
                                            : undefined
                                    }
                                >
                                    {editToggles ? (
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            disabled={!item.ok}
                                            onChange={() =>
                                                editToggles.onToggle(idx)
                                            }
                                            onClick={(e) => e.stopPropagation()}
                                            className="mt-0.5 h-3 w-3 shrink-0 cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                    ) : (
                                        <span
                                            className={cn(
                                                'mt-0.5 shrink-0',
                                                item.ok
                                                    ? 'text-emerald-600'
                                                    : 'text-amber-600'
                                            )}
                                        >
                                            {item.ok ? (
                                                <Check size={10} />
                                            ) : (
                                                <X size={10} />
                                            )}
                                        </span>
                                    )}
                                    <div
                                        className={cn(
                                            'min-w-0 flex-1 leading-snug',
                                            interactive &&
                                                !checked &&
                                                'opacity-50'
                                        )}
                                    >
                                        <div className="break-words text-foreground">
                                            {item.label}
                                        </div>
                                        {item.detail && (
                                            <div className="break-words text-[10px] text-muted-foreground">
                                                {item.detail}
                                            </div>
                                        )}
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                </>
            )}
        </div>
    )
}

function BubbleAction({
    icon,
    label,
    title,
    onClick
}: {
    icon: ReactNode
    label: string
    title?: string
    onClick: () => void
}): JSX.Element {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title ?? label}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground"
        >
            {icon}
            {label}
        </button>
    )
}

function groupBy<T, K extends string>(items: T[], keyFn: (item: T) => K): Record<K, T[]> {
    const out = {} as Record<K, T[]>
    for (const item of items) {
        const k = keyFn(item)
        if (!out[k]) out[k] = []
        out[k].push(item)
    }
    return out
}

// ─── Prototype snapshot card (M4.11) ─────────────────────────────────────
//
// Inline summary of a single build turn: counts per op kind, collapsible
// path list, and an inline Restore button (host owns the destructive thunk).

const opKindLabel: Record<'create' | 'update' | 'delete', string> = {
    create: 'created',
    update: 'updated',
    delete: 'deleted'
}

const opKindClass: Record<'create' | 'update' | 'delete', string> = {
    create: 'text-emerald-500',
    update: 'text-blue-500',
    delete: 'text-red-500'
}

function PrototypeSnapshotCard({
    data,
    streaming,
    globalStreaming,
    onRestore,
    onOpenFile
}: {
    data: NonNullable<ChatMessage['prototype']>
    /** This message is the one currently being streamed. */
    streaming?: boolean
    /** Any chat message is streaming — disables Restore to avoid races. */
    globalStreaming?: boolean
    onRestore?: (sha: string) => void
    onOpenFile?: (path: string) => void
}): JSX.Element {
    const [expanded, setExpanded] = useState(false)
    const ops = data.ops ?? []
    const created = ops.filter((o) => o.op === 'create' && !o.failed)
    const updated = ops.filter((o) => o.op === 'update' && !o.failed)
    const deleted = ops.filter((o) => o.op === 'delete' && !o.failed)
    const failed = ops.filter((o) => o.failed)

    const summaryBits: string[] = []
    if (created.length) summaryBits.push(`${created.length} created`)
    if (updated.length) summaryBits.push(`${updated.length} updated`)
    if (deleted.length) summaryBits.push(`${deleted.length} deleted`)
    if (failed.length) summaryBits.push(`${failed.length} failed`)

    const sha = data.commitSha ?? null

    return (
        <div className="mt-2 overflow-hidden rounded-md border bg-background/60 text-[10px]">
            <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                disabled={ops.length === 0}
                className="flex w-full items-center gap-2 px-2 py-1.5 text-left transition-colors hover:bg-accent/40 disabled:cursor-default disabled:hover:bg-transparent"
            >
                {ops.length > 0 ? (
                    expanded ? (
                        <ChevronDown size={11} className="shrink-0 text-muted-foreground" />
                    ) : (
                        <ChevronRight size={11} className="shrink-0 text-muted-foreground" />
                    )
                ) : (
                    <span className="w-[11px] shrink-0" />
                )}
                <span className="flex-1 truncate font-medium text-foreground">
                    {data.summary ?? 'Build turn'}
                </span>
                {streaming && (
                    <span className="flex shrink-0 items-center gap-1 text-amber-500">
                        <Loader2 size={10} className="animate-spin" />
                        <span>applying {data.applied}…</span>
                    </span>
                )}
                {!streaming && summaryBits.length > 0 && (
                    <span className="shrink-0 text-muted-foreground">
                        {summaryBits.join(' · ')}
                    </span>
                )}
                {sha && (
                    <span className="shrink-0 font-mono text-muted-foreground">
                        {sha.slice(0, 7)}
                    </span>
                )}
            </button>
            {expanded && ops.length > 0 && (
                <ul className="border-t bg-card/40 p-2">
                    {ops.map((op, idx) => (
                        <li
                            key={`${op.path}-${idx}`}
                            className={cn(
                                'flex items-center gap-2 rounded px-1.5 py-0.5',
                                onOpenFile && !op.failed && 'cursor-pointer hover:bg-accent'
                            )}
                            onClick={
                                onOpenFile && !op.failed
                                    ? () => onOpenFile(op.path)
                                    : undefined
                            }
                            role={onOpenFile && !op.failed ? 'button' : undefined}
                        >
                            <span
                                className={cn(
                                    'w-14 shrink-0 font-medium uppercase tracking-wide',
                                    op.failed ? 'text-red-500' : opKindClass[op.op]
                                )}
                            >
                                {op.failed ? 'failed' : opKindLabel[op.op]}
                            </span>
                            <span className="flex-1 truncate font-mono text-foreground">
                                {op.path}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
            {sha && onRestore && !globalStreaming && (
                <div className="flex justify-end border-t bg-card/40 px-2 py-1">
                    <button
                        type="button"
                        onClick={() => {
                            if (
                                window.confirm(
                                    `Restore prototype to commit ${sha.slice(0, 7)}? Uncommitted changes will be lost.`
                                )
                            ) {
                                onRestore(sha)
                            }
                        }}
                        className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                        <RotateCcw size={10} />
                        Restore this turn
                    </button>
                </div>
            )}
        </div>
    )
}

// ─── chat history persistence helpers ───────────────────────────────────
//
// Persist only fields that make sense on remount. `streaming` is reset to
// false (an in-flight request from a previous session is unreachable from
// the new AIAssistant instance). `error` is preserved so the user still
// sees what went wrong before they navigated away.

const PERSIST_PREFIX = 'spec.aiChat.'
const MAX_PERSISTED_MESSAGES = 200

function persistenceStorageKey(key: string): string {
    return `${PERSIST_PREFIX}${key}`
}

function readPersistedMessages(key: string | undefined): ChatMessage[] {
    if (!key || typeof window === 'undefined') return []
    try {
        const raw = window.localStorage?.getItem(persistenceStorageKey(key))
        if (!raw) return []
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return []
        return parsed
            .filter(
                (m: unknown): m is ChatMessage =>
                    Boolean(m) &&
                    typeof m === 'object' &&
                    typeof (m as ChatMessage).id === 'string' &&
                    typeof (m as ChatMessage).role === 'string' &&
                    typeof (m as ChatMessage).content === 'string'
            )
            .map((m) => ({ ...m, streaming: false }))
    } catch {
        return []
    }
}

function writePersistedMessages(key: string, messages: ChatMessage[]): void {
    if (typeof window === 'undefined') return
    try {
        // Trim oldest first if the chat ran for a long time — localStorage
        // quota is shared per origin (~5MB Chromium), and a single chat
        // shouldn't dominate that budget.
        const trimmed = messages.slice(-MAX_PERSISTED_MESSAGES)
        // Strip transient flags before persisting.
        const persistable = trimmed.map((m) => ({ ...m, streaming: false }))
        window.localStorage?.setItem(
            persistenceStorageKey(key),
            JSON.stringify(persistable)
        )
    } catch {
        // localStorage may be full or unavailable; failing silently keeps
        // the chat alive in memory for the current session.
    }
}
