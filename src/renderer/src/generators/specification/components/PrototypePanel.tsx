import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system'
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
import {
    AlertCircle,
    CheckCircle2,
    Download,
    ExternalLink,
    FileCode,
    FolderOpen,
    History,
    Layout as LayoutIcon,
    Monitor,
    Pause,
    Play,
    RefreshCw,
    RotateCcw,
    Smartphone,
    Tablet,
    Terminal,
    X
} from 'lucide-react'
import { type JSX, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AIAssistant } from './shared/AIAssistant'

interface PanelProps {
    basePath?: string
    currentItem?: any
    variant?: 'list' | 'content'
}

type DeviceFrame = 'desktop' | 'tablet' | 'mobile'
type PrototypeTab = 'preview' | 'files' | 'logs' | 'history'

const TABS: { id: PrototypeTab; label: string }[] = [
    { id: 'preview', label: 'Preview' },
    { id: 'files', label: 'Files' },
    { id: 'logs', label: 'Logs' },
    { id: 'history', label: 'History' }
]

// ─── List variant — placeholder; the rail hides the secondary panel here. ─

const ListVariant = (): JSX.Element => (
    <div className="flex flex-col gap-3 p-3 text-xs text-muted-foreground">
        Prototype builder is opened in the main area.
    </div>
)

// ─── Content variant ──────────────────────────────────────────────────────

const ContentVariant = ({ basePath }: PanelProps): JSX.Element => {
    const dispatch = useDispatch<any>()
    const docs = useSelector((s: RootState) => s.specDocs.nodes)
    const buffer = useSelector((s: RootState) => s.specDocs.buffer)
    const selectedId = useSelector((s: RootState) => s.specDocs.selectedId)
    const kbItems = useSelector((s: RootState) => s.specKB.items)
    const devStatus = useSelector((s: RootState) => s.specPrototype.devStatus)
    const lastTurnId = useSelector((s: RootState) => s.specPrototype.lastTurnId)
    const turns = useSelector((s: RootState) => s.specPrototype.turns)

    const [activeTab, setActiveTab] = useState<PrototypeTab>('preview')
    const [device, setDevice] = useState<DeviceFrame>('desktop')

    const activeDoc = useMemo(
        () => docs.find((d) => d.id === selectedId) ?? null,
        [docs, selectedId]
    )
    const linkedKb = useMemo(
        () => kbItems.filter((k) => activeDoc?.kbRefs?.includes(k.id)),
        [activeDoc, kbItems]
    )
    const lastTurn = lastTurnId ? turns[lastTurnId] : null

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

    // Tree refresh when the main process reports a generation finished.
    useEffect(() => {
        if (!basePath) return
        const off = window.specPrototype.onTreeChanged((payload) => {
            if (payload.basePath === basePath) {
                dispatch(loadPrototypeFiles(basePath))
                dispatch(loadPrototypeSnapshots(basePath))
            }
        })
        return off
    }, [basePath, dispatch])

    return (
        <div className="flex h-full">
            {/* Build chat */}
            <aside className="flex w-[360px] shrink-0 flex-col border-r bg-card/30">
                <AIAssistant
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
                    contextProvider={async ({ userMessage, useKB }) => {
                        void userMessage
                        const sections: string[] = []
                        if (activeDoc) {
                            sections.push(
                                `### Active spec document: ${activeDoc.name}\n\n${buffer || '(empty)'}`
                            )
                        } else {
                            sections.push(
                                '_No active spec document — open one in the Documents tab to ground the build in a real spec._'
                            )
                        }
                        if (linkedKb.length > 0) {
                            sections.push(
                                `### Linked KB items (${linkedKb.length})\n${linkedKb.map((k) => `- ${k.name}`).join('\n')}`
                            )
                        }
                        if (lastTurn?.summary) {
                            sections.push(
                                `### Previous turn\n- ${lastTurn.summary}${lastTurn.sha ? ` (${lastTurn.sha.slice(0, 7)})` : ''}`
                            )
                        }
                        const label = activeDoc
                            ? `Spec: ${activeDoc.name} · ${linkedKb.length} KB linked${useKB ? '' : ' (KB off)'}`
                            : 'No active doc — open Documents to start'
                        return {
                            systemPrompt: sections.join('\n\n'),
                            contextLabel: label
                        }
                    }}
                />
            </aside>

            {/* Main */}
            <main className="flex flex-1 flex-col bg-card/10">
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
                        <PreviewPane device={device} url={devStatus.url} running={devStatus.running} />
                    )}
                    {activeTab === 'files' && <FilesPane basePath={basePath} />}
                    {activeTab === 'logs' && <LogsPane />}
                    {activeTab === 'history' && <HistoryPane basePath={basePath} />}
                </div>

                <PrototypeFooter basePath={basePath} />
            </main>
        </div>
    )
}

// ─── Preview ──────────────────────────────────────────────────────────────

const PreviewToolbar = ({
    device,
    onChangeDevice,
    url,
    running,
    onToggleDev
}: {
    device: DeviceFrame
    onChangeDevice: (d: DeviceFrame) => void
    url: string | null
    running: boolean
    onToggleDev: () => void
}): JSX.Element => {
    const reload = () => {
        const view = document.querySelector(
            'webview.spec-prototype-preview'
        ) as { reload?: () => void } | null
        view?.reload?.()
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
            </div>
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
    url,
    running
}: {
    device: DeviceFrame
    url: string | null
    running: boolean
}): JSX.Element => {
    const widthClass =
        device === 'desktop'
            ? 'w-full'
            : device === 'tablet'
              ? 'w-[768px]'
              : 'w-[375px]'
    return (
        <div className="flex h-full items-center justify-center">
            <div
                className={cn(
                    'relative h-full overflow-hidden rounded-xl border bg-white shadow-2xl transition-all duration-300',
                    widthClass
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
                        <div className="flex h-full flex-col items-center justify-center gap-4 text-gray-400">
                            <LayoutIcon size={48} className="opacity-20" />
                            <div className="space-y-1 text-center text-sm italic">
                                <p>{running ? 'Starting preview…' : 'Dev server is stopped.'}</p>
                                <p className="text-[11px]">
                                    {running
                                        ? 'Waiting for the dev server to bind to its port.'
                                        : 'Click ▶ in the toolbar to start, or describe a feature in the Build chat.'}
                                </p>
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
                            No files yet — describe a feature in the Build chat to scaffold the prototype.
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
            <section className="flex flex-1 flex-col bg-background">
                <header className="flex h-10 items-center justify-between border-b bg-card px-4">
                    <span className="font-mono text-[11px] text-muted-foreground">
                        {activeFile ? `prototype/${activeFile}` : 'No file selected'}
                    </span>
                    {activeFile && (
                        <IGRPButtonPrimitive
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            disabled
                        >
                            <X size={12} />
                        </IGRPButtonPrimitive>
                    )}
                </header>
                <div className="flex-1 overflow-auto bg-background">
                    {loading ? (
                        <p className="p-6 text-[11px] text-muted-foreground">Loading…</p>
                    ) : activeFileContent === null ? (
                        <p className="p-6 text-[11px] text-muted-foreground">
                            Select a file from the explorer to preview its contents.
                        </p>
                    ) : (
                        <pre className="whitespace-pre-wrap p-6 font-mono text-[12px] leading-relaxed">
                            <code>{activeFileContent}</code>
                        </pre>
                    )}
                </div>
            </section>
        </div>
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

const LogsPane = (): JSX.Element => {
    const logs = useSelector((s: RootState) => s.specPrototype.logs)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const el = scrollRef.current
        if (el) el.scrollTop = el.scrollHeight
    }, [logs])

    return (
        <div className="flex h-full flex-col rounded-xl border bg-background">
            <div className="flex items-center gap-2 border-b px-6 py-3 text-emerald-500">
                <Terminal size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                    Dev Server Logs
                </span>
                <span className="ml-auto text-[10px] text-muted-foreground">
                    {logs.length} entries
                </span>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 font-mono text-[12px]">
                {logs.length === 0 ? (
                    <p className="italic text-muted-foreground">
                        No logs yet. The dev server starts when you open the Preview tab or hit ▶.
                    </p>
                ) : (
                    <div className="space-y-1">
                        {logs.map((log, idx) => (
                            <LogLine key={idx} log={log} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

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
            window.alert(
                `Export failed: ${err instanceof Error ? err.message : String(err)}`
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
