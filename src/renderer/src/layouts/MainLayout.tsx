import React, { } from 'react';
import Header from './components/header';
import { ToastContainer } from 'react-toastify';
import withRouter from '@renderer/common/withRouter';

interface LayoutProps {
    children: React.ReactNode;
}

const MainLayout = (props: LayoutProps): JSX.Element => {

    return (
        <div className="flex flex-col h-screen">
            <ToastContainer />
            <Header />
            <main className="flex-1 overflow-auto p-6 pt-12">
                <div className="max-w-7xl mx-auto">
                    {props.children}
                </div>
            </main>
        </div>        
    )
}

export default withRouter(MainLayout)