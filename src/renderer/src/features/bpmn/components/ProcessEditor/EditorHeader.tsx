import {
    IGRPBadgePrimitive,
    IGRPButtonPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { Check, ChevronLeft, Loader2, Save } from 'lucide-react'
import type { JSX } from 'react'
import { cn } from '../../../../lib/utils'

interface EditorHeaderProps {
    isSaving: boolean
    isDirty: boolean
    lastSavedAt: number | null
    onSave: () => void
    onClose?: () => void
}

function formatRelative(timestamp: number): string {
    const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000))
    if (seconds < 5) return 'just now'
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
}

interface StatusPillProps {
    isSaving: boolean
    isDirty: boolean
    lastSavedAt: number | null
}

function StatusPill({ isSaving, isDirty, lastSavedAt }: StatusPillProps): JSX.Element {
    if (isSaving) {
        return (
            <IGRPBadgePrimitive
                variant="secondary"
                className="gap-1.5 border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
            >
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving…
            </IGRPBadgePrimitive>
        )
    }
    if (isDirty) {
        return (
            <IGRPBadgePrimitive
                variant="outline"
                className="gap-1.5 border-amber-500/40 text-amber-700 dark:text-amber-300"
            >
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Unsaved changes
            </IGRPBadgePrimitive>
        )
    }
    if (lastSavedAt) {
        return (
            <IGRPBadgePrimitive
                variant="secondary"
                className="gap-1.5 border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            >
                <Check className="h-3 w-3" />
                Saved {formatRelative(lastSavedAt)}
            </IGRPBadgePrimitive>
        )
    }
    return (
        <IGRPBadgePrimitive variant="outline" className="gap-1.5 text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
            No changes
        </IGRPBadgePrimitive>
    )
}

export function EditorHeader({
    isSaving,
    isDirty,
    lastSavedAt,
    onSave,
    onClose
}: EditorHeaderProps): JSX.Element {
    return (
        <div className="flex items-center justify-between gap-4 border-b px-4 py-2">
            <div className="flex items-center gap-2">
                {onClose && (
                    <IGRPButtonPrimitive
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        aria-label="Back to list"
                        className="h-8 px-2 text-muted-foreground hover:text-foreground"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Back
                    </IGRPButtonPrimitive>
                )}
            </div>
            <div className="flex shrink-0 items-center gap-3">
                <StatusPill
                    isSaving={isSaving}
                    isDirty={isDirty}
                    lastSavedAt={lastSavedAt}
                />
                <IGRPButtonPrimitive
                    size="sm"
                    variant={isDirty ? 'default' : 'secondary'}
                    onClick={onSave}
                    disabled={isSaving || !isDirty}
                    className={cn(
                        'gap-1.5 transition-opacity',
                        !isDirty && !isSaving && 'opacity-70'
                    )}
                >
                    {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isDirty ? (
                        <Save className="h-4 w-4" />
                    ) : (
                        <Check className="h-4 w-4" />
                    )}
                    {isSaving ? 'Saving…' : isDirty ? 'Save' : 'Saved'}
                </IGRPButtonPrimitive>
            </div>
        </div>
    )
}
