import type { FileChangeKind, PrototypeFile } from '@renderer/redux/specPrototype/reducer'

/**
 * Visual tree node for the Files pane.
 *
 * Distinct from the Prototype manifest's `StructuredComponent` tree —
 * this one models the project's filesystem (folders + files) for the
 * Project Explorer aside. `status` carries the dirty / added / deleted
 * marker so the row can render the appropriate decorator.
 */
export interface TreeNode {
    name: string
    path: string
    type: 'file' | 'folder'
    depth: number
    children?: TreeNode[]
    status?: FileChangeKind
}

/**
 * Fold a flat `PrototypeFile[]` (plus the change-kind map) into a
 * nested `TreeNode[]` rooted at the project's top-level directories.
 *
 * Algorithm: walk files in order, keying folders into a `Map<path,
 * node>` so subsequent files can find their parent by directory path.
 * Files whose parent hasn't been seen yet (out-of-order arrival)
 * collapse to the root level — the source ordering normally puts
 * folders first, so this is a corner case.
 *
 * Extracted from `PrototypePanel.tsx` as part of the prototype refactor
 * (P2 — pure helper functions).
 */
export function buildTree(
    files: PrototypeFile[],
    changes: Record<string, FileChangeKind>
): TreeNode[] {
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
