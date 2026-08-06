import { DiffEditor } from '@monaco-editor/react'
import { AlertTriangle, Check, X } from 'lucide-react'
import { type JSX, useState } from 'react'
import { Button } from '@renderer/components/ui/button'
import { cn } from '@renderer/lib/utils'
import { summariseOps, type SROp } from '../../utils/searchReplaceParser'

interface DocDiffPreviewProps {
    /** Document content captured at the moment the proposal arrived. */
    original: string
    /** Document content after applying every assistant edit. */
    proposed: string
    /** Per-edit outcome — drives the toolbar summary and the failures list. */
    ops: SROp[]
    /**
     * Per-edit selection (optional, in-flight feature). Index-aligned with
     * `ops`. When provided, the diff reflects only the edits where
     * `selected[i]` is true.
     */
    selected?: boolean[]
    onApply: () => void
    onReject: () => void
    className?: string
}

/**
 * Read-only diff view shown in place of the markdown editor while the user
 * reviews an assistant proposal built from SEARCH/REPLACE blocks. Apply
 * commits all successful edits; Reject discards. Failed edits are listed in
 * a collapsible accordion so the user knows what didn't apply and can ask
 * the assistant to retry just those.
 */
export function DocDiffPreview({
    original,
    proposed,
    ops,
    selected,
    onApply,
    onReject,
    className
}: DocDiffPreviewProps): JSX.Element {
    const [showFailures, setShowFailures] = useState(false)
    const failed = ops.filter((op): op is Extract<SROp, { ok: false }> => !op.ok)
    const hasChanges = original !== proposed

    // When `selected` is provided, show "Apply N of M" reflecting the user's
    // per-edit picks; otherwise fall back to the bulk summary.
    const okTotal = ops.filter((op) => op.ok).length
    const selectedOk = selected
        ? ops.reduce((acc, op, idx) => acc + (op.ok && selected[idx] ? 1 : 0), 0)
        : okTotal

    return (
        <div className={cn('flex h-full flex-col', className)}>
            <div className="flex items-center justify-between gap-2 border-b bg-card/50 px-3 py-2 text-[11px]">
                <div className="flex min-w-0 items-center gap-2">
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 font-medium uppercase tracking-wider text-primary">
                        Proposal
                    </span>
                    <span className="truncate text-muted-foreground">
                        {selected
                            ? `${selectedOk} of ${okTotal} selected — review and apply.`
                            : `${summariseOps(ops)} — review and apply.`}
                    </span>
                    {failed.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setShowFailures((v) => !v)}
                            className="flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 hover:bg-amber-500/20"
                        >
                            <AlertTriangle size={10} />
                            {failed.length} not applied
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 px-2 text-[11px] text-red-500 hover:bg-red-500/10"
                        onClick={onReject}
                    >
                        <X size={12} /> Reject
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        className="h-7 gap-1 px-2 text-[11px]"
                        onClick={onApply}
                        disabled={!hasChanges}
                        title={hasChanges ? 'Apply to document' : 'Nothing to apply'}
                    >
                        <Check size={12} />
                        {selected ? `Apply ${selectedOk}/${okTotal}` : 'Apply'}
                    </Button>
                </div>
            </div>
            {showFailures && failed.length > 0 && (
                <div className="max-h-40 overflow-auto border-b bg-amber-500/5 px-3 py-2 text-[11px]">
                    <p className="mb-1 font-medium text-amber-700 dark:text-amber-400">
                        Edits that couldn't be applied — ask the assistant to retry these with more
                        context:
                    </p>
                    <ul className="space-y-2">
                        {failed.map((op, idx) => (
                            <li
                                key={idx}
                                className="rounded border border-amber-500/30 bg-background/40 p-2"
                            >
                                <div className="text-amber-700 dark:text-amber-400">
                                    {op.reason === 'no-match' && 'No match in document'}
                                    {op.reason === 'multiple-matches' &&
                                        'Ambiguous (multiple matches)'}
                                    {op.reason === 'empty-edit' && 'Empty SEARCH and REPLACE'}
                                </div>
                                {op.search && (
                                    <pre className="mt-1 overflow-auto whitespace-pre-wrap break-all rounded bg-muted/40 p-1.5 font-mono text-[10px] text-muted-foreground">
                                        {truncate(op.search, 240)}
                                    </pre>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            <div className="min-h-0 flex-1">
                <DiffEditor
                    height="100%"
                    language="markdown"
                    original={original}
                    modified={proposed}
                    theme="vs-dark"
                    options={{
                        readOnly: true,
                        renderSideBySide: false,
                        fontSize: 13,
                        fontFamily:
                            'JetBrains Mono, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                        lineNumbers: 'off',
                        minimap: { enabled: false },
                        wordWrap: 'on',
                        wrappingIndent: 'same',
                        scrollBeyondLastLine: false,
                        renderLineHighlight: 'none',
                        folding: false,
                        glyphMargin: false,
                        padding: { top: 12, bottom: 12 }
                    }}
                />
            </div>
        </div>
    )
}

function truncate(text: string, max: number): string {
    if (text.length <= max) return text
    return `${text.slice(0, max)}…`
}
