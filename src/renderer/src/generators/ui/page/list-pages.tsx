import { useEffect, useState } from "react";
import { createSelector } from "reselect";
import { useDispatch, useSelector } from 'react-redux';

import {
    getPages as onGetPages,
    deletePage as onDeletePage
} from "@renderer/redux/thunks";
import { PageConfig } from "@igrp/nextjs-engine/dist/interfaces/types";
import { useTranslation } from 'react-i18next';
import { File } from 'src/main/types';
import { Card, CardContent, CardHeader } from '@renderer/components/ui/card';
import { Button } from '@renderer/components/ui/button';
import { TableLayout } from '../components/TableLayout';
import { NewPageModal } from './new-page-modal';
import { Component, Trash } from 'lucide-react';
import AlertDialogDelete from '@renderer/components/alert-dialog-delete';

interface PageBuilderContentProps {
    onPageClick?: (pageFile: File) => void
}



const MainPageBuilder = ({
    onPageClick = (): void => { }
}: PageBuilderContentProps): JSX.Element => {

    const { t } = useTranslation();

    const dispatch: any = useDispatch();

    const [content, setContent] = useState<any>([]);
    const [page, setPage] = useState<any>([]);
    const [newPageModal, setNewPageModal] = useState<boolean>(false);
    const [deleteModal, setDeleteModal] = useState<boolean>(false);
    const [loadingTable, isLoadingTable] = useState<boolean>(true);

    const selectState = (state: any) => state.PageBuilder;

    const selectProperties = createSelector(
        selectState,
        (studio) => ({
            basePath: studio.basePath,
            config: studio.config,
            pages: studio.folderFiles?.pages
        })
    );

    const { basePath, pages } = useSelector(selectProperties);

    const tableColumns = [
        { header: 'Page Name', accessorKey: 'name', enableSorting: true, enableColumnFilter: true },
        { header: 'Status', accessorKey: 'status' },
        { header: 'Created', accessorKey: 'created' }
    ];

    const handleDeletePage = () => {
        const pageConfig: PageConfig = {
            type: 'page',
            pageName: page.pageName,
            path: page.path
        }

        dispatch(onDeletePage(pageConfig, basePath));
        setDeleteModal(false);
        isLoadingTable(true);
        setPage(null)
    };

    const handleNewPage = () => {
        setNewPageModal(false);
        isLoadingTable(true);
    };

    const onClickDelete = (page: any) => {
        setPage(page);
        setDeleteModal(true);
    };

    const onClickNewPage = () => {
        setNewPageModal(true);
    };

    const onClickBtnGerador = (item: File) => {
        if (onPageClick)
            onPageClick(item);
    };

    useEffect(() => {
        if (loadingTable) {
            dispatch(onGetPages(basePath));
            isLoadingTable(false)
        }
    }, [loadingTable]);

    useEffect(() => {
        if (pages?.files) {
            // Transform the pages structure into a flat array
            const flattenedPages = pages.files.flatMap(page =>
                Object.values(page).flat()
            );

            setContent(flattenedPages);
        }
    }, [pages])

    const actions = (cell: any) => (
        <div className="flex space-x-2" >
            <Button title='Add Components' variant="ghost" size="icon" onClick={() => onClickBtnGerador(cell.row.original)}>
                <Component className='h-4' />
            </Button>
            <Button title='Delete Page' variant="ghost" size="icon" onClick={() => onClickDelete(cell.row.original)}>
                <Trash className='h-4 text-red-500' />
            </Button>
        </div>
    );

    return (
        <div className='container mt-4'>
            <Card>
                <CardHeader className="flex flex-1 flex-row justify-between">
                    <h4 className="text-lg font-semibold">{t("pageLists")}</h4>
                    <div className="ml-auto">
                    
                        <Button
                            size="sm"
                            onClick={onClickNewPage}>
                            {t("create")}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <TableLayout content={content || []} columns={tableColumns} actions={actions} />
                </CardContent>
            </Card>

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
    )
}

export default MainPageBuilder; 
