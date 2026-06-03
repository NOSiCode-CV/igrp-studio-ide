import { SidebarProvider } from '@renderer/components/ui/sidebar'
import { ROUTES } from '@renderer/routes/routeConstants'
import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
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

    const navigate = useNavigate()

    const { config, basePath } = useSelector(selectStudioProperties)

    useEffect(() => {
        if (!basePath) {
            navigate(ROUTES.IDE_INITIAL_SCREEN, { replace: true })
        }
    }, [navigate, basePath])

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
                    <Header config={config} basePath={basePath} />

                    <div className="flex flex-1 overflow-hidden h-[calc(100svh-var(--header-height))]">
                        {React.cloneElement(props.children, {
                            basePath: basePath
                        })}
                    </div>
                    <Footer />
                    <IntegratedTerminal />
                </div>
            </SidebarProvider>
        </div>
    )
}

export default Layout
