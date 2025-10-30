import React from 'react';
import Header from './components/header';
import { createSelector } from 'reselect';
import { useSelector } from 'react-redux';
import {
    IGRPSidebarProvider,
    IGRPToasterPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { Footer } from './components/footer';

interface LayoutProps {
    children: React.ReactElement<{ basePath: string }>;
}

export interface RootState {
    PageBuilder: {
        config: any;
        basePath: string;
    };
}

const Layout = (props: LayoutProps): React.JSX.Element => {
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
            <IGRPSidebarProvider
                style={
                    {
                        '--sidebar-width': '380px',
                    } as React.CSSProperties
                }
            >
                <div className="h-screen flex flex-col w-full">
                    <IGRPToasterPrimitive
                        //position="top-right"
                        richColors
                        closeButton
                        expand
                    />
                    <Header config={config} basePath={basePath} />

                    <div className="flex flex-1 overflow-hidden h-[calc(100svh-var(--header-height))]">
                        {React.cloneElement(props.children, {
                            basePath: basePath,
                        })}
                    </div>
                    <Footer />
                </div>
            </IGRPSidebarProvider>
        </div>
    );
};

export default Layout;
