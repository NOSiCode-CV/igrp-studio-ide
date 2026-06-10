import { cn } from '@renderer/lib/utils'
import type {
    FileChangeKind,
    PrototypeFile
} from '@renderer/redux/specPrototype/reducer'
import { FileCode, FolderOpen } from 'lucide-react'
import { useState, type JSX } from 'react'
import type { TreeNode } from './file-tree'

interface FileTreeRowProps {
    node: TreeNode
    allFiles: PrototypeFile[]
    changedPaths: Record<string, FileChangeKind>
    activeFile: string | null
    onSelect: (path: string) => void
}

/**
 * One row of the Project Explorer tree. Folders are click-to-toggle;
 * files are click-to-open. Recurses into `node.children` when the
 * folder is expanded.
 *
 * Dirty-state indicator (small coloured dot) reflects the most recent
 * change kind: emerald = new, blue = modified, red = deleted.
 *
 * Extracted from `PrototypePanel.tsx` as part of the prototype refactor
 * (P5 — panes).
 */
export const FileTreeRow = ({
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
