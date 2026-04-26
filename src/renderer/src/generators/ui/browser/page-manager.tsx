import {
    IGRPButtonPrimitive,
    IGRPDropdownMenuContentPrimitive,
    IGRPDropdownMenuItemPrimitive,
    IGRPDropdownMenuPrimitive,
    IGRPDropdownMenuTriggerPrimitive,
    IGRPPageHeader,
    IGRPTabsContentPrimitive,
    IGRPTabsListPrimitive,
    IGRPTabsPrimitive,
    IGRPTabsTriggerPrimitive,
    IGRPToggleGroupItemPrimitive,
    IGRPToggleGroupPrimitive
} from '@igrp/igrp-framework-react-design-system'
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
import useStudio from '@renderer/hooks/use-studio'
import ProjectSettings from '@renderer/pages/project/project-settings'
import { getFileThree as onGetPages } from '@renderer/redux/thunks'
import { FileCode, LayoutGrid, Plus, Settings, TableIcon, Workflow } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import type { FileTree } from 'src/main/types'
import { BPMNManager } from './processes/bpmn-manager'
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
    pageName: string
    isPage: boolean
    content: { [key: string]: string }
}

interface PageBuilderContentProps {
    onPageClick?: (pageFile: PageDefinition | FileTree) => void
}

const PageManager = ({ onPageClick }: PageBuilderContentProps): React.JSX.Element => {
    const { t } = useTranslation()
    const dispatch: any = useDispatch()

    const { basePath, files, config: project } = useStudio()

    const [content, setContent] = useState<any>([])
    const [components, setComponents] = useState<any>([])

    const [showformPage, setFormPage] = useState<boolean>(false)
    const [showFormComponent, setFormComponent] = useState(false)
    const [showDuplicateModal, setShowDuplicateModal] = useState<boolean>(false)
    const [deleteModal, setDeleteModal] = useState<boolean>(false)
    const [loadingTable, isLoadingTable] = useState<boolean>(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [viewMode, setViewMode] = useState<'card' | 'table'>('card')

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

    const filteredPages = content.filter((page: FileTree) =>
        page.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const filteredComponents = components.filter((comp: FileTree) =>
        comp.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getPageComponent = (pageName: string): PageDefinition[] => {
        return filteredComponents
            .filter((comp: FileTree) => comp.content.pageName === pageName)
            .map((comp: FileTree) => ({
                ...comp?.content,
                ...comp,
                pageName: comp?.content?.name,
                pagePath: comp?.content?.path,
                isPage: false
            }))
    }

    const getSubPages = (pageName: string): PageDefinition[] => {
        return filteredPages
            .filter((page: FileTree) => page.content.parentName === pageName)
            .map((page: FileTree) => ({
                ...page?.content,
                ...page,
                pageName: page?.content?.pageName,
                pagePath: page?.content?.path,
                isPage: true
            }))
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
        ...filteredPages
            .filter((page: FileTree) => page.content.parentName === undefined)
            .map((page: FileTree) => ({
                ...page?.content,
                ...page,
                pagePath: page.content?.path,
                isPage: true,
                children: getPageComponent(page.content.pageName)
            })),
        ...filteredComponents
            .filter((comp: FileTree) => comp.content.scope === 'app')
            .map((comp: FileTree) => ({
                ...comp?.content,
                ...comp,
                pageName: comp?.content?.name,
                pagePath: comp?.content?.path,
                isPage: false
            }))
    ]

    const pageOptions = tableData
        .filter((p) => p.isPage)
        .map(({ description, pageName, content }) => ({
            label: description || pageName,
            value: pageName,
            path: content?.path
        }))

    const tableCountText = `${filteredPages.length} ${
        filteredPages.length === 1 ? 'page' : 'pages'
    } • ${filteredComponents.length} ${filteredComponents.length === 1 ? 'component' : 'components'}`

    const tableQueryText = searchTerm ? ` matching "${searchTerm}"` : ''

    return (
        <div className="px-8 py-4 space-y-6">
            <IGRPPageHeader
                variant="h3"
                title={project?.name}
                description={project.config?.description}
            />

            <VersionAlert
                projectVersion={project?.config?.version}
                className="mb-4"
                changelogContent={nextjsEngineChangelog}
            />

            <IGRPTabsPrimitive value={activeTab} onValueChange={setActiveTab}>
                <IGRPTabsListPrimitive>
                    <IGRPTabsTriggerPrimitive value="pages">
                        <FileCode className="h-4 w-4 mr-2" />
                        {t('pages')}
                    </IGRPTabsTriggerPrimitive>
                    <IGRPTabsTriggerPrimitive value="bpmn">
                        <Workflow className="h-4 w-4 mr-2" />
                        BPMN
                    </IGRPTabsTriggerPrimitive>
                    <IGRPTabsTriggerPrimitive value="settings">
                        <Settings className="h-4 w-4 mr-2" />
                        {t('settings')}
                    </IGRPTabsTriggerPrimitive>
                </IGRPTabsListPrimitive>
                <IGRPTabsContentPrimitive value="pages" className="space-y-4 pt-3 group">
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
                                <SearchInput
                                    placeholder={t('seachPages')}
                                    value={searchTerm}
                                    onChange={(value) => setSearchTerm(value)}
                                    className="lg:w-[250px]"
                                />
                                <IGRPToggleGroupPrimitive
                                    type="single"
                                    value={viewMode}
                                    onValueChange={(value) =>
                                        value && setViewMode(value as 'table' | 'card')
                                    }
                                >
                                    <IGRPToggleGroupItemPrimitive
                                        value="card"
                                        aria-label="Card view"
                                        className="h-8 w-8"
                                    >
                                        <LayoutGrid className="h-3.5 w-3.5" />
                                    </IGRPToggleGroupItemPrimitive>
                                    <IGRPToggleGroupItemPrimitive
                                        value="table"
                                        aria-label="Table view"
                                        className="h-8 w-8"
                                    >
                                        <TableIcon className="h-3.5 w-3.5" />
                                    </IGRPToggleGroupItemPrimitive>
                                </IGRPToggleGroupPrimitive>
                                <IGRPDropdownMenuPrimitive>
                                    <IGRPDropdownMenuTriggerPrimitive asChild>
                                        <IGRPButtonPrimitive size="sm" variant="default">
                                            <Plus className="h-4 w-4" />
                                            {t('add')}
                                        </IGRPButtonPrimitive>
                                    </IGRPDropdownMenuTriggerPrimitive>
                                    <IGRPDropdownMenuContentPrimitive>
                                        <IGRPDropdownMenuItemPrimitive
                                            onSelect={() => {
                                                openDialogNewPage(undefined, false)
                                            }}
                                        >
                                            {t('createNewPage')}
                                        </IGRPDropdownMenuItemPrimitive>
                                        <IGRPDropdownMenuItemPrimitive
                                            onSelect={() => {
                                                setFormComponent(true)
                                                setCurrentComponent(undefined)
                                            }}
                                        >
                                            {t('createNewComponent')}
                                        </IGRPDropdownMenuItemPrimitive>
                                    </IGRPDropdownMenuContentPrimitive>
                                </IGRPDropdownMenuPrimitive>
                            </div>
                        </div>

                        {viewMode === 'card' ? (
                            tableData.length > 0 ? (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 items-start">
                                    {tableData.map((page): React.JSX.Element => {
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
                                                components={components}
                                                subPages={subPages}
                                                openDialogNewPage={openDialogNewPage}
                                                setIsSubPage={setIsSubPage}
                                            />
                                        )
                                    })}
                                </div>
                            ) : (
                                <EmptyList
                                    title="No pages or components created yet"
                                    description="Get started by creating your first page or component. Once created, you can use the Page Builder to design and customize it."
                                />
                            )
                        ) : (
                            <PageTable
                                tableData={tableData}
                                components={components}
                                getPageComponent={getPageComponent}
                                getSubPages={getSubPages}
                                handleDeletePage={handleDeletePage}
                                handleAddComponents={handleAddComponents}
                                openDialogNewPage={openDialogNewPage}
                                handleDuplicate={handleDuplicate}
                                setIsSubPage={setIsSubPage}
                            />
                        )}
                    </>
                </IGRPTabsContentPrimitive>
                <IGRPTabsContentPrimitive value="bpmn" className="space-y-4 pt-3">
                    <BPMNManager
                        onPageClick={handleAddComponents}
                        bpmnProcesses={bpmnProcesses}
                        basePath={basePath}
                    />
                </IGRPTabsContentPrimitive>
                <IGRPTabsContentPrimitive value="settings" className="space-y-4">
                    <ProjectSettings
                        hasTitle={false}
                        project={project}
                        className="max-w-screen px-0"
                    />
                </IGRPTabsContentPrimitive>
            </IGRPTabsPrimitive>
            <CreatePageModal
                basePath={basePath}
                isOpen={showformPage}
                onClose={() => setFormPage(false)}
                onConfirm={handleNewPage}
                isSubPage={isSubPage}
                currentComponent={currentComponent}
            />

            <CreateComponentModal
                basePath={basePath}
                isOpen={showFormComponent}
                onClose={() => setFormComponent(false)}
                onConfirm={handleNewPage}
                pageOptions={pageOptions}
                currentComponent={currentComponent}
            />

            <DuplicatePageModal
                basePath={basePath}
                isOpen={showDuplicateModal}
                onClose={() => setShowDuplicateModal(false)}
                onConfirm={handleNewPage}
                pageToDuplicate={pageToDuplicate}
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
