import logo from '@renderer/assets/images/igrp-green.svg';
import { useEffect, useState } from 'react';
import { ProjectData } from 'src/main/types';
import { ROUTES } from '@renderer/routes/routeConstants';
import {
    ArrowLeft,
    Bell,
    Code,
    Loader2,
    Maximize2,
    Minus,
    Play,
    Square,
    X,
} from 'lucide-react';
import { SettingsDialog } from '@renderer/pages/settings/settings-dialog';
import { cn } from '@renderer/lib/utils';
import { ModeToggle } from '@renderer/components/mode-toogle';
import { Button } from '@renderer/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { BranchSwitcher } from '../../components/git/git-branch-switcher';
import useToast from '@renderer/components/useToast';
import { useDispatch, useSelector } from 'react-redux';
import { getFileThree as onGetPages } from '@renderer/redux/thunks';
import SyncButton from '@renderer/components/git/git-sync';
import { RootState } from '@renderer/redux';
import GitConnectionMenu from '@renderer/components/user-auth';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@renderer/components/ui/tooltip';
import { useTranslation } from 'react-i18next';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@renderer/components/ui/dropdown-menu';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@renderer/components/ui/breadcrumb';
import { IGRPIcon } from '@igrp/igrp-framework-react-design-system';
import { useWorkspace } from '@renderer/hooks/use-workspace';
import { useDocker } from '@renderer/hooks/use-docker';

interface HeaderProps {
    config?: ProjectData;
    basePath?: string;
}

const Header = ({ config, basePath }: HeaderProps) => {
    const { t } = useTranslation();
    const dispatch: any = useDispatch();
    const { isGitEnabled } = useSelector((state: RootState) => state.git);
    const { showErrorToast, showSuccessToast } = useToast();
    const isMac =
        window.api.i18nextElectronBackend.clientOptions.platform === 'darwin';

    const { workspace } = useWorkspace();
    const { loading, startContainers } = useDocker();

    const navigate = useNavigate();

    const [installedIDEs, setInstalledIDEs] = useState<Array<any>>([]);

    const [isMaximized, setIsMaximized] = useState(false); // New state to track maximize status

    // Window control buttons
    const handleMinimize = () => {
        window.menu.minimizeWindow();
    };

    const handleMaximize = () => {
        window.menu.maximizeWindow();
        setIsMaximized(!isMaximized); // Toggle the state
    };

    const handleClose = () => {
        window.menu.closeWindow();
    };

    const openPage = () => {
        navigate(ROUTES.HOME);
    };

    const openIDE = async (ideType: string) => {
        if (!basePath) return;
        try {
            await window.api.openIDE({ basePath, ideType });
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        const laodIdes = async () => {
            await window.api.getIDEs().then((data) => {
                setInstalledIDEs(data);
            });
        };
        laodIdes();
    }, []);

    useEffect(() => {
        const checkMaximized = async () => {
            const maximized = window.menu.isMaximized();
            setIsMaximized(maximized);
        };
        checkMaximized();
    }, []);

    const WindowButton = ({
        onClick,
        icon,
        label,
        className,
    }: {
        onClick: () => void;
        icon: React.ReactNode;
        label: string;
        className?: string;
    }) => (
        <button
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
    );

    const handleRun = async () => {
        await startContainers();
    };

    const isProjectAtive = config?.name !== undefined && config?.name !== null;

    return (
        <>
            <TooltipProvider>
                <header className="fle sticky top-0 z-50 w-full items-center border-b bg-background">
                    <div className="flex h-(--header-height) w-full items-center  px-4 justify-between">
                        <div className="flex items-center space-x-4 home cursor-pointer">
                            <div
                                onClick={openPage}
                                className={cn(
                                    'flex items-center gap-2',
                                    isMac ? 'pl-12' : ''
                                )}
                            >
                                <img
                                    src={logo}
                                    alt="Logo"
                                    className="h-6 w-auto"
                                />
                                <p className="text-sm font-medium">
                                    {import.meta.env.VITE_APP_TITLE}
                                </p>
                            </div>

                            {isProjectAtive && (
                                <Breadcrumb>
                                    <BreadcrumbList>
                                        <BreadcrumbItem>
                                            <BreadcrumbLink href="/#">
                                                <ArrowLeft className="h-4 w-4" />
                                            </BreadcrumbLink>
                                        </BreadcrumbItem>
                                        <BreadcrumbItem>
                                            <BreadcrumbPage>
                                                {workspace?.name}
                                            </BreadcrumbPage>
                                        </BreadcrumbItem>
                                        <BreadcrumbSeparator />
                                        <BreadcrumbItem>
                                            <BreadcrumbPage>
                                                {config?.name}
                                            </BreadcrumbPage>
                                        </BreadcrumbItem>
                                    </BreadcrumbList>
                                </Breadcrumb>
                            )}
                        </div>
                        <div className="flex items-center space-x-2 ">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-6 text-xs gap-1"
                                        onClick={handleRun}
                                    >
                                        {!loading ? (
                                            <>
                                                <Play className="h-3 w-3 text-igrp" />
                                                Run
                                            </>
                                        ) : (
                                            <Loader2 className="animate-spin h-3 w-3 text-igrp" />
                                            
                                        )}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('Run')}</p>
                                </TooltipContent>
                            </Tooltip>

                            <BranchSwitcher
                                projectPath={basePath || ''}
                                onError={showErrorToast}
                                onSuccess={showSuccessToast}
                                onBranchChange={() => {
                                    dispatch(onGetPages(basePath || ''));
                                }}
                            />

                            {isGitEnabled && (
                                <SyncButton basePath={basePath || ''} />
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
                                    {installedIDEs.map(
                                        ({ key, config }, index) => {
                                            return (
                                                <DropdownMenuItem
                                                    key={index}
                                                    onClick={() => openIDE(key)}
                                                    className="flex items-center"
                                                >
                                                    <IGRPIcon
                                                        iconName={config.icon}
                                                    />
                                                    <span>
                                                        Open in {config.name}
                                                    </span>
                                                </DropdownMenuItem>
                                            );
                                        }
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <ModeToggle />

                            <SettingsDialog />

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                        <Bell className="w-5 h-5" />
                                        <span className="sr-only">
                                            {t('notifications')}
                                        </span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('notifications')}</p>
                                </TooltipContent>
                            </Tooltip>

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
                                        label={
                                            isMaximized
                                                ? t('restore')
                                                : t('maximize')
                                        }
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
    );
};

export default Header;
