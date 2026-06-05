import { cn } from '@renderer/lib/utils'
import { Download, Loader2, RefreshCw } from 'lucide-react'
import { useMemo, useState, type JSX } from 'react'
import type { SkillUpdateSummary } from '../../../hooks/usePrototypeSkills'
import { SKILL_UPDATE_DISMISS_KEY_PREFIX } from '../persistence/skill-banner-dismiss'

/**
 * Banner that nudges the user to update a skill when a newer version
 * is available. Same visual language as `SkillInstallBanner`, in amber
 * instead of blue.
 *
 * Shows ONE update at a time (the first with `hasUpdate`). Dismiss is
 * keyed by `${name}:${latest}` so a brand-new version pops the banner
 * again, while clicking ✕ on 1.0.2 doesn't keep silencing 1.0.3.
 *
 * On successful update the banner hides itself — `usePrototypeSkills`
 * re-checks and the next render sees `hasUpdate` flip to false.
 *
 * Extracted from `PrototypePanel.tsx` as part of the prototype refactor
 * (P3 — leaf components / banners).
 */
export const SkillUpdateBanner = ({
    basePath,
    updates,
    updateSkill
}: {
    basePath: string | undefined
    updates: SkillUpdateSummary[]
    updateSkill: (name: string) => Promise<{ ok: boolean; error?: string }>
}): JSX.Element | null => {
    const [updating, setUpdating] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [dismissedKeys, setDismissedKeys] = useState<Set<string>>(() => {
        if (typeof window === 'undefined' || !basePath) return new Set()
        try {
            const raw = window.localStorage?.getItem(
                `${SKILL_UPDATE_DISMISS_KEY_PREFIX}${basePath}`
            )
            return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
        } catch {
            return new Set()
        }
    })

    // First update that isn't dismissed for its (name, latest) tuple.
    const candidate = useMemo(() => {
        return (
            updates.find(
                (u) => u.hasUpdate && u.latest && !dismissedKeys.has(`${u.name}:${u.latest}`)
            ) ?? null
        )
    }, [updates, dismissedKeys])

    if (!basePath || !candidate) return null

    const dismiss = () => {
        if (!candidate.latest) return
        const key = `${candidate.name}:${candidate.latest}`
        const next = new Set(dismissedKeys)
        next.add(key)
        setDismissedKeys(next)
        try {
            window.localStorage?.setItem(
                `${SKILL_UPDATE_DISMISS_KEY_PREFIX}${basePath}`,
                JSON.stringify(Array.from(next))
            )
        } catch {
            // noop — private mode etc.
        }
    }

    const handleUpdate = async () => {
        setUpdating(true)
        setError(null)
        const result = await updateSkill(candidate.name)
        setUpdating(false)
        if (!result.ok) {
            setError(result.error ?? 'Update failed.')
        }
        // On success the hook re-checks; the banner will hide itself
        // when `hasUpdate` flips to false (installed === latest).
    }

    return (
        <div className="flex items-center gap-3 border-b bg-amber-500/5 px-4 py-2 text-[11px]">
            <RefreshCw size={14} className="text-amber-500" />
            <div className="flex-1">
                <span className="font-medium">Update available:</span>{' '}
                <code className="rounded bg-muted px-1 py-0.5 font-mono">{candidate.name}</code>{' '}
                <span className="text-muted-foreground">
                    {candidate.installed ?? '?'} → {candidate.latest}
                </span>
                {error && (
                    <span className="ml-2 text-red-500" title={error}>
                        — {error.length > 80 ? `${error.slice(0, 80)}…` : error}
                    </span>
                )}
            </div>
            <button
                type="button"
                onClick={handleUpdate}
                disabled={updating}
                className={cn(
                    'flex items-center gap-1 rounded-md border px-2 py-1 text-[10.5px] font-medium transition-colors',
                    updating
                        ? 'border-border bg-card text-muted-foreground'
                        : 'border-amber-500/30 bg-amber-500/10 text-amber-700 hover:bg-amber-500/15 dark:text-amber-400'
                )}
            >
                {updating ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />}
                {updating ? 'Updating…' : 'Update'}
            </button>
            <button
                type="button"
                onClick={dismiss}
                className="text-[10.5px] text-muted-foreground hover:text-foreground"
                title="Dismiss until next version"
            >
                ✕
            </button>
        </div>
    )
}
