import type { RootState } from '@renderer/redux'
import {
    loadPrototypeFiles,
    openPrototypeFile
} from '@renderer/redux/specPrototype/thunks'
import { RefreshCw } from 'lucide-react'
import { useMemo, type JSX } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { buildTree } from './file-tree'
import { FileTreeRow } from './FileTreeRow'
import { FileViewer } from './FileViewer'

/**
 * "Files" tab — a VS-Code-style split: Project Explorer aside on the
 * left (folder/file tree), Monaco viewer on the right.
 *
 * The tree memoises off `(files, changedPaths)` so quick log /
 * snapshot updates don't trigger a re-fold. File selection delegates
 * to `openPrototypeFile` thunk which loads the buffer and updates
 * `state.specPrototype.activeFile{,Content,Loading}`.
 *
 * Extracted from `PrototypePanel.tsx` as part of the prototype refactor
 * (P5 — panes).
 */
export const FilesPane = ({ basePath }: { basePath?: string }): JSX.Element => {
    const dispatch = useDispatch<any>()
    const files = useSelector((s: RootState) => s.specPrototype.files)
    const changedPaths = useSelector((s: RootState) => s.specPrototype.changedPaths)
    const activeFile = useSelector((s: RootState) => s.specPrototype.activeFile)
    const activeFileContent = useSelector((s: RootState) => s.specPrototype.activeFileContent)
    const loading = useSelector((s: RootState) => s.specPrototype.activeFileLoading)

    const tree = useMemo(() => buildTree(files, changedPaths), [files, changedPaths])

    return (
        <div className="flex h-full overflow-hidden rounded-xl border bg-background">
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
