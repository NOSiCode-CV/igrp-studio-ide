import React from 'react'
import Header from './components/header'
import { ToastContainer } from 'react-toastify'
import withRouter from '@renderer/common/withRouter'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import { Sidebar, SidebarData, SidebarProvider } from '@igrp/igrp-design-system'
import { SidebarInset } from '@renderer/components/ui/sidebar'

interface LayoutProps {
  children: React.ReactNode
}

const navData: SidebarData = {
  navMain: [
    {
      title: 'Home',
      url: '#'
    },
    {
      title: 'Settings',
      url: '#'
    }
  ]
}

const MainLayout = (props: LayoutProps): JSX.Element => {
  return (
    <div className="h-screen flex flex-col">
      <ToastContainer />
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <SidebarProvider>
          <Sidebar data={navData} className="mt-10">
          </Sidebar>
          <SidebarInset>
            <ScrollArea className="mb-20">{props.children}</ScrollArea>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </div>
  )
}

export default withRouter(MainLayout)
