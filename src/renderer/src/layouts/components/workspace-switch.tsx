'use client';

import * as React from 'react';
import { FolderKanban, ListFilter, Plus } from 'lucide-react';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from '@renderer/components/ui/dropdown-menu';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@renderer/components/ui/sidebar';
import { IWorkspace } from 'src/main/types';
import { IGRPInputSearch } from '@igrp/igrp-framework-react-design-system';
import CreateWorkspace from '@renderer/pages/home/components/create-workspace';
import { cn } from '@renderer/lib/utils';
import { useWorkspace } from '@renderer/hooks/use-workspace';

export function WorkspaceSwitcher({
    defaultWorkspace,
    onWorkspaceChange,
}: {
    defaultWorkspace: IWorkspace;
    onWorkspaceChange: (workspace: IWorkspace) => void;
}) {
    const [workspaces, setWorkspaces] = React.useState<IWorkspace[]>([]);
    const [showWorkspaceDialog, setShowWorkspaceDialog] = React.useState(false);

    const [selectedWorkspace, setSelectedWorkspace] =
        React.useState<IWorkspace>(defaultWorkspace);
    const [searchTerm, setSearchTerm] = React.useState<string>('');
    const [filteredWorkspaces, setFilteredWorkspaces] = React.useState<
        IWorkspace[]
    >([]);

    const {
        actions: { getWorkspaces },
    } = useWorkspace();

    React.useEffect(() => {
        const result = workspaces.filter((workspace) =>
            workspace.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredWorkspaces(result);

        setSelectedWorkspace(defaultWorkspace);
    }, [searchTerm, defaultWorkspace, workspaces]);

    React.useEffect(() => {
        const loadWorkspaces = async () => {
            await getWorkspaces().then((data) => {
                setWorkspaces(data);
            });
        };
        loadWorkspaces();
    }, []);

    const handleCreationSuccess = () => {};

    return (
        <>
            <SidebarMenu className="mt-3">
                <SidebarMenuItem>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground text-igrp bg-igrp/5">
                                <FolderKanban className="h-4 w-4 flex-shrink-0" />
                                <span className="">
                                    {selectedWorkspace.name}
                                </span>
                                <ListFilter className="ml-auto h-3 w-3" />
                            </SidebarMenuButton>
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
                </SidebarMenuItem>
            </SidebarMenu>
            {showWorkspaceDialog && (
                <CreateWorkspace
                    open={showWorkspaceDialog}
                    onSuccess={handleCreationSuccess}
                    onOpenChange={setShowWorkspaceDialog}
                />
            )}
        </>
    );
}
