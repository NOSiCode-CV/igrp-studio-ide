/**
 * Adapter — turns the Page Builder's `EditorContext` API into the
 * `TreeCallbacks` shape consumed by `features/manifest-tree`.
 *
 * The Prototype builder uses a Redux slice; the Page Builder uses a
 * React Context (`useDroppedComponents`). Both expose tree-mutation
 * operations, just with different signatures:
 *
 *   - Slice:   `nodeAdded({parentId, node, position?})`
 *   - Context: `handleAddChildToComponent({droppableId, index}, node)`
 *
 * The adapter normalises this. The result is a `TreeCallbacks` value the
 * caller hands to `<TreeView />` / `<PropsPanel />` unchanged.
 *
 * Selection model: `EditorContext` stores the full component in
 * `currentComponent.component`, not just an id. We derive `selectedId`
 * from that, and on `onSelect(id)` we look up the node and call
 * `setEditingComponent({ component })`.
 *
 * The `findSourceOf` helper is needed because the Context's
 * `handleReorderChildInComponent` expects an explicit `source` location
 * (parent id + index) whereas `TreeCallbacks.onMove` only gets the
 * node id. We walk the tree to recover the source.
 */

import { useMemo } from 'react'
import type { StructuredComponent } from '@renderer/lib/dnd/types'
import type { TreeCallbacks } from '@renderer/features/manifest-tree'
import { useDroppedComponents } from '../contexts/EditorContext'

/**
 * Build a stable `TreeCallbacks` value that proxies to the active tab's
 * EditorContext. Re-creates only when one of the underlying handlers
 * changes identity (the handlers in `useDroppedComponents` are already
 * `useCallback`-wrapped, so this is cheap).
 */
export function useTreeCallbacksFromContext(): TreeCallbacks {
    const {
        components: root,
        handleAddChildToComponent,
        handleReorderChildInComponent,
        handleRemoveChildFromComponent,
        handleUpdateChildComponent,
        setEditingComponent,
        clearEditingComponent
    } = useDroppedComponents()

    return useMemo<TreeCallbacks>(
        () => ({
            onAdd: (parentId, node, position) => {
                handleAddChildToComponent(
                    {
                        droppableId: parentId,
                        // Context uses a positional index; treating undefined
                        // as "end" by using a large sentinel matches the
                        // existing handler's behaviour for late inserts.
                        index: position ?? Number.MAX_SAFE_INTEGER
                    },
                    node
                )
            },
            onMove: (id, newParentId, position) => {
                const source = findSourceOf(root as StructuredComponent, id)
                if (!source) return
                handleReorderChildInComponent(
                    id,
                    { droppableId: source.parentId, index: source.index },
                    {
                        droppableId: newParentId,
                        index: position ?? Number.MAX_SAFE_INTEGER
                    }
                )
            },
            onRemove: (id) => {
                // Context's remove uses `droppableId` to identify the target
                // node; `index` is unused on that path.
                handleRemoveChildFromComponent({ droppableId: id, index: 0 })
            },
            onUpdate: (id, patch) => {
                handleUpdateChildComponent(id, patch)
            },
            onSelect: (id) => {
                if (id === null) {
                    clearEditingComponent()
                    return
                }
                const node = findNodeById(root as StructuredComponent, id)
                if (node) {
                    setEditingComponent({ component: node })
                }
            }
        }),
        [
            root,
            handleAddChildToComponent,
            handleReorderChildInComponent,
            handleRemoveChildFromComponent,
            handleUpdateChildComponent,
            setEditingComponent,
            clearEditingComponent
        ]
    )
}

// ─── tree helpers ──────────────────────────────────────────────────────

interface SourceLocation {
    parentId: string
    index: number
}

function findSourceOf(
    root: StructuredComponent | null,
    childId: string
): SourceLocation | null {
    if (!root || !Array.isArray(root.children)) return null
    const idx = root.children.findIndex((c) => c.id === childId)
    if (idx >= 0) return { parentId: root.id, index: idx }
    for (const c of root.children) {
        const hit = findSourceOf(c, childId)
        if (hit) return hit
    }
    return null
}

function findNodeById(
    root: StructuredComponent | null,
    id: string
): StructuredComponent | null {
    if (!root) return null
    if (root.id === id) return root
    if (Array.isArray(root.children)) {
        for (const c of root.children) {
            const hit = findNodeById(c, id)
            if (hit) return hit
        }
    }
    return null
}
