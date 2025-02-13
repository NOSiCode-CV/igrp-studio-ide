import { useEffect, useState } from 'react';
import { createSelector } from 'reselect';
import { useDispatch, useSelector } from 'react-redux';

import {
    getFileThree as onGetPages,
    deletePage as onDeletePage,
} from '@renderer/redux/thunks';
import { PageConfig } from '@igrp/nextjs-engine/dist/interfaces/types';
import { useTranslation } from 'react-i18next';
import { File } from 'src/main/types';
import { Button } from '@renderer/components/ui/button';
import { LayoutDashboard, Plus } from 'lucide-react';
import { Input } from '@renderer/components/ui/input';
import { PageCard } from './page-card';
import { IGRPContainer, PageHeader } from '@igrp/igrp-design-system';
import { NewPageModal } from './new-page-modal';
import AlertDialogDelete from '@renderer/components/alert-dialog-delete';

interface PageBuilderContentProps {
    onPageClick?: (pageFile: File) => void;
}

const MainPageBuilder = ({
    onPageClick = (): void => {},
}: PageBuilderContentProps): JSX.Element => {
    const { t } = useTranslation();

    const dispatch: any = useDispatch();

    const [content, setContent] = useState<any>([]);
    const [page, setPage] = useState<any>([]);
    const [newPageModal, setNewPageModal] = useState<boolean>(false);
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
        pages: studio.filesThree,
    }));

    const { basePath, pages, config } = useSelector(selectProperties);

    const handleDeletePage = () => {
        const pageConfig: PageConfig = {
            type: 'page',
            pageName: page.name,
            path: page.path,
        };
        dispatch(onDeletePage(pageConfig, basePath));
        setDeleteModal(false);
        isLoadingTable(true);
        setPage(null);
    };

    const handleNewPage = () => {
        setNewPageModal(false);
        isLoadingTable(true);
    };

    useEffect(() => {
        if (loadingTable) {
            dispatch(onGetPages(basePath));
            isLoadingTable(false);
        }
    }, [loadingTable]);

    useEffect(() => {
        if (pages) {
            const page = pages.find((page) => page.name === 'pages');

            if (page  && page.children) {
                const resourceItems = page.children;
                setContent(resourceItems);
            }
        }
    }, [pages]);

    const filteredPages = content.filter((page) =>
        page.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container mx-auto p-4">
            <PageHeader title={config?.name} description={config?.description}>
                <Button size="sm" onClick={() => setNewPageModal(true)}>
                    <Plus />
                    Add Page
                </Button>
            </PageHeader>
            <IGRPContainer>
                <div className="flex items-center text-foreground">
                    <LayoutDashboard className="w-5 h-5 mr-2" />
                    {t('pageLists')}
                </div>
                <div>
                    <div className="mb-4">
                        <Input
                            placeholder="Search pages..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredPages.map((page) => (
                            <PageCard
                                key={page.name}
                                page={page}
                                onDelete={() => setDeleteModal(true)}
                                onAddComponents={handleAddComponents}
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

            <AlertDialogDelete
                isOpen={deleteModal}
                onClose={() => setDeleteModal(false)}
                onConfirm={handleDeletePage}
                hasTrigger={false}
            />
        </div>
    );
};

export default MainPageBuilder;
