'use client';

import { FolderKanban, ListFilter, Pin, Plus, FolderOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
    IGRPDropdownMenuPrimitive,
    IGRPDropdownMenuContentPrimitive,
    IGRPDropdownMenuItemPrimitive,
    IGRPDropdownMenuSeparatorPrimitive,
    IGRPDropdownMenuShortcutPrimitive,
    IGRPDropdownMenuTriggerPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import {
    IGRPSidebarGroupPrimitive,
    IGRPSidebarMenuPrimitive,
    IGRPSidebarMenuButtonPrimitive,
    IGRPSidebarMenuItemPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { IWorkspace } from 'src/main/types';
import { IGRPInputSearch } from '@igrp/igrp-framework-react-design-system';
import CreateWorkspace from '@renderer/pages/workspaces/components/create-workspace';
import { cn } from '@renderer/lib/utils';
import { useWorkspace } from '@renderer/hooks/use-workspace';
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
import {
    IGRPTooltipPrimitive,
    IGRPTooltipContentPrimitive,
    IGRPTooltipTriggerPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@renderer/routes/routeConstants';
import { useEffect, useState } from 'react';

export const WorkspaceSwitcher = ({
    defaultWorkspace,
    onWorkspaceChange,
}: {
    defaultWorkspace: IWorkspace;
    onWorkspaceChange: (workspace: IWorkspace) => void;
}) => {
    const navigate = useNavigate();
    const [pinnedWorkspaces, setPinnedWorkspaces] = useState<IWorkspace[]>([]);

    const { t } = useTranslation();

    const [showWorkspaceDialog, setShowWorkspaceDialog] = useState(false);

    const [selectedWorkspace, setSelectedWorkspace] =
        useState<IWorkspace>(defaultWorkspace);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filteredWorkspaces, setFilteredWorkspaces] = useState<IWorkspace[]>(
        []
    );

    const {
        workspaces,
        actions: { updateWorkspace, openWorkspace },
    } = useWorkspace();

    const loadPinnedWorkspace = () => {
        const pinned: IWorkspace[] = workspaces.filter(
            (workspace) =>
                workspace.pinned || workspace.name === selectedWorkspace.name
        );

        setPinnedWorkspaces(pinned);
    };

    const handleChangeWorkspace = (workspace: IWorkspace) => {
        onWorkspaceChange(workspace);
        navigate(ROUTES.HOME);
    };

    useEffect(() => {
        const result = workspaces.filter((workspace) =>
            workspace.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredWorkspaces(result);

        setSelectedWorkspace(defaultWorkspace);

        loadPinnedWorkspace();
    }, [searchTerm, defaultWorkspace, workspaces]);


    const togglePinWorkspace = (workspace: IWorkspace, e?: MouseEvent) => {
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

    const handleOpenWorkspace = async () => {
        try {
            // Use the Electron dialog to select a directory
            const result = await window.api.openDirectory(t('openWorkspace'));

            if (!result.canceled && result.basePath) {
                const newWorkspace = await openWorkspace(result.basePath);
                if (newWorkspace) {
                    // Switch to the newly opened workspace
                    onWorkspaceChange(newWorkspace);
                }
            }
        } catch (error) {
            console.error('Error opening workspace:', error);
        }
    };

    return (
        <>
            <IGRPSidebarMenuPrimitive className="mt-3">
                <IGRPSidebarGroupPrimitive className="p-0">
                    <IGRPSidebarMenuPrimitive className="gap-1">
                        <IGRPDropdownMenuPrimitive modal={false}>
                            <IGRPDropdownMenuTriggerPrimitive asChild>
                                <IGRPSidebarMenuItemPrimitive>
                                    <IGRPSidebarMenuButtonPrimitive className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground text-primary bg-primary/5">
                                        <FolderKanban className="h-4 w-4 flex-shrink-0" />
                                        <span>{t('workspaces')}</span>
                                        <ListFilter className="ml-auto h-3 w-3" />
                                    </IGRPSidebarMenuButtonPrimitive>
                                </IGRPSidebarMenuItemPrimitive>
                            </IGRPDropdownMenuTriggerPrimitive>
                            <IGRPDropdownMenuContentPrimitive
                                className="w-[--radix-dropdown-menu-trigger-width] min-w-72 rounded-lg"
                                align="start"
                                side={'right'}
                                sideOffset={4}
                            >
                                <IGRPInputSearch
                                    name="inputseach"
                                    value={searchTerm}
                                    showSubmitButton={false}
                                    placeholder={t('searchWorkspaces')}
                                    onChange={(value) =>
                                        setSearchTerm(value.target.value)
                                    }
                                />
                                {filteredWorkspaces.map((workspace, index) => (
                                    <IGRPDropdownMenuItemPrimitive
                                        key={index}
                                        onSelect={() =>
                                            handleChangeWorkspace(workspace)
                                        }
                                        className={cn(
                                            workspace.id ===
                                                selectedWorkspace.id &&
                                                'text-primary bg-primary/5'
                                        )}
                                    >
                                        {workspace.name}

                                        <IGRPDropdownMenuShortcutPrimitive>
                                            ⌘{index + 1}
                                        </IGRPDropdownMenuShortcutPrimitive>
                                    </IGRPDropdownMenuItemPrimitive>
                                ))}
                                <IGRPDropdownMenuSeparatorPrimitive />
                                <IGRPDropdownMenuItemPrimitive
                                    className="gap-2 p-2"
                                    onSelect={(e) => {
                                        e.preventDefault();
                                        handleOpenWorkspace();
                                    }}
                                >
                                    <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                                        <FolderOpen className="size-4" />
                                    </div>
                                    <div className="font-medium text-muted-foreground">
                                        {t('openWorkspace')}
                                    </div>
                                </IGRPDropdownMenuItemPrimitive>
                                <IGRPDropdownMenuItemPrimitive
                                    className="gap-2 p-2"
                                    onSelect={(e) => {
                                        e.preventDefault();
                                        setShowWorkspaceDialog(true);
                                    }}
                                >
                                    <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                                        <Plus className="size-4" />
                                    </div>
                                    <div className="font-medium text-muted-foreground">
                                        {t('addWorkspace')}
                                    </div>
                                </IGRPDropdownMenuItemPrimitive>
                            </IGRPDropdownMenuContentPrimitive>
                        </IGRPDropdownMenuPrimitive>
                        {/* Pinned Workspaces */}
                        {pinnedWorkspaces.map((workspace) => (
                            <IGRPSidebarMenuItemPrimitive
                                key={workspace.id}
                                className="ml-3 border-l-0"
                            >
                                <IGRPSidebarMenuButtonPrimitive
                                    asChild
                                    className={cn(
                                        workspace.id ===
                                            selectedWorkspace.id && 'bg-muted'
                                    )}
                                    onClick={() =>
                                        handleChangeWorkspace(workspace)
                                    }
                                >
                                    <div className="flex items-center justify-between pl-9 cursor-pointer">
                                        <div className="flex items-center gap-2">
                                            <span>{workspace.name}</span>
                                        </div>
                                        <IGRPTooltipPrimitive>
                                            <IGRPTooltipTriggerPrimitive
                                                asChild
                                            >
                                                <IGRPButtonPrimitive
                                                    size="icon"
                                                    variant="ghost"
                                                    className={cn(
                                                        'h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity'
                                                    )}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        togglePinWorkspace(
                                                            workspace
                                                        );
                                                    }}
                                                >
                                                    <Pin
                                                        className={cn(
                                                            'h-3 w-3',
                                                            workspace.pinned &&
                                                                'text-primary'
                                                        )}
                                                    />
                                                </IGRPButtonPrimitive>
                                            </IGRPTooltipTriggerPrimitive>
                                            <IGRPTooltipContentPrimitive>
                                                {workspace.pinned
                                                    ? t('unpinWorkspace')
                                                    : t('pinWorkspace')}
                                            </IGRPTooltipContentPrimitive>
                                        </IGRPTooltipPrimitive>
                                    </div>
                                </IGRPSidebarMenuButtonPrimitive>
                            </IGRPSidebarMenuItemPrimitive>
                        ))}
                    </IGRPSidebarMenuPrimitive>
                </IGRPSidebarGroupPrimitive>
            </IGRPSidebarMenuPrimitive>
            <CreateWorkspace
                open={showWorkspaceDialog}
                onOpenChange={setShowWorkspaceDialog}
            />
        </>
    );
};
