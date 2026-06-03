/**
 * Public API — manifest-tree feature.
 *
 * State-agnostic, drag-and-drop-enabled tree editor for IGRP
 * `StructuredComponent` manifests. Callers wire `TreeCallbacks` to their
 * own state layer (Redux slice, React Context, etc.) — see `types.ts`.
 *
 * Components:
 *   - `<TreeView />`   — root wrapper, renders the recursive tree.
 *   - `<PropsPanel />` — selected-node property editor (engine-schema-aware).
 *
 * Pure helpers:
 *   - `evaluateDrop()` — validate a candidate parent + incoming child
 *     against the engine's `maxChildren` + `acceptedChildren` rules.
 *   - `buildNewNode()` — mint a fresh `StructuredComponent` with engine
 *     defaults, unique id, and unique tag.
 *
 * Drop orchestration (typically wired internally by TreeView, but
 * exported for surfaces that want to drive drops programmatically):
 *   - `applyPaletteDrop()` / `applyTreeReorder()`.
 */

export { TreeView } from './TreeView'
export type { TreeViewProps } from './TreeView'

export { PropsPanel } from './PropsPanel'
export type { PropsPanelProps } from './PropsPanel'

export {
    evaluateDrop,
    isDescendantOf,
    HARD_CONTAINER_RULES,
    SOFT_CONTAINER_RULES,
    type ContainerRule,
    type DropVerdict
} from './validation'

export { buildNewNode } from './defaults'

export {
    applyPaletteDrop,
    applyTreeReorder,
    collectExistingIds,
    detectDragKind,
    type DropContext,
    type DropPayloadKind
} from './drop-orchestrator'

export type {
    DropFeedback,
    PaletteDragPayload,
    TreeCallbacks,
    TreeNodeDragPayload
} from './types'
