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
 * `setEditingComponent({ path, component })` — `path` is required for
 * nested registry children (e.g. `menuNavigationItem` under
 * `menuNavigation`) so the properties schema resolves.
 *
 * The `findSourceOf` helper is needed because the Context's
 * `handleReorderChildInComponent` expects an explicit `source` location
 * (parent id + index) whereas `TreeCallbacks.onMove` only gets the
 * node id. We walk the tree to recover the source.
 */

import { useMemo } from 'react'
import type { StructuredComponent } from '@renderer/lib/dnd/types'
import type { TreeCallbacks } from '@renderer/features/manifest-tree'
import { COMPONENT } from '../ComponentTypes'
import { useDroppedComponents } from '../contexts/EditorContext'

const CONTENT_ROOTS = new Set([
    COMPONENT.PageContent,
    COMPONENT.ComponentContent,
    COMPONENT.ProcessContent,
    COMPONENT.ProcessStepContent
])

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
                const hit = findNodeWithRegistryPath(root as StructuredComponent, id)
                if (hit) {
                    setEditingComponent({
                        path: hit.path || undefined,
                        component: hit.node
                    })
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

interface NodeWithPath {
    node: StructuredComponent
    path: string
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

/**
 * Locate a node and the registry path used by `findComponent` /
 * `getPropertiesComponent`. Path is the slash-joined `componentName`
 * chain of ancestors (excluding page/component content roots).
 */
function findNodeWithRegistryPath(
    root: StructuredComponent | null,
    id: string,
    parentPath = ''
): NodeWithPath | null {
    if (!root) return null
    if (root.id === id) return { node: root, path: parentPath }

    if (!Array.isArray(root.children)) return null

    for (const child of root.children) {
        const nextPath = CONTENT_ROOTS.has(root.componentName)
            ? parentPath
            : parentPath
              ? `${parentPath}/${root.componentName}`
              : root.componentName

        const hit = findNodeWithRegistryPath(child, id, nextPath)
        if (hit) return hit
    }

    return null
}
