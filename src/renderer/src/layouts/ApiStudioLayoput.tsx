import React, { useEffect, useMemo } from 'react';
import { ToastContainer } from 'react-toastify';
import withRouter from '@renderer/common/withRouter';
import { createSelector } from 'reselect';
import { useDispatch, useSelector } from 'react-redux';

import {
    getPages as onGetFolderFiles,
    setChangeStatus as onSetChangeStatus,
} from "@renderer/redux/thunks";

import { generateMenuItems } from '@renderer/utils/helpers';
import { SidebarInset, SidebarProvider } from '@renderer/components/ui/sidebar';
import { AppSidebar } from './components/app-sidebar';
import Header from './components/header';
import { ScrollArea } from '@renderer/components/ui/scroll-area';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout = (props: LayoutProps): JSX.Element => {
    const dispatch: any = useDispatch();

    const selectStudioState = (state: any) => state.PageBuilder;
    const selectStudioProperties = createSelector(
        selectStudioState,
        (studio) => ({
            config: studio.config,
            folders: studio.folderFiles,
            basePath: studio.basePath,
            changeStatus: studio.changeStatus,
        })
    );

    const { changeStatus, config, basePath, folders } = useSelector(selectStudioProperties);

    useEffect(() => {
        dispatch(onGetFolderFiles(basePath));
    }, [basePath, dispatch]);

    useEffect(() => {
        if (changeStatus) {
            dispatch(onGetFolderFiles(basePath));
            dispatch(onSetChangeStatus(false));
        }
    }, [changeStatus, basePath, dispatch]);

    const menuItems = useMemo(() => generateMenuItems(folders), [folders]);

    return (
        <div className="h-screen flex flex-col">
            <ToastContainer />
            <Header config={config} basePath={basePath} />

            <div className="flex flex-1 overflow-hidden">
                <SidebarProvider>
                    <AppSidebar menuItems={menuItems} className='mt-10' config={config} />
                    <SidebarInset >
                        <ScrollArea className='mb-20'>
                            {props.children}
                        </ScrollArea>
                    </SidebarInset>
                </SidebarProvider>
            </div >
        </div >
    );
}

export default withRouter(Layout);
