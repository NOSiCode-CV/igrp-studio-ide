import { SidebarInset, SidebarProvider } from '@renderer/components/ui/sidebar'
import useStudioAPI from '@renderer/hooks/use-studio-api'

import {
    getFileThree as onGetFolderFiles,
    setChangeStatus as onSetChangeStatus
} from '@renderer/redux/thunks'
import { ROUTES } from '@renderer/routes/routeConstants'
import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import type { ProjectData } from 'src/main/types'
import { IntegratedTerminal } from '../components/integrated-terminal'
import { AppIGRPSidebar } from './components/app-sidebar'
import { Footer } from './components/footer'
import Header from './components/header'
import { useNavdata } from './components/nav-data'

interface LayoutProps {
    children: React.ReactElement<{
        basePath: string
        currentItem: any
        project: ProjectData
    }>
}

const Layout = (props: LayoutProps): React.ReactNode => {
    const dispatch: any = useDispatch()
    const navigate = useNavigate()

    const { currentItem, changeStatus, config, basePath, filesThree } = useStudioAPI()

    useEffect(() => {
        dispatch(onGetFolderFiles(basePath))
    }, [basePath, dispatch])

    useEffect(() => {
        if (changeStatus) {
            dispatch(onGetFolderFiles(basePath))
            dispatch(onSetChangeStatus(false))
        }
        return undefined
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [changeStatus, basePath, dispatch])

    const { menuItems } = useNavdata(filesThree)

    useEffect(() => {
        if (!basePath) {
            navigate(ROUTES.HOME)
        }
    }, [basePath, navigate])

    return (
        <div className="[--header-height:calc(--spacing(10))] [--header-height-two:calc(--spacing(18))] [--header-height-three:calc(--spacing(30))]">
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
                        <AppIGRPSidebar
                            menuItems={menuItems}
                            config={config}
                            basePath={basePath}
                            header
                        />
                        <SidebarInset className="flex-1">
                            {React.cloneElement(props.children, {
                                basePath,
                                currentItem,
                                project: config
                            })}
                        </SidebarInset>
                    </div>
                </div>
                <Footer />
                <IntegratedTerminal />
            </SidebarProvider>
        </div>
    )
}

export default Layout
