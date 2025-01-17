import { GitBranch, Github, GitlabIcon, LogOut, User2Icon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';
import useGithubAuth from '@renderer/hooks/useGithubAuth';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

function GitConnectionMenu() {
    const { loginGithub, user, logoutGithub } = useGithubAuth();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger>
            {user ? (
                <Button variant="ghost" size="icon" className="p-0">
                    <Avatar className="h-8 w-8">
                        
                            <>
                                <AvatarImage
                                    src={user.avatar_url}
                                    alt={user.login}
                                />
                                <AvatarFallback>
                                    {user.login.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </>
                        
                    </Avatar>
                </Button>
                ) : (
                    <Button variant="ghost" size="icon" className="p-0">
                        <User2Icon className="h-4 w-4" />
                    </Button>
                )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem>
                    {user ? (
                        <div className="flex items-center justify-between gap-5 w-full">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">
                                    {user.login}
                                </p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {user.email}
                                </p>
                            </div>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <LogOut
                                        className="h-4 w-4 cursor-pointer"
                                        onClick={logoutGithub}
                                    />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Logout</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    ) : (
                        <div
                            className="flex items-center"
                            onClick={loginGithub}
                        >
                            <Github className="mr-2 h-4 w-4" />
                            <span>Connect GitHub</span>
                        </div>
                    )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {}}>
                    <GitlabIcon className="mr-2 h-4 w-4" />
                    <span>Connect GitLab</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default GitConnectionMenu;
