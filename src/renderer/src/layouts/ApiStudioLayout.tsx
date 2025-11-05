import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import {
    getFileThree as onGetFolderFiles,
    setChangeStatus as onSetChangeStatus,
} from '@renderer/redux/thunks';

import Header from './components/header';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@renderer/routes/routeConstants';
import { useNavdata } from './components/nav-data';
import { ProjectData } from 'src/main/types';
import { Footer } from './components/footer';
import useStudioAPI from '@renderer/hooks/use-studio-api';
import {
    IGRPSidebarInsetPrimitive,
    IGRPSidebarProviderPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { AppIGRPSidebar } from './components/app-sidebar';

interface LayoutProps {
    children: React.ReactElement<{
        basePath: string;
        currentItem: any;
        project: ProjectData;
    }>;
}

const Layout = (props: LayoutProps): React.ReactNode => {
    const dispatch: any = useDispatch();
    const navigate = useNavigate();

    const { currentItem, changeStatus, config, basePath, filesThree } =
        useStudioAPI();

    useEffect(() => {
        dispatch(onGetFolderFiles(basePath));
    }, [basePath, dispatch]);

    useEffect(() => {
        if (changeStatus) {
            // Add a small delay to ensure file system operations complete
            const timer = setTimeout(() => {
                dispatch(onGetFolderFiles(basePath));
                dispatch(onSetChangeStatus(false));
            }, 100);
            return () => clearTimeout(timer);
        }
        return undefined;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [changeStatus, basePath, dispatch]);

    const { menuItems } = useNavdata(filesThree);

    useEffect(() => {
        if (!basePath) {
            navigate(ROUTES.HOME);
        }
    }, [basePath, navigate]);

    return (
        <div className="[--header-height:calc(--spacing(10))] [--header-height-two:calc(--spacing(18))] [--header-height-three:calc(--spacing(30))]">
            <IGRPSidebarProviderPrimitive
                style={
                    {
                        '--sidebar-width': '380px',
                    } as React.CSSProperties
                }
            >
                <div className="h-screen flex flex-col w-full">
                    <Header config={config} basePath={basePath} />

                    <div className="flex flex-1 overflow-hidden h-[calc(100svh-var(--header-height))]">
                        <AppIGRPSidebar
                            menuItems={menuItems}
                            config={config}
                            basePath={basePath}
                            header
                        />
                        <IGRPSidebarInsetPrimitive className="flex-1">
                            {React.cloneElement(props.children, {
                                basePath,
                                currentItem,
                                project: config,
                            })}
                        </IGRPSidebarInsetPrimitive>
                    </div>
                </div>
                <Footer />
            </IGRPSidebarProviderPrimitive>
        </div>
    );
};

export default Layout;
