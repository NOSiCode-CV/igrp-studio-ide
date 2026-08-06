import { SidebarInset, SidebarProvider } from '@renderer/components/ui/sidebar'
import Loader from '@renderer/components/loader'
import useStudioAPI from '@renderer/hooks/use-studio-api'
import { useRestoreStudioSession } from '@renderer/hooks/use-restore-studio-session'

import {
    getFileThree as onGetFolderFiles,
    setChangeStatus as onSetChangeStatus
} from '@renderer/redux/thunks'
import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'
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
    const { restoring, basePath: restoredBasePath } = useRestoreStudioSession()

    const { currentItem, changeStatus, config, basePath, filesThree } = useStudioAPI()
    const activeBasePath = basePath || restoredBasePath

    useEffect(() => {
        if (!activeBasePath) return
        dispatch(onGetFolderFiles(activeBasePath))
    }, [activeBasePath, dispatch])

    useEffect(() => {
        if (changeStatus && activeBasePath) {
            dispatch(onGetFolderFiles(activeBasePath))
            dispatch(onSetChangeStatus(false))
        }
        return undefined
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [changeStatus, activeBasePath, dispatch])

    const { menuItems } = useNavdata(filesThree)

    if (restoring || !activeBasePath) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader variant="fullscreen" className="h-screen w-full" />
            </div>
        )
    }

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
                    <Header config={config} basePath={activeBasePath} />

                    <div className="flex flex-1 overflow-hidden h-[calc(100svh-var(--header-height))]">
                        <AppIGRPSidebar
                            menuItems={menuItems}
                            config={config}
                            basePath={activeBasePath}
                            header
                        />
                        <SidebarInset className="flex-1">
                            {React.cloneElement(props.children, {
                                basePath: activeBasePath,
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
