'use client'

import { Button } from '@renderer/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger
} from '@renderer/components/ui/dropdown-menu'
import {
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem
} from '@renderer/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/components/ui/tooltip'
import { IGRPInputSearch } from '@igrp/igrp-framework-react-design-system'
import { SHORTCUTS } from '@renderer/constants/shortcut'
import { useWorkspace } from '@renderer/hooks/use-workspace'
import { cn } from '@renderer/lib/utils'
import CreateWorkspace from '@renderer/browser/workspaces/components/create-workspace'
import { ROUTES } from '@renderer/routes/routeConstants'
import { EllipsisVertical, FolderKanban, FolderOpen, Pin, Plus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import type { IWorkspace } from 'src/main/types'

// Helper function to get workspace index from number key
const getWorkspaceIndexFromKey = (key: string): number | null => {
    const keyNumber = parseInt(key)
    return keyNumber >= 1 && keyNumber <= 9 ? keyNumber - 1 : null
}

export const WorkspaceSwitcher = ({
    defaultWorkspace,
    onWorkspaceChange
}: {
    defaultWorkspace: IWorkspace
    onWorkspaceChange: (workspace: IWorkspace) => void
}): React.JSX.Element => {
    const navigate = useNavigate()
    const [pinnedWorkspaces, setPinnedWorkspaces] = useState<IWorkspace[]>([])

    const { t } = useTranslation()

    const [showWorkspaceDialog, setShowWorkspaceDialog] = useState(false)

    const [selectedWorkspace, setSelectedWorkspace] = useState<IWorkspace>(defaultWorkspace)
    const [searchTerm, setSearchTerm] = useState<string>('')
    const [filteredWorkspaces, setFilteredWorkspaces] = useState<IWorkspace[]>([])

    const {
        workspaces,
        actions: { updateWorkspace, openWorkspace }
    } = useWorkspace()

    const loadPinnedWorkspace = useCallback((): void => {
        const pinned: IWorkspace[] = workspaces.filter(
            (workspace) => workspace.pinned || workspace.name === selectedWorkspace.name
        )

        setPinnedWorkspaces(pinned)
    }, [workspaces, selectedWorkspace.name])

    const handleChangeWorkspace = useCallback(
        (workspace: IWorkspace): void => {
            onWorkspaceChange(workspace)
            navigate(ROUTES.IDE_INITIAL_SCREEN)
        },
        [onWorkspaceChange, navigate]
    )

    const handleOpenWorkspace = useCallback(async (): Promise<void> => {
        try {
            // Use the Electron dialog to select a directory
            const result = await window.api.openDirectory(t('openWorkspace'))

            if (!result.canceled && result.basePath) {
                const newWorkspace = await openWorkspace(result.basePath)
                if (newWorkspace) {
                    // Switch to the newly opened workspace
                    onWorkspaceChange(newWorkspace)
                }
            }
        } catch (error) {
            console.error('Error opening workspace:', error)
        }
    }, [openWorkspace, onWorkspaceChange, t])

    useEffect(() => {
        const result = workspaces.filter((workspace) =>
            workspace.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        setFilteredWorkspaces(result)

        setSelectedWorkspace(defaultWorkspace)

        loadPinnedWorkspace()
    }, [searchTerm, defaultWorkspace, workspaces, loadPinnedWorkspace])

    // Keyboard shortcuts handler
    useEffect(() => {
        const handleKeyboardShortcuts = (event: KeyboardEvent): void => {
            // Only handle shortcuts when Cmd/Ctrl is pressed
            if (!event.metaKey && !event.ctrlKey) return

            // Handle number keys 1-9 for workspace switching
            const workspaceIndex = getWorkspaceIndexFromKey(event.key)
            if (workspaceIndex !== null) {
                event.preventDefault()
                if (workspaceIndex < filteredWorkspaces.length) {
                    handleChangeWorkspace(filteredWorkspaces[workspaceIndex])
                }
                return
            }

            // Handle action shortcuts
            const key = event.key.toLowerCase()
            switch (key) {
                case 'o':
                    event.preventDefault()
                    handleOpenWorkspace()
                    break
                case 'n':
                    event.preventDefault()
                    setShowWorkspaceDialog(true)
                    break
            }
        }

        document.addEventListener('keydown', handleKeyboardShortcuts)
        return () => document.removeEventListener('keydown', handleKeyboardShortcuts)
    }, [filteredWorkspaces, handleChangeWorkspace, handleOpenWorkspace])

    const togglePinWorkspace = (workspace: IWorkspace, e?: MouseEvent): void => {
        if (e) {
            e.preventDefault()
            e.stopPropagation()
        }
        updateWorkspace(workspace.id, {
            ...workspace,
            pinned: !workspace.pinned
        })

        loadPinnedWorkspace()
    }

    return (
        <>
            <SidebarMenu className="mt-3">
                <SidebarGroup className="p-0">
                    <SidebarMenu className="gap-1">
                        <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuItem>
                                    <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground text-primary bg-primary/5">
                                        <FolderKanban className="h-4 w-4 flex-shrink-0" />
                                        <span>{t('workspaces')}</span>
                                        <EllipsisVertical className="ml-auto h-3 w-3" />
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
                                    placeholder={t('searchWorkspaces')}
                                    onChange={(value) => setSearchTerm(value.target.value)}
                                />
                                {filteredWorkspaces.map((workspace, index) => (
                                    <DropdownMenuItem
                                        key={workspace.id}
                                        onSelect={() => handleChangeWorkspace(workspace)}
                                        className={cn(
                                            workspace.id === selectedWorkspace.id &&
                                                'text-primary bg-primary/5'
                                        )}
                                    >
                                        {workspace.name}

                                        <DropdownMenuShortcut>
                                            {index < 9
                                                ? SHORTCUTS[
                                                      `SWITCH_WORKSPACE_${index + 1}` as keyof typeof SHORTCUTS
                                                  ]
                                                : ''}
                                        </DropdownMenuShortcut>
                                    </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="gap-2 p-2"
                                    onSelect={(e) => {
                                        e.preventDefault()
                                        handleOpenWorkspace()
                                    }}
                                >
                                    <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                                        <FolderOpen className="size-4" />
                                    </div>
                                    <div className="font-medium text-muted-foreground">
                                        {t('openWorkspace')}
                                    </div>
                                    <DropdownMenuShortcut>
                                        {SHORTCUTS.OPEN_WORKSPACE}
                                    </DropdownMenuShortcut>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="gap-2 p-2"
                                    onSelect={(e) => {
                                        e.preventDefault()
                                        setShowWorkspaceDialog(true)
                                    }}
                                >
                                    <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                                        <Plus className="size-4" />
                                    </div>
                                    <div className="font-medium text-muted-foreground">
                                        {t('addWorkspace')}
                                    </div>
                                    <DropdownMenuShortcut>
                                        {SHORTCUTS.NEW_WORKSPACE}
                                    </DropdownMenuShortcut>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        {/* Pinned Workspaces */}
                        {pinnedWorkspaces.map((workspace) => (
                            <SidebarMenuItem key={workspace.id} className="ml-3 border-l-0">
                                <SidebarMenuButton
                                    asChild
                                    className={cn(
                                        workspace.id === selectedWorkspace.id && 'bg-muted'
                                    )}
                                    onClick={() => handleChangeWorkspace(workspace)}
                                >
                                    <div className="flex items-center justify-between pl-9 cursor-pointer">
                                        <div className="flex items-center gap-2">
                                            <span>{workspace.name}</span>
                                        </div>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className={cn(
                                                        'h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity'
                                                    )}
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        e.stopPropagation()
                                                        togglePinWorkspace(workspace)
                                                    }}
                                                >
                                                    <Pin
                                                        className={cn(
                                                            'h-3 w-3',
                                                            workspace.pinned && 'text-primary'
                                                        )}
                                                    />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                {workspace.pinned
                                                    ? t('unpinWorkspace')
                                                    : t('pinWorkspace')}
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarMenu>
            <CreateWorkspace open={showWorkspaceDialog} onOpenChange={setShowWorkspaceDialog} />
        </>
    )
}
