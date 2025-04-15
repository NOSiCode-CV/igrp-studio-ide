'use client';

import * as React from 'react';
import { FolderKanban, ListFilter, Pin, Plus } from 'lucide-react';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from '@renderer/components/ui/dropdown-menu';
import {
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@renderer/components/ui/sidebar';
import { IWorkspace } from 'src/main/types';
import { IGRPInputSearch } from '@igrp/igrp-framework-react-design-system';
import CreateWorkspace from '@renderer/pages/home/components/create-workspace';
import { cn } from '@renderer/lib/utils';
import { useWorkspace } from '@renderer/hooks/use-workspace';
import { Button } from '@renderer/components/ui/button';
import { Tool } from 'gojs';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@renderer/components/ui/tooltip';

export function WorkspaceSwitcher({
    defaultWorkspace,
    onWorkspaceChange,
}: {
    defaultWorkspace: IWorkspace;
    onWorkspaceChange: (workspace: IWorkspace) => void;
}) {
    const [workspaces, setWorkspaces] = React.useState<IWorkspace[]>([]);
    const [pinnedWorkspaces, setPinnedWorkspaces] = React.useState<
        IWorkspace[]
    >([]);
    const [showWorkspaceDialog, setShowWorkspaceDialog] = React.useState(false);

    const [selectedWorkspace, setSelectedWorkspace] =
        React.useState<IWorkspace>(defaultWorkspace);
    const [searchTerm, setSearchTerm] = React.useState<string>('');
    const [filteredWorkspaces, setFilteredWorkspaces] = React.useState<
        IWorkspace[]
    >([]);

    const {
        state: { changeStatus },
        actions: { getWorkspaces, updateWorkspace },
    } = useWorkspace();

    const loadPinnedWorkspace = () => {
        const pinned: IWorkspace[] = workspaces.filter(
            (workspace) =>
                workspace.pinned || workspace.name === selectedWorkspace.name
        );

        setPinnedWorkspaces(pinned);
    };

    React.useEffect(() => {
        const result = workspaces.filter((workspace) =>
            workspace.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredWorkspaces(result);

        setSelectedWorkspace(defaultWorkspace);

        loadPinnedWorkspace();
    }, [searchTerm, defaultWorkspace, workspaces]);

    React.useEffect(() => {
        const loadWorkspaces = async () => {
            await getWorkspaces().then((data) => {
                setWorkspaces(data);
            });
        };
        loadWorkspaces();
    }, [changeStatus]);

    const togglePinWorkspace = (
        workspace: IWorkspace,
        e?: React.MouseEvent
    ) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        updateWorkspace(workspace.id, {
            ...workspace,
            pinned: !workspace.pinned,
        });

        loadPinnedWorkspace();
    };

    return (
        <>
            <SidebarMenu className="mt-3">
                <SidebarGroup className="p-0">
                    <SidebarMenu className="gap-1">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuItem>
                                    <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground text-igrp bg-igrp/5">
                                        <FolderKanban className="h-4 w-4 flex-shrink-0" />
                                        <span>
                                            Workspaces
                                        </span>
                                        <ListFilter className="ml-auto h-3 w-3" />
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-[--radix-dropdown-menu-trigger-width] min-w-72 rounded-lg"
                                align="start"
                                side={'right'}
                                sideOffset={4}
                            >
                                <IGRPInputSearch
                                    name="inputseach"
                                    value={searchTerm}
                                    showSubmitButton={false}
                                    placeholder="Search workspaces"
                                    onChange={(value) =>
                                        setSearchTerm(value.target.value)
                                    }
                                />
                                {filteredWorkspaces.map((workspace, index) => (
                                    <DropdownMenuItem
                                        key={index}
                                        onSelect={() =>
                                            onWorkspaceChange(workspace)
                                        }
                                        className={cn(
                                            workspace.name ===
                                                selectedWorkspace.name
                                                ? 'text-igrp bg-igrp/5'
                                                : ''
                                        )}
                                    >
                                        {workspace.name}

                                        <DropdownMenuShortcut>
                                            ⌘{index + 1}
                                        </DropdownMenuShortcut>
                                    </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="gap-2 p-2"
                                    onClick={() => setShowWorkspaceDialog(true)}
                                >
                                    <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                                        <Plus className="size-4" />
                                    </div>
                                    <div className="font-medium text-muted-foreground">
                                        Add Workspace
                                    </div>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        {/* Pinned Workspaces */}
                        {pinnedWorkspaces.map((workspace) => (
                            <SidebarMenuItem
                                key={workspace.id}
                                className="ml-3 border-l-0"
                            >
                                <SidebarMenuButton
                                    asChild
                                    className={
                                        workspace.name ===
                                        selectedWorkspace.name
                                            ? 'bg-muted'
                                            : ''
                                    }
                                    onClick={() => onWorkspaceChange(workspace)}
                                >
                                    <div className="flex items-center justify-between pl-9 cursor-pointer">
                                        <div className="flex items-center gap-2">
                                            <span>{workspace.name}</span>
                                        </div>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() =>
                                                        togglePinWorkspace(
                                                            workspace
                                                        )
                                                    }
                                                >
                                                    <Pin
                                                        className={cn(
                                                            'h-3 w-3',
                                                            workspace.pinned &&
                                                                'text-igrp'
                                                        )}
                                                    />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                {workspace.pinned
                                                    ? 'Unpin workspace'
                                                    : 'Pin workspace'}
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarMenu>
            {showWorkspaceDialog && (
                <CreateWorkspace
                    open={showWorkspaceDialog}
                    onOpenChange={setShowWorkspaceDialog}
                />
            )}
        </>
    );
}
