/**
 * Public types for the manifest-tree feature.
 *
 * The feature renders a tree-style editor for IGRP `StructuredComponent`
 * manifests with full drag-and-drop support. It is **state-agnostic** —
 * the caller provides a `TreeCallbacks` set that bridges to whatever
 * persistence layer it uses (Redux slice, React Context, in-memory).
 *
 * Today there are two callers:
 *   - **Prototype builder** (`generators/specification/.../EditCanvas.tsx`)
 *     wires the callbacks to the `specPrototypeManifest` Redux slice.
 *   - **Page Builder** (`generators/ui/page-builder.tsx`, Fase β) wires
 *     them to its `EditorContext`.
 *
 * Both produce the same on-disk artifact — a `PageConfig` JSON consumed
 * by the iGRP Next.js engine. The tree feature doesn't care which.
 */

import type { StructuredComponent } from '@renderer/lib/dnd/types'

/**
 * Payload serialised into `dataTransfer` when the user drags from the
 * component palette. The palette feature owns this shape; tree drop
 * handlers parse it back and call `onAdd` with a freshly-built node.
 */
export interface PaletteDragPayload {
    id: string
    kind: 'palette-item'
    componentName: string
}

/**
 * Payload serialised when an existing tree node is dragged. The full
 * `StructuredComponent` rides along plus a `kind` tag so the drop
 * handler can disambiguate from palette payloads.
 */
export type TreeNodeDragPayload = StructuredComponent & { kind?: 'tree-node' }

/**
 * Surface the tree feature dispatches mutations through. Each callback
 * mirrors a single intent — the implementation owns whether that's a
 * Redux action, a setState, or an IPC call.
 *
 * Callbacks are intentionally synchronous from the caller's PoV. If a
 * mutation needs async work (debounced save, optimistic IPC), the
 * implementation handles that internally.
 */
export interface TreeCallbacks {
    /** Insert `node` under `parentId` at `position` (defaults to end). */
    onAdd: (parentId: string, node: StructuredComponent, position?: number) => void
    /** Re-parent or reorder `id` under `newParentId` at `position`. */
    onMove: (id: string, newParentId: string, position?: number) => void
    /** Remove `id`. Implementations should refuse to remove the root. */
    onRemove: (id: string) => void
    /**
     * Patch the node identified by `id`. The patch is a shallow merge for
     * `properties` / `interactions`; `label` is replaced wholesale.
     */
    onUpdate: (
        id: string,
        patch: Partial<Pick<StructuredComponent, 'label' | 'properties' | 'interactions'>>
    ) => void
    /** Select `id` (or `null` to clear the selection). */
    onSelect: (id: string | null) => void
}

/**
 * Transient banner copy fired by the tree on drop validation failures or
 * warnings. Callers render it however they like — the EditCanvas uses an
 * inline banner; future surfaces could route it to a toast.
 */
export interface DropFeedback {
    kind: 'warn' | 'block'
    msg: string
}
