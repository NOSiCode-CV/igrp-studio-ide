import { Github, Gitlab, GitlabIcon, LogOut, User2Icon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useTranslation } from 'react-i18next';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';
import useGitAuth from '@renderer/hooks/use-git-auth';
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

function GitConnectionMenu() {
    const { t } = useTranslation();
    const {
        loginGithub,
        loginGitLab,
        userGitHub,
        userGitLab,
        logoutGithub,
        logoutGitLab,
    } = useGitAuth();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                {userGitHub || userGitLab ? (
                    <IGRPButtonPrimitive variant="ghost" size="icon" className="p-0">
                        <Avatar className="h-8 w-8">
                            <>
                                <AvatarImage
                                    src={
                                        userGitHub?.avatar_url ||
                                        userGitLab?.avatar_url
                                    }
                                    alt={
                                        userGitHub?.login ||
                                        userGitLab?.username
                                    }
                                />
                                <AvatarFallback>
                                    {userGitHub?.login
                                        .charAt(0)
                                        .toUpperCase() ||
                                        userGitLab?.username
                                            .charAt(0)
                                            .toUpperCase()}
                                </AvatarFallback>
                            </>
                        </Avatar>
                    </IGRPButtonPrimitive>
                ) : (
                    <IGRPButtonPrimitive variant="ghost" size="icon" className="p-0">
                        <User2Icon className="h-4 w-4" />
                    </IGRPButtonPrimitive>
                )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem>
                    {userGitHub ? (
                        <div className="flex items-center justify-between space-x-3 w-full">
                            <div className="flex items-center space-x-2">
                                <Github className="h-3 w-3"/>
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        {userGitHub?.login}
                                    </p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {userGitHub?.email}
                                    </p>
                                </div>
                            </div>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <IGRPButtonPrimitive
                                        variant="ghost"
                                        size="icon"
                                        onClick={logoutGithub}
                                    >
                                        <LogOut className="h-3 w-3" />
                                    </IGRPButtonPrimitive>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('logout')}</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    ) : (
                        <div
                            className="flex items-center cursor-pointer"
                            onClick={loginGithub}
                        >
                            <Github className="mr-2 h-4 w-4" />
                            <span>{t('connectGitHub')}</span>
                        </div>
                    )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {}}>
                    {userGitLab ? (
                        <div className="flex items-center justify-between space-x-3 w-full">
                            <div className="flex items-center space-x-2">
                                <Gitlab className="h-3 w-3" />
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        {userGitLab.username}
                                    </p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {userGitLab.email}
                                    </p>
                                </div>
                            </div>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <IGRPButtonPrimitive
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => logoutGitLab()}
                                    >
                                        <LogOut className="h-3 w-3" />
                                    </IGRPButtonPrimitive>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('logout')}</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    ) : (
                        <div
                            className="flex items-center cursor-pointer"
                            onClick={() => loginGitLab()}
                        >
                            <GitlabIcon className="mr-2 h-4 w-4" />
                            <span>{t('connectGitLab')}</span>
                        </div>
                    )}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default GitConnectionMenu;
