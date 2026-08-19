import { Button } from '@renderer/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@renderer/components/ui/dropdown-menu'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@renderer/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@renderer/components/ui/toggle-group'
import { IGRPPageHeader } from '@igrp/igrp-framework-react-design-system'
import type { DeleteConfig } from '@igrp/igrp-studio-nextjs-engine/types'
import AlertDialogDelete from '@renderer/components/alert-dialog-delete'
import { EmptyList } from '@renderer/components/empty-list'
import { SearchInput, SubHeadline } from '@renderer/components/shared-ui'
import { VersionAlert } from '@renderer/components/version-alert'
import { nextjsEngineChangelog } from '@renderer/components/version-alert-resume'
import { ENV_TYPES } from '@renderer/constants/appConstants'
import { CreateComponentModal } from '@renderer/generators/ui/browser/components/create-component-modal'
import { CreatePageModal } from '@renderer/generators/ui/browser/components/create-page-modal'
import { DuplicatePageModal } from '@renderer/generators/ui/browser/components/duplicate-page-modal'
import { MovePageModal } from '@renderer/generators/ui/browser/components/move-page-modal'
import { SkillProjectAlert } from '@renderer/generators/ui/browser/skill-project-alert'
import {
    BROWSER_TAB_BADGE,
    BROWSER_TAB_TRIGGER
} from '@renderer/generators/ui/browser/browser-card-styles'
import { usePermissionCatalog } from '@renderer/generators/ui/permission-catalog/PermissionCatalogContext'
import useStudio from '@renderer/hooks/use-studio'
import ProjectSettings from '@renderer/browser/project'
import { getFileThree as onGetPages } from '@renderer/redux/thunks'
import { cn } from '@renderer/lib/utils'
import {
    getRouteGroup,
    listRouteGroups,
    pathBelongsToGroup,
    UNGROUPED_ROUTE_GROUP
} from '@renderer/generators/ui/components/settings/properties/route-parser'
import { FileCode, FolderKanban, Key, LayoutGrid, Plus, Settings, TableIcon, Workflow } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import type { FileTree } from 'src/main/types'
import { BPMNManager } from './processes/bpmn-manager'
import { PermissionManager } from './permissions/permission-manager'
import { PageCardView } from './page-card-view'
import { PageTable } from './page-table'

export interface PageDefinition {
    id: string
    type: 'page' | 'component'
    name: string
    description: string
    path: string
    pagePath: string
    status: string
    created: string
    createdAt?: number
    modifiedAt?: number
    pageName: string
    isPage: boolean
    content: { [key: string]: string }
}

export type PageSortOption = 'modified' | 'created' | 'name'

interface PageBuilderContentProps {
    onPageClick?: (pageFile: PageDefinition | FileTree) => void
}

const PageManager = ({ onPageClick }: PageBuilderContentProps): React.JSX.Element => {
    const { t } = useTranslation()
    const dispatch: any = useDispatch()

    const { basePath, files, config: project } = useStudio()
    const { catalog } = usePermissionCatalog()

    const [content, setContent] = useState<any>([])
    const [components, setComponents] = useState<any>([])

    const [showformPage, setFormPage] = useState<boolean>(false)
    const [showFormComponent, setFormComponent] = useState(false)
    const [showDuplicateModal, setShowDuplicateModal] = useState<boolean>(false)
    const [showMoveModal, setShowMoveModal] = useState<boolean>(false)
    const [pageToMove, setPageToMove] = useState<PageDefinition | undefined>(undefined)
    const [scopedComponentTarget, setScopedComponentTarget] = useState<PageDefinition | undefined>(
        undefined
    )
    const [deleteModal, setDeleteModal] = useState<boolean>(false)
    const [loadingTable, isLoadingTable] = useState<boolean>(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [groupFilter, setGroupFilter] = useState<string>('all')
    const [viewMode, setViewMode] = useState<'card' | 'table'>('card')
    const [sortBy, setSortBy] = useState<PageSortOption>('modified')

    const [pageToDuplicate, setPageToDuplicate] = useState<PageDefinition>()
    const [activeTab, setActiveTab] = useState<string>('pages')
    const [bpmnProcesses, setBpmnProcesses] = useState<FileTree[]>([])
    const [currentComponent, setCurrentComponent] = useState<PageDefinition>()
    const [isSubPage, setIsSubPage] = useState<boolean>(false)

    const handleAddComponents = (page: PageDefinition | FileTree): void => {
        onPageClick?.(page)
    }

    const handleDeletePage = (page: PageDefinition): void => {
        setDeleteModal(true)
        setCurrentComponent(page)
    }

    const handleDuplicate = (page: PageDefinition): void => {
        setPageToDuplicate(page)
        setShowDuplicateModal(true)
    }

    const handleMove = (page: PageDefinition): void => {
        setPageToMove(page)
        setShowMoveModal(true)
    }

    const handleCreateScopedComponent = (page: PageDefinition): void => {
        setScopedComponentTarget(page)
        setCurrentComponent(undefined)
        setFormComponent(true)
    }

    const confirmDeletion = async (): Promise<void> => {
        if (!currentComponent) {
            return
        }
        const pageConfig: DeleteConfig = {
            type: currentComponent.type,
            name: currentComponent.pageName,
            id: currentComponent.id
        }
        await window.engine.delete(pageConfig, ENV_TYPES.NEXTJS, basePath)
        setDeleteModal(false)
        isLoadingTable(true)
        setCurrentComponent(undefined)
    }

    const openDialogNewPage = (page?: PageDefinition, isSubPage?: boolean): void => {
        setFormPage(true)
        setCurrentComponent(page)
        setIsSubPage(isSubPage || false)
    }

    const handleNewPage = (createdPage?: PageDefinition): void => {
        setFormPage(false)
        setFormComponent(false)
        setShowDuplicateModal(false)
        setPageToDuplicate(undefined)
        setScopedComponentTarget(undefined)
        isLoadingTable(true)

        // If we were creating a sub-page, open the newly created sub-page
        if (isSubPage && createdPage) {
            // Open the newly created sub-page
            onPageClick?.(createdPage)
            // Keep the current component context for potential future sub-page creation
        } else {
            // For regular page creation, reset the context
            setCurrentComponent(undefined)
        }

        setIsSubPage(false)
    }

    useEffect(() => {
        if (loadingTable) {
            dispatch(onGetPages(basePath))
            isLoadingTable(false)
        }
    }, [loadingTable, basePath])

    useEffect(() => {
        setContent([])
        setComponents([])
        if (files) {
            const pages = files.find((page) => page.name === 'pages')
            const components = files.find((page) => page.name === 'components')
            const process = files.find((page) => page.name === 'process')

            if (pages && pages.children) {
                setContent(pages.children)
            }

            if (components && components.children) {
                setComponents(components.children)
            }

            if (process && process.children) setBpmnProcesses(process.children)
        }
    }, [files])

    const normalizedSearch = searchTerm.trim().toLowerCase()
    const hasSearch = normalizedSearch.length > 0

    const matchesSearch = (item: FileTree): boolean => {
        if (!hasSearch) return true

        const content = item.content || {}
        const candidates = [
            item.name,
            content.name,
            content.pageName,
            content.description,
            content.path,
            content.parentName,
            content.type,
            getRouteGroup(content.path)
        ]

        return candidates.some(
            (value) => typeof value === 'string' && value.toLowerCase().includes(normalizedSearch)
        )
    }

    const matchesGroupFilter = (item: FileTree): boolean =>
        pathBelongsToGroup(item.content?.path, groupFilter)

    const toPageDefinition = (item: FileTree, isPage: boolean): PageDefinition => ({
        ...item?.content,
        ...item,
        pageName: isPage ? item?.content?.pageName : item?.content?.name,
        pagePath: item?.content?.path,
        isPage
    })

    const availableGroups = useMemo(
        () =>
            listRouteGroups([
                ...content.map((page: FileTree) => page.content?.path as string | undefined),
                ...components.map((comp: FileTree) => comp.content?.path as string | undefined)
            ]),
        [content, components]
    )

    const hasUngrouped = useMemo(() => {
        const pages = content.filter((page: FileTree) => page.content?.parentName === undefined)
        const appComponents = components.filter((comp: FileTree) => comp.content?.scope === 'app')
        return [...pages, ...appComponents].some(
            (item: FileTree) => !getRouteGroup(item.content?.path)
        )
    }, [content, components])

    // Drop stale filter when the selected group disappears from the project.
    useEffect(() => {
        if (groupFilter === 'all' || groupFilter === UNGROUPED_ROUTE_GROUP) return
        if (!availableGroups.includes(groupFilter)) {
            setGroupFilter('all')
        }
    }, [availableGroups, groupFilter])

    const getPageComponent = (pageName: string): PageDefinition[] => {
        const pageComps = components.filter(
            (comp: FileTree) => comp.content?.pageName === pageName
        )
        const pageMatches = content.some(
            (page: FileTree) => page.content?.pageName === pageName && matchesSearch(page)
        )

        return pageComps
            .filter((comp: FileTree) => !hasSearch || pageMatches || matchesSearch(comp))
            .map((comp: FileTree) => toPageDefinition(comp, false))
    }

    const getSubPages = (pageName: string): PageDefinition[] => {
        const subs = content.filter((page: FileTree) => page.content?.parentName === pageName)
        const pageMatches = content.some(
            (page: FileTree) => page.content?.pageName === pageName && matchesSearch(page)
        )

        return subs
            .filter((page: FileTree) => !hasSearch || pageMatches || matchesSearch(page))
            .map((page: FileTree) => toPageDefinition(page, true))
    }

    const pageHasMatchingChildren = (pageName: string): boolean => {
        if (!hasSearch) return true

        const hasMatchingSubpage = content.some(
            (page: FileTree) =>
                page.content?.parentName === pageName && matchesSearch(page)
        )
        const hasMatchingComponent = components.some(
            (comp: FileTree) =>
                comp.content?.pageName === pageName && matchesSearch(comp)
        )

        return hasMatchingSubpage || hasMatchingComponent
    }

    const handleEdit = (page: PageDefinition): void => {
        if (page.type === 'page') {
            setFormPage(!showformPage)
        } else {
            setFormComponent(!showFormComponent)
        }
        setCurrentComponent(page)
    }

    const tableData: PageDefinition[] = [
        ...content
            .filter((page: FileTree) => page.content?.parentName === undefined)
            .filter((page: FileTree) => matchesGroupFilter(page))
            .filter(
                (page: FileTree) =>
                    !hasSearch ||
                    matchesSearch(page) ||
                    pageHasMatchingChildren(page.content?.pageName)
            )
            .map((page: FileTree) => ({
                ...toPageDefinition(page, true),
                children: getPageComponent(page.content.pageName)
            })),
        ...components
            .filter((comp: FileTree) => comp.content?.scope === 'app')
            .filter((comp: FileTree) => matchesGroupFilter(comp))
            .filter((comp: FileTree) => matchesSearch(comp))
            .map((comp: FileTree) => toPageDefinition(comp, false))
    ]

    const getLatestActivity = (pageName: string, fallback?: number): number => {
        const childTimestamps = [
            ...content
                .filter((page: FileTree) => page.content?.parentName === pageName)
                .map((page: FileTree) => page.modifiedAt ?? page.createdAt ?? 0),
            ...components
                .filter((comp: FileTree) => comp.content?.pageName === pageName)
                .map((comp: FileTree) => comp.modifiedAt ?? comp.createdAt ?? 0)
        ]

        return Math.max(fallback ?? 0, ...childTimestamps, 0)
    }

    const getSortTimestamp = (item: PageDefinition, key: 'modifiedAt' | 'createdAt'): number => {
        if (!item.isPage) {
            return item[key] ?? 0
        }

        if (key === 'createdAt') {
            return item.createdAt ?? 0
        }

        return getLatestActivity(item.pageName, item.modifiedAt)
    }

    const sortedTableData = [...tableData].sort((a, b) => {
        if (sortBy === 'name') {
            return (a.description || a.pageName || '').localeCompare(
                b.description || b.pageName || ''
            )
        }
        const key = sortBy === 'modified' ? 'modifiedAt' : 'createdAt'
        return getSortTimestamp(b, key) - getSortTimestamp(a, key)
    })

    const pageOptions = content
        .filter((page: FileTree) => page.content?.parentName === undefined)
        .map((page: FileTree) => ({
            label: page.content?.description || page.content?.pageName || page.name,
            value: page.content?.pageName || page.name,
            path: page.content?.path
        }))

    const topLevelPageCount = content.filter(
        (page: FileTree) => page.content?.parentName === undefined
    ).length
    const subPageCount = content.filter(
        (page: FileTree) => page.content?.parentName !== undefined
    ).length
    const componentCount = components.length

    const visiblePageCount = sortedTableData.filter((p) => p.isPage).length
    const visibleComponentCount =
        sortedTableData.filter((p) => !p.isPage).length +
        sortedTableData.reduce((total, page) => total + getPageComponent(page.pageName).length, 0)
    const visibleSubPageCount = sortedTableData.reduce(
        (total, page) => total + (page.isPage ? getSubPages(page.pageName).length : 0),
        0
    )

    const tableCountText =
        hasSearch || groupFilter !== 'all'
            ? `${visiblePageCount} ${visiblePageCount === 1 ? 'page' : 'pages'} • ${visibleSubPageCount} ${
                  visibleSubPageCount === 1 ? 'subpage' : 'subpages'
              } • ${visibleComponentCount} ${
                  visibleComponentCount === 1 ? 'component' : 'components'
              }`
            : `${topLevelPageCount} ${topLevelPageCount === 1 ? 'page' : 'pages'} • ${subPageCount} ${
                  subPageCount === 1 ? 'subpage' : 'subpages'
              } • ${componentCount} ${componentCount === 1 ? 'component' : 'components'}`

    const tableQueryText = [
        searchTerm ? `matching "${searchTerm}"` : null,
        groupFilter === UNGROUPED_ROUTE_GROUP
            ? 'in ungrouped'
            : groupFilter !== 'all'
              ? `in (${groupFilter})`
              : null
    ]
        .filter(Boolean)
        .map((part, index) => (index === 0 ? ` ${part}` : ` · ${part}`))
        .join('')

    const preferredCreateGroup =
        groupFilter !== 'all' && groupFilter !== UNGROUPED_ROUTE_GROUP ? groupFilter : null

    return (
        <div className="px-8 py-4 space-y-6">
            <IGRPPageHeader
                variant="h3"
                title={project?.name}
                description={project.config?.description}
                className='flex-row'
            />

            <VersionAlert
                projectVersion={project?.config?.version}
                className="mb-4"
                changelogContent={nextjsEngineChangelog}
            />

            <SkillProjectAlert basePath={basePath} className="mb-4" />

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="border-b border-border pb-3">
                    <TabsList className="h-auto gap-1 bg-transparent p-0">
                        <TabsTrigger value="pages" className={cn('group', BROWSER_TAB_TRIGGER)}>
                            <FileCode className="mr-2 h-4 w-4" />
                            {t('pages')}
                            <span className={BROWSER_TAB_BADGE}>{topLevelPageCount}</span>
                        </TabsTrigger>
                        <TabsTrigger value="bpmn" className={cn('group', BROWSER_TAB_TRIGGER)}>
                            <Workflow className="mr-2 h-4 w-4" />
                            BPMN
                            <span className={BROWSER_TAB_BADGE}>{bpmnProcesses.length}</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="permissions"
                            className={cn('group', BROWSER_TAB_TRIGGER)}
                        >
                            <Key className="mr-2 h-4 w-4" />
                            {t('permissionsManager', 'Permissions')}
                            <span className={BROWSER_TAB_BADGE}>{catalog.length}</span>
                        </TabsTrigger>
                        <TabsTrigger value="settings" className={cn('group', BROWSER_TAB_TRIGGER)}>
                            <Settings className="mr-2 h-4 w-4" />
                            {t('settings')}
                        </TabsTrigger>
                    </TabsList>
                </div>
                <TabsContent value="pages" className="space-y-4 pt-3 group">
                    <>
                        <div className="flex justify-between">
                            <SubHeadline
                                title={t('pageLists')}
                                description={
                                    <>
                                        {tableCountText}
                                        {tableQueryText}
                                    </>
                                }
                            />
                            <div className="flex justify-end gap-3">
                                {(availableGroups.length > 0 || hasUngrouped) && (
                                    <Select
                                        value={groupFilter}
                                        onValueChange={(value) => value && setGroupFilter(value)}
                                    >
                                        <SelectTrigger className="w-[200px]" size="sm">
                                            <FolderKanban className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                                            <SelectValue
                                                placeholder={t('filterByGroup')}
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                {t('allGroups')}
                                            </SelectItem>
                                            {availableGroups.map((group) => (
                                                <SelectItem key={group} value={group}>
                                                    ({group})
                                                </SelectItem>
                                            ))}
                                            {hasUngrouped && (
                                                <SelectItem value={UNGROUPED_ROUTE_GROUP}>
                                                    {t('ungrouped')}
                                                </SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                )}
                                <SearchInput
                                    placeholder={t('seachPages')}
                                    value={searchTerm}
                                    onChange={(value) => setSearchTerm(value)}
                                    className="lg:w-[250px]"
                                />
                                <Select
                                    value={sortBy}
                                    onValueChange={(value) =>
                                        value && setSortBy(value as PageSortOption)
                                    }
                                >
                                    <SelectTrigger className="w-[180px]" size="sm">
                                        <SelectValue placeholder={t('sortBy')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="modified">
                                            {t('sortLastModified')}
                                        </SelectItem>
                                        <SelectItem value="created">
                                            {t('sortCreatedDate')}
                                        </SelectItem>
                                        <SelectItem value="name">{t('sortName')}</SelectItem>
                                    </SelectContent>
                                </Select>
                                <ToggleGroup
                                    type="single"
                                    value={viewMode}
                                    onValueChange={(value) =>
                                        value && setViewMode(value as 'table' | 'card')
                                    }
                                >
                                    <ToggleGroupItem
                                        value="card"
                                        aria-label="Card view"
                                        className="h-8 w-8"
                                    >
                                        <LayoutGrid className="h-3.5 w-3.5" />
                                    </ToggleGroupItem>
                                    <ToggleGroupItem
                                        value="table"
                                        aria-label="Table view"
                                        className="h-8 w-8"
                                    >
                                        <TableIcon className="h-3.5 w-3.5" />
                                    </ToggleGroupItem>
                                </ToggleGroup>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button size="sm" variant="default">
                                            <Plus className="h-4 w-4" />
                                            {t('add')}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem
                                            onSelect={() => {
                                                openDialogNewPage(undefined, false)
                                            }}
                                        >
                                            {t('createNewPage')}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onSelect={() => {
                                                setFormComponent(true)
                                                setCurrentComponent(undefined)
                                            }}
                                        >
                                            {t('createNewComponent')}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        {viewMode === 'card' ? (
                            sortedTableData.length > 0 ? (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 items-stretch">
                                    {sortedTableData.map((page): React.JSX.Element => {
                                        const components = getPageComponent(page.pageName)
                                        const subPages = getSubPages(page.pageName)
                                        return (
                                            <PageCardView
                                                key={page.name}
                                                page={page}
                                                onDelete={(page) => handleDeletePage(page)}
                                                onAddComponents={handleAddComponents}
                                                onEdit={handleEdit}
                                                onDuplicate={handleDuplicate}
                                                onMove={handleMove}
                                                onCreateScopedComponent={
                                                    handleCreateScopedComponent
                                                }
                                                components={components}
                                                subPages={subPages}
                                                openDialogNewPage={openDialogNewPage}
                                                setIsSubPage={setIsSubPage}
                                                defaultOpen={
                                                    hasSearch &&
                                                    (components.length > 0 || subPages.length > 0)
                                                }
                                            />
                                        )
                                    })}
                                </div>
                            ) : (
                                <EmptyList
                                    title={
                                        groupFilter !== 'all' || hasSearch
                                            ? t('noPagesInContext', 'No pages in this context')
                                            : 'No pages or components created yet'
                                    }
                                    description={
                                        groupFilter !== 'all' || hasSearch
                                            ? t(
                                                  'noPagesInContextDescription',
                                                  'Try another group or clear the filter to see all pages.'
                                              )
                                            : 'Get started by creating your first page or component. Once created, you can use the Page Builder to design and customize it.'
                                    }
                                />
                            )
                        ) : (
                            <PageTable
                                tableData={sortedTableData}
                                components={components}
                                getPageComponent={getPageComponent}
                                getSubPages={getSubPages}
                                handleDeletePage={handleDeletePage}
                                handleAddComponents={handleAddComponents}
                                openDialogNewPage={openDialogNewPage}
                                handleDuplicate={handleDuplicate}
                                handleMove={handleMove}
                                handleCreateScopedComponent={handleCreateScopedComponent}
                                setIsSubPage={setIsSubPage}
                                expandMatching={hasSearch}
                                searchTerm={normalizedSearch}
                            />
                        )}
                    </>
                </TabsContent>
                <TabsContent value="bpmn" className="space-y-4 pt-3">
                    <BPMNManager
                        onPageClick={handleAddComponents}
                        bpmnProcesses={bpmnProcesses}
                        basePath={basePath}
                    />
                </TabsContent>
                <TabsContent value="permissions" className="space-y-4 pt-3">
                    <PermissionManager />
                </TabsContent>
                <TabsContent value="settings" className="space-y-4">
                    <ProjectSettings
                        hasTitle={false}
                        project={project}
                        className="max-w-screen px-0"
                    />
                </TabsContent>
            </Tabs>
            <CreatePageModal
                basePath={basePath}
                isOpen={showformPage}
                onClose={() => setFormPage(false)}
                onConfirm={handleNewPage}
                isSubPage={isSubPage}
                currentComponent={currentComponent}
                availableGroups={availableGroups}
                preferredGroup={preferredCreateGroup}
            />

            <CreateComponentModal
                basePath={basePath}
                isOpen={showFormComponent}
                onClose={() => {
                    setFormComponent(false)
                    setScopedComponentTarget(undefined)
                }}
                onConfirm={handleNewPage}
                pageOptions={pageOptions}
                currentComponent={currentComponent}
                lockedPage={
                    scopedComponentTarget
                        ? {
                              pageName: scopedComponentTarget.pageName,
                              path:
                                  (scopedComponentTarget.content?.path as string | undefined) ??
                                  scopedComponentTarget.pagePath ??
                                  '',
                              description: scopedComponentTarget.description
                          }
                        : undefined
                }
            />

            <DuplicatePageModal
                basePath={basePath}
                isOpen={showDuplicateModal}
                onClose={() => setShowDuplicateModal(false)}
                onConfirm={handleNewPage}
                pageToDuplicate={pageToDuplicate}
            />

            <MovePageModal
                isOpen={showMoveModal}
                onClose={() => {
                    setShowMoveModal(false)
                    setPageToMove(undefined)
                }}
                onConfirm={() => {
                    isLoadingTable(true)
                }}
                page={pageToMove}
                allPages={content
                    .filter((page: FileTree) => page.content?.parentName === undefined)
                    .map((page: FileTree) => toPageDefinition(page, true))}
            />

            <AlertDialogDelete
                isOpen={deleteModal}
                onClose={() => setDeleteModal(false)}
                onConfirm={confirmDeletion}
                hasTrigger={false}
                recordId={currentComponent?.pageName}
            />
        </div>
    )
}

export default PageManager
