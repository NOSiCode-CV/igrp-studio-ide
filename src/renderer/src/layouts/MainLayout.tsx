import React, { useMemo } from 'react';
import Header from './components/header';
import { ScrollArea } from '@renderer/components/ui/scroll-area';
import {
    IGRPSidebar,
    IGRPSidebarContent,
    IGRPSidebarFooter,
} from '@renderer/layouts/components/app-sidebar-default';
import { SidebarInset, SidebarProvider } from '@renderer/components/ui/sidebar';
import { BrainCircuit, Database } from 'lucide-react';
import FooterSidebar from './components/footer-sidebar';
import { Footer } from './components/footer';
import { Toaster } from '@renderer/components/ui/sonner';
import { useWorkspace } from '@renderer/hooks/use-workspace';
import { WorkspaceSwitcher } from '../pages/workspaces/components/workspace-switch';

interface LayoutProps {
    children: React.ReactNode;
}

const MainLayout = (props: LayoutProps) => {
    const {
        workspace,
        actions: { switchWorkspace },
    } = useWorkspace();

    const navData = useMemo(
        () => [
            {
                name: 'Database',
                type: 'item' as const,
                icon: Database,
                href: '#',
            },
           /*  {
                name: 'App Logic',
                type: 'item' as const,
                icon: BrainCircuit,
                href: '#/app-logic',
            }, */
        ],
        []
    );

    return (
        <div className="[--header-height:calc(--spacing(10))] [--header-height-two:calc(--spacing(18))]">
            <SidebarProvider>
                <div className="flex flex-col w-full h-screen">
                    <Toaster
                        position="top-right"
                        richColors
                        closeButton
                        expand
                    />
                    <Header />

                    <div className="flex flex-1 overflow-hidden">
                        <IGRPSidebar className="!top-(--header-height)  h-[calc(100svh-var(--header-height-two))]">
                            <IGRPSidebarContent items={[...navData]}>
                                {workspace && (
                                    <WorkspaceSwitcher
                                        defaultWorkspace={workspace}
                                        onWorkspaceChange={switchWorkspace}
                                    />
                                )}
                            </IGRPSidebarContent>
                            <IGRPSidebarFooter
                                items={[]}
                                className="items-center text-xs text-muted-foreground"
                            >
                                <FooterSidebar />
                            </IGRPSidebarFooter>
                        </IGRPSidebar>
                        <SidebarInset className="flex-1">
                            <ScrollArea className="h-[calc(100svh-var(--header-height-two))]">
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

export default MainLayout;
