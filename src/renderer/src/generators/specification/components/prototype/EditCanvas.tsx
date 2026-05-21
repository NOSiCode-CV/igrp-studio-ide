/**
 * Edit canvas — low-fidelity wireframe view of the prototype's `PageConfig`
 * manifest tree. Sibling to the live `<webview>` preview; the user toggles
 * between the two via the PreviewToolbar's `Preview ⇄ Edit` switch.
 *
 * Scope (Etapas B + C + D):
 *   - Load manifest from disk on mount.
 *   - Render every `StructuredComponent` as a labelled box, with containers
 *     nesting children indented (low fidelity — we care about structure).
 *   - Click selects a node; Delete key removes the selected non-root node.
 *   - Right pane: editable properties form. Fields are inferred from the
 *     engine's `ComponentRegisterConfig.properties` defaults — string,
 *     number, boolean primitives surface as native inputs; objects/arrays
 *     fall back to a JSON textarea (escape hatch).
 *   - Auto-save: any mutation flips `dirty`; a 500ms-debounced effect
 *     dispatches `saveManifest()`, which persists to disk and calls
 *     `engine.createPage`. The dev server hot-reloads off the new code.
 *   - Header shows save status (Saving… / Saved · HH:mm:ss / failure).
 *
 * Queued for later:
 *   - DnD from palette into specific drop zones.
 *   - Internal reorder via DnD.
 *   - Add-via-palette while a container is selected.
 */

import { cn } from '@renderer/lib/utils'
import { resolveIcon } from '@renderer/features/component-icons'
import { useEngineCatalog } from '@renderer/features/engine-catalog'
import type { RootState } from '@renderer/redux'
import {
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
import type { StructuredComponent } from '@renderer/lib/dnd/types'
import {
    AlertCircle,
    Check,
    ChevronDown,
    ChevronRight,
    FileEdit,
    Loader2,
    Save,
    Trash2
} from 'lucide-react'
import { type ChangeEvent, type JSX, useCallback, useEffect, useMemo, useState } from 'react'
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

    // Load the manifest from disk when entering Edit mode (or when basePath
    // changes). The slice tracks `basePath` so we don't re-fetch for the
    // same project on every render.
    useEffect(() => {
        if (!basePath) return
        if (loadedBasePath === basePath) return
        void dispatch(loadManifest(basePath))
    }, [basePath, dispatch, loadedBasePath])

    // Auto-save (D.1) — any mutation flips `dirty`; we wait 500ms of quiet
    // then save. The slice's `markSaved` resets `dirty`, ending the loop.
    // While `saving` is true we don't queue another save (race protection);
    // edits during the in-flight save keep `dirty=true`, so a fresh debounce
    // kicks in once the current save lands.
    useEffect(() => {
        if (!dirty || saving) return
        const handle = setTimeout(() => {
            void dispatch(saveManifest())
        }, AUTO_SAVE_DEBOUNCE_MS)
        return () => clearTimeout(handle)
    }, [dirty, saving, dispatch])

    // Keyboard: Delete removes the selected non-root node. Ignored while the
    // user is typing in a form field.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
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

    return (
        <div className="flex h-full flex-col overflow-hidden rounded-xl border bg-card/30">
            <CanvasHeader
                pageName={manifest?.pageName}
                dirty={dirty}
                saving={saving}
                error={error}
                lastSavedAt={lastSavedAt}
                onSaveNow={() => void dispatch(saveManifest())}
            />
            <div className="flex flex-1 overflow-hidden">
                <div className="flex-1 overflow-auto p-4">
                    {loading && (
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <Loader2 size={12} className="animate-spin" />
                            Loading manifest…
                        </div>
                    )}
                    {!loading && error && !manifest && (
                        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-[11px] text-red-700">
                            <strong>Couldn't load manifest:</strong> {error}
                        </div>
                    )}
                    {!loading && !root && <EmptyState />}
                    {root && (
                        <NodeRow
                            node={root}
                            depth={0}
                            selectedId={selectedId}
                            isRoot
                            onSelect={(id) => dispatch(nodeSelected({ id }))}
                        />
                    )}
                </div>
                <SelectionPanel manifest={manifest} selectedId={selectedId} />
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

    const statusIcon = saving ? (
        <Loader2 size={11} className="animate-spin" />
    ) : error ? (
        <AlertCircle size={11} className="text-red-500" />
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
                <span className={cn(error && 'text-red-600')}>{statusLabel}</span>
            </div>
            <button
                type="button"
                onClick={onSaveNow}
                disabled={!dirty || saving}
                className={cn(
                    'flex items-center gap-1 rounded-md border px-2 py-1 text-[10.5px] font-medium transition-colors',
                    dirty && !saving
                        ? 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/15'
                        : 'border-border bg-card text-muted-foreground/60 cursor-not-allowed'
                )}
                title="Force save now (overrides the 500ms debounce)"
            >
                <Save size={11} />
                Save now
            </button>
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

// ─── node renderer ──────────────────────────────────────────────────────

interface NodeRowProps {
    node: StructuredComponent
    depth: number
    selectedId: string | null
    isRoot?: boolean
    onSelect: (id: string) => void
}

const NodeRow = ({ node, depth, selectedId, isRoot, onSelect }: NodeRowProps): JSX.Element => {
    const hasChildren = Array.isArray(node.children) && node.children.length > 0
    const [open, setOpen] = useState(depth < 2 || isRoot)
    const isSelected = selectedId === node.id
    const Icon = resolveIcon(node.componentName)
    const label = node.label || node.componentName

    return (
        <div className="select-none">
            <div
                className={cn(
                    'group flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] transition-colors',
                    isSelected ? 'bg-primary/10 ring-1 ring-primary/30' : 'hover:bg-accent/50'
                )}
                style={{ paddingLeft: `${depth * 14 + 8}px` }}
                onClick={(e) => {
                    e.stopPropagation()
                    onSelect(node.id)
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onSelect(node.id)
                    }
                }}
                role="button"
                tabIndex={0}
            >
                {hasChildren ? (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            setOpen((v) => !v)
                        }}
                        className="flex h-4 w-4 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-accent"
                        aria-label={open ? 'Collapse' : 'Expand'}
                    >
                        {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                    </button>
                ) : (
                    <span className="w-4 shrink-0" />
                )}
                <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="font-mono text-[10.5px] text-muted-foreground">
                    {node.componentName}
                </span>
                {label && label !== node.componentName && (
                    <span className="truncate text-[11.5px] font-medium text-foreground">
                        {label}
                    </span>
                )}
                <span className="ml-auto font-mono text-[9px] text-muted-foreground/60">
                    {node.id}
                </span>
            </div>
            {hasChildren && open && (
                <div>
                    {node.children.map((child) => (
                        <NodeRow
                            key={child.id}
                            node={child}
                            depth={depth + 1}
                            selectedId={selectedId}
                            onSelect={onSelect}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── right-side selection panel (props editor) ──────────────────────────

interface SelectionPanelProps {
    manifest: ReturnType<typeof selectManifest>
    selectedId: string | null
}

const SelectionPanel = ({ manifest, selectedId }: SelectionPanelProps): JSX.Element => {
    const dispatch = useDispatch<any>()
    const { componentsRegistered } = useEngineCatalog()

    const node = useMemo(() => {
        if (!manifest || !isStructuredComponent(manifest.components)) return null
        if (!selectedId) return null
        return findNodeById(manifest.components, selectedId)
    }, [manifest, selectedId])

    const engineConfig = useMemo(() => {
        if (!node) return null
        return componentsRegistered.find((c) => c.name === node.componentName) ?? null
    }, [node, componentsRegistered])

    // Union of property keys: engine defaults + whatever the node already has.
    // Engine-declared keys come first (preserves a canonical order); extras
    // from the node tail behind a separator so the user knows they're custom.
    const propertyKeys = useMemo(() => {
        const engineKeys = engineConfig?.properties
            ? Object.keys(engineConfig.properties as Record<string, unknown>)
            : []
        const nodeKeys = node?.properties ? Object.keys(node.properties) : []
        const seen = new Set<string>()
        const ordered: { key: string; custom: boolean }[] = []
        for (const k of engineKeys) {
            if (seen.has(k)) continue
            seen.add(k)
            ordered.push({ key: k, custom: false })
        }
        for (const k of nodeKeys) {
            if (seen.has(k)) continue
            seen.add(k)
            ordered.push({ key: k, custom: true })
        }
        return ordered
    }, [engineConfig, node])

    const onLabelChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            if (!node) return
            dispatch(nodeUpdated({ id: node.id, patch: { label: e.target.value } }))
        },
        [dispatch, node]
    )

    const onPropertyChange = useCallback(
        (key: string, next: unknown) => {
            if (!node) return
            dispatch(
                nodeUpdated({
                    id: node.id,
                    patch: { properties: { [key]: next } as Record<string, unknown> }
                })
            )
        },
        [dispatch, node]
    )

    return (
        <aside className="flex w-80 shrink-0 flex-col border-l bg-card">
            <header className="flex h-9 shrink-0 items-center gap-2 border-b px-3 text-[11px] font-medium">
                Properties
            </header>
            <div className="flex-1 overflow-y-auto p-3 text-[11.5px]">
                {!node ? (
                    <p className="italic text-muted-foreground">
                        Click a node on the left to inspect and edit.
                    </p>
                ) : (
                    <div className="space-y-3">
                        <ReadOnlyField label="id" value={node.id} mono />
                        <ReadOnlyField label="componentName" value={node.componentName} mono />
                        <LabelField value={node.label ?? ''} onChange={onLabelChange} />

                        {propertyKeys.length > 0 && (
                            <div className="pt-2">
                                <div className="mb-1.5 text-[9.5px] font-bold uppercase tracking-wide text-muted-foreground">
                                    properties
                                </div>
                                <div className="space-y-2.5">
                                    {propertyKeys.map(({ key, custom }) => (
                                        <PropertyField
                                            key={key}
                                            propKey={key}
                                            currentValue={node.properties?.[key]}
                                            defaultValue={
                                                (
                                                    engineConfig?.properties as
                                                        | Record<string, unknown>
                                                        | undefined
                                                )?.[key]
                                            }
                                            custom={custom}
                                            onChange={(v) => onPropertyChange(key, v)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        <ReadOnlyField
                            label="children"
                            value={`${Array.isArray(node.children) ? node.children.length : 0}`}
                        />

                        <div className="border-t pt-3">
                            <button
                                type="button"
                                disabled={
                                    !manifest ||
                                    !isStructuredComponent(manifest.components) ||
                                    manifest.components.id === node.id
                                }
                                onClick={() => dispatch(nodeRemoved({ id: node.id }))}
                                className={cn(
                                    'flex w-full items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-[11px] font-medium transition-colors',
                                    'border-red-200 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40'
                                )}
                            >
                                <Trash2 size={11} />
                                Delete node
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </aside>
    )
}

// ─── form fields ────────────────────────────────────────────────────────

const ReadOnlyField = ({
    label,
    value,
    mono
}: {
    label: string
    value: string
    mono?: boolean
}): JSX.Element => (
    <div>
        <div className="text-[9.5px] font-bold uppercase tracking-wide text-muted-foreground">
            {label}
        </div>
        <div className={cn('mt-0.5 truncate', mono && 'font-mono text-[11px]')}>{value}</div>
    </div>
)

const LabelField = ({
    value,
    onChange
}: {
    value: string
    onChange: (e: ChangeEvent<HTMLInputElement>) => void
}): JSX.Element => (
    <div>
        <div className="mb-1 text-[9.5px] font-bold uppercase tracking-wide text-muted-foreground">
            label
        </div>
        <input
            type="text"
            value={value}
            onChange={onChange}
            placeholder="(no label)"
            className="w-full rounded-md border bg-background px-2 py-1 text-[11px] outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20"
        />
    </div>
)

interface PropertyFieldProps {
    propKey: string
    currentValue: unknown
    defaultValue: unknown
    custom: boolean
    onChange: (next: unknown) => void
}

/**
 * One row per property. Field type is inferred from the engine's default
 * value (or the current value if the engine doesn't declare a default).
 * Falls back to a JSON textarea for objects/arrays so the escape hatch
 * always works — we'll add per-property schemas later if the heuristic
 * proves too coarse.
 */
const PropertyField = ({
    propKey,
    currentValue,
    defaultValue,
    custom,
    onChange
}: PropertyFieldProps): JSX.Element => {
    const fieldType = inferFieldType(currentValue ?? defaultValue)
    const value = currentValue ?? defaultValue ?? defaultByType(fieldType)

    return (
        <div>
            <div className="mb-1 flex items-baseline gap-1.5">
                <span className="font-mono text-[10.5px] text-foreground">{propKey}</span>
                {custom && (
                    <span className="text-[9px] italic text-muted-foreground">(custom)</span>
                )}
            </div>
            {fieldType === 'boolean' ? (
                <label className="flex cursor-pointer items-center gap-1.5 text-[11px]">
                    <input
                        type="checkbox"
                        checked={Boolean(value)}
                        onChange={(e) => onChange(e.target.checked)}
                        className="h-3.5 w-3.5"
                    />
                    <span className="text-muted-foreground">
                        {Boolean(value) ? 'true' : 'false'}
                    </span>
                </label>
            ) : fieldType === 'number' ? (
                <input
                    type="number"
                    value={typeof value === 'number' ? value : ''}
                    onChange={(e) => {
                        const n = Number(e.target.value)
                        onChange(Number.isFinite(n) ? n : 0)
                    }}
                    className="w-full rounded-md border bg-background px-2 py-1 text-[11px] outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20"
                />
            ) : fieldType === 'string' ? (
                <input
                    type="text"
                    value={typeof value === 'string' ? value : ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={
                        typeof defaultValue === 'string' && defaultValue ? defaultValue : '(empty)'
                    }
                    className="w-full rounded-md border bg-background px-2 py-1 text-[11px] outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20"
                />
            ) : (
                <JsonField value={value} onChange={onChange} />
            )}
        </div>
    )
}

const JsonField = ({
    value,
    onChange
}: {
    value: unknown
    onChange: (next: unknown) => void
}): JSX.Element => {
    const [draft, setDraft] = useState<string>(() => safeJsonStringify(value))
    const [parseError, setParseError] = useState<string | null>(null)

    // Re-sync the textarea when the upstream value changes from outside
    // (engine catalog reload, undo, etc.) AND the user isn't mid-typing
    // (draft hasn't diverged from the last known good).
    useEffect(() => {
        const next = safeJsonStringify(value)
        if (next !== draft && !parseError) {
            setDraft(next)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value])

    return (
        <div>
            <textarea
                value={draft}
                onChange={(e) => {
                    const text = e.target.value
                    setDraft(text)
                    try {
                        const parsed = JSON.parse(text)
                        setParseError(null)
                        onChange(parsed)
                    } catch (err) {
                        setParseError(err instanceof Error ? err.message : 'invalid JSON')
                    }
                }}
                rows={3}
                className={cn(
                    'w-full resize-y rounded-md border bg-background px-2 py-1 font-mono text-[10.5px] outline-none focus:ring-1',
                    parseError
                        ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                        : 'focus:border-primary/60 focus:ring-primary/20'
                )}
                spellCheck={false}
            />
            {parseError && <p className="mt-0.5 text-[9.5px] text-red-600">{parseError}</p>}
        </div>
    )
}

// ─── helpers ────────────────────────────────────────────────────────────

type InferredFieldType = 'string' | 'number' | 'boolean' | 'object'

function inferFieldType(value: unknown): InferredFieldType {
    if (typeof value === 'boolean') return 'boolean'
    if (typeof value === 'number') return 'number'
    if (typeof value === 'string') return 'string'
    if (value === null || value === undefined) return 'string'
    return 'object'
}

function defaultByType(t: InferredFieldType): unknown {
    switch (t) {
        case 'boolean':
            return false
        case 'number':
            return 0
        case 'object':
            return {}
        default:
            return ''
    }
}

function safeJsonStringify(value: unknown): string {
    try {
        return JSON.stringify(value ?? {}, null, 2)
    } catch {
        return '{}'
    }
}

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

// Silence type-only "unused" warning on ComponentRegisterConfig — we use it
// implicitly via `componentsRegistered: ComponentRegisterConfig[]` from the
// engine catalog hook. Re-export keeps the import live for downstream tools.
export type { ComponentRegisterConfig }
