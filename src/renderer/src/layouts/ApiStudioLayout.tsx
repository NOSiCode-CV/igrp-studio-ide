import React, { useEffect } from 'react';
import withRouter from '@renderer/common/withRouter';
import { useDispatch } from 'react-redux';

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
import { Footer } from './components/footer';
import { Toaster } from '@renderer/components/ui/sonner';
import useStudioAPI from '@renderer/hooks/use-studio-api';

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

    const { currentItem, changeStatus, config, basePath, filesThree } =
        useStudioAPI();

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
        <div className="[--header-height:calc(--spacing(10))] [--header-height-two:calc(--spacing(18))] [--header-height-three:calc(--spacing(30))]">
            <SidebarProvider
                style={
                    {
                        '--sidebar-width': '380px',
                    } as React.CSSProperties
                }
            >
                <div className="h-screen flex flex-col w-full">
                    <Toaster
                        position="top-right"
                        richColors
                        closeButton
                        expand
                    />
                    <Header config={config} basePath={basePath} />

                    <div className="flex flex-1 overflow-hidden h-[calc(100svh-var(--header-height))]">
                        <AppSidebar
                            menuItems={menuItems}
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
                <Footer />
            </SidebarProvider>
        </div>
    );
};

export default withRouter(Layout);
