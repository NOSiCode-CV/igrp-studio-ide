import { useState, useEffect } from 'react';
import {
    Check,
    ChevronsUpDown,
    PlusCircle,
    GitBranch,
    GitFork,
} from 'lucide-react';

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@renderer/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@renderer/components/ui/popover';
import { Button } from '@renderer/components/ui/button';
import { cn } from '@renderer/lib/utils';
import { useDispatch, useSelector } from 'react-redux';
import {
    setActiveBranch,
    setBranches,
    setGitEnabled,
} from '@renderer/redux/git/reducer';
import { RootState } from '@renderer/redux';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

export interface Branch {
    name: string;
    isActive: boolean;
    isRemote: boolean;
    fullName: string;
    lastCommit?: string;
    lastCommitDate?: string;
}

interface BranchSwitcherProps {
    projectPath: string;
    onError?: (message: string) => void;
    onSuccess?: (message: string) => void;
    onBranchChange?: (branchName: string) => void;
}

export function BranchSwitcher({
    projectPath,
    onError,
    onSuccess,
    onBranchChange,
}: BranchSwitcherProps) {
    const dispatch = useDispatch();
    
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreatingBranch, setIsCreatingBranch] = useState(false);
    const [newBranchName, setNewBranchName] = useState('');

    const { isGitEnabled, branches, activeBranch } = useSelector(
        (state: RootState) => state.git
    );

    useEffect(() => {
        checkGitStatus();
    }, [projectPath]);

    const checkGitStatus = async () => {
        try {
            const isInitialized = await window.electron.ipcRenderer.invoke(
                'is-git-initialized',
                projectPath
            );
            dispatch(setGitEnabled(isInitialized));
            if (isInitialized) {
                loadBranches();
            }
        } catch (error) {
            console.error('Failed to check git status:', error);
        }
    };

    const loadBranches = async () => {
        try {
            setIsLoading(true);
            const branchList = await window.electron.ipcRenderer.invoke(
                'list-branches',
                projectPath
            );
            dispatch(setBranches(branchList));

            const activeBranch = branchList.find((branch) => branch.isActive);
            if (activeBranch) {
                dispatch(setActiveBranch(activeBranch.name));
            }
        } catch (error) {
            onError?.('Failed to load branches');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInitGit = async () => {
        try {
            await window.electron.ipcRenderer.invoke(
                'initialize-git',
                projectPath
            );
            onSuccess?.('Git initialized successfully');
            await checkGitStatus();
        } catch (error) {
            onError?.('Failed to initialize git');
        }
    };

    if (!isGitEnabled) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        onClick={handleInitGit}
                        className="justify-between"
                    >
                        <GitFork className="mr-2 h-4 w-4" />
                        Init git
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Initialize git</p>
                </TooltipContent>
            </Tooltip>
        );
    }

    const handleCreateBranch = async () => {
        try {
            setIsCreatingBranch(false);
            await window.electron.ipcRenderer.invoke('create-branch', {
                projectPath,
                branchName: newBranchName,
            });

            setNewBranchName('');
            await loadBranches();
            setOpen(false);
            onSuccess?.(`Branch "${newBranchName}" created successfully`);
        } catch (error: any) {
            onError?.(error.message || 'Failed to create branch');
        }
    };

    const handleBranchSwitch = async (branchName: string) => {
        try {
            await window.electron.ipcRenderer.invoke('checkout-branch', {
                projectPath,
                branchName,
            });

            await loadBranches();
            setOpen(false);
            onSuccess?.(`Switched to branch ${branchName}`);
            onBranchChange?.(branchName);
        } catch (error) {
            if (error instanceof Error) {
                onError?.('Commits pending. Please commit changes before switch branch.');
            } else {
                onError?.('Failed to switch branch');
            }
        }
    };

    if (isLoading) {
        return (
            <Button
                variant="outline"
                className="w-[250px] justify-between"
                disabled
            >
                <GitBranch className="mr-2 h-4 w-4" />
                Loading branches...
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
        );
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    role="combobox"
                    aria-expanded={open}
                    className="justify-between"
                >
                    <GitBranch className="mr-2 h-4 w-4" />
                    {activeBranch || 'Select branch'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <Command>
                    <CommandInput placeholder="Search branch..." />
                    <CommandList>
                        <CommandEmpty>No branch found.</CommandEmpty>
                        <CommandGroup heading="Branches">
                            {branches.map((branch) => (
                                <CommandItem
                                    key={branch.fullName}
                                    onSelect={() =>
                                        handleBranchSwitch(branch.name)
                                    }
                                    className="flex items-center justify-between"
                                >
                                    <div className="flex items-center">
                                        <Check
                                            className={cn(
                                                'mr-2 h-4 w-4',
                                                branch.isActive
                                                    ? 'opacity-100'
                                                    : 'opacity-0'
                                            )}
                                        />
                                        <div className="flex flex-col">
                                            <span className="flex items-center gap-2">
                                                {branch.name}
                                                {branch.isActive && (
                                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                                        Current
                                                    </span>
                                                )}
                                                {branch.isRemote && (
                                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                                        Remote
                                                    </span>
                                                )}
                                            </span>
                                            {branch.lastCommit && (
                                                <span className="text-xs text-muted-foreground">
                                                    {branch.lastCommit} •{' '}
                                                    {branch.lastCommitDate}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                        <CommandSeparator />
                        <CommandGroup>
                            <CommandItem
                                onSelect={() => setIsCreatingBranch(true)}
                            >
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Create new branch
                            </CommandItem>

                            {isCreatingBranch && (
                                <div className="p-2 flex gap-2">
                                    <input
                                        type="text"
                                        value={newBranchName}
                                        onChange={(e) =>
                                            setNewBranchName(e.target.value)
                                        }
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
                                        placeholder="Branch name..."
                                        autoFocus
                                    />
                                    <Button
                                        size="sm"
                                        disabled={!newBranchName.trim()}
                                        onClick={handleCreateBranch}
                                    >
                                        Create
                                    </Button>
                                </div>
                            )}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
