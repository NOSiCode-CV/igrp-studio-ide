import MonacoEditor from '@renderer/components/monaco-editor'
import { FileText, Loader2 } from 'lucide-react'
import { type JSX, useCallback, useEffect } from 'react'
import { Group, Panel, Separator } from 'react-resizable-panels'
import DropZone from './components/drop-zone'
import HistoryList from './components/history-list'
import MarkdownPreview from './components/markdown-preview'
import Toolbar from './components/toolbar'
import { useConversionHistory } from './hooks/useConversionHistory'
import { useMarkdownConverter } from './hooks/useMarkdownConverter'

const MarkItDownPage = (): JSX.Element => {
    const { state, convert, loadFromHistory, setMarkdown, clear } = useMarkdownConverter()
    const history = useConversionHistory()

    useEffect(() => {
        if (!state.isConverting) {
            void history.refresh()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.markdown, state.error])

    const handlePickFile = useCallback(async (): Promise<void> => {
        const filePath = await window.markitdown.pickFile()
        if (filePath) void convert(filePath)
    }, [convert])

    const handleFileDropped = useCallback(
        (filePath: string): void => {
            void convert(filePath)
        },
        [convert]
    )

    return (
        <div className="flex flex-col h-screen bg-background">
            <header className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <FileText className="h-5 w-5 text-primary" />
                <h1 className="text-base font-semibold">Markdown Converter</h1>
                <div className="flex-1" />
                <Toolbar
                    markdown={state.markdown}
                    fileName={state.fileName}
                    disabled={state.isConverting}
                    onPickFile={handlePickFile}
                    onClear={clear}
                />
            </header>

            <section className="px-4 py-2 text-xs text-muted-foreground border-b border-border min-h-7 flex items-center gap-2">
                {state.isConverting ? (
                    <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Converting {state.fileName ?? 'file'}&hellip;
                    </>
                ) : state.fileName ? (
                    <span className="truncate flex items-center gap-3">
                        <span title={state.filePath ?? ''}>{state.fileName}</span>
                        {state.durationMs !== null && (
                            <span className="text-[10px] opacity-70">
                                {(state.durationMs / 1000).toFixed(2)}s
                            </span>
                        )}
                    </span>
                ) : (
                    <span>Drop a file, pick one, or choose from history.</span>
                )}
            </section>

            <div className="flex flex-1 min-h-0">
                <HistoryList
                    entries={history.entries}
                    activeFilePath={state.filePath}
                    onSelect={(e) => loadFromHistory(e.fileName, e.filePath, e.markdown)}
                    onDelete={(id) => void history.remove(id)}
                    onClear={() => void history.clear()}
                />

                <DropZone
                    onFileDropped={handleFileDropped}
                    disabled={state.isConverting}
                    className="flex-1 min-w-0"
                >
                    {state.error ? (
                        <div className="p-6">
                            <div className="rounded-md border border-destructive/40 bg-destructive/10 text-destructive text-sm p-4 whitespace-pre-wrap">
                                {state.error}
                            </div>
                        </div>
                    ) : (
                        <Group orientation="horizontal" className="h-full flex">
                            <Panel defaultSize="50%" minSize="20%" className="h-full">
                                <MonacoEditor
                                    filePath={
                                        state.filePath
                                            ? `file:///markitdown/${state.filePath.replace(/[\\/]/g, '_')}.md`
                                            : 'file:///markitdown/untitled.md'
                                    }
                                    content={state.markdown}
                                    onChange={setMarkdown}
                                    language="markdown"
                                    height="100%"
                                    options={{
                                        readOnly: state.isConverting,
                                        fontSize: 13,
                                        lineNumbers: 'on',
                                        scrollBeyondLastLine: false,
                                        padding: { top: 8, bottom: 8 }
                                    }}
                                />
                            </Panel>
                            <Separator className="w-px bg-border hover:bg-primary/40 transition-colors cursor-col-resize" />
                            <Panel defaultSize="50%" minSize="20%" className="h-full">
                                <MarkdownPreview markdown={state.markdown} />
                            </Panel>
                        </Group>
                    )}
                </DropZone>
            </div>
        </div>
    )
}

export default MarkItDownPage
