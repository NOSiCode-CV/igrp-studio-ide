import React from 'react';
import Header from './components/header';
import { ToastContainer } from 'react-toastify';
import withRouter from '@renderer/common/withRouter';
import { createSelector } from 'reselect';
import { useSelector } from 'react-redux';

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
            <div className="main-content overflow-hidden">
                {React.cloneElement(props.children, { basePath: basePath })}
            </div>
        </div>
    )
}

export default withRouter(Layout)