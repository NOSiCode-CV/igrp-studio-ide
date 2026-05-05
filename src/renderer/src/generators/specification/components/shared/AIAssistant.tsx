import {
    IGRPButtonPrimitive,
    IGRPInputPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { cn } from '@renderer/lib/utils'
import {
    AlertCircle,
    ArrowDownToLine,
    Check,
    Copy,
    Library,
    Loader2,
    MessageSquare,
    RefreshCw,
    Send,
    Square,
    Trash2,
    X
} from 'lucide-react'
import {
    type FormEvent,
    type JSX,
    type ReactNode,
    useCallback,
    useEffect,
    useRef,
    useState
} from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
    parseSearchReplaceBlocks,
    type SREdit
} from '../../utils/searchReplaceParser'

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
export type ProposalStatus = 'pending' | 'applied' | 'rejected' | 'stale'

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
    /** Where requests are dispatched. Default `{ kind: 'llm' }`. */
    chatBackend?: ChatBackend
    /**
     * When true, shows the "Use KB" toggle in the header — the host's
     * `contextProvider` is expected to honour it (do RAG when on, fall back
     * to plain context otherwise).
     */
    supportsKB?: boolean
    className?: string
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
    chatBackend = { kind: 'llm' },
    supportsKB = false,
    className
}: AIAssistantProps): JSX.Element {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [input, setInput] = useState('')
    const [streaming, setStreaming] = useState(false)
    const [activeRequestId, setActiveRequestId] = useState<string | null>(null)
    const [useKB, setUseKB] = useState<boolean>(supportsKB)

    const [models, setModels] = useState<ProviderModel[]>([])
    const [selected, setSelected] = useState<ProviderModel | null>(null)
    const [providersReady, setProvidersReady] = useState<boolean | null>(null)
    const [loadError, setLoadError] = useState<string | null>(null)

    const scrollRef = useRef<HTMLDivElement>(null)

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
                        (m) =>
                            m.providerId === 'openrouter' &&
                            /claude.*sonnet/i.test(m.modelId)
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
                    case 'op-applied':
                        target.prototype.applied += 1
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
                        value={
                            selected
                                ? `${selected.providerId}::${selected.modelId}`
                                : ''
                        }
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
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
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
                        onRetry={
                            m.role === 'assistant' && m.error && !streaming
                                ? () => handleRetry(m.id)
                                : undefined
                        }
                        proposalStatus={proposalStatus?.[m.id]}
                    />
                ))}
            </div>

            {/* Composer */}
            <form onSubmit={handleSubmit} className="border-t p-3">
                {ctxLabel && (
                    <p className="mb-1.5 text-[10px] text-muted-foreground">{ctxLabel}</p>
                )}

                <div className="flex items-end gap-2">
                    <IGRPInputPrimitive
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={placeholder}
                        disabled={!selected || streaming}
                        className="h-9 flex-1 text-[12px]"
                    />
                    {streaming ? (
                        <IGRPButtonPrimitive
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-9"
                            onClick={handleCancel}
                            title="Stop"
                        >
                            <Square size={12} />
                        </IGRPButtonPrimitive>
                    ) : (
                        <IGRPButtonPrimitive
                            type="submit"
                            size="sm"
                            className="h-9 gap-1.5"
                            disabled={!selected || !input.trim()}
                        >
                            <Send size={12} />
                            {submitLabel}
                        </IGRPButtonPrimitive>
                    )}
                </div>
            </form>
        </div>
    )
}

function MessageBubble({
    message,
    onRetry,
    proposalStatus
}: {
    message: ChatMessage
    onRetry?: () => void
    proposalStatus?: ProposalStatus
}): JSX.Element {
    const [copied, setCopied] = useState(false)
    const isUser = message.role === 'user'
    const canApply =
        !isUser && !message.streaming && !message.error && message.content.trim().length > 0

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
            className={cn('group flex', isUser ? 'justify-end' : 'justify-start')}
        >
            <div
                className={cn(
                    'max-w-[85%] rounded-lg px-3 py-2 text-[12px]',
                    isUser
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card border border-border',
                    message.error && !isUser && 'border-red-500/40'
                )}
            >
                {isUser ? (
                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                ) : (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content || (message.streaming ? '_…thinking_' : '')}
                        </ReactMarkdown>
                        {message.streaming && (
                            <span className="inline-block h-3 w-1 animate-pulse bg-primary align-baseline" />
                        )}
                    </div>
                )}

                {proposalStatus === 'pending' && (
                    <div className="mt-2 flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/5 px-2 py-1 text-[10px] text-primary">
                        <ArrowDownToLine size={10} />
                        Diff aberto no editor — review aí
                    </div>
                )}
                {proposalStatus === 'applied' && (
                    <div className="mt-2 flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-2 py-1 text-[10px] text-emerald-700 dark:text-emerald-400">
                        <Check size={10} />
                        Applied to document
                    </div>
                )}
                {proposalStatus === 'rejected' && (
                    <div className="mt-2 flex items-center gap-1.5 rounded-md border bg-muted/40 px-2 py-1 text-[10px] text-muted-foreground">
                        <X size={10} />
                        Rejected
                    </div>
                )}
                {proposalStatus === 'stale' && (
                    <div className="mt-2 flex items-center gap-1.5 rounded-md border bg-muted/40 px-2 py-1 text-[10px] text-muted-foreground opacity-70">
                        <X size={10} />
                        Replaced by a newer proposal
                    </div>
                )}

                {message.prototype && (message.prototype.applied > 0 || message.prototype.failed > 0 || message.prototype.commitSha) && (
                    <div className="mt-2 rounded-md border bg-background/60 p-2 text-[10px]">
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-foreground">
                                {message.prototype.summary ?? 'Build turn'}
                            </span>
                            {message.prototype.commitSha && (
                                <span className="font-mono text-muted-foreground">
                                    {message.prototype.commitSha.slice(0, 7)}
                                </span>
                            )}
                        </div>
                        <div className="mt-1 flex gap-3 text-muted-foreground">
                            <span>{message.prototype.applied} applied</span>
                            {message.prototype.failed > 0 && (
                                <span className="text-red-500">
                                    {message.prototype.failed} failed
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {message.data && (message.data.applied > 0 || message.data.failed > 0) && (
                    <div className="mt-2 rounded-md border bg-background/60 p-2 text-[10px]">
                        <div className="font-medium text-foreground">
                            {message.data.summary ?? 'Data turn'}
                        </div>
                        <div className="mt-1 flex gap-3 text-muted-foreground">
                            <span>{message.data.applied} applied</span>
                            {message.data.failed > 0 && (
                                <span className="text-red-500">
                                    {message.data.failed} failed
                                </span>
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

                {message.error && (
                    <div className="mt-2 space-y-1.5">
                        <p className="flex items-start gap-1 text-[10px] text-red-500">
                            <AlertCircle size={10} className="mt-0.5 shrink-0" />
                            <span className="break-words">{message.error}</span>
                        </p>
                        {onRetry && (
                            <button
                                type="button"
                                onClick={onRetry}
                                className="flex items-center gap-1 rounded-md border border-red-500/30 bg-red-500/5 px-2 py-1 text-[10px] font-medium text-red-500 hover:bg-red-500/10"
                            >
                                <RefreshCw size={10} /> Retry
                            </button>
                        )}
                    </div>
                )}
            </div>
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

function groupBy<T, K extends string>(
    items: T[],
    keyFn: (item: T) => K
): Record<K, T[]> {
    const out = {} as Record<K, T[]>
    for (const item of items) {
        const k = keyFn(item)
        if (!out[k]) out[k] = []
        out[k].push(item)
    }
    return out
}
