import React from 'react'
import Header from './components/header'
import { ToastContainer } from 'react-toastify'
import withRouter from '@renderer/common/withRouter'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import {
  IGRPSidebar,
  IGRPSidebarContent,
  SidebarProvider
} from '@igrp/igrp-design-system'
import { SidebarInset } from '@renderer/components/ui/sidebar'
import { Home, Settings } from 'lucide-react'
import { SidebarData } from '@igrp/igrp-design-system/dist/types'

interface LayoutProps {
  children: React.ReactNode
}

const navData: SidebarData[] = [
  {
    title: 'Home',
    url: '#',
    icon: Home
  },
  {
    title: 'Settings',
    url: '#',
    icon: Settings
  }
]

const MainLayout = (props: LayoutProps): JSX.Element => {
  return (
    <div className="h-screen flex flex-col">
      <ToastContainer />
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <SidebarProvider>
          <IGRPSidebar className="mt-10">
            <IGRPSidebarContent items={navData} />
          </IGRPSidebar>
          <SidebarInset>
            <ScrollArea className="mb-20">
              {props.children}
            </ScrollArea>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </div>
  )
}

export default withRouter(MainLayout)
