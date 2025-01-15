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
import { Component, GitBranch, Trash } from 'lucide-react';
import AlertDialogDelete from '@renderer/components/alert-dialog-delete';
import useToast from "@renderer/components/useToast";

interface PageBuilderContentProps {
    onPageClick?: (pageFile: File) => void
}




interface Branch {
    name: string;
    isActive: boolean;
    isRemote: boolean;
    fullName: string;
  }
  
  const ProjectBranches = ({ projectPath }: { projectPath: string }) => {
    console.log("projectPath", projectPath)
    const [branches, setBranches] = useState<Branch[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showErrorToast, showSuccessToast } = useToast();
  
    useEffect(() => {
      const loadBranches = async () => {
        try {
          const branchList = await window.electron.ipcRenderer.invoke('list-branches', projectPath);
          setBranches(branchList);
        } catch (error) {
          showErrorToast('Failed to load branches');
          console.error('Error loading branches:', error);
        } finally {
          setIsLoading(false);
        }
      };
  
      loadBranches();
    }, [projectPath]);

    const handleCheckout = async (branchName: string) => {
        try {
          await window.electron.ipcRenderer.invoke('checkout-branch', {
            projectPath,
            branchName
          });
          // Recarrega a lista de branches
          const updatedBranches = await window.electron.ipcRenderer.invoke('list-branches', projectPath);
          setBranches(updatedBranches);
          showSuccessToast(`Switched to branch ${branchName}`);
        } catch (error) {
          showErrorToast('Failed to switch branch');
        }
      };
  
    if (isLoading) {
      return <div>Loading branches...</div>;
    }
  
    return (
      <div className="mt-4">
        <h3 className="font-medium mb-2">Branches</h3>
        <div className="border rounded-lg divide-y">
          {branches.map((branch) => (
            <div 
              key={branch.fullName}
              className={`p-3 flex items-center justify-between ${
                branch.isActive ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4" />
                <span>{branch.name}</span>
                {branch.isActive && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Current
                  </span>
                )}
                {branch.isRemote && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    Remote
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleCheckout(branch.name)}
                  disabled={branch.isActive}
                >
                  Switch to Branch
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

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

    console.log("pages", pages)

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
                    <ProjectBranches projectPath="C:\\Users\\vadyy\\Desktop\\work\\NOSI\\igrp-studio-horizon" />
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
