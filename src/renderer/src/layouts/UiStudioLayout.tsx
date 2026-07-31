import { SidebarProvider } from '@renderer/components/ui/sidebar'
import Loader from '@renderer/components/loader'
import { PermissionCatalogProvider } from '@renderer/generators/ui/permission-catalog/PermissionCatalogContext'
import { useRestoreStudioSession } from '@renderer/hooks/use-restore-studio-session'
import React from 'react'
import { useSelector } from 'react-redux'
import { createSelector } from '@reduxjs/toolkit'
import { IntegratedTerminal } from '../components/integrated-terminal'
import { Footer } from './components/footer'
import Header from './components/header'

interface LayoutProps {
    children: React.ReactElement<{ basePath: string }>
}

export interface RootState {
    PageBuilder: {
        config: any
        basePath: string
    }
}

const Layout = (props: LayoutProps): React.JSX.Element => {
    const selectStudioState = (state: RootState) => state.PageBuilder
    const selectStudioProperties = createSelector(selectStudioState, (studio) => ({
        config: studio.config,
        basePath: studio.basePath
    }))

    const { restoring, basePath: restoredBasePath } = useRestoreStudioSession()
    const { config, basePath } = useSelector(selectStudioProperties)
    const activeBasePath = basePath || restoredBasePath

    if (restoring || !activeBasePath) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader variant="fullscreen" className="h-screen w-full" />
            </div>
        )
    }

    return (
        <div className="[--header-height:calc(--spacing(10))] [--header-height-two:calc(--spacing(20))] [--header-height-three:calc(--spacing(28))]">
            <SidebarProvider
                style={
                    {
                        '--sidebar-width': '380px'
                    } as React.CSSProperties
                }
            >
                <div className="h-screen flex flex-col w-full">
                    <Header config={config} basePath={activeBasePath} />

                    <div className="flex flex-1 overflow-hidden h-[calc(100svh-var(--header-height))]">
                        <PermissionCatalogProvider>
                            {React.cloneElement(props.children, {
                                basePath: activeBasePath
                            })}
                        </PermissionCatalogProvider>
                    </div>
                    <Footer />
                    <IntegratedTerminal />
                </div>
            </SidebarProvider>
        </div>
    )
}

export default Layout
