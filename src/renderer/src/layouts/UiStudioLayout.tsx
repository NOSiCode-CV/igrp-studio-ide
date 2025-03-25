import React from 'react';
import Header from './components/header';
import withRouter from '@renderer/common/withRouter';
import { createSelector } from 'reselect';
import { useSelector } from 'react-redux';
import { SidebarProvider } from '@renderer/components/ui/sidebar';
import { Footer } from './components/footer';
import { Toaster } from '@renderer/components/ui/sonner';

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
        <div className="[--header-height:calc(--spacing(10))] [--header-height-two:calc(--spacing(20))] [--header-height-three:calc(--spacing(28))]">
            <SidebarProvider
                style={
                    {
                        '--sidebar-width': '380px',
                    } as React.CSSProperties
                }
            >
                <div className="h-screen flex flex-col w-full">
                    <Toaster position="top-right" richColors closeButton expand/>
                    <Header config={config} basePath={basePath} />

                    <div className="flex flex-1 overflow-hidden h-[calc(100svh-var(--header-height))]">
                        {React.cloneElement(props.children, {
                            basePath: basePath,
                        })}
                    </div>
                    <Footer />
                </div>
            </SidebarProvider>
        </div>
    );
};

export default withRouter(Layout);
