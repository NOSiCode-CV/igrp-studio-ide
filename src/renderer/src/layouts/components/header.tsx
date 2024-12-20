import logo from '@renderer/assets/images/igrp-blue.svg'
import { useEffect, useState } from 'react'
import { ConfigOptions } from 'src/main/types'
import { ROUTES } from '@renderer/routes/routeConstants'
import { Bell, Code, Maximize2, Minus, Settings, Square, X } from 'lucide-react'
import { SettingsDialog } from '@renderer/components/settings-dialog'
import { HelpDialog } from '@renderer/components/help-dialog'
import { cn } from '@renderer/lib/utils'
import { ModeToggle } from '@renderer/components/mode-toogle'
import { Avatar, AvatarFallback, AvatarImage } from '@renderer/components/ui/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@renderer/components/ui/tooltip'
import { Button } from '@renderer/components/ui/button'
import { useNavigate } from 'react-router-dom'

interface HeaderProps {
  config?: ConfigOptions
  basePath?: string
}

const Header = ({ config, basePath }: HeaderProps): JSX.Element => {
  const isMac = window.api.i18nextElectronBackend.clientOptions.platform === 'darwin'

  const navigate = useNavigate()

  const [openSettings, setOpenSettings] = useState(false)

  const [openHelp, setOpenHelp] = useState(false)

  const [isMaximized, setIsMaximized] = useState(false) // New state to track maximize status

  // Window control buttons
  const handleMinimize = () => {
    window.menu.minimizeWindow()
  }

  const handleMaximize = () => {
    window.menu.maximizeWindow()
    setIsMaximized(!isMaximized) // Toggle the state
  }

  const handleClose = () => {
    window.menu.closeWindow()
  }

  const openPage = () => {
    navigate(ROUTES.HOME)
  }

  const openVSCode = async () => {
    try {
      await window.api.openVSCode(basePath)
    } catch (error) {
      console.error('Error opening VS Code:', error)
    }
  }

  useEffect(() => {
    // Check if window is maximized on mount
    const checkMaximized = async () => {
      const maximized = window.menu.isMaximized()
      setIsMaximized(maximized)
    }
    checkMaximized()
  }, [])

  const WindowButton = ({
    onClick,
    icon,
    label,
    className
  }: {
    onClick: () => void
    icon: JSX.Element
    label: string
    className?: string
  }) => (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center justify-center w-6 h-6 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300',
        className
      )}
      title={label}
    >
      {icon}
      <span className="sr-only">{label}</span>
    </button>
  )

  return (
    <> 
      <TooltipProvider>
        <header className="sticky h-10 top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center space-x-2 home cursor-pointer" onClick={openPage}>
              <img src={logo} alt="Logo" className="h-6 w-auto" />
              <p className="text-sm font-medium">IGRP Studio</p>
            </div>
            <div className="flex items-center space-x-2">
              <ModeToggle />

              {config?.name && (
                <Button variant="ghost" size="sm" onClick={openVSCode}>
                  <Code className="w-5 h-5" />
                  <span className="sr-only">Open VS Code</span>
                </Button>
              )}

              <Button variant="ghost" size="sm" onClick={() => setOpenSettings(true)}>
                <Settings className="w-5 h-5" />
                <span className="sr-only">Settings</span>
              </Button>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Bell className="w-5 h-5" />
                    <span className="sr-only">Notifications</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Notifications</p>
                </TooltipContent>
              </Tooltip>
              <Avatar className="size-8">
                <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>

              {!isMac && (
                <>
                  <WindowButton
                    onClick={handleMinimize}
                    icon={<Minus className="h-4 w-4" />}
                    label="Minimize"
                  />
                  <WindowButton
                    onClick={handleMaximize}
                    icon={
                      isMaximized ? (
                        <Square className="h-4 w-4" />
                      ) : (
                        <Maximize2 className="h-4 w-4" />
                      )
                    }
                    label={isMaximized ? 'Restore' : 'Maximize'}
                  />
                  <WindowButton
                    onClick={handleClose}
                    icon={<X className="h-4 w-4" />}
                    label="Close"
                    className="hover:bg-red-500 hover:text-white"
                  />
                </>
              )}
            </div>
          </div>
        </header>
        <SettingsDialog isOpen={openSettings} onClose={() => setOpenSettings(!openSettings)} />
        <HelpDialog isOpen={openHelp} onClose={() => setOpenHelp(!openHelp)} />
      </TooltipProvider>
    </>
  )
}

export default Header
