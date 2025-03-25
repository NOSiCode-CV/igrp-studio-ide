import React from 'react';
import Header from './components/header';
import withRouter from '@renderer/common/withRouter';
import { ScrollArea } from '@renderer/components/ui/scroll-area';
import {
    IGRPSidebar,
    IGRPSidebarContent,
    IGRPSidebarFooter,
    SidebarProvider,
} from '@igrp/igrp-framework-react-design-system';
import { SidebarInset } from '@renderer/components/ui/sidebar';
import { Home } from 'lucide-react';
import { SidebarProps } from '@igrp/igrp-framework-react-design-system/dist/types/globals';
import FooterSidebar from './components/footer-sidebar';
import { Footer } from './components/footer';
import { Toaster } from '@renderer/components/ui/sonner';

interface LayoutProps {
    children: React.ReactNode;
}

const navData: SidebarProps[] = [
    {
        name: 'Home',
        href: '#/',
        icon: Home,
    },
];

const MainLayout = (props: LayoutProps) => {
    return (
        <div className="[--header-height:calc(--spacing(10))] [--header-height-two:calc(--spacing(18))]">
            <SidebarProvider>
                <div className="flex flex-col w-full h-screen">
                    <Toaster position="top-right" richColors closeButton expand/>
                    <Header />

                    <div className="flex flex-1 overflow-hidden">
                        <IGRPSidebar className="mt-10 h-[calc(100svh-var(--header-height-two))]">
                            <IGRPSidebarContent items={navData} />
                            <IGRPSidebarFooter
                                items={[]}
                                className="items-center text-xs text-muted-foreground"
                            >
                                <FooterSidebar />
                            </IGRPSidebarFooter>
                        </IGRPSidebar>
                        <SidebarInset className="flex-1">
                            <ScrollArea className="h-[calc(100svh-var(--header-height))]">
                                {props.children}
                            </ScrollArea>
                        </SidebarInset>
                    </div>
                    <Footer />
                </div>
            </SidebarProvider>
        </div>
    );
};

export default withRouter(MainLayout);
