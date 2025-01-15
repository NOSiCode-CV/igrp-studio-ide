import React from 'react';
import Header from './components/header';
import { ToastContainer } from 'react-toastify';
import withRouter from '@renderer/common/withRouter';
import { ScrollArea } from '@renderer/components/ui/scroll-area';
import {
    IGRPSidebar,
    IGRPSidebarContent,
    IGRPSidebarFooter,
    SidebarProvider,
} from '@igrp/igrp-design-system';
import { SidebarInset } from '@renderer/components/ui/sidebar';
import { Home, Settings } from 'lucide-react';
import { SidebarProps } from '@igrp/igrp-design-system/dist/types';
import Footer from './components/footer';

interface LayoutProps {
    children: React.ReactNode;
}

const navData: SidebarProps[] = [
    {
        name: 'Home',
        href: '#',
        icon: Home,
    },
    {
        name: 'Settings',
        href: '#',
        icon: Settings,
    },
];

const MainLayout = (props: LayoutProps): JSX.Element => {
    return (
        <div className="h-screen flex flex-col">
            <ToastContainer />
            <Header />

            <div className="flex flex-1 overflow-hidden">
                <SidebarProvider>
                    <IGRPSidebar className="mt-10">
                        <IGRPSidebarContent items={navData} />
                        <IGRPSidebarFooter
                            items={[]}
                            className="mb-10 items-center text-xs text-muted-foreground"
                        >
                            <Footer />
                        </IGRPSidebarFooter>
                    </IGRPSidebar>
                    <SidebarInset>
                        <ScrollArea className="h-full">
                            {props.children}
                        </ScrollArea>
                    </SidebarInset>
                </SidebarProvider>
            </div>
        </div>
    );
};

export default withRouter(MainLayout);
