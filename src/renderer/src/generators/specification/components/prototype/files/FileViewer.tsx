import MonacoEditor, { DiffEditor } from '@monaco-editor/react'
import { cn } from '@renderer/lib/utils'
import type { FileChangeKind } from '@renderer/redux/specPrototype/reducer'
import { useEffect, useState, type JSX } from 'react'
import { languageFromExt, monacoOptions } from './monaco-config'

/**
 * Read-only Monaco viewer for files in the Prototype's Files pane.
 * Optional diff-mode shows the current buffer against `HEAD~1` when the
 * file is dirty (`status === 'modified'`).
 *
 * Diff is fetched on demand from the main process
 * (`window.specPrototype.readFileAt(basePath, 'HEAD~1', path)`); the
 * effect cancels in-flight reads when the user toggles diff off or
 * switches files.
 *
 * Toggling between files automatically forces diff off — avoids a stale
 * diff sticking around when the user navigates to an untouched file
 * after viewing a modified one.
 *
 * Extracted from `PrototypePanel.tsx` as part of the prototype refactor
 * (P5 — panes).
 */
export const FileViewer = ({
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
