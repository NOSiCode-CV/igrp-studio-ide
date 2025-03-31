'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, DiamondIcon, Plus } from 'lucide-react';

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

export function WorkspaceSwitcher({
    workspaces,
    defaultWorkspace,
}: {
    workspaces: IWorkspace[];
    defaultWorkspace: IWorkspace;
}) {
    const [showWorkspaceDialog, setShowWorkspaceDialog] = React.useState(false);

    const [selectedVersion, setSelectedVersion] =
        React.useState<IWorkspace>(defaultWorkspace);
    const [searchTerm, setSearchTerm] = React.useState<string>('');
    const [filteredWorkspaces, setFilteredWorkspaces] = React.useState<
        IWorkspace[]
    >([]);

    React.useEffect(() => {
        const result = workspaces.filter((workspace) =>
            workspace.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredWorkspaces(result);

        setSelectedVersion(defaultWorkspace)
    }, [searchTerm, defaultWorkspace]);

    const handleCreationSuccess = () => {};

    return (
        <>
            <SidebarMenu className="mt-2">
                <SidebarMenuItem>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuButton
                                size="lg"
                                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                            >
                                <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground">
                                    <DiamondIcon className="size-4" />
                                </div>
                                <div className="flex flex-col gap-0.5 leading-none">
                                    <span className="">
                                        {selectedVersion.name}
                                    </span>
                                </div>
                                <ChevronsUpDown className="ml-auto" />
                            </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                            align="start"
                        >
                            <IGRPInputSearch
                                name="inputseach"
                                value={searchTerm}
                                onChange={(value) => setSearchTerm(value)}
                            />
                            {filteredWorkspaces.map((workspace, index) => (
                                <DropdownMenuItem
                                    key={index}
                                    onSelect={() =>
                                        setSelectedVersion(workspace)
                                    }
                                >
                                    {workspace.name}

                                    {workspace.name === selectedVersion.name ? (
                                        <Check className="ml-auto" />
                                    ) : (
                                        <DropdownMenuShortcut>
                                            ⌘{index + 1}
                                        </DropdownMenuShortcut>
                                    )}
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
