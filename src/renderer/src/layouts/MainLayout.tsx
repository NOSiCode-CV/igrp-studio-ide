import {
    IGRPScrollAreaPrimitive,
    IGRPSidebarInsetPrimitive,
    IGRPSidebarProviderPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { UpdateModalBottomLeft } from '@renderer/components/update-banner'
import { IntegratedTerminal } from '@renderer/components/integrated-terminal'
import { useGitTokenExpiredToast } from '@renderer/hooks/use-git-token-expired-toast'
import { useWorkspace } from '@renderer/hooks/use-workspace'
import {
    Sidebar,
    SidebarContent,
    SidebarFooter
} from '@renderer/layouts/components/app-sidebar-default'
import { FileText } from 'lucide-react'
import type React from 'react'
import { useMemo } from 'react'
import { WorkspaceSwitcher } from '../browser/workspaces/components/workspace-switch'
import { Footer } from './components/footer'
import FooterSidebar from './components/footer-sidebar'
import Header from './components/header'

interface LayoutProps {
    children: React.ReactNode
}

const MainLayout = (props: LayoutProps): React.ReactElement => {
    useGitTokenExpiredToast()
    const {
        workspace,
        actions: { switchWorkspace }
    } = useWorkspace()

    const navData = useMemo(
        () => [
            {
                name: 'Markdown Converter',
                type: 'item' as const,
                icon: FileText,
                onClick: () => window.markitdown?.openWindow()
            }
        ],
        []
    )

    return (
        <div className="[--header-height:calc(--spacing(10))] [--header-height-two:calc(--spacing(18))]">
            <IGRPSidebarProviderPrimitive>
                <div className="flex flex-col w-full h-screen">
                    <Header />

                    <div className="flex flex-1 overflow-hidden">
                        <Sidebar className="!top-(--header-height)  h-[calc(100svh-var(--header-height-two))] group-data-[side=left]:border-r-0">
                            <SidebarContent items={[...navData]}>
                                {workspace && (
                                    <WorkspaceSwitcher
                                        defaultWorkspace={workspace}
                                        onWorkspaceChange={switchWorkspace}
                                    />
                                )}
                            </SidebarContent>
                            <SidebarFooter
                                items={[]}
                                className="items-center text-xs text-muted-foreground"
                            >
                                <FooterSidebar />
                            </SidebarFooter>
                        </Sidebar>
                        <IGRPSidebarInsetPrimitive className="flex-1">
                            <IGRPScrollAreaPrimitive className="h-[calc(100svh-var(--header-height-two))]">
                                {props.children}
                            </IGRPScrollAreaPrimitive>
                        </IGRPSidebarInsetPrimitive>
                    </div>
                    <Footer />
                    <IntegratedTerminal />
                    <UpdateModalBottomLeft />
                </div>
            </IGRPSidebarProviderPrimitive>
        </div>
    )
}

export default MainLayout
