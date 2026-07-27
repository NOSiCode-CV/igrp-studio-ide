import { Button } from '@renderer/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@renderer/components/ui/dropdown-menu'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from '@renderer/components/ui/tooltip'
import { useTheme } from '@renderer/components/theme-provider'
import { IGRPIcon } from '@igrp/igrp-framework-react-design-system'
import logo from '@renderer/assets/images/igrp-green.svg'
import SyncButton from '@renderer/components/git/git-sync'
import NotificationsPopover from '@renderer/components/notifications/notifications-popover'
import GitConnectionMenu from '@renderer/components/user-auth'
import { SettingsDialog } from '@renderer/browser/settings'
import { useWorkspace } from '@renderer/hooks/use-workspace'
import useToast from '@renderer/hooks/useToast'
import { cn } from '@renderer/lib/utils'
import type { RootState } from '@renderer/redux'
import { getFileThree as onGetPages } from '@renderer/redux/thunks'
import { ROUTES } from '@renderer/routes/routeConstants'
import {
    ArrowLeft,
    ChevronRight,
    Code,
    FolderOpen,
    Maximize2,
    Minus,
    Moon,
    Square,
    Sun,
    X
} from 'lucide-react'
import { type JSX, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import type { ProjectData } from 'src/main/types'
import { BranchSwitcher } from '../../components/git/git-branch-switcher'

interface HeaderProps {
    config?: ProjectData
    basePath?: string
}

const headerIconBtn =
    'h-auto w-auto rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white dark:hover:bg-slate-800'

const branchTriggerClass =
    'flex h-auto items-center gap-1.5 border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700 hover:bg-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'

const Header = ({ config, basePath }: HeaderProps): JSX.Element => {
    const { t } = useTranslation()
    const dispatch: any = useDispatch()
    const isGitEnabled = useSelector((state: RootState) => state.git.isGitEnabled)
    const isMac = window.api.i18nextElectronBackend.clientOptions.platform === 'darwin'
    const { theme, setTheme } = useTheme()
    const { workspace } = useWorkspace()
    const [installedIDEs, setInstalledIDEs] = useState<Array<any>>([])
    const [isMaximized, setIsMaximized] = useState(false)
    const [isDarkMode, setIsDarkMode] = useState(
        () =>
            document.documentElement.classList.contains('dark') ||
            (theme === 'system' &&
                window.matchMedia('(prefers-color-scheme: dark)').matches)
    )

    const { showErrorToast, showSuccessToast } = useToast()

    useEffect(() => {
        const root = document.documentElement
        const sync = (): void => {
            setIsDarkMode(
                root.classList.contains('dark') ||
                    (theme === 'system' &&
                        window.matchMedia('(prefers-color-scheme: dark)').matches)
            )
        }
        sync()
        const observer = new MutationObserver(sync)
        observer.observe(root, { attributes: true, attributeFilter: ['class'] })
        return () => observer.disconnect()
    }, [theme])

    const toggleTheme = (): void => {
        setTheme(isDarkMode ? 'light' : 'dark')
    }

    const handleMinimize = (): void => {
        window.menu.minimizeWindow()
        window.menu.isMaximized().then(setIsMaximized)
    }

    const handleMaximize = (): void => {
        window.menu.maximizeWindow()
        window.menu.isMaximized().then(setIsMaximized)
    }

    const handleClose = (): void => {
        window.menu.closeWindow()
    }

    const openIDE = async (ideType: string): Promise<void> => {
        const path = basePath || workspace.path
        if (!path) return
        try {
            await window.api.openIDE({ basePath: path, ideType })
        } catch (error) {
            console.error(error)
        }
    }

    const platform = window.api.i18nextElectronBackend.clientOptions.platform
    const fileManagerLabel = isMac
        ? t('openInFinder')
        : platform === 'win32'
          ? t('openInExplorer')
          : t('openInFileManager')

    const openInFileManager = async (): Promise<void> => {
        const path = basePath || workspace.path
        if (!path) return
        try {
            await window.api.openInFileManager(path)
        } catch (error) {
            console.error(error)
        }
    }

    useEffect(() => {
        void window.api.getIDEs().then(setInstalledIDEs)
    }, [])

    useEffect(() => {
        const checkMaximized = async (): Promise<void> => {
            try {
                setIsMaximized(await window.menu.isMaximized())
            } catch {
                setIsMaximized(false)
            }
        }
        void checkMaximized()
        window.addEventListener('resize', checkMaximized)
        return () => window.removeEventListener('resize', checkMaximized)
    }, [])

    const isProjectActive = config?.name !== undefined && config?.name !== null
    const isMonorepoLinked =
        !!basePath &&
        config?.storageMode === 'linked' &&
        !!config?.gitRootPath &&
        config.gitRootPath !== basePath

    return (
        <TooltipProvider delayDuration={300}>
            <header
                className={cn(
                    'sticky top-0 z-40 w-full border-b',
                    'h-(--header-height)',
                    'bg-background text-foreground border-border',
                    'dark:bg-[#0A0D14] dark:text-slate-200 dark:border-slate-800/80'
                )}
            >
                <div
                    className={cn(
                        'flex h-full w-full items-center justify-between gap-2',
                        isMac ? 'pl-[76px] pr-4' : 'px-4'
                    )}
                >
                {/* Left: brand + breadcrumbs */}
                <div className="flex min-w-0 items-center gap-2 text-sm">
                    <a
                        href={ROUTES.HOME}
                        className="flex shrink-0 items-center gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold tracking-wide text-emerald-400 transition-colors hover:bg-emerald-500/15"
                    >
                        <img src={logo} alt="" className="h-3.5 w-auto shrink-0" />
                        <span className="leading-none">{import.meta.env.VITE_APP_TITLE}</span>
                    </a>

                    {isProjectActive && (
                        <>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <a
                                        href={ROUTES.HOME}
                                        title={t('backToProject', 'Voltar ao Projeto')}
                                        className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-800/60 hover:text-white dark:hover:bg-slate-800/60"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                    </a>
                                </TooltipTrigger>
                                <TooltipContent>{t('backToProject', 'Voltar ao Projeto')}</TooltipContent>
                            </Tooltip>

                            <div className="hidden min-w-0 items-center gap-1.5 text-xs font-medium text-slate-400 md:flex">
                                <a
                                    href={ROUTES.HOME}
                                    className="truncate transition-colors hover:text-slate-200"
                                >
                                    {workspace.name}
                                </a>
                                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-600" />
                                <span
                                    className="truncate rounded border border-slate-800 bg-slate-900/80 px-2 py-0.5 font-mono text-xs font-semibold text-emerald-400"
                                    title={config.name}
                                >
                                    {config.name}
                                </span>
                            </div>
                        </>
                    )}
                </div>

                {/* Right: dev controls + profile */}
                <div className="flex shrink-0 items-center gap-1.5 text-xs">
                    {basePath && (
                        <>
                            {isMonorepoLinked ? (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div>
                                            <BranchSwitcher
                                                projectPath={basePath}
                                                triggerClassName={branchTriggerClass}
                                                onError={showErrorToast}
                                                onSuccess={showSuccessToast}
                                                onBranchChange={() =>
                                                    dispatch(onGetPages(basePath))
                                                }
                                            />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        {t('gitRepoRootDetected', {
                                            root: config?.gitRootPath
                                        })}
                                    </TooltipContent>
                                </Tooltip>
                            ) : (
                                <BranchSwitcher
                                    projectPath={basePath}
                                    triggerClassName={branchTriggerClass}
                                    onError={showErrorToast}
                                    onSuccess={showSuccessToast}
                                    onBranchChange={() => dispatch(onGetPages(basePath))}
                                />
                            )}

                            {isGitEnabled &&
                                (isMonorepoLinked ? (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div>
                                                <SyncButton
                                                    basePath={basePath}
                                                    buttonClassName={headerIconBtn}
                                                />
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            {t('gitSyncRepoRootWarning', {
                                                root: config?.gitRootPath
                                            })}
                                        </TooltipContent>
                                    </Tooltip>
                                ) : (
                                    <SyncButton
                                        basePath={basePath}
                                        buttonClassName={headerIconBtn}
                                    />
                                ))}
                        </>
                    )}

                    <DropdownMenu>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className={headerIconBtn}>
                                        <Code className="h-3.5 w-3.5" />
                                    </Button>
                                </DropdownMenuTrigger>
                            </TooltipTrigger>
                            <TooltipContent>{t('openOnEditor')}</TooltipContent>
                        </Tooltip>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={openInFileManager}>
                                <FolderOpen />
                                {fileManagerLabel}
                            </DropdownMenuItem>
                            {installedIDEs.length > 0 && <DropdownMenuSeparator />}
                            {installedIDEs.map(({ key, config: ideConfig }) => (
                                <DropdownMenuItem key={key} onClick={() => openIDE(key)}>
                                    <IGRPIcon iconName={ideConfig.icon} />
                                    {ideConfig.name}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className={cn(headerIconBtn, 'hover:text-amber-400')}
                                onClick={toggleTheme}
                            >
                                {isDarkMode ? (
                                    <Sun className="h-3.5 w-3.5" />
                                ) : (
                                    <Moon className="h-3.5 w-3.5" />
                                )}
                                <span className="sr-only">{t('toggleTheme')}</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            {isDarkMode ? t('light') : t('dark')}
                        </TooltipContent>
                    </Tooltip>

                    <div className="hidden sm:block">
                        <SettingsDialog triggerClassName={headerIconBtn} />
                    </div>

                    <NotificationsPopover triggerClassName={headerIconBtn} />

                    <div className="mx-1 hidden h-4 w-px bg-slate-800 sm:block" />

                    <GitConnectionMenu variant="header" />

                    {!isMac && (
                        <>
                            <div className="mx-1 h-4 w-px bg-slate-800" />
                            <div className="flex items-center gap-0.5">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className={headerIconBtn}
                                    onClick={handleMinimize}
                                    title={t('minimize')}
                                >
                                    <Minus className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className={headerIconBtn}
                                    onClick={handleMaximize}
                                    title={isMaximized ? t('restore') : t('maximize')}
                                >
                                    {isMaximized ? (
                                        <Square className="h-3 w-3" />
                                    ) : (
                                        <Maximize2 className="h-3.5 w-3.5" />
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        headerIconBtn,
                                        'hover:bg-red-500/90 hover:text-white'
                                    )}
                                    onClick={handleClose}
                                    title={t('close')}
                                >
                                    <X className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </>
                    )}
                </div>
                </div>
            </header>
        </TooltipProvider>
    )
}

export default Header
