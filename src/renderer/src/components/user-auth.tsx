import { Avatar, AvatarFallback, AvatarImage } from '@renderer/components/ui/avatar'
import { Button } from '@renderer/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@renderer/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/components/ui/tooltip'
import useGitAuth from '@renderer/hooks/use-git-auth'
import { cn } from '@renderer/lib/utils'
import { Github, Gitlab, GitlabIcon, LogOut, User2Icon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

function GitConnectionMenu({
    triggerClassName,
    variant = 'default'
}: {
    triggerClassName?: string
    variant?: 'default' | 'header'
}) {
    const { t } = useTranslation()
    const { loginGithub, loginGitLab, userGitHub, userGitLab, logoutGithub, logoutGitLab } =
        useGitAuth()

    const displayName =
        userGitHub?.name ||
        userGitHub?.login ||
        userGitLab?.name ||
        userGitLab?.username ||
        null

    const initials =
        (userGitHub?.login?.slice(0, 2) || userGitLab?.username?.slice(0, 2) || '?').toUpperCase()

    const isHeader = variant === 'header'

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                {userGitHub || userGitLab ? (
                    <Button
                        variant="ghost"
                        className={cn(
                            isHeader
                                ? 'group h-auto gap-2 px-1 py-0 hover:bg-transparent'
                                : 'h-9 max-w-[200px] gap-2 px-2 hover:bg-accent',
                            triggerClassName
                        )}
                    >
                        <Avatar
                            className={cn(
                                'shrink-0',
                                isHeader
                                    ? 'h-7 w-7 ring-2 ring-border transition-all group-hover:ring-primary/40'
                                    : 'h-7 w-7'
                            )}
                        >
                            <AvatarImage
                                src={userGitHub?.avatar_url || userGitLab?.avatar_url}
                                alt={displayName ?? undefined}
                            />
                            <AvatarFallback
                                className={cn(
                                    isHeader
                                        ? 'bg-primary text-xs font-bold text-primary-foreground'
                                        : 'bg-primary/15 text-xs text-primary'
                                )}
                            >
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        {displayName && (
                            <span
                                className={cn(
                                    'hidden truncate text-sm font-medium lg:inline',
                                    isHeader
                                        ? 'text-xs text-muted-foreground group-hover:text-foreground'
                                        : ''
                                )}
                            >
                                {displayName}
                            </span>
                        )}
                    </Button>
                ) : (
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            isHeader
                                ? 'h-auto w-auto rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                : 'h-9 w-9 rounded-full',
                            triggerClassName
                        )}
                    >
                        <User2Icon className="h-4 w-4" />
                    </Button>
                )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem>
                    {userGitHub ? (
                        <div className="flex w-full items-center justify-between space-x-3">
                            <div className="flex items-center space-x-2">
                                <Github className="h-3 w-3" />
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
                                    <Button variant="ghost" size="icon" onClick={logoutGithub}>
                                        <LogOut className="h-3 w-3" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('logout')}</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    ) : (
                        <div className="flex cursor-pointer items-center" onClick={loginGithub}>
                            <Github className="mr-2 h-4 w-4" />
                            <span>{t('connectGitHub')}</span>
                        </div>
                    )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {}}>
                    {userGitLab ? (
                        <div className="flex w-full items-center justify-between space-x-3">
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
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => logoutGitLab()}
                                    >
                                        <LogOut className="h-3 w-3" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('logout')}</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    ) : (
                        <div
                            className="flex cursor-pointer items-center"
                            onClick={() => loginGitLab()}
                        >
                            <GitlabIcon className="mr-2 h-4 w-4" />
                            <span>{t('connectGitLab')}</span>
                        </div>
                    )}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default GitConnectionMenu
