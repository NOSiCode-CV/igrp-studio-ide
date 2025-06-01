import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import { getFileThree as onGetPages } from '@renderer/redux/thunks';
import { useTranslation } from 'react-i18next';
import { Button } from '@renderer/components/ui/button';
import {
    ChevronDown,
    ChevronRight,
    Edit,
    LayoutGrid,
    Plus,
    TableIcon,
    Trash,
} from 'lucide-react';
import { PageCard } from './page-card';
import {
    IGRPDataTable,
    IGRPPageHeader,
} from '@igrp/igrp-framework-react-design-system';
import { NewPageModal } from './new-page-modal';
import AlertDialogDelete from '@renderer/components/alert-dialog-delete';
import { DeleteConfig } from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';
import { FileTree } from 'src/main/types';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@renderer/components/ui/dropdown-menu';
import { NewComponentModal } from './new-component-modal';
import {
    IGRPTabs,
    IGRPTabsContent,
    IGRPTabsList,
    IGRPTabsTrigger,
} from '@renderer/components/tabs';
import ProjectSettings from '@renderer/pages/project/project-settings';
import { ColumnDef } from '@igrp/igrp-framework-react-design-system/dist/types/globals';
import {
    ToggleGroup,
    ToggleGroupItem,
} from '@renderer/components/ui/toggle-group';
import { EmptyList } from '@renderer/components/empty-list';
import { ENV_TYPES } from '@renderer/constants/appConstants';
import { SearchInput, SubHeadline } from '@renderer/components/shared-ui';
import useStudio from '@renderer/hooks/use-studio';
import { Badge } from '@renderer/components/ui/badge';
import { IconPage, PageActions } from './shared';

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

const MainPageBuilder = ({ onPageClick }: PageBuilderContentProps) => {
    const { t } = useTranslation();
    const dispatch: any = useDispatch();

    const { basePath, files, config: project } = useStudio();

    const [content, setContent] = useState<any>([]);
    const [components, setComponents] = useState<any>([]);
    const [page, setPage] = useState<PageDefinition>();
    const [newPageModal, setNewPageModal] = useState<boolean>(false);
    const [showNewComponentModal, setNewComponentModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState<boolean>(false);
    const [loadingTable, isLoadingTable] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
    const [pageEditing, setPageEditing] = useState<PageDefinition>();

    const handleAddComponents = (page: PageDefinition) => {
        onPageClick?.(page);
    };

    const handleDeletePage = (page: PageDefinition) => {
        setDeleteModal(true);
        setPage(page);
    };

    const confirmDeletion = async () => {
        if (!page) return;
        const pageConfig: DeleteConfig = {
            type: page.type,
            name: page.pageName,
            id: page.id,
        };
        await window.engine.delete(pageConfig, ENV_TYPES.NEXTJS, basePath);
        setDeleteModal(false);
        isLoadingTable(true);
        setPage(undefined);
    };

    const openDialogNewPage = (page?: PageDefinition) => {
        setNewPageModal(true);
        setPageEditing(page);
    };

    const handleNewPage = () => {
        setNewPageModal(false);
        setNewComponentModal(false);
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

    const tableData: PageDefinition[] = [
        ...filteredPages.map((page: FileTree) => ({
            ...page?.content,
            ...page,
            pagePath: page.content?.path,
            isPage: true,
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

    const getPageComponet = (pageName: string) => {
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

    const columns: ColumnDef<any>[] = [
        {
            accessorKey: 'description',
            header: 'Name',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <IconPage
                        isOpen={false}
                        compCount={components ? components.length : 0}
                        page={row.original}
                    />
                    <span>
                        {row.original.description || row.original.pageName}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: 'pagePath',
            header: 'Path',
            cell: ({ row }) => (
                <code className="text-xs bg-muted px-1 py-0.5 rounded">
                    {row.original.pagePath || '-'}
                </code>
            ),
        },
        {
            accessorKey: 'type',
            header: 'Type',
            cell: ({ row }) => (
                <Badge
                    variant={row.original.isPage ? 'default' : 'secondary'}
                    className="text-xs"
                >
                    {row.original.type}
                </Badge>
            ),
        },
        {
            accessorKey: 'type',
            header: 'Subpages/Components',
            cell: ({ row }) => {
                const components = getPageComponet(row.original.pageName);
                return (
                    <div className="flex gap-2">
                        {components && components.length > 0 ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => console.log()}
                                className="h-6 px-2 text-xs flex items-center gap-1"
                            >
                                <span>Components</span>
                                <Badge variant="outline" className="text-xs">
                                    {components.length}
                                </Badge>
                                {row.original.isComponentsExpanded ? (
                                    <ChevronDown className="h-3 w-3" />
                                ) : (
                                    <ChevronRight className="h-3 w-3" />
                                )}
                            </Button>
                        ):<>-</>}
                    </div>
                );
            },
        },
        {
            accessorKey: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <PageActions
                    page={row.original}
                    onDelete={() => handleDeletePage(row.original)}
                    onAddComponents={() => handleAddComponents(row.original)}
                    openDialogNewPage={openDialogNewPage}
                />
            ),
        },
    ];

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
                                    <ToggleGroupItem
                                        value="table"
                                        aria-label="Table view"
                                        className="h-8 w-8"
                                    >
                                        <TableIcon className="h-3.5 w-3.5" />
                                    </ToggleGroupItem>
                                    <ToggleGroupItem
                                        value="card"
                                        aria-label="Card view"
                                        className="h-8 w-8"
                                    >
                                        <LayoutGrid className="h-3.5 w-3.5" />
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
                                                setNewComponentModal(true)
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
                                        const components = getPageComponet(
                                            page.pageName
                                        );
                                        return (
                                            <PageCard
                                                key={page.name}
                                                page={page}
                                                onDelete={() =>
                                                    handleDeletePage(page)
                                                }
                                                onAddComponents={
                                                    handleAddComponents
                                                }
                                                components={components}
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
                            <IGRPDataTable columns={columns} data={tableData} />
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
            <NewPageModal
                basePath={basePath}
                isOpen={newPageModal}
                onClose={() => setNewPageModal(false)}
                onConfirm={handleNewPage}
                pageEditing={pageEditing}
            />

            <NewComponentModal
                basePath={basePath}
                isOpen={showNewComponentModal}
                onClose={() => setNewComponentModal(false)}
                onConfirm={handleNewPage}
                pageOptions={pageOptions}
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

export default MainPageBuilder;
