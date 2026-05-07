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
import {
    selectDocBuffer,
    selectDocNodes,
    selectSelectedDocId
} from '@renderer/redux/specDocs/reducer'
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
    Terminal
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
    const docs = useSelector(selectDocNodes)
    const selectedId = useSelector(selectSelectedDocId)
    const buffer = useSelector(selectDocBuffer(selectedId))
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
                        <PreviewPane
                            device={device}
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
        const view = document.querySelector('webview.spec-prototype-preview') as {
            reload?: () => void
        } | null
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
    running,
    installing,
    onSwitchToLogs
}: {
    device: DeviceFrame
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
    const widthClass =
        device === 'desktop' ? 'w-full' : device === 'tablet' ? 'w-[768px]' : 'w-[375px]'
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
