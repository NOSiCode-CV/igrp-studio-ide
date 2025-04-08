import { Moon, Sun } from 'lucide-react';

import { Button } from '@renderer/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@renderer/components/ui/dropdown-menu';
import { useTheme } from '@renderer/components/theme-provider';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

export function ModeToggle() {
    const { setTheme } = useTheme();

    return (
        <DropdownMenu>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                            <span className="sr-only">Toggle theme</span>
                        </Button>
                    </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Toggle theme</p>
                </TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme('light')}>
                    Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')}>
                    Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')}>
                    System
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

{/* <div className="bg-background/80 backdrop-blur-sm border rounded-lg flex items-center">
            <Button
                variant="ghost"
                size="icon"
                className={cn(
                    'rounded-full w-8 h-8',
                    theme === 'light' && 'bg-background text-primary'
                )}
                onClick={() => setTheme('light')}
                aria-label="Light mode"
            >
                <Sun className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className={cn(
                    'rounded-full w-8 h-8',
                    theme === 'dark' && 'bg-background text-primary'
                )}
                onClick={() => setTheme('dark')}
                aria-label="Dark mode"
            >
                <Moon className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className={cn(
                    'rounded-full w-8 h-8',
                    theme === 'system' && 'bg-background text-primary'
                )}
                onClick={() => setTheme('system')}
                aria-label="System mode"
            >
                <Monitor className="h-4 w-4" />
            </Button>
        </div> */}
