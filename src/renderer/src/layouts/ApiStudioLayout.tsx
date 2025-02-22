import React, { useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import withRouter from '@renderer/common/withRouter';
import { createSelector } from 'reselect';
import { useDispatch, useSelector } from 'react-redux';

import {
    getFileThree as onGetFolderFiles,
    setChangeStatus as onSetChangeStatus,
} from '@renderer/redux/thunks';

import Header from './components/header';
import { SidebarInset, SidebarProvider } from '@renderer/components/ui/sidebar';
import { AppSidebar } from './components/app-sidebar';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@renderer/routes/routeConstants';
import { useNavdata } from './components/nav-data';
import { ProjectData } from 'src/main/types';

interface LayoutProps {
    children: React.ReactElement<{
        basePath: string;
        currentItem: any;
        project: ProjectData;
    }>;
}

const Layout = (props: LayoutProps) => {
    const dispatch: any = useDispatch();
    const navigate = useNavigate();

    const selectStudioState = (state: any) => state.PageBuilder;
    const selectStudioProperties = createSelector(
        selectStudioState,
        (studio) => ({
            config: studio.config,
            filesThree: studio.filesThree,
            basePath: studio.basePath,
            changeStatus: studio.changeStatus,
            currentItem: studio.currentItem,
        })
    );

    const { currentItem, changeStatus, config, basePath, filesThree } =
        useSelector(selectStudioProperties);

    useEffect(() => {
        dispatch(onGetFolderFiles(basePath));
    }, [basePath, dispatch]);

    useEffect(() => {
        if (changeStatus) {
            dispatch(onGetFolderFiles(basePath));
            dispatch(onSetChangeStatus(false));
        }
    }, [changeStatus, basePath, dispatch]);

    const { menuItems } = useNavdata(filesThree);

    useEffect(() => {
        if (!basePath) {
            navigate(ROUTES.HOME);
        }
    }, [basePath, navigate]);

    return (
        <SidebarProvider
            style={
                {
                    '--sidebar-width': '380px',
                } as React.CSSProperties
            }
        >
            <div className="h-screen flex flex-col w-full">
                <ToastContainer />
                <Header config={config} basePath={basePath} />

                <div className="flex flex-1 overflow-hidden">
                    <AppSidebar
                        menuItems={menuItems}
                        className="mt-10"
                        config={config}
                        basePath={basePath}
                        header
                    />
                    <SidebarInset className="flex-1">
                        {React.cloneElement(props.children, {
                            basePath,
                            currentItem,
                            project: config,
                        })}
                    </SidebarInset>
                </div>
            </div>
        </SidebarProvider>
    );
};

export default withRouter(Layout);
