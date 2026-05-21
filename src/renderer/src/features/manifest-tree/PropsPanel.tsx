/**
 * `PropsPanel` — engine-schema-aware property editor for a selected
 * `StructuredComponent`.
 *
 * Renders per-property form fields inferred from the engine's default
 * values. Booleans → checkbox; numbers → number input; strings → text
 * input; everything else (objects, arrays) → JSON textarea escape hatch.
 *
 * Pure presentation — every mutation flows through the `onUpdate` /
 * `onRemove` callbacks. The Prototype builder wires those to its Redux
 * slice (M-DnD α extraction); the Page Builder wires them to its
 * EditorContext (M-DnD β).
 *
 * Layout: fixed-width right rail (`w-80`) with a sticky header. Mount
 * inside a flex container with `<TreeView />` on the left for the
 * canonical 2-col edit experience.
 */

import type { ComponentRegisterConfig } from '@igrp/igrp-studio-nextjs-engine/types'
import type { StructuredComponent } from '@renderer/lib/dnd/types'
import { cn } from '@renderer/lib/utils'
import { Trash2 } from 'lucide-react'
import { type ChangeEvent, type JSX, useEffect, useMemo, useState } from 'react'
import type { TreeCallbacks } from './types'

export interface PropsPanelProps {
    /** Selected node — `null` shows the "select a node" empty state. */
    node: StructuredComponent | null
    /** Engine registry — drives property field inference + defaults. */
    engineCatalog: ReadonlyArray<ComponentRegisterConfig>
    /** Patch handler — typically wired to `TreeCallbacks.onUpdate`. */
    onUpdate: TreeCallbacks['onUpdate']
    /** Remove handler — caller decides whether to enable the delete button. */
    onRemove: TreeCallbacks['onRemove']
    /**
     * When `false`, the Delete button is disabled. Callers set this to
     * `false` for the manifest root (can't be removed) or when the user
     * lacks edit permission. Default: `true`.
     */
    canDelete?: boolean
    className?: string
}

export const PropsPanel = ({
    node,
    engineCatalog,
    onUpdate,
    onRemove,
    canDelete = true,
    className
}: PropsPanelProps): JSX.Element => {
    const engineConfig = useMemo(() => {
        if (!node) return null
        return engineCatalog.find((c) => c.name === node.componentName) ?? null
    }, [node, engineCatalog])

    // Union of property keys: engine-declared first (canonical order),
    // then any custom keys the node carries (flagged in the UI).
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

    const handleLabelChange = (e: ChangeEvent<HTMLInputElement>): void => {
        if (!node) return
        onUpdate(node.id, { label: e.target.value })
    }

    const handlePropertyChange = (key: string, next: unknown): void => {
        if (!node) return
        onUpdate(node.id, {
            properties: { [key]: next } as Record<string, unknown>
        })
    }

    return (
        <aside className={cn('flex w-80 shrink-0 flex-col border-l bg-card', className)}>
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
                        <LabelField value={node.label ?? ''} onChange={handleLabelChange} />

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
                                            onChange={(v) => handlePropertyChange(key, v)}
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
                                disabled={!canDelete}
                                onClick={() => onRemove(node.id)}
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

// ─── internal field components ──────────────────────────────────────────

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
 * Objects/arrays drop into a JSON textarea — coarse but reliable until
 * we wire per-property schemas.
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
    // (engine catalog reload, undo, etc.) AND the user isn't mid-typing.
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
