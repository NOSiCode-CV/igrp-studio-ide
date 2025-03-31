import React, { useEffect, useState } from 'react';
import Header from './components/header';
import withRouter from '@renderer/common/withRouter';
import { ScrollArea } from '@renderer/components/ui/scroll-area';
import {
    IGRPSidebar,
    IGRPSidebarContent,
    IGRPSidebarFooter,
    SidebarItem,
    SidebarProps,
} from '@renderer/components/app-sidebar-default';
import { SidebarInset, SidebarProvider } from '@renderer/components/ui/sidebar';
import { Folder } from 'lucide-react';
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
    const [navData, setNavData] = useState<SidebarProps[]>([]);

    const {
        workspace,
        workspaces,
        actions: { getRecentWorkspaces, switchWorkspace },
    } = useWorkspace();

    useEffect(() => {
        const loadWorkspaces = async () => {
            const workspaces = await getRecentWorkspaces();

            const workspaceItems: SidebarItem[] = workspaces.map(
                (workspace: IWorkspace) => ({
                    name: workspace.name,
                    icon: Folder,
                    badge: workspace.projects?.length || 0,
                    onClick: () => {
                        switchWorkspace(workspace);
                    },
                    contextMenu: [
                        {
                            label: 'Rename',
                            action: () => console.log(workspace.id),
                        },
                        {
                            label: 'Delete',
                            action: () => console.log(workspace.id),
                        },
                    ],
                })
            );

            setNavData([
                {
                    name: 'Recentes Workspaces',
                    type: 'group',
                    items: workspaceItems,
                },
            ]);
        };

        loadWorkspaces();

        // Refresh workspaces when notified
        const refreshWorkspaces = () => loadWorkspaces();
        window.addEventListener('workspace-updated', refreshWorkspaces);

        return () => {
            window.removeEventListener('workspace-updated', refreshWorkspaces);
        };
    }, [workspace]);

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
                            <IGRPSidebarContent items={navData} searchActive={false}>
                                {workspace && (
                                    <WorkspaceSwitcher
                                        workspaces={workspaces}
                                        defaultWorkspace={workspace}
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
