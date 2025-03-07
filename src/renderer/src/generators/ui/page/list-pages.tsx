import { useEffect, useState } from 'react';
import { createSelector } from 'reselect';
import { useDispatch, useSelector } from 'react-redux';

import {
    getFileThree as onGetPages,
    deletePage as onDeletePage,
} from '@renderer/redux/thunks';
import { useTranslation } from 'react-i18next';
import { Button } from '@renderer/components/ui/button';
import { Contact, LayoutDashboard, Plus } from 'lucide-react';
import { Input } from '@renderer/components/ui/input';
import { PageCard } from './page-card';
import {
    IGRPContainer,
    PageHeader,
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

    const handleAddComponents = (page: any) => {
        onPageClick?.(page);
    };

    const selectState = (state: any) => state.PageBuilder;

    const selectProperties = createSelector(selectState, (studio) => ({
        basePath: studio.basePath,
        config: studio.config,
        files: studio.filesThree,
    }));

    const { basePath, files, config } = useSelector(selectProperties);

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
        setNewComponentModal(false)
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

    return (
        <div className="container mx-auto p-4">
            <PageHeader title={config?.name} description={config?.description}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline">
                            <Plus className="mr-2 h-4 w-4" /> {t('add')}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem
                            onSelect={() => setNewPageModal(true)}
                        >
                            {t('createNewPage')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onSelect={() => setNewComponentModal(true)}
                        >
                            {t('createNewComponent')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </PageHeader>
            <IGRPContainer>
                <div className="flex items-center text-foreground">
                    <LayoutDashboard className="w-5 h-5 mr-2" />
                    {t('pageLists')}
                </div>
                <div>
                    <div className="mb-4">
                        <Input
                            placeholder={t('seachPages')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredPages.map((page) => (
                            <PageCard
                                key={page.name}
                                page={page}
                                onDelete={() => handleDeletePage(page)}
                                onAddComponents={handleAddComponents}
                                isPage
                            />
                        ))}

                        {filteredComponents.map((comp) => (
                            <PageCard
                                key={comp.name}
                                page={comp}
                                onDelete={() => handleDeletePage(comp)}
                                onAddComponents={handleAddComponents}
                                isPage={false}
                            />
                        ))}
                    </div>
                </div>
            </IGRPContainer>
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
