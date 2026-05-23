/**
 * Redux slice for the prototype's PageConfig manifest — the source of truth
 * that the Edit canvas mutates directly.
 *
 * Lifecycle:
 *   1. M6 LLM turn writes `<basePath>/.igrpstudio/prototype/page.json` and
 *      emits a `manifest-applied` chunk. The renderer's chunk handler (or a
 *      tree-changed listener) dispatches `manifestLoaded` to seed this slice.
 *   2. Edit canvas mutates the tree via `nodeAdded` / `nodeUpdated` /
 *      `nodeRemoved` / `nodeMoved`. Each mutation flips `dirty`.
 *   3. A debounced `saveManifest` thunk calls `window.specPrototype
 *      .applyManifest(basePath, manifest)`, which re-runs the engine and
 *      git-commits. On success `markSaved` clears dirty + bumps `lastSavedAt`.
 *
 * The slice is kept generator-agnostic — it owns the manifest, period.
 * Engine integration and disk IO live in thunks.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { StructuredComponent } from '@renderer/lib/dnd/types'

/**
 * Mirrors the `PageConfig` shape the engine accepts. We keep it loose here
 * (extras allowed) because the engine package owns the canonical schema —
 * we don't want this slice to drift on every engine release.
 */
export interface PrototypePageConfig {
    type: 'page'
    pageName: string
    path: string
    label?: string
    components: StructuredComponent | Record<string, never>
    types: unknown[]
    imports: unknown[]
    states: unknown[]
    functions: unknown[]
    [key: string]: unknown
}

export interface SpecPrototypeManifestState {
    /** Current manifest, or null when no page has been generated yet. */
    manifest: PrototypePageConfig | null
    /** basePath the manifest belongs to — guards against cross-project mix-ups. */
    basePath: string | null
    /** Locally mutated since last save. */
    dirty: boolean
    /** Disk read in progress. */
    loading: boolean
    /** Disk write + engine.createPage in progress. */
    saving: boolean
    /** Last load / save error, surfaced in the canvas header. */
    error: string | null
    /** ms timestamp of the last successful save. */
    lastSavedAt: number | null
    /** Selected node id in the canvas (drives the props panel). */
    selectedNodeId: string | null
}

const initialState: SpecPrototypeManifestState = {
    manifest: null,
    basePath: null,
    dirty: false,
    loading: false,
    saving: false,
    error: null,
    lastSavedAt: null,
    selectedNodeId: null
}

const slice = createSlice({
    name: 'specPrototypeManifest',
    initialState,
    reducers: {
        loadStarted(state, action: PayloadAction<{ basePath: string }>) {
            state.loading = true
            state.error = null
            state.basePath = action.payload.basePath
        },
        loadFailed(state, action: PayloadAction<{ error: string }>) {
            state.loading = false
            state.error = action.payload.error
        },
        manifestLoaded(
            state,
            action: PayloadAction<{
                basePath: string
                manifest: PrototypePageConfig | null
            }>
        ) {
            state.loading = false
            state.error = null
            state.basePath = action.payload.basePath
            state.manifest = action.payload.manifest
            state.dirty = false
            state.lastSavedAt = action.payload.manifest ? Date.now() : null
            state.selectedNodeId = null
        },
        manifestCleared(state) {
            state.manifest = null
            state.basePath = null
            state.dirty = false
            state.error = null
            state.lastSavedAt = null
            state.selectedNodeId = null
        },

        // ─── tree mutations ────────────────────────────────────────────
        // Each mutation walks the tree imperatively (Immer-compatible).
        // We don't optimise for performance — even 200-node trees are
        // cheap to re-walk per edit.

        nodeAdded(
            state,
            action: PayloadAction<{
                parentId: string
                node: StructuredComponent
                position?: number
            }>
        ) {
            if (!state.manifest || !isStructuredComponent(state.manifest.components)) return
            const parent = findNodeById(state.manifest.components, action.payload.parentId)
            if (!parent) return
            if (!Array.isArray(parent.children)) parent.children = []
            const pos =
                typeof action.payload.position === 'number'
                    ? action.payload.position
                    : parent.children.length
            parent.children.splice(pos, 0, action.payload.node)
            state.dirty = true
        },

        nodeUpdated(
            state,
            action: PayloadAction<{
                id: string
                patch: Partial<Pick<StructuredComponent, 'label' | 'properties' | 'interactions'>>
            }>
        ) {
            if (!state.manifest || !isStructuredComponent(state.manifest.components)) return
            const node = findNodeById(state.manifest.components, action.payload.id)
            if (!node) return
            const { patch } = action.payload
            if (patch.label !== undefined) node.label = patch.label
            if (patch.properties !== undefined) {
                node.properties = { ...node.properties, ...patch.properties }
            }
            if (patch.interactions !== undefined) {
                node.interactions = { ...(node.interactions ?? {}), ...patch.interactions }
            }
            state.dirty = true
        },

        nodeRemoved(state, action: PayloadAction<{ id: string }>) {
            if (!state.manifest || !isStructuredComponent(state.manifest.components)) return
            // Can't remove the root component this way — guard explicitly.
            if (state.manifest.components.id === action.payload.id) return
            removeNodeById(state.manifest.components, action.payload.id)
            if (state.selectedNodeId === action.payload.id) state.selectedNodeId = null
            state.dirty = true
        },

        nodeMoved(
            state,
            action: PayloadAction<{
                id: string
                newParentId: string
                position?: number
            }>
        ) {
            if (!state.manifest || !isStructuredComponent(state.manifest.components)) return
            if (state.manifest.components.id === action.payload.id) return
            const detached = detachNodeById(state.manifest.components, action.payload.id)
            if (!detached) return
            const newParent = findNodeById(state.manifest.components, action.payload.newParentId)
            if (!newParent) return // dropped node is gone — leak avoided, but data lost; caller should validate first
            if (!Array.isArray(newParent.children)) newParent.children = []
            const pos =
                typeof action.payload.position === 'number'
                    ? action.payload.position
                    : newParent.children.length
            newParent.children.splice(pos, 0, detached)
            state.dirty = true
        },

        nodeSelected(state, action: PayloadAction<{ id: string | null }>) {
            state.selectedNodeId = action.payload.id
        },

        // ─── save lifecycle ────────────────────────────────────────────
        saveStarted(state) {
            state.saving = true
            state.error = null
        },
        saveFailed(state, action: PayloadAction<{ error: string }>) {
            state.saving = false
            state.error = action.payload.error
        },
        markSaved(state, action: PayloadAction<{ at?: number }>) {
            state.saving = false
            state.dirty = false
            state.lastSavedAt = action.payload.at ?? Date.now()
            state.error = null
        }
    }
})

export const {
    loadStarted,
    loadFailed,
    manifestLoaded,
    manifestCleared,
    nodeAdded,
    nodeUpdated,
    nodeRemoved,
    nodeMoved,
    nodeSelected,
    saveStarted,
    saveFailed,
    markSaved
} = slice.actions

export default slice.reducer

// ─── selectors ──────────────────────────────────────────────────────────

import type { RootState } from '..'

export const selectManifest = (s: RootState): PrototypePageConfig | null =>
    s.specPrototypeManifest.manifest
export const selectManifestDirty = (s: RootState): boolean => s.specPrototypeManifest.dirty
export const selectManifestSaving = (s: RootState): boolean => s.specPrototypeManifest.saving
export const selectManifestLoading = (s: RootState): boolean => s.specPrototypeManifest.loading
export const selectManifestError = (s: RootState): string | null => s.specPrototypeManifest.error
export const selectManifestBasePath = (s: RootState): string | null =>
    s.specPrototypeManifest.basePath
export const selectManifestLastSavedAt = (s: RootState): number | null =>
    s.specPrototypeManifest.lastSavedAt
export const selectSelectedNodeId = (s: RootState): string | null =>
    s.specPrototypeManifest.selectedNodeId

// ─── tree helpers ───────────────────────────────────────────────────────

function isStructuredComponent(
    node: unknown
): node is StructuredComponent {
    return Boolean(node) && typeof node === 'object' && 'id' in (node as object)
}

function findNodeById(root: StructuredComponent, id: string): StructuredComponent | null {
    if (root.id === id) return root
    if (Array.isArray(root.children)) {
        for (const child of root.children) {
            const hit = findNodeById(child, id)
            if (hit) return hit
        }
    }
    return null
}

function removeNodeById(root: StructuredComponent, id: string): boolean {
    if (!Array.isArray(root.children)) return false
    const idx = root.children.findIndex((c) => c.id === id)
    if (idx >= 0) {
        root.children.splice(idx, 1)
        return true
    }
    for (const child of root.children) {
        if (removeNodeById(child, id)) return true
    }
    return false
}

function detachNodeById(
    root: StructuredComponent,
    id: string
): StructuredComponent | null {
    if (!Array.isArray(root.children)) return null
    const idx = root.children.findIndex((c) => c.id === id)
    if (idx >= 0) {
        const [removed] = root.children.splice(idx, 1)
        return removed
    }
    for (const child of root.children) {
        const detached = detachNodeById(child, id)
        if (detached) return detached
    }
    return null
}

/**
 * Walk the tree and return every node — used by the canvas to list, and by
 * cross-cutting features like keyboard nav.
 */
export function collectNodes(root: StructuredComponent | null): StructuredComponent[] {
    if (!root) return []
    const out: StructuredComponent[] = [root]
    if (Array.isArray(root.children)) {
        for (const child of root.children) {
            out.push(...collectNodes(child))
        }
    }
    return out
}
