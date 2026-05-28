import { Button } from '@renderer/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@renderer/components/ui/dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@renderer/components/ui/dropdown-menu'
import { ToggleGroup, ToggleGroupItem } from '@renderer/components/ui/toggle-group'
import { CloneProjectModal } from '@renderer/components/git/clone-project-modal'
import { SearchInput } from '@renderer/components/shared-ui'
import { useDocker } from '@renderer/hooks/use-docker'
import { useWorkspace } from '@renderer/hooks/use-workspace'
import useToast from '@renderer/hooks/useToast'
import { cn } from '@renderer/lib/utils'
import { ProjectWizard } from '@renderer/browser/project/project-form'
import { getId } from '@renderer/utils'
import {
    ArrowDownWideNarrow,
    EllipsisVertical,
    FolderKanban,
    FolderOpen,
    GitFork,
    LayoutGrid,
    ListFilter,
    LoaderCircle,
    type LucideIcon,
    Plus,
    PlusCircle,
    StretchHorizontal
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { IOpenProject, ProjectData } from 'src/main/types'
import ProjectGrid from './projects/project-grid'
import { ProjectList } from './projects/project-list'

type ResourceType = 'project'
type ViewMode = 'grid' | 'list'

interface ResourceSectionProps {
    type: ResourceType
    icon: LucideIcon
    title: string
    count: number
    searchQuery: string
    viewMode: ViewMode
    onViewModeChange: (mode: ViewMode) => void
    onSearchChange: (value: string) => void
    sortValue: string
    onSortChange: (value: string) => void
    isEmpty: boolean
    emptyState: React.ReactNode
    children: React.ReactNode
    actionButtons: React.ReactNode
}

const ResourceSection = ({
    type,
    icon: Icon,
    title,
    count,
    searchQuery,
    viewMode,
    onViewModeChange,
    onSearchChange,
    sortValue,
    onSortChange,
    isEmpty,
    emptyState,
    children,
    actionButtons
}: ResourceSectionProps) => {
    const { t } = useTranslation()
    const countText = `${count} ${count === 1 ? type : `${type}s`}`
    const queryText = searchQuery ? ` matching "${searchQuery}"` : ''

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b pb-2">
                {/* LEFT: icon + title + count */}
                <div className="flex items-center gap-2 min-w-0">
                    {Icon && <Icon className="h-4 w-4 text-primary shrink-0" />}
                    <span className="text-sm font-bold tracking-tight text-foreground truncate">
                        {title}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                        · {countText}
                        {queryText}
                    </span>
                </div>

                {/* RIGHT: search, sort, view toggle, actions */}
                <div className="flex flex-wrap items-center justify-end gap-2 min-w-0 flex-1 text-xs text-muted-foreground">
                    <SearchInput
                        placeholder={`${t('search')} ${type}s...`}
                        value={searchQuery}
                        onChange={onSearchChange}
                        className="w-[224px] max-w-full"
                        inputClassName="rounded-[4px] focus-visible:ring-1"
                    />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={t('sortBy')}
                                title={t('sortBy')}
                            >
                                <ListFilter className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-[180px] p-1">
                            {(
                                [
                                    { value: 'name', label: t('name') },
                                    { value: 'lastModified', label: t('lastModified') },
                                    { value: 'framework', label: t('framework') }
                                ] as const
                            ).map((option) => {
                                const isActive = sortValue === option.value
                                return (
                                    <DropdownMenuItem
                                        key={option.value}
                                        onSelect={() => onSortChange(option.value)}
                                        className={cn(
                                            'flex cursor-pointer items-center justify-between gap-4 rounded-[4px] px-2 py-1.5 text-sm',
                                            isActive &&
                                                'bg-emerald-50 text-emerald-600 focus:bg-emerald-50 focus:text-emerald-600'
                                        )}
                                    >
                                        <span>{option.label}</span>
                                        {isActive && (
                                            <ArrowDownWideNarrow className="h-3.5 w-3.5 shrink-0" />
                                        )}
                                    </DropdownMenuItem>
                                )
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <ToggleGroup
                        type="single"
                        value={viewMode}
                        onValueChange={(value) => value && onViewModeChange(value as ViewMode)}
                        spacing={1}
                        className="flex shrink-0 items-center gap-0 rounded-[4px] border bg-muted p-0.5"
                    >
                        <ToggleGroupItem
                            value="grid"
                            size="sm"
                            aria-label="Grid view"
                            className="h-auto min-w-0 rounded-[4px] p-1 text-muted-foreground transition-all hover:bg-transparent hover:text-foreground data-[state=on]:bg-background data-[state=on]:text-emerald-600 data-[state=on]:shadow-sm"
                        >
                            <LayoutGrid className="h-3.5 w-3.5" />
                        </ToggleGroupItem>
                        <ToggleGroupItem
                            value="list"
                            size="sm"
                            aria-label="List view"
                            className="h-auto min-w-0 rounded-[4px] p-1 text-muted-foreground transition-all hover:bg-transparent hover:text-foreground data-[state=on]:bg-background data-[state=on]:text-emerald-600 data-[state=on]:shadow-sm"
                        >
                            <StretchHorizontal className="h-3.5 w-3.5" />
                        </ToggleGroupItem>
                    </ToggleGroup>
                    <div className="flex items-center gap-2">{actionButtons}</div>
                </div>
            </div>
            {isEmpty ? emptyState : children}
        </div>
    )
}

const Resources = () => {
    const [projectViewMode, setProjectViewMode] = useState<ViewMode>('grid')
    const [projectSearchQuery, setProjectSearchQuery] = useState('')
    const [sortOrder, setSortOrder] = useState<string>('lastModified')
    const [allProjects, setAllProjects] = useState<ProjectData[]>([])
    const [openProjectDialog, setOpenProjectDialog] = useState(false)
    const [pendingOpenProject, setPendingOpenProject] = useState<IOpenProject | null>(null)
    const [isOpeningProject, setIsOpeningProject] = useState(false)

    const { showErrorToast } = useToast()

    const { t } = useTranslation()

    const {
        workspace,
        actions: { findAllProjects, saveOrOpenProject, refreshWorkspaces },
        state: { changeStatus }
    } = useWorkspace()

    const { services, refreshContainers } = useDocker({
        workspace,
        changeStatus
    })

    useEffect(() => {
        fetchProjects()
        refreshWorkspaces()
        refreshContainers()
    }, [workspace, changeStatus])

    useEffect(() => {
        const handler = () => {
            fetchProjects()
            refreshWorkspaces()
            refreshContainers()
        }
        window.addEventListener('igrp:workspace:refresh', handler)
        return () => {
            window.removeEventListener('igrp:workspace:refresh', handler)
        }
    }, [workspace, changeStatus])

    const fetchProjects = async () => {
        await findAllProjects().then((data) => {
            setAllProjects(data)
        })
    }

    const normalizedQuery = (projectSearchQuery || '').toLowerCase()
    const filteredProjects = allProjects.filter((project) => {
        const projectName = (project?.name || '').toLowerCase()
        const projectFramework = (project?.framework || '').toLowerCase()
        return projectName.includes(normalizedQuery) || projectFramework.includes(normalizedQuery)
    })

    const onHandleOpenProjectClick = async (): Promise<void> => {
        const result: IOpenProject = await window.api.openDirectory()

        const { canceled, basePath, config, folderExists } = result

        if (canceled || !basePath || !config) {
            return
        }

        if (!folderExists || !config.framework) {
            showErrorToast(t('notFoundProject'))
            return
        }

        setPendingOpenProject(result)
        setOpenProjectDialog(true)
    }

    const closeOpenProjectDialog = (): void => {
        if (isOpeningProject) return
        setOpenProjectDialog(false)
        setPendingOpenProject(null)
    }

    const confirmOpenProject = async (storageMode: 'linked' | 'managed'): Promise<void> => {
        const config = pendingOpenProject?.config
        if (!config) {
            closeOpenProjectDialog()
            return
        }
        if (!workspace?.id) {
            showErrorToast('Nenhum workspace ativo selecionado.')
            closeOpenProjectDialog()
            return
        }

        setIsOpeningProject(true)
        try {
            await saveOrOpenProject({
                project: {
                    ...config,
                    id: config.id ?? getId(),
                    workspaceId: workspace.id,
                    storageMode
                }
            })

            closeOpenProjectDialog()
        } finally {
            setIsOpeningProject(false)
        }
    }

    const ProjectActions = () => {
        const [openCloneProject, setOpenCloneProject] = useState(false)
        return (
            <>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                            <EllipsisVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={onHandleOpenProjectClick}>
                            <FolderOpen className="w-4 h-4 mr-2" />
                            <span>{t('openProject')}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setOpenCloneProject(true)}>
                            <GitFork className="w-4 h-4 mr-2" />
                            {t('cloneProject')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <ProjectWizard>
                    <Button size="sm" className="h-8 gap-1.5 rounded-[4px]">
                        <Plus className="h-3.5 w-3.5" />
                        {t('newProject')}
                    </Button>
                </ProjectWizard>
                {openCloneProject && (
                    <CloneProjectModal
                        open={openCloneProject}
                        setOpen={setOpenCloneProject}
                        workspace={workspace}
                    />
                )}

                <Dialog
                    open={openProjectDialog}
                    onOpenChange={(open) => {
                        if (!open) {
                            closeOpenProjectDialog()
                            return
                        }
                        setOpenProjectDialog(true)
                    }}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t('openProjectOptionsTitle')}</DialogTitle>
                            <DialogDescription>
                                {t('openProjectOptionsDescription')}
                            </DialogDescription>
                        </DialogHeader>

                        <DialogFooter className="grid grid-cols-2 gap-2">
                            <Button
                                variant="outline"
                                onClick={() => confirmOpenProject('linked')}
                                disabled={isOpeningProject}
                            >
                                {isOpeningProject ? (
                                    <span className="inline-flex items-center gap-2">
                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                        {t('opening')}
                                    </span>
                                ) : (
                                    t('openProjectAsLinked')
                                )}
                            </Button>
                            <Button
                                onClick={() => confirmOpenProject('managed')}
                                disabled={isOpeningProject}
                            >
                                {isOpeningProject ? (
                                    <span className="inline-flex items-center gap-2">
                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                        {t('opening')}
                                    </span>
                                ) : (
                                    t('importProjectToWorkspace')
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </>
        )
    }

    const ProjectEmptyState = () => (
        <div className="shrink-0 border border-dashed rounded-md p-6 text-center">
            <FolderKanban className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <h3 className="text-sm font-medium">{t('noProjectsFound')}</h3>
            <p className="text-xs text-muted-foreground mb-3">
                {projectSearchQuery
                    ? `${t('noProjectsMatching')} "${projectSearchQuery}"`
                    : t('noProjectsYet')}
            </p>
            <ProjectWizard>
                <Button size="sm">
                    <PlusCircle className="h-3.5 w-3.5 mr-1" />
                    {t('createNewProject')}
                </Button>
            </ProjectWizard>
        </div>
    )

    return (
        <div className="space-y-6">
            {/* Projects Section */}
            <ResourceSection
                type="project"
                icon={FolderKanban}
                title={t('projects')}
                count={filteredProjects.length}
                searchQuery={projectSearchQuery}
                viewMode={projectViewMode}
                onViewModeChange={setProjectViewMode}
                onSearchChange={setProjectSearchQuery}
                sortValue={sortOrder}
                onSortChange={setSortOrder}
                isEmpty={filteredProjects.length === 0}
                emptyState={<ProjectEmptyState />}
                actionButtons={<ProjectActions />}
            >
                {projectViewMode === 'grid' ? (
                    <>
                        <ProjectGrid
                            projects={filteredProjects}
                            workspaceId={workspace.id}
                            projectOrder={sortOrder}
                            services={services}
                        />
                    </>
                ) : (
                    <ProjectList
                        projects={filteredProjects}
                        workspaceId={workspace.id}
                        services={services}
                    />
                )}
            </ResourceSection>
        </div>
    )
}

export default Resources
