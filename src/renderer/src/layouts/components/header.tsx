import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from '@renderer/components/ui/breadcrumb'
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
import { IGRPIcon } from '@igrp/igrp-framework-react-design-system'
import logo from '@renderer/assets/images/igrp-green.svg'
import SyncButton from '@renderer/components/git/git-sync'
import { ModeToggle } from '@renderer/components/mode-toogle'
import NotificationsPopover from '@renderer/components/notifications/notifications-popover'
import GitConnectionMenu from '@renderer/components/user-auth'
import { useWorkspace } from '@renderer/hooks/use-workspace'
import useToast from '@renderer/hooks/useToast'
import { cn } from '@renderer/lib/utils'
import { SettingsDialog } from '@renderer/browser/settings'
import type { RootState } from '@renderer/redux'
import { getFileThree as onGetPages } from '@renderer/redux/thunks'
import { ROUTES } from '@renderer/routes/routeConstants'
import { ArrowLeft, Code, FolderOpen, Maximize2, Minus, Square, X } from 'lucide-react'
import { type JSX, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import type { ProjectData } from 'src/main/types'
import { BranchSwitcher } from '../../components/git/git-branch-switcher'

interface HeaderProps {
    config?: ProjectData
    basePath?: string
}

const Header = ({ config, basePath }: HeaderProps): JSX.Element => {
    const { t } = useTranslation()
    const dispatch: any = useDispatch()
    const isGitEnabled = useSelector((state: RootState) => state.git.isGitEnabled)
    const isMac = window.api.i18nextElectronBackend.clientOptions.platform === 'darwin'

    const { workspace } = useWorkspace()

    const [installedIDEs, setInstalledIDEs] = useState<Array<any>>([])

    const [isMaximized, setIsMaximized] = useState(false)

    const { showErrorToast, showSuccessToast } = useToast()

    const handleMinimize = (): void => {
        window.menu.minimizeWindow()
        window.menu.isMaximized().then((maximized) => {
            setIsMaximized(maximized)
        })
    }

    const handleMaximize = (): void => {
        window.menu.maximizeWindow()
        window.menu.isMaximized().then((maximized) => {
            setIsMaximized(maximized)
        })
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
        const laodIdes = async (): Promise<void> => {
            await window.api.getIDEs().then((data) => {
                setInstalledIDEs(data)
            })
        }
        laodIdes()
    }, [])

    useEffect(() => {
        const checkMaximized = async (): Promise<void> => {
            try {
                const maximized = await window.menu.isMaximized()
                setIsMaximized(maximized)
            } catch (error) {
                console.error(error)
                setIsMaximized(false)
            }
        }

        checkMaximized()

        // Optional: Add listeners for window state changes
        const updateState = (): Promise<void> => checkMaximized()
        window.addEventListener('resize', updateState)

        return () => {
            window.removeEventListener('resize', updateState)
        }
    }, [])

    const WindowButton = ({
        onClick,
        icon,
        label,
        className
    }: {
        onClick: () => void
        icon: React.ReactNode
        label: string
        className?: string
    }): JSX.Element => (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'flex items-center justify-center w-6 h-6 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-hidden focus:ring-2 focus:ring-gray-300',
                className
            )}
            title={label}
        >
            {icon}
            <span className="sr-only">{label}</span>
        </button>
    )

    const isProjectAtive = config?.name !== undefined && config?.name !== null
    const isMonorepoLinked =
        !!basePath &&
        config?.storageMode === 'linked' &&
        !!config?.gitRootPath &&
        config.gitRootPath !== basePath
    return (
        <>
            <TooltipProvider>
                <header className="fle sticky top-0 z-50 w-full items-center border-b bg-background">
                    <div className="flex h-(--header-height) w-full items-center  px-4 justify-between">
                        <div className="flex items-center space-x-4 home">
                            <a
                                href={ROUTES.HOME}
                                className={cn(
                                    'flex items-center gap-2',
                                    isMac && isMaximized && 'pl-12'
                                )}
                            >
                                <img src={logo} alt="Logo" className="h-6 w-auto" />
                                <p className="text-sm font-medium">
                                    {import.meta.env.VITE_APP_TITLE}
                                </p>
                            </a>

                            {isProjectAtive && (
                                <Breadcrumb className="hidden lg:flex">
                                    <BreadcrumbList>
                                        <BreadcrumbItem>
                                            <BreadcrumbLink href={ROUTES.HOME}>
                                                <ArrowLeft className="h-4 w-4" />
                                            </BreadcrumbLink>
                                        </BreadcrumbItem>
                                        <BreadcrumbItem className="md:hidden lg:flex">
                                            <BreadcrumbPage>{workspace.name}</BreadcrumbPage>
                                        </BreadcrumbItem>
                                        <BreadcrumbSeparator />
                                        <BreadcrumbItem>
                                            <BreadcrumbPage className="truncate">
                                                {config.name}
                                            </BreadcrumbPage>
                                        </BreadcrumbItem>
                                    </BreadcrumbList>
                                </Breadcrumb>
                            )}
                        </div>
                        <div className="flex items-center space-x-2 ">
                            {basePath && (
                                <>
                                    {isMonorepoLinked ? (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div>
                                                    <BranchSwitcher
                                                        projectPath={basePath || ''}
                                                        onError={showErrorToast}
                                                        onSuccess={showSuccessToast}
                                                        onBranchChange={() => {
                                                            dispatch(onGetPages(basePath || ''))
                                                        }}
                                                    />
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>
                                                    {t('gitRepoRootDetected', {
                                                        root: config?.gitRootPath
                                                    })}
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>
                                    ) : (
                                        <BranchSwitcher
                                            projectPath={basePath || ''}
                                            onError={showErrorToast}
                                            onSuccess={showSuccessToast}
                                            onBranchChange={() => {
                                                dispatch(onGetPages(basePath || ''))
                                            }}
                                        />
                                    )}
                                    {isGitEnabled &&
                                        (isMonorepoLinked ? (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div>
                                                        <SyncButton basePath={basePath || ''} />
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>
                                                        {t('gitSyncRepoRootWarning', {
                                                            root: config?.gitRootPath
                                                        })}
                                                    </p>
                                                </TooltipContent>
                                            </Tooltip>
                                        ) : (
                                            <SyncButton basePath={basePath || ''} />
                                        ))}
                                </>
                            )}

                            <DropdownMenu>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost">
                                                <Code />
                                            </Button>
                                        </DropdownMenuTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{t('openOnEditor')}</p>
                                    </TooltipContent>
                                </Tooltip>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        onClick={openInFileManager}
                                        className="flex items-center"
                                    >
                                        <FolderOpen />
                                        {fileManagerLabel}
                                    </DropdownMenuItem>
                                    {installedIDEs.length > 0 && <DropdownMenuSeparator />}
                                    {installedIDEs.map(({ key, config }): React.ReactNode => {
                                        return (
                                            <DropdownMenuItem
                                                key={key}
                                                onClick={() => openIDE(key)}
                                                className="flex items-center"
                                            >
                                                <IGRPIcon iconName={config.icon} />
                                                {config.name}
                                            </DropdownMenuItem>
                                        )
                                    })}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <ModeToggle />

                            <SettingsDialog />

                            <NotificationsPopover />

                            <GitConnectionMenu />

                            {!isMac && (
                                <>
                                    <WindowButton
                                        onClick={handleMinimize}
                                        icon={<Minus className="h-4 w-4" />}
                                        label={t('minimize')}
                                    />
                                    <WindowButton
                                        onClick={handleMaximize}
                                        icon={
                                            isMaximized ? (
                                                <Square className="h-4 w-4" />
                                            ) : (
                                                <Maximize2 className="h-4 w-4" />
                                            )
                                        }
                                        label={isMaximized ? t('restore') : t('maximize')}
                                    />
                                    <WindowButton
                                        onClick={handleClose}
                                        icon={<X className="h-4 w-4" />}
                                        label={t('close')}
                                        className="hover:bg-red-500 hover:text-white"
                                    />
                                </>
                            )}
                        </div>
                    </div>
                </header>
            </TooltipProvider>
        </>
    )
}

export default Header
