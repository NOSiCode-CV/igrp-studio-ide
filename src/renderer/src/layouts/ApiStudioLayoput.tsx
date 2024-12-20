import React, { useEffect } from 'react'
import { ToastContainer } from 'react-toastify'
import withRouter from '@renderer/common/withRouter'
import { createSelector } from 'reselect'
import { useDispatch, useSelector } from 'react-redux'

import {
  getPages as onGetFolderFiles,
  setChangeStatus as onSetChangeStatus
} from '@renderer/redux/thunks'

import Header from './components/header'
import Navdata from './components/nav-data'
import { SidebarInset, SidebarProvider } from '@renderer/components/ui/sidebar'
import VerticalMenu from './components/vertical-menu'
import { AppSidebar } from './components/app-sidebar'

interface LayoutProps {
  children: React.ReactElement<{ basePath: string }>;
}

const Layout = (props: LayoutProps): JSX.Element => {
  const dispatch: any = useDispatch()

  const selectStudioState = (state: any) => state.PageBuilder
  const selectStudioProperties = createSelector(selectStudioState, (studio) => ({
    config: studio.config,
    folders: studio.folderFiles,
    basePath: studio.basePath,
    changeStatus: studio.changeStatus
  }))

  const { changeStatus, config, basePath, folders } = useSelector(selectStudioProperties)

  useEffect(() => {
    dispatch(onGetFolderFiles(basePath))
  }, [basePath, dispatch])

  useEffect(() => {
    if (changeStatus) {
      dispatch(onGetFolderFiles(basePath))
      dispatch(onSetChangeStatus(false))
    }
  }, [changeStatus, basePath, dispatch])

  const menuItems = Navdata(folders).menuItems

  return (
    <SidebarProvider>
      <div className="h-screen flex flex-col w-full">
        <ToastContainer />
        <Header config={config} basePath={basePath} />

        <div className="flex flex-1 overflow-hidden">
          <VerticalMenu config={config} />
          <AppSidebar
            menuItems={menuItems}
            className="mt-10 ml-20"
            config={config}
            basePath={basePath}
            header
          />
          <SidebarInset className="flex-1">
            <div className="overflow-hidden">
              {React.cloneElement(props.children, { basePath: basePath })}
            </div>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  )
}

export default withRouter(Layout)
