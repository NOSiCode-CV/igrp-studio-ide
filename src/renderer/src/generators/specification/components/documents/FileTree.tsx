import { cn } from '@renderer/lib/utils'
import type { DocNode } from '@renderer/redux/specDocs/reducer'
import {
    ChevronDown,
    ChevronRight,
    FilePlus,
    FileText,
    Folder,
    FolderPlus,
    MoreHorizontal,
    Pencil,
    Trash2
} from 'lucide-react'
import { type JSX, useState } from 'react'

interface FileTreeProps {
    nodes: DocNode[]
    selectedId: string | null
    onSelect: (id: string) => void
    onRename: (id: string) => void
    onRemove: (id: string) => void
    /** Create a file or folder inside the given parent folder. */
    onCreateInside: (parentId: string, type: 'file' | 'folder') => void
}

export function FileTree({
    nodes,
    selectedId,
    onSelect,
    onRename,
    onRemove,
    onCreateInside
}: FileTreeProps): JSX.Element {
    const roots = nodes.filter((n) => n.parentId === null)
    if (roots.length === 0) {
        return (
            <p className="px-3 py-4 text-xs text-muted-foreground">
                No documents yet — create one above.
            </p>
        )
    }
    return (
        <div className="space-y-0.5 p-2">
            {roots.map((node) => (
                <FileTreeItem
                    key={node.id}
                    node={node}
                    allNodes={nodes}
                    selectedId={selectedId}
                    onSelect={onSelect}
                    onRename={onRename}
                    onRemove={onRemove}
                    onCreateInside={onCreateInside}
                    depth={0}
                />
            ))}
        </div>
    )
}

interface FileTreeItemProps {
    node: DocNode
    allNodes: DocNode[]
    selectedId: string | null
    onSelect: (id: string) => void
    onRename: (id: string) => void
    onRemove: (id: string) => void
    onCreateInside: (parentId: string, type: 'file' | 'folder') => void
    depth: number
}

function FileTreeItem({
    node,
    allNodes,
    selectedId,
    onSelect,
    onRename,
    onRemove,
    onCreateInside,
    depth
}: FileTreeItemProps): JSX.Element {
    const [open, setOpen] = useState(true)
    const [menuOpen, setMenuOpen] = useState(false)
    const children = allNodes.filter((n) => n.parentId === node.id)
    const isFolder = node.type === 'folder'
    const isSelected = !isFolder && selectedId === node.id

    return (
        <div>
            <div
                onClick={() => (isFolder ? setOpen((v) => !v) : onSelect(node.id))}
                className={cn(
                    'group flex cursor-pointer items-center gap-1.5 rounded px-2 py-1 text-[12px] transition-colors',
                    isSelected
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-accent/50'
                )}
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
            >
                {isFolder ? (
                    <>
                        {open ? (
                            <ChevronDown size={12} className="shrink-0 text-muted-foreground" />
                        ) : (
                            <ChevronRight size={12} className="shrink-0 text-muted-foreground" />
                        )}
                        <Folder
                            size={14}
                            className={cn('shrink-0', open ? 'text-blue-400' : 'text-blue-500')}
                        />
                    </>
                ) : (
                    <FileText
                        size={14}
                        className={cn(
                            'ml-3 shrink-0',
                            isSelected ? 'text-primary' : 'text-muted-foreground'
                        )}
                    />
                )}
                <span className="truncate flex-1" title={node.name}>
                    {node.name}
                </span>
                {isFolder && (
                    <>
                        <button
                            type="button"
                            className="rounded p-0.5 opacity-0 group-hover:opacity-100 hover:bg-accent"
                            title="New document inside"
                            onClick={(e) => {
                                e.stopPropagation()
                                onCreateInside(node.id, 'file')
                            }}
                        >
                            <FilePlus size={12} />
                        </button>
                        <button
                            type="button"
                            className="rounded p-0.5 opacity-0 group-hover:opacity-100 hover:bg-accent"
                            title="New folder inside"
                            onClick={(e) => {
                                e.stopPropagation()
                                onCreateInside(node.id, 'folder')
                            }}
                        >
                            <FolderPlus size={12} />
                        </button>
                    </>
                )}
                <div className="relative">
                    <button
                        type="button"
                        className="rounded p-0.5 opacity-0 group-hover:opacity-100 hover:bg-accent"
                        onClick={(e) => {
                            e.stopPropagation()
                            setMenuOpen((v) => !v)
                        }}
                    >
                        <MoreHorizontal size={12} />
                    </button>
                    {menuOpen && (
                        <div
                            className="absolute right-0 top-5 z-20 w-44 rounded-md border bg-popover p-1 shadow-md"
                            onMouseLeave={() => setMenuOpen(false)}
                        >
                            {isFolder && (
                                <>
                                    <button
                                        type="button"
                                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-accent"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setMenuOpen(false)
                                            onCreateInside(node.id, 'file')
                                        }}
                                    >
                                        <FilePlus size={12} /> New document inside
                                    </button>
                                    <button
                                        type="button"
                                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-accent"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setMenuOpen(false)
                                            onCreateInside(node.id, 'folder')
                                        }}
                                    >
                                        <FolderPlus size={12} /> New folder inside
                                    </button>
                                    <div className="my-1 h-px bg-border" />
                                </>
                            )}
                            <button
                                type="button"
                                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-accent"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setMenuOpen(false)
                                    onRename(node.id)
                                }}
                            >
                                <Pencil size={12} /> Rename
                            </button>
                            <button
                                type="button"
                                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-red-500 hover:bg-accent"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setMenuOpen(false)
                                    onRemove(node.id)
                                }}
                            >
                                <Trash2 size={12} /> Remove
                            </button>
                        </div>
                    )}
                </div>
            </div>
            {isFolder && open && (
                <div>
                    {children.map((child) => (
                        <FileTreeItem
                            key={child.id}
                            node={child}
                            allNodes={allNodes}
                            selectedId={selectedId}
                            onSelect={onSelect}
                            onRename={onRename}
                            onRemove={onRemove}
                            onCreateInside={onCreateInside}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
