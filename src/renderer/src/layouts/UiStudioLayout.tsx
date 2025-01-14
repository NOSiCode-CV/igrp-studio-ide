import React, { useEffect, useState } from 'react';
import Header from './components/header';
import { ToastContainer } from 'react-toastify';
import withRouter from '@renderer/common/withRouter';
import { createSelector } from 'reselect';
import { useSelector } from 'react-redux';
import useToast from '@renderer/components/useToast';
import { BranchSwitcher } from './components/branch-switcher';

interface LayoutProps {
    children: React.ReactElement<{ basePath: string }>;
}

interface RootState {
    PageBuilder: {
        config: any; // Define appropriate types
        folderFiles: any; // Define appropriate types
        basePath: string;
    };
}


const Layout = (props: LayoutProps): JSX.Element => {
    const { showErrorToast, showSuccessToast } = useToast();
    const selectStudioState = (state: RootState) => state.PageBuilder;
    const selectStudioProperties = createSelector(
        selectStudioState,
        (studio) => ({
            config: studio.config,
            folders: studio.folderFiles,
            basePath: studio.basePath
        })
    );

    const { config, basePath } = useSelector(selectStudioProperties);
    return (
        <div className="h-screen flex flex-col">
            <ToastContainer />
            <Header config={config} basePath={basePath} />
            <BranchSwitcher
                projectPath={basePath}
                onError={showErrorToast}
                onSuccess={showSuccessToast}
            />
            <div className="overflow-hidden">
                {React.cloneElement(props.children, { basePath: basePath })}
            </div>
        </div>
    )
}

export default withRouter(Layout)