import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import { getFileThree as onGetPages } from '@renderer/redux/thunks';
import { useTranslation } from 'react-i18next';
import { Button } from '@renderer/components/ui/button';
import { LayoutGrid, Plus, TableIcon } from 'lucide-react';
import { PageCardView } from './page-card-view';
import { CreatePageModal } from './create-page-modal';
import { DuplicatePageModal } from './duplicate-page-modal';
import { PageTable } from './page-table';
import AlertDialogDelete from '@renderer/components/alert-dialog-delete';
import { DeleteConfig } from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';
import { FileTree } from 'src/main/types';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@renderer/components/ui/dropdown-menu';
import { CreateComponentModal } from './create-component-modal';
import {
    IGRPTabs,
    IGRPTabsContent,
    IGRPTabsList,
    IGRPTabsTrigger,
} from '@renderer/components/tabs';
import ProjectSettings from '@renderer/pages/project/project-settings';
import {
    ToggleGroup,
    ToggleGroupItem,
} from '@renderer/components/ui/toggle-group';
import { EmptyList } from '@renderer/components/empty-list';
import { ENV_TYPES } from '@renderer/constants/appConstants';
import { SearchInput, SubHeadline } from '@renderer/components/shared-ui';
import useStudio from '@renderer/hooks/use-studio';
import { IGRPPageHeader } from '@igrp/igrp-framework-react-design-system';

export interface PageDefinition {
    id: string;
    type: 'page' | 'component';
    name: string;
    description: string;
    path: string;
    pagePath: string;
    status: string;
    created: string;
    pageName: string;
    isPage: boolean;
    content: { [key: string]: string };
}

interface PageBuilderContentProps {
    onPageClick?: (pageFile: PageDefinition) => void;
}

const PageManager = ({ onPageClick }: PageBuilderContentProps) => {
    const { t } = useTranslation();
    const dispatch: any = useDispatch();

    const { basePath, files, config: project } = useStudio();

    const [content, setContent] = useState<any>([]);
    const [components, setComponents] = useState<any>([]);
    const [page, setPage] = useState<PageDefinition>();
    const [showformPage, setFormPage] = useState<boolean>(false);
    const [showFormComponent, setFormComponent] = useState(false);
    const [showDuplicateModal, setShowDuplicateModal] =
        useState<boolean>(false);
    const [deleteModal, setDeleteModal] = useState<boolean>(false);
    const [loadingTable, isLoadingTable] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
    const [pageEditing, setPageEditing] = useState<PageDefinition>();
    const [pageToDuplicate, setPageToDuplicate] = useState<PageDefinition>();

    const handleAddComponents = (page: PageDefinition) => {
        onPageClick?.(page);
    };

    const handleDeletePage = (page: PageDefinition) => {
        setDeleteModal(true);
        setPage(page);
    };

    const handleDuplicate = (page: PageDefinition) => {
        setPageToDuplicate(page);
        setShowDuplicateModal(true);
    };

    const confirmDeletion = async () => {
        if (!page) return;
        const pageConfig: DeleteConfig = {
            type: page.type,
            name: page.pageName,
            id: page.id,
        };
        console.log(pageConfig);
        await window.engine.delete(pageConfig, ENV_TYPES.NEXTJS, basePath);
        setDeleteModal(false);
        isLoadingTable(true);
        setPage(undefined);
    };

    const openDialogNewPage = (page?: PageDefinition) => {
        setFormPage(true);
        setPageEditing(page);
    };

    const handleNewPage = () => {
        setFormPage(false);
        setPage(undefined);
        setFormComponent(false);
        setShowDuplicateModal(false);
        setPageToDuplicate(undefined);
        isLoadingTable(true);
    };

    useEffect(() => {
        if (loadingTable) {
            dispatch(onGetPages(basePath));
            isLoadingTable(false);
        }
    }, [loadingTable]);

    useEffect(() => {
        if (files) {
            const pages = files.find((page) => page.name === 'pages');
            const components = files.find((page) => page.name === 'components');

            if (pages && pages.children) {
                setContent(pages.children);
            }

            if (components && components.children) {
                setComponents(components.children);
            }
        }
    }, [files]);

    const filteredPages = content.filter((page: FileTree) =>
        page.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredComponents = components.filter((comp: FileTree) =>
        comp.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getPageComponent = (pageName: string) => {
        return filteredComponents
            .filter((comp: FileTree) => comp.content.pageName === pageName)
            .map((comp: FileTree) => ({
                ...comp?.content,
                ...comp,
                pageName: comp?.content?.name,
                pagePath: comp?.content?.path,
                isPage: false,
            }));
    };

    const getSubPages = (pageName: string) => {
        return filteredPages
            .filter((page: FileTree) => page.content.parentName === pageName)
            .map((page: FileTree) => ({
                ...page?.content,
                ...page,
                pageName: page?.content?.pageName,
                pagePath: page?.content?.path,
                isPage: false,
            }));
    };

    const handleEdit = (page: PageDefinition) => {
        if (page.isPage) {
            setFormPage(!showformPage);
        } else {
            setFormComponent(!showFormComponent);
        }
        setPage(page);
    };

    const tableData: PageDefinition[] = [
        ...filteredPages
            .filter((page: FileTree) => page.content.parentName === undefined)
            .map((page: FileTree) => ({
                ...page?.content,
                ...page,
                pagePath: page.content?.path,
                isPage: true,
                children: getPageComponent(page.content.pageName),
            })),
        ...filteredComponents
            .filter((comp: FileTree) => comp.content.scope === 'app')
            .map((comp: FileTree) => ({
                ...comp?.content,
                ...comp,
                pageName: comp?.content?.name,
                pagePath: comp?.content?.path,
                isPage: false,
            })),
    ];

    const pageOptions = tableData
        .filter((p) => p.isPage)
        .map(({ description, pageName, content }) => ({
            label: description || pageName,
            value: pageName,
            path: content?.path,
        }));

    const tableCountText = `${filteredPages.length} ${
        filteredPages.length === 1 ? 'page' : 'pages'
    } • ${filteredComponents.length} ${filteredComponents.length === 1 ? 'component' : 'components'}`;

    const tableQueryText = searchTerm ? ` matching "${searchTerm}"` : '';

    return (
        <div className="container mx-auto p-4 space-y-6">
            <IGRPPageHeader
                variant="h3"
                title={project?.name}
                description={project.config?.description}
            />
            <IGRPTabs defaultValue="pages">
                <IGRPTabsList className="w-full">
                    <IGRPTabsTrigger value="pages">
                        {t('pages')}
                    </IGRPTabsTrigger>
                    <IGRPTabsTrigger value="settings">
                        {t('settings')}
                    </IGRPTabsTrigger>
                </IGRPTabsList>
                <IGRPTabsContent value="pages" className="space-y-4 pt-3 group">
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
                                <ToggleGroup
                                    type="single"
                                    value={viewMode}
                                    onValueChange={(value) =>
                                        value &&
                                        setViewMode(value as 'table' | 'card')
                                    }
                                >
                                    {' '}
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
                                            onSelect={() => openDialogNewPage()}
                                        >
                                            {t('createNewPage')}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onSelect={() =>
                                                setFormComponent(true)
                                            }
                                        >
                                            {t('createNewComponent')}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        {viewMode === 'card' ? (
                            tableData.length > 0 ? (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {tableData.map((page) => {
                                        const components = getPageComponent(
                                            page.pageName
                                        );
                                        const subPages = getSubPages(
                                            page.pageName
                                        );
                                        return (
                                            <PageCardView
                                                key={page.name}
                                                page={page}
                                                onDelete={(page) =>
                                                    handleDeletePage(page)
                                                }
                                                onAddComponents={
                                                    handleAddComponents
                                                }
                                                onEdit={handleEdit}
                                                onDuplicate={handleDuplicate}
                                                components={components}
                                                subPages={subPages}
                                                openDialogNewPage={
                                                    openDialogNewPage
                                                }
                                            />
                                        );
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
                            />
                        )}
                    </>
                </IGRPTabsContent>
                <IGRPTabsContent value="settings" className="space-y-4">
                    <ProjectSettings
                        hasTitle={false}
                        project={project}
                        className="max-w-screen px-0"
                    />
                </IGRPTabsContent>
            </IGRPTabs>
            <CreatePageModal
                basePath={basePath}
                isOpen={showformPage}
                onClose={() => setFormPage(false)}
                onConfirm={handleNewPage}
                pageEditing={pageEditing}
                currentComponent={page}
            />

            <CreateComponentModal
                basePath={basePath}
                isOpen={showFormComponent}
                onClose={() => setFormComponent(false)}
                onConfirm={handleNewPage}
                pageOptions={pageOptions}
                currentComponent={page}
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
                recordId={page?.pageName}
            />
        </div>
    );
};

export default PageManager;
