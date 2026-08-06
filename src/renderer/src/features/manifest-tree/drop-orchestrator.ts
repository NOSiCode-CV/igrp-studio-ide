/**
 * Drop orchestration — pure functions that bridge raw drag events to the
 * `TreeCallbacks` surface.
 *
 * Previously lived in `prototype/dnd/handlers.ts` and dispatched directly
 * to a Redux slice. The orchestration logic — validation gating, cycle
 * detection on re-parent, default id minting — is generic; the only
 * generator-specific bit was the dispatch target. So we lifted those
 * dispatches into a `TreeCallbacks` interface (`onAdd`, `onMove`, …)
 * passed in via `DropContext`. The Prototype builder wires those to its
 * Redux slice; the Page Builder will wire them to its EditorContext;
 * future surfaces can plug in any state layer.
 *
 * Failure modes (block / warn) surface via `onWarn` / `onBlock` callbacks
 * — the caller renders the message however it likes (inline banner,
 * toast, console). The orchestrator itself stays UI-free.
 */

import type { ComponentRegisterConfig } from '@igrp/igrp-studio-nextjs-engine/types'
import type { StructuredComponent } from '@renderer/lib/dnd/types'
import { buildNewNode } from './defaults'
import type { PaletteDragPayload, TreeCallbacks, TreeNodeDragPayload } from './types'
import { evaluateDrop, isDescendantOf, type DropVerdict } from './validation'

export type DropPayloadKind = 'palette-item' | 'tree-node'

/**
 * Collect every id (and tag) in the tree. `buildNewNode` consumes this
 * set to avoid id / tag collisions when minting a fresh node.
 */
export function collectExistingIds(root: StructuredComponent | null): Set<string> {
    const ids = new Set<string>()
    if (!root) return ids
    const walk = (n: StructuredComponent): void => {
        ids.add(n.id)
        if (n.tag) ids.add(n.tag)
        if (Array.isArray(n.children)) n.children.forEach(walk)
    }
    walk(root)
    return ids
}

/**
 * Everything an orchestrator function needs to apply a drop:
 *  - the current tree root for validation lookups,
 *  - the engine catalog for default property hydration,
 *  - the callbacks that actually mutate state,
 *  - optional warn/block sinks for UI feedback.
 */
export interface DropContext {
    manifestRoot: StructuredComponent | null
    engineCatalog: ReadonlyArray<ComponentRegisterConfig>
    callbacks: TreeCallbacks
    onWarn?: (msg: string) => void
    onBlock?: (msg: string) => void
}

/**
 * Palette item → tree drop. Returns `true` when the tree was mutated.
 *
 * Steps:
 *  1. Locate the destination parent in the live tree.
 *  2. Run `evaluateDrop` with `extraDelta: 1` (one new child arriving).
 *  3. On block → fire `onBlock` + bail.
 *  4. On warn → fire `onWarn`, continue.
 *  5. Build a fresh node via `buildNewNode` (engine defaults, unique
 *     id/tag).
 *  6. Call `callbacks.onAdd(parentId, node, position)`.
 *  7. Auto-select the new node so the props panel jumps to it.
 */
export function applyPaletteDrop(
    payload: PaletteDragPayload,
    parent: StructuredComponent,
    indexHint: number | undefined,
    ctx: DropContext
): boolean {
    const parentInTree = findNodeById(ctx.manifestRoot, parent.id)
    if (!parentInTree) {
        ctx.onBlock?.(`Drop target ${parent.id} not found in manifest`)
        return false
    }
    const verdict: DropVerdict = evaluateDrop({
        parent: parentInTree,
        incomingComponentName: payload.componentName,
        extraDelta: 1
    })
    if (verdict.kind === 'block') {
        ctx.onBlock?.(verdict.reason)
        return false
    }
    if (verdict.kind === 'warn') {
        ctx.onWarn?.(verdict.reason)
    }
    const engineConfig = ctx.engineCatalog.find((c) => c.name === payload.componentName) ?? null
    const newNode = buildNewNode({
        componentName: payload.componentName,
        engineConfig,
        existingIds: collectExistingIds(ctx.manifestRoot)
    })
    ctx.callbacks.onAdd(parent.id, newNode, indexHint)
    ctx.callbacks.onSelect(newNode.id)
    return true
}

/**
 * Existing tree node → new parent (re-parent or sibling reorder).
 *
 * Guards (in addition to the standard verdict):
 *  - Self-drop is a no-op (returns false silently — UX is "nothing to do").
 *  - Cycle: can't drop a node into its own subtree.
 *  - Same-parent reorder doesn't count against the cap (count unchanged).
 */
export function applyTreeReorder(
    payload: TreeNodeDragPayload,
    newParent: StructuredComponent,
    indexHint: number | undefined,
    ctx: DropContext
): boolean {
    if (payload.id === newParent.id) return false
    const newParentInTree = findNodeById(ctx.manifestRoot, newParent.id)
    if (!newParentInTree) {
        ctx.onBlock?.(`Drop target ${newParent.id} not found in manifest`)
        return false
    }
    const dragged = findNodeById(ctx.manifestRoot, payload.id)
    if (!dragged) {
        ctx.onBlock?.(`Dragged node ${payload.id} not found in manifest`)
        return false
    }
    if (isDescendantOf(dragged, newParent.id) && dragged.id !== newParent.id) {
        ctx.onBlock?.('Cannot move a node into its own subtree')
        return false
    }
    const currentParent = findParentOf(ctx.manifestRoot, dragged.id)
    const sameParent = currentParent?.id === newParent.id
    const extraDelta = sameParent ? 0 : 1
    const verdict = evaluateDrop({
        parent: newParentInTree,
        incomingComponentName: dragged.componentName ?? '',
        extraDelta
    })
    if (verdict.kind === 'block') {
        ctx.onBlock?.(verdict.reason)
        return false
    }
    if (verdict.kind === 'warn') {
        ctx.onWarn?.(verdict.reason)
    }
    ctx.callbacks.onMove(payload.id, newParent.id, indexHint)
    return true
}

/**
 * Best-effort detection of the drag kind. Reads the explicit `kind` tag
 * when present; otherwise falls back to shape sniffing (tree nodes
 * always carry `properties` + `children`; palette items don't).
 */
export function detectDragKind(item: unknown): DropPayloadKind | null {
    if (!item || typeof item !== 'object') return null
    const obj = item as Record<string, unknown>
    if (obj.kind === 'palette-item') return 'palette-item'
    if (obj.kind === 'tree-node') return 'tree-node'
    if ('properties' in obj && 'children' in obj) return 'tree-node'
    if ('componentName' in obj && !('properties' in obj)) return 'palette-item'
    return null
}

// ─── tree traversal (mirrors the slice's internal helpers) ──────────────

function findNodeById(root: StructuredComponent | null, id: string): StructuredComponent | null {
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

function findParentOf(
    root: StructuredComponent | null,
    childId: string
): StructuredComponent | null {
    if (!root || !Array.isArray(root.children)) return null
    for (const c of root.children) {
        if (c.id === childId) return root
        const hit = findParentOf(c, childId)
        if (hit) return hit
    }
    return null
}
