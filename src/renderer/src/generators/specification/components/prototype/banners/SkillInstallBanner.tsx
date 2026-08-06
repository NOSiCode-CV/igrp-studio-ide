import { cn } from '@renderer/lib/utils'
import { Download, Library, Loader2 } from 'lucide-react'
import { useMemo, useState, type JSX } from 'react'
import type { InstalledSkillSummary } from '../../../hooks/usePrototypeSkills'
import {
    CANONICAL_SKILL,
    SKILL_BANNER_DISMISS_KEY_PREFIX
} from '../persistence/skill-banner-dismiss'

/**
 * One-click install banner for the canonical Prototype skill
 * (`igrp-studio-metadata`).
 *
 * Surfaces when the skill isn't present in `.agents/skills/`. Stays
 * out of the way once dismissed (per-project, localStorage). Install
 * spawns the CLI via the IPC bridge wired by `usePrototypeSkills` and
 * refreshes the local skill list on success.
 *
 * Extracted from `PrototypePanel.tsx` as part of the prototype refactor
 * (P3 — leaf components / banners).
 */
export const SkillInstallBanner = ({
    basePath,
    skills,
    installSkill
}: {
    basePath: string | undefined
    skills: InstalledSkillSummary[]
    installSkill: (name: string) => Promise<{ ok: boolean; error?: string }>
}): JSX.Element | null => {
    const [installing, setInstalling] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const dismissKey = basePath ? `${SKILL_BANNER_DISMISS_KEY_PREFIX}${basePath}` : null
    const [dismissed, setDismissed] = useState<boolean>(() => {
        if (!dismissKey || typeof window === 'undefined') return false
        try {
            return window.localStorage?.getItem(dismissKey) === '1'
        } catch {
            return false
        }
    })

    const installed = useMemo(() => skills.some((s) => s.name === CANONICAL_SKILL), [skills])

    if (!basePath || installed || dismissed) return null

    const dismiss = () => {
        setDismissed(true)
        if (!dismissKey) return
        try {
            window.localStorage?.setItem(dismissKey, '1')
        } catch {
            // noop — private mode etc.
        }
    }

    const handleInstall = async () => {
        setInstalling(true)
        setError(null)
        const result = await installSkill(CANONICAL_SKILL)
        setInstalling(false)
        if (!result.ok) {
            setError(result.error ?? 'Install failed.')
        }
    }

    return (
        <div className="flex items-center gap-3 border-b bg-blue-500/5 px-4 py-2 text-[11px]">
            <Library size={14} className="text-blue-500" />
            <div className="flex-1">
                <span className="font-medium">Recommended:</span> install the{' '}
                <code className="rounded bg-muted px-1 py-0.5 font-mono">{CANONICAL_SKILL}</code>{' '}
                skill for better generation quality.
                {error && (
                    <span className="ml-2 text-red-500" title={error}>
                        — {error.length > 80 ? `${error.slice(0, 80)}…` : error}
                    </span>
                )}
            </div>
            <button
                type="button"
                onClick={handleInstall}
                disabled={installing}
                className={cn(
                    'flex items-center gap-1 rounded-md border px-2 py-1 text-[10.5px] font-medium transition-colors',
                    installing
                        ? 'border-border bg-card text-muted-foreground'
                        : 'border-blue-500/30 bg-blue-500/10 text-blue-600 hover:bg-blue-500/15'
                )}
            >
                {installing ? (
                    <Loader2 size={11} className="animate-spin" />
                ) : (
                    <Download size={11} />
                )}
                {installing ? 'Installing…' : 'Install'}
            </button>
            <button
                type="button"
                onClick={dismiss}
                className="text-[10.5px] text-muted-foreground hover:text-foreground"
                title="Dismiss"
            >
                ✕
            </button>
        </div>
    )
}
