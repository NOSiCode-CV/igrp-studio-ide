import React, { useMemo } from 'react';
import Header from './components/header';
import withRouter from '@renderer/common/withRouter';
import { ScrollArea } from '@renderer/components/ui/scroll-area';
import {
    IGRPSidebar,
    IGRPSidebarContent,
    IGRPSidebarFooter,
} from '@renderer/components/app-sidebar-default';
import { SidebarInset, SidebarProvider } from '@renderer/components/ui/sidebar';
import { Database, Folder } from 'lucide-react';
import FooterSidebar from './components/footer-sidebar';
import { Footer } from './components/footer';
import { Toaster } from '@renderer/components/ui/sonner';
import { useWorkspace } from '@renderer/hooks/use-workspace';
import { IWorkspace } from 'src/main/types';
import { WorkspaceSwitcher } from './components/workspace-switch';

interface LayoutProps {
    children: React.ReactNode;
}

const MainLayout = (props: LayoutProps) => {
    const {
        workspace,
        workspaces,
        actions: { switchWorkspace },
    } = useWorkspace();

    const workspaceItems = useMemo(() => {
        return workspaces.map((workspace: IWorkspace) => ({
            name: workspace.name,
            icon: Folder,
            badge: workspace.projects?.length || 0,
            onClick: () => switchWorkspace(workspace),
            contextMenu: [
                { label: 'Rename', action: () => console.log(workspace.id) },
                { label: 'Delete', action: () => console.log(workspace.id) },
            ],
            href:"#"
        }));
    }, [workspaces]);

    const navData = useMemo(
        () => [
            {
                name: 'Database',
                type: "item" as const,
                items: workspaceItems,
                icon: Database,
                href:"#"
            },
        ],
        [workspaceItems]
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
                            <IGRPSidebarContent items={navData}>
                                {workspace && (
                                    <WorkspaceSwitcher
                                        workspaces={workspaces}
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

export default withRouter(MainLayout);
