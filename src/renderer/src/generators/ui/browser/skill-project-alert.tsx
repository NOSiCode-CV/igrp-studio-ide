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
import { Download, Library, Loader2, RefreshCw, X } from 'lucide-react'
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

    // 1) Update available
    if (updateCandidate) {
        return (
            <Alert
                className={cn(
                    'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20',
                    className
                )}
            >
                <RefreshCw className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <div className="col-start-2 flex min-w-0 flex-1 items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <AlertTitle className="text-amber-800 dark:text-amber-200">
                            {t('skillAlertUpdateTitle')}
                        </AlertTitle>
                        <AlertDescription className="text-amber-700 dark:text-amber-300">
                            {t('skillAlertUpdateDescription', {
                                name: updateCandidate.name,
                                installed: updateCandidate.installed ?? '?',
                                latest: updateCandidate.latest
                            })}
                            {error && (
                                <span className="mt-1 block text-red-600 dark:text-red-400">
                                    {error}
                                </span>
                            )}
                        </AlertDescription>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={busy}
                            onClick={() => void handleUpdate()}
                            className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-600 dark:text-amber-300 dark:hover:bg-amber-900/30"
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
                            className="h-8 w-8 p-0 text-amber-600 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/30"
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
                className={cn(
                    'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20',
                    className
                )}
            >
                <Library className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <div className="col-start-2 flex min-w-0 flex-1 items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <AlertTitle className="text-blue-800 dark:text-blue-200">
                            {t('skillAlertInstallTitle')}
                        </AlertTitle>
                        <AlertDescription className="text-blue-700 dark:text-blue-300">
                            {t('skillAlertInstallDescription', { name: CANONICAL_SKILL })}
                            {error && (
                                <span className="mt-1 block text-red-600 dark:text-red-400">
                                    {error}
                                </span>
                            )}
                        </AlertDescription>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={busy}
                            onClick={() => void handleInstall()}
                            className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900/30"
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
                            className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30"
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

    // 3) Soft awareness when skills already exist — semantic tokens for theme safety
    if (skills.length > 0 && !infoDismissed) {
        const names = skills.map((s) => s.name).join(', ')
        return (
            <Alert
                className={cn(
                    'border-border bg-muted/40 dark:bg-muted/20',
                    className
                )}
            >
                <Library className="h-4 w-4 text-muted-foreground" />
                <div className="col-start-2 flex min-w-0 flex-1 items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <AlertTitle className="text-foreground">
                            {t('skillAlertPresentTitle')}
                        </AlertTitle>
                        <AlertDescription className="text-muted-foreground">
                            {t('skillAlertPresentDescription', {
                                count: skills.length,
                                names
                            })}
                        </AlertDescription>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 shrink-0 p-0 text-muted-foreground hover:bg-muted dark:hover:bg-muted/60"
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
