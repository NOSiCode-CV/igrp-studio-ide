import React from 'react';
import Header from './components/header';
import { ToastContainer } from 'react-toastify';
import withRouter from '@renderer/common/withRouter';
import { createSelector } from 'reselect';
import { useSelector } from 'react-redux';
import { SidebarProvider } from '@renderer/components/ui/sidebar';

interface LayoutProps {
    children: React.ReactElement<{ basePath: string }>;
}

export interface RootState {
    PageBuilder: {
        config: any;
        basePath: string;
    };
}

const Layout = (props: LayoutProps) => {
    const selectStudioState = (state: RootState) => state.PageBuilder;
    const selectStudioProperties = createSelector(
        selectStudioState,
        (studio) => ({
            config: studio.config,
            basePath: studio.basePath,
        })
    );

    const { config, basePath } = useSelector(selectStudioProperties);

    return (
        <div className="[--header-height:calc(--spacing(10))] [--header-height-two:calc(--spacing(20))] overflow-hidden h-screen">
            <SidebarProvider
                className="flex flex-col"
                style={{ height: '100%' }}
            >
                <ToastContainer />
                <Header config={config} basePath={basePath} />
                {React.cloneElement(props.children, {
                    basePath: basePath,
                })}
            </SidebarProvider>
        </div>
    );
};

export default withRouter(Layout);
