import { useEffect, useState } from 'react';
import { createSelector } from 'reselect';
import { useDispatch, useSelector } from 'react-redux';

import {
    getFileThree as onGetPages,
    deletePage as onDeletePage,
} from '@renderer/redux/thunks';
import { useTranslation } from 'react-i18next';
import { Button } from '@renderer/components/ui/button';
import { Edit, LayoutGrid, Plus, TableIcon, Trash } from 'lucide-react';
import { Input } from '@renderer/components/ui/input';
import { PageCard } from './page-card';
import {
    IGRPDataTable,
    IGRPHeaderPage,
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
import ProjectSettings from '@renderer/pages/project-settings';
import { ColumnDef } from '@igrp/igrp-framework-react-design-system/dist/types/globals';
import {
    ToggleGroup,
    ToggleGroupItem,
} from '@renderer/components/ui/toggle-group';
import { EmptyList } from '@renderer/components/empty-list';

interface PageBuilderContentProps {
    onPageClick?: (pageFile: FileTree) => void;
}

const MainPageBuilder = ({
    onPageClick = (): void => {},
}: PageBuilderContentProps) => {
    const { t } = useTranslation();
    const dispatch: any = useDispatch();

    const [content, setContent] = useState<any>([]);
    const [components, setComponents] = useState<any>([]);
    const [page, setPage] = useState<any>();
    const [newPageModal, setNewPageModal] = useState<boolean>(false);
    const [showNewComponentModal, setNewComponentModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState<boolean>(false);
    const [loadingTable, isLoadingTable] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

    const handleAddComponents = (page: any) => {
        onPageClick?.(page);
    };

    const selectState = (state: any) => state.PageBuilder;

    const selectProperties = createSelector(selectState, (studio) => ({
        basePath: studio.basePath,
        config: studio.config,
        files: studio.filesThree,
    }));

    const { basePath, files, config: project } = useSelector(selectProperties);

    const handleDeletePage = (page: any) => {
        setDeleteModal(true);
        setPage(page);
    };

    const confirmDeletion = () => {
        const pageConfig: DeleteConfig = {
            type: page.content.type,
            name: page.content.pageName || page.content.name,
        };
        dispatch(onDeletePage(pageConfig, basePath));
        setDeleteModal(false);
        isLoadingTable(true);
        setPage(null);
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

    const filteredPages = content.filter((page) =>
        page.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredComponents = components.filter((comp) =>
        comp.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const tableData = [
        ...filteredPages.map((page) => ({
            ...page,
            pageName: page.content?.pageName,
            isPage: true,
        })),
        ...filteredComponents.map((comp) => ({
            ...comp,
            pageName: comp.content?.name,
            isPage: false,
        })),
    ];

    const columns: ColumnDef<any>[] = [
        {
            accessorKey: 'pageName',
            header: 'Name',
        },
        {
            accessorKey: 'type',
            header: 'Type',
            cell: ({ row }) => (row.original.isPage ? 'Page' : 'Component'),
        },
        {
            accessorKey: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <div className="flex space-x-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAddComponents(row.original)}
                    >
                        <Edit className="h-4 w-4 mr-2" />
                        {row.original.isPage
                            ? t('addComponents')
                            : t('editComponents')}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePage(row.original)}
                    >
                        <Trash className="h-4 w-4 text-red-500" />
                        <span>{t('delete')}</span>
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="container mx-auto p-4">
            <IGRPHeaderPage
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
                <IGRPTabsContent value="pages" className="space-y-4">
                    <div className="space-y-4 py-3">
                        <div className="flex justify-between">
                            <div className="flex items-center text-foreground">
                                <h1 className="">{t('pageLists')}</h1>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button size="sm" variant="default">
                                        <Plus className="h-4 w-4" />
                                        {t('add')}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem
                                        onSelect={() => setNewPageModal(true)}
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
                        <div className="flex flex-col sm:flex-row justify-between gap-4">
                            <Input
                                placeholder={t('seachPages')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
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
                                >
                                    <TableIcon className="h-4 w-4" />
                                </ToggleGroupItem>
                                <ToggleGroupItem
                                    value="card"
                                    aria-label="Card view"
                                >
                                    <LayoutGrid className="h-4 w-4" />
                                </ToggleGroupItem>
                            </ToggleGroup>
                        </div>
                        {viewMode === 'card' ? (
                            tableData.length > 0 ? (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {tableData.map((page) => (
                                        <PageCard
                                            key={page.name}
                                            page={page}
                                            onDelete={() =>
                                                handleDeletePage(page)
                                            }
                                            onAddComponents={
                                                handleAddComponents
                                            }
                                        />
                                    ))}
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
                    </div>
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
            />

            <NewComponentModal
                basePath={basePath}
                isOpen={showNewComponentModal}
                onClose={() => setNewComponentModal(false)}
                onConfirm={handleNewPage}
            />

            <AlertDialogDelete
                isOpen={deleteModal}
                onClose={() => setDeleteModal(false)}
                onConfirm={confirmDeletion}
                hasTrigger={false}
            />
        </div>
    );
};

export default MainPageBuilder;
