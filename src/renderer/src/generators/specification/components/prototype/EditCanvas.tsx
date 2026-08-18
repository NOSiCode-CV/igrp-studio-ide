/**
 * Edit canvas — low-fidelity tree view of the prototype's `PageConfig`
 * manifest. Sibling to the live `<webview>` preview; the user toggles
 * between the two via the PreviewToolbar's `Preview ⇄ Edit` switch.
 *
 * What lives here (Prototype-specific):
 *   - Manifest lifecycle: load from disk on mount, persist on dirty via
 *     a 500ms debounced auto-save thunk.
 *   - Header chrome: page name, save status, "Save now" button.
 *   - Keyboard: Delete removes the selected non-root node.
 *   - The `TreeCallbacks` bridge from `features/manifest-tree` to the
 *     `specPrototypeManifest` Redux slice.
 *
 * What lives in `features/manifest-tree/`:
 *   - `<TreeView />` — recursive node renderer + drag/drop wiring.
 *   - `<PropsPanel />` — engine-schema-aware property editor.
 *   - Validation rules, default-node factory, drop orchestration helpers.
 *
 * That split lets the Page Builder (M-DnD β) reuse the same tree UI by
 * pointing its own callbacks at its EditorContext.
 */

import { TreeView, PropsPanel, type TreeCallbacks } from '@renderer/features/manifest-tree'
import { Button } from '@renderer/components/ui/button'
import { useEngineCatalog } from '@renderer/features/engine-catalog'
import type { RootState } from '@renderer/redux'
import {
    nodeAdded,
    nodeMoved,
    nodeRemoved,
    nodeSelected,
    nodeUpdated,
    selectManifest,
    selectManifestError,
    selectManifestLastSavedAt,
    selectManifestLoading,
    selectManifestSaving,
    selectManifestDirty,
    selectSelectedNodeId
} from '@renderer/redux/specPrototypeManifest/reducer'
import { loadManifest, saveManifest } from '@renderer/redux/specPrototypeManifest/thunks'
import { cn } from '@renderer/lib/utils'
import type { StructuredComponent } from '@renderer/lib/dnd/types'
import { AlertCircle, Check, FileEdit, Loader2, Save } from 'lucide-react'
import { type JSX, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { ComponentRegisterConfig } from '@igrp/igrp-studio-nextjs-engine/types'

interface EditCanvasProps {
    basePath?: string
}

const AUTO_SAVE_DEBOUNCE_MS = 500

export const EditCanvas = ({ basePath }: EditCanvasProps): JSX.Element => {
    const dispatch = useDispatch<any>()
    const manifest = useSelector(selectManifest)
    const loading = useSelector(selectManifestLoading)
    const error = useSelector(selectManifestError)
    const dirty = useSelector(selectManifestDirty)
    const saving = useSelector(selectManifestSaving)
    const lastSavedAt = useSelector(selectManifestLastSavedAt)
    const selectedId = useSelector(selectSelectedNodeId)
    const loadedBasePath = useSelector((s: RootState) => s.specPrototypeManifest.basePath)
    const { componentsRegistered } = useEngineCatalog()

    // Load the manifest from disk when entering Edit mode (or when basePath
    // changes). The slice tracks `basePath` so we don't re-fetch for the
    // same project on every render.
    useEffect(() => {
        if (!basePath) return
        if (loadedBasePath === basePath) return
        void dispatch(loadManifest(basePath))
    }, [basePath, dispatch, loadedBasePath])

    // Auto-save — any mutation flips `dirty`; we wait 500ms of quiet then
    // save. The slice's `markSaved` resets `dirty`, ending the loop. While
    // `saving` is true we don't queue another save (race protection); edits
    // during the in-flight save keep `dirty=true`, so a fresh debounce
    // kicks in once the current save lands.
    useEffect(() => {
        if (!dirty || saving) return
        const handle = setTimeout(() => {
            void dispatch(saveManifest())
        }, AUTO_SAVE_DEBOUNCE_MS)
        return () => clearTimeout(handle)
    }, [dirty, saving, dispatch])

    // Keyboard: Delete removes the selected non-root node. Ignored while
    // the user is typing in a form field.
    useEffect(() => {
        const onKey = (e: KeyboardEvent): void => {
            if (e.key !== 'Delete' && e.key !== 'Backspace') return
            if (!selectedId) return
            if (!manifest || !isStructuredComponent(manifest.components)) return
            if (manifest.components.id === selectedId) return
            const target = e.target as HTMLElement | null
            if (target?.closest('input, textarea, [contenteditable]')) return
            e.preventDefault()
            dispatch(nodeRemoved({ id: selectedId }))
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [dispatch, manifest, selectedId])

    const root = manifest && isStructuredComponent(manifest.components) ? manifest.components : null

    // Bridge the feature-level callbacks to Redux. Each callback is a
    // single dispatch — no async work, no derived state. The slice's
    // reducers handle Immer-style mutations + dirty flag.
    const callbacks = useMemo<TreeCallbacks>(
        () => ({
            onAdd: (parentId, node, position) => dispatch(nodeAdded({ parentId, node, position })),
            onMove: (id, newParentId, position) =>
                dispatch(nodeMoved({ id, newParentId, position })),
            onRemove: (id) => dispatch(nodeRemoved({ id })),
            onUpdate: (id, patch) => dispatch(nodeUpdated({ id, patch })),
            onSelect: (id) => dispatch(nodeSelected({ id }))
        }),
        [dispatch]
    )

    const selectedNode = useMemo(() => {
        if (!root || !selectedId) return null
        return findNodeById(root, selectedId)
    }, [root, selectedId])

    return (
        <div className="flex h-full flex-col overflow-hidden rounded-xl border bg-background">
            <CanvasHeader
                pageName={manifest?.pageName}
                dirty={dirty}
                saving={saving}
                error={error}
                lastSavedAt={lastSavedAt}
                onSaveNow={() => void dispatch(saveManifest())}
            />
            <div className="flex flex-1 overflow-hidden">
                {loading && !root ? (
                    <div className="flex flex-1 items-center gap-2 p-4 text-[11px] text-muted-foreground">
                        <Loader2 size={12} className="animate-spin" />
                        Loading manifest…
                    </div>
                ) : !loading && error && !manifest ? (
                    <div className="flex-1 p-4">
                        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-[11px] text-destructive">
                            <strong>Couldn't load manifest:</strong> {error}
                        </div>
                    </div>
                ) : !root ? (
                    <div className="flex-1">
                        <EmptyState />
                    </div>
                ) : (
                    <>
                        {/* Drop target side — the component palette lives
                            on the chat-side aside (left rail of the
                            Specification screen); the user switches to
                            its Palette tab and drags onto the tree here. */}
                        <TreeView
                            className="flex-1"
                            root={root}
                            selectedId={selectedId}
                            engineCatalog={
                                componentsRegistered as ReadonlyArray<ComponentRegisterConfig>
                            }
                            callbacks={callbacks}
                        />
                        <PropsPanel
                            node={selectedNode}
                            engineCatalog={
                                componentsRegistered as ReadonlyArray<ComponentRegisterConfig>
                            }
                            onUpdate={callbacks.onUpdate}
                            onRemove={callbacks.onRemove}
                            canDelete={Boolean(selectedNode && root.id !== selectedNode.id)}
                        />
                    </>
                )}
            </div>
        </div>
    )
}

// ─── header (save status + page name) ───────────────────────────────────

interface CanvasHeaderProps {
    pageName?: string
    dirty: boolean
    saving: boolean
    error: string | null
    lastSavedAt: number | null
    onSaveNow: () => void
}

const CanvasHeader = ({
    pageName,
    dirty,
    saving,
    error,
    lastSavedAt,
    onSaveNow
}: CanvasHeaderProps): JSX.Element => {
    const statusLabel = useMemo(() => {
        if (saving) return 'Saving…'
        if (error) return `Save failed: ${error}`
        if (dirty) return 'Unsaved changes'
        if (lastSavedAt) {
            const d = new Date(lastSavedAt)
            return `Saved · ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
        }
        return 'No changes yet'
    }, [saving, error, dirty, lastSavedAt])

    // Status colours — `destructive` is theme-aware (red); amber + emerald
    // 500-level tints render OK in both modes.
    const statusIcon = saving ? (
        <Loader2 size={11} className="animate-spin" />
    ) : error ? (
        <AlertCircle size={11} className="text-destructive" />
    ) : dirty ? (
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
    ) : (
        <Check size={11} className="text-emerald-500" />
    )

    return (
        <header className="flex h-10 shrink-0 items-center gap-3 border-b bg-card px-4">
            <span className="flex items-center gap-1.5 text-[11px] font-medium">
                <FileEdit size={12} className="text-primary" />
                {pageName ? (
                    <>
                        page: <span className="font-mono">{pageName}</span>
                    </>
                ) : (
                    <span className="text-muted-foreground italic">no page</span>
                )}
            </span>
            <div className="ml-auto flex items-center gap-2 text-[10.5px] text-muted-foreground">
                {statusIcon}
                <span className={cn(error && 'text-destructive')}>{statusLabel}</span>
            </div>
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onSaveNow}
                disabled={!dirty || saving}
                title="Force save now (overrides the 500ms debounce)"
                className={cn(
                    'h-7 gap-1 text-[10.5px]',
                    dirty &&
                        !saving &&
                        'border-primary/30 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary'
                )}
            >
                <Save size={11} />
                Save now
            </Button>
        </header>
    )
}

const pad = (n: number): string => String(n).padStart(2, '0')

// ─── empty state ────────────────────────────────────────────────────────

const EmptyState = (): JSX.Element => (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted-foreground">
        <FileEdit size={36} className="opacity-30" />
        <div className="max-w-xs space-y-1">
            <p className="text-sm font-medium text-foreground">No page yet</p>
            <p className="text-[11px]">
                Generate one from the chat first — attach a spec, ask the AI to build a page. The
                manifest will land here, ready for visual editing.
            </p>
        </div>
    </div>
)

// ─── local helpers ──────────────────────────────────────────────────────

function isStructuredComponent(node: unknown): node is StructuredComponent {
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

// Keep ComponentRegisterConfig type-live for downstream tools — used
// implicitly via `componentsRegistered` from the engine catalog hook.
export type { ComponentRegisterConfig }
