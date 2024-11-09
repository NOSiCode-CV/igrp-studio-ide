import '@renderer/assets/css/gen.css'
import React, { useEffect, useState } from "react";
import { createSelector } from "reselect";
import { useDispatch, useSelector } from 'react-redux';
import UiNewPage from "./components/UiNewPage";
import { Button, Card, CardBody, CardHeader, Container } from "reactstrap";
import { Link } from "react-router-dom";
import { DeleteModal, DefaultTable } from '@igrp/nosi-velzon-ts'

import {
    getPages as onGetPages,
    deletePage as onDeletePage
} from "@renderer/slices/thunks";
import { PageConfig } from "@igrp/nextjs-engine/dist/interfaces/types";
import { useTranslation } from 'react-i18next';
import { File } from 'src/main/types';

interface PageBuilderContentProps {
    onPageClick?: (pageFile: File) => void
}

const PageBuilderContent = ({
    onPageClick = (): void => { }
}: PageBuilderContentProps): JSX.Element => {

    const dispatch: any = useDispatch();

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

    const { t } = useTranslation();

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

    const handleNewPageModal = () => {
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

    const onClickOthersBtn = (item: any) => {
        console.log(item)
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

    const actions = (cell: any) => (
        <React.Fragment>
            <ul className="list-inline hstack gap-2 mb-0">
                <li className="list-inline-item edit" title="Historico">
                    <Link to="#" className="text-muted d-inline-block"
                        onClick={() => { const item = cell.row.original; onClickOthersBtn(item); }}>
                        <i className=" ri-history-line fs-16"></i>
                    </Link>
                </li>
                <li className="list-inline-item edit" title="Gerador">
                    <Link to="#" className="text-muted d-inline-block"
                        onClick={() => { const item = cell.row.original; onClickBtnGerador(item); }}>
                        <i className="ri-code-line fs-16"></i>
                    </Link>
                </li>
                <li className="list-inline-item" title="Preview">
                    <Link to="#"
                        onClick={() => { const item = cell.row.original; onClickOthersBtn(item); }}
                    >
                        <i className="ri-eye-fill align-bottom text-muted"></i>
                    </Link>
                </li>
                <li className="list-inline-item" title="Edit">
                    <Link className="edit-item-btn" to="#"
                        onClick={() => { const item = cell.row.original; onClickOthersBtn(item); }}
                    >
                        <i className="ri-pencil-fill align-bottom text-muted"></i>
                    </Link>
                </li>
                <li className="list-inline-item" title="Delete">
                    <Link
                        className="remove-item-btn"
                        onClick={() => { const item = cell.row.original; onClickDelete(item); }}
                        to="#"
                    >
                        <i className="ri-delete-bin-fill align-bottom text-muted"></i>
                    </Link>
                </li>
            </ul>
        </React.Fragment>
    );

    return (
        <React.Fragment>
            <DeleteModal
                show={deleteModal}
                onDeleteClick={() => handleDeletePage()}
                onCloseClick={() => setDeleteModal(false)}
            />
            <UiNewPage
                basePath={basePath}
                show={newPageModal}
                onConfirmClick={handleNewPageModal}
                onCloseClick={() => setNewPageModal(false)}
            />

            <Container className='mt-4'>
                <Card>
                    <CardHeader className="align-items-center d-flex">
                        <h4 className="card-title mb-0 flex-grow-1">{t("pageLists")}</h4>
                        <div className="flex-shrink-0">
                            <Button color="primary" size='sm' className="btn-soft-primary" onClick={onClickNewPage}>
                                {t("create")}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardBody>
                        <DefaultTable content={pages} columns={tableColumns} actions={actions} />
                    </CardBody>
                </Card>
            </Container>
        </React.Fragment>
    )
}

export default PageBuilderContent; 
