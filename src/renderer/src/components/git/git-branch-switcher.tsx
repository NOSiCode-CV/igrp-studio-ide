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
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();

    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreatingBranch, setIsCreatingBranch] = useState(false);
    const [newBranchName, setNewBranchName] = useState('');

    const { isGitEnabled, branches, activeBranch } = useSelector(
        (state: RootState) => state.git
    );

    useEffect(() => {
        if (projectPath) checkGitStatus();
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
            console.error(t('failedCheckGitStatus'), error);
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
            onError?.(t('failedLoadBranches'));
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
            onSuccess?.(t('gitInitialized'));
            await checkGitStatus();
        } catch (error) {
            onError?.(t('failedInitGit'));
        }
    };

    if (!isGitEnabled) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant={'outline'}
                        onClick={handleInitGit}
                        className="h-6 text-xs"
                    >
                        <GitFork className="h-3 w-3" />
                        {t('initGit')}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{t('initializeGit')}</p>
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
            onSuccess?.(t('branchCreated', { branchName: newBranchName }));
        } catch (error: any) {
            onError?.(error.message || t('failedCreateBranch'));
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
            onSuccess?.(t('switchedToBranch', { branchName }));
            onBranchChange?.(branchName);
        } catch (error) {
            if (error instanceof Error) {
                onError?.(t('commitsPendingSwitch'));
            } else {
                onError?.(t('failedSwitchBranch'));
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
                {t('loadingBranches')}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
        );
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={'outline'}
                    role="combobox"
                    aria-expanded={open}
                    className="h-6 text-xs space-x-1"
                >
                    <GitBranch className="h-3 w-3 " />
                    <span>{activeBranch || t('selectBranch')}</span>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <Command>
                    <CommandInput placeholder={t('searchBranch')} />
                    <CommandList>
                        <CommandEmpty>{t('noBranchFound')}</CommandEmpty>
                        <CommandGroup heading={t('branches')}>
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
                                                        {t('current')}
                                                    </span>
                                                )}
                                                {branch.isRemote && (
                                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                                        {t('remote')}
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
                                {t('createNewBranch')}
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
                                        placeholder={t('branchNamePlaceholder')}
                                        autoFocus
                                    />
                                    <Button
                                        size="sm"
                                        disabled={!newBranchName.trim()}
                                        onClick={handleCreateBranch}
                                    >
                                        {t('create')}
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
