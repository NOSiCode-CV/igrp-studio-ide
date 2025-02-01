import logo from '@renderer/assets/images/igrp-green.svg';
import { useEffect, useState } from 'react';
import { ProjectData } from 'src/main/types';
import { ROUTES } from '@renderer/routes/routeConstants';
import {
    Bell,
    Code,
    Maximize2,
    Minus,
    Settings,
    Square,
    X,
} from 'lucide-react';
import { SettingsDialog } from '@renderer/pages/settings/settings-dialog';
import { HelpDialog } from '@renderer/components/help-dialog';
import { cn } from '@renderer/lib/utils';
import { ModeToggle } from '@renderer/components/mode-toogle';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@renderer/components/ui/tooltip';
import { Button } from '@renderer/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { BranchSwitcher } from '../../components/git/git-branch-switcher';
import useToast from '@renderer/components/useToast';
import { useDispatch, useSelector } from 'react-redux';
import { getFileThree as onGetPages } from '@renderer/redux/thunks';
import SyncButton from '@renderer/components/git/git-sync';
import { RootState } from '@renderer/redux';
import GitConnectionMenu from '@renderer/components/user-auth';

interface HeaderProps {
    config?: ProjectData;
    basePath?: string;
}

const Header = ({ config, basePath }: HeaderProps): JSX.Element => {
    const dispatch: any = useDispatch();
    const { isGitEnabled } = useSelector((state: RootState) => state.git);
    const { showErrorToast, showSuccessToast } = useToast();
    const isMac =
        window.api.i18nextElectronBackend.clientOptions.platform === 'darwin';

    const navigate = useNavigate();

    const [openSettings, setOpenSettings] = useState(false);

    const [openHelp, setOpenHelp] = useState(false);

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

    const openVSCode = async () => {
        try {
            await window.api.openVSCode(basePath);
        } catch (error) {
            console.error('Error opening VS Code:', error);
        }
    };

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
        icon: JSX.Element;
        label: string;
        className?: string;
    }) => (
        <button
            onClick={onClick}
            className={cn(
                'flex items-center justify-center w-6 h-6 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300',
                className
            )}
            title={label}
        >
            {icon}
            <span className="sr-only">{label}</span>
        </button>
    );

    return (
        <>
            <TooltipProvider>
                <header className="sticky h-10 top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex items-center justify-between px-4">
                        <div className="flex items-center space-x-2 home cursor-pointer">
                            <div onClick={openPage} className={cn('flex items-center gap-2', isMac ? 'pl-12': '')}>
                                <img src={logo} alt="Logo" className="h-6 w-auto" />
                                <p className="text-sm font-medium">IGRP Studio</p>
                            </div>
                            <div>
                            {config?.name && (
                                <div className="flex justify-center gap-2 items-center">
                                    <BranchSwitcher
                                        projectPath={basePath || ''}
                                        onError={showErrorToast}
                                        onSuccess={showSuccessToast}
                                        onBranchChange={() => {
                                            dispatch(
                                                onGetPages(basePath || '')
                                            );
                                        }}
                                    />
                                    {isGitEnabled && <SyncButton basePath={basePath || ''} /> }
                                </div>
                            )}
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                        
                            <ModeToggle />

                            {config?.name && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={openVSCode}
                                >
                                    <Code className="w-5 h-5" />
                                    <span className="sr-only">
                                        Open VS Code
                                    </span>
                                </Button>
                            )}

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setOpenSettings(true)}
                            >
                                <Settings className="w-5 h-5" />
                                <span className="sr-only">Settings</span>
                            </Button>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                        <Bell className="w-5 h-5" />
                                        <span className="sr-only">
                                            Notifications
                                        </span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Notifications</p>
                                </TooltipContent>
                            </Tooltip>
                            
                            <GitConnectionMenu />

                            {!isMac && (
                                <>
                                    <WindowButton
                                        onClick={handleMinimize}
                                        icon={<Minus className="h-4 w-4" />}
                                        label="Minimize"
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
                                            isMaximized ? 'Restore' : 'Maximize'
                                        }
                                    />
                                    <WindowButton
                                        onClick={handleClose}
                                        icon={<X className="h-4 w-4" />}
                                        label="Close"
                                        className="hover:bg-red-500 hover:text-white"
                                    />
                                </>
                            )}
                        </div>
                    </div>
                </header>
                <SettingsDialog
                    isOpen={openSettings}
                    onClose={() => setOpenSettings(false)}
                />
                <HelpDialog
                    isOpen={openHelp}
                    onClose={() => setOpenHelp(!openHelp)}
                />
            </TooltipProvider>
        </>
    );
};

export default Header;
