/**
 * Project-level skill awareness for the Frontend (Page Manager).
 *
 * Reuses the same IPC / `usePrototypeSkills` stack as the Prototype banners,
 * but renders as a VersionAlert-style block under the page header — Page
 * Manager has no full-bleed chrome strip like PrototypePanel.
 *
 * Priority (one alert at a time):
 *   1. Skill update available
 *   2. Canonical skill missing → recommend install
 *   3. Skills present → soft “your project has skills” info (dismissible)
 */
import { Alert, AlertDescription, AlertTitle } from '@renderer/components/ui/alert'
import { Button } from '@renderer/components/ui/button'
import { cn } from '@renderer/lib/utils'
import {
    usePrototypeSkills,
    type SkillUpdateSummary
} from '@renderer/generators/specification/hooks/usePrototypeSkills'
import {
    CANONICAL_SKILL,
    SKILL_BANNER_DISMISS_KEY_PREFIX,
    SKILL_UPDATE_DISMISS_KEY_PREFIX
} from '@renderer/generators/specification/components/prototype/persistence/skill-banner-dismiss'
import { Download, Loader2, RefreshCw, Sparkles, X } from 'lucide-react'
import { useMemo, useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'

/** Separate from Prototype panel dismiss — Page Manager is its own surface. */
const UI_SKILL_INFO_DISMISS_PREFIX = 'ui.skillAlert.info.dismissed.'
const UI_SKILL_INSTALL_DISMISS_PREFIX = 'ui.skillAlert.install.dismissed.'

function readFlag(key: string): boolean {
    try {
        return window.localStorage?.getItem(key) === '1'
    } catch {
        return false
    }
}

function writeFlag(key: string): void {
    try {
        window.localStorage?.setItem(key, '1')
    } catch {
        // private mode etc.
    }
}

function readUpdateDismissed(basePath: string): Set<string> {
    try {
        const raw = window.localStorage?.getItem(`${SKILL_UPDATE_DISMISS_KEY_PREFIX}${basePath}`)
        return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
    } catch {
        return new Set()
    }
}

function writeUpdateDismissed(basePath: string, keys: Set<string>): void {
    try {
        window.localStorage?.setItem(
            `${SKILL_UPDATE_DISMISS_KEY_PREFIX}${basePath}`,
            JSON.stringify(Array.from(keys))
        )
    } catch {
        // noop
    }
}

export function SkillProjectAlert({
    basePath,
    className
}: {
    basePath?: string
    className?: string
}): JSX.Element | null {
    const { t } = useTranslation()
    const { skills, updates, isLoading, installSkill, updateSkill } = usePrototypeSkills(basePath)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [installDismissed, setInstallDismissed] = useState(() =>
        basePath ? readFlag(`${UI_SKILL_INSTALL_DISMISS_PREFIX}${basePath}`) : false
    )
    const [infoDismissed, setInfoDismissed] = useState(() =>
        basePath ? readFlag(`${UI_SKILL_INFO_DISMISS_PREFIX}${basePath}`) : false
    )
    const [updateDismissed, setUpdateDismissed] = useState<Set<string>>(() =>
        basePath ? readUpdateDismissed(basePath) : new Set()
    )

    const hasCanonical = useMemo(
        () => skills.some((s) => s.name === CANONICAL_SKILL),
        [skills]
    )

    const updateCandidate = useMemo((): SkillUpdateSummary | null => {
        return (
            updates.find(
                (u) =>
                    u.hasUpdate &&
                    u.latest &&
                    !updateDismissed.has(`${u.name}:${u.latest}`)
            ) ?? null
        )
    }, [updates, updateDismissed])

    if (!basePath || isLoading) return null

    const dismissInstall = () => {
        setInstallDismissed(true)
        writeFlag(`${UI_SKILL_INSTALL_DISMISS_PREFIX}${basePath}`)
        // Keep Prototype install banner in sync if user dismissed from UI.
        writeFlag(`${SKILL_BANNER_DISMISS_KEY_PREFIX}${basePath}`)
    }

    const dismissInfo = () => {
        setInfoDismissed(true)
        writeFlag(`${UI_SKILL_INFO_DISMISS_PREFIX}${basePath}`)
    }

    const dismissUpdate = () => {
        if (!updateCandidate?.latest) return
        const key = `${updateCandidate.name}:${updateCandidate.latest}`
        const next = new Set(updateDismissed)
        next.add(key)
        setUpdateDismissed(next)
        writeUpdateDismissed(basePath, next)
    }

    const handleInstall = async () => {
        setBusy(true)
        setError(null)
        const result = await installSkill(CANONICAL_SKILL)
        setBusy(false)
        if (!result.ok) setError(result.error ?? t('skillAlertInstallFailed'))
    }

    const handleUpdate = async () => {
        if (!updateCandidate) return
        setBusy(true)
        setError(null)
        const result = await updateSkill(updateCandidate.name)
        setBusy(false)
        if (!result.ok) setError(result.error ?? t('skillAlertUpdateFailed'))
    }

    // Alert reserves an icon column only for direct `>svg`; our icon sits in a div.
    const alertLayout =
        '!grid-cols-[auto_1fr] gap-x-3 items-center border-border bg-card text-card-foreground shadow-sm'

    // 1) Update available
    if (updateCandidate) {
        return (
            <Alert
                className={cn(alertLayout, 'border-l-4 border-l-amber-500', className)}
            >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10">
                    <RefreshCw className="size-4 text-amber-500" />
                </div>
                <div className="flex min-w-0 items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <AlertTitle className="col-start-auto text-foreground">
                            {t('skillAlertUpdateTitle')}
                        </AlertTitle>
                        <AlertDescription className="col-start-auto text-muted-foreground">
                            {t('skillAlertUpdateDescription', {
                                name: updateCandidate.name,
                                installed: updateCandidate.installed ?? '?',
                                latest: updateCandidate.latest
                            })}
                            {error && (
                                <span className="mt-1 block text-destructive">{error}</span>
                            )}
                        </AlertDescription>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={busy}
                            onClick={() => void handleUpdate()}
                            className="border-amber-500/30 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200"
                        >
                            {busy ? (
                                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Download className="mr-1 h-3.5 w-3.5" />
                            )}
                            {busy ? t('cliUpdating') : t('cliUpdateAction')}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:bg-accent hover:text-foreground"
                            onClick={dismissUpdate}
                            title={t('dismiss')}
                        >
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </Alert>
        )
    }

    // 2) Recommend installing the canonical skill
    if (!hasCanonical && !installDismissed) {
        return (
            <Alert
                className={cn(alertLayout, 'border-l-4 border-l-primary', className)}
            >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
                    <Sparkles className="size-4 text-primary" />
                </div>
                <div className="flex min-w-0 items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <AlertTitle className="col-start-auto text-foreground">
                            {t('skillAlertInstallTitle')}
                        </AlertTitle>
                        <AlertDescription className="col-start-auto text-muted-foreground">
                            {t('skillAlertInstallDescription', { name: CANONICAL_SKILL })}
                            {error && (
                                <span className="mt-1 block text-destructive">{error}</span>
                            )}
                        </AlertDescription>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={busy}
                            onClick={() => void handleInstall()}
                            className="border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
                        >
                            {busy ? (
                                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Download className="mr-1 h-3.5 w-3.5" />
                            )}
                            {busy ? t('skillAlertInstalling') : t('skillAlertInstallAction')}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:bg-accent hover:text-foreground"
                            onClick={dismissInstall}
                            title={t('dismiss')}
                        >
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </Alert>
        )
    }

    // 3) Soft awareness when skills already exist
    if (skills.length > 0 && !infoDismissed) {
        return (
            <Alert
                className={cn(
                    alertLayout,
                    'border-l-4 border-l-primary py-2.5',
                    className
                )}
            >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
                    <Sparkles className="size-4 text-primary" />
                </div>
                <div className="flex min-w-0 items-center justify-between gap-3">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                        <span className="font-semibold text-foreground">
                            {t('skillAlertPresentTitle')}:
                        </span>
                        <span className="text-muted-foreground">
                            {t('skillAlertPresentCount', {
                                count: skills.length,
                                defaultValue: 'This project has {{count}} skill(s):'
                            })}
                        </span>
                        {skills.map((skill) => (
                            <span
                                key={skill.name}
                                className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 font-mono text-[11px] text-primary"
                            >
                                {skill.name}
                            </span>
                        ))}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 shrink-0 p-0 text-muted-foreground hover:bg-accent hover:text-foreground"
                        onClick={dismissInfo}
                        title={t('dismiss')}
                    >
                        <X className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </Alert>
        )
    }

    return null
}
