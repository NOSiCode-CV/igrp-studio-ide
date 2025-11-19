'use client'

import { useState, useEffect, JSX } from 'react'
import {
  Wifi,
  WifiOff,
  HelpCircle,
  AlertCircle,
  Stethoscope,
  Download,
  RefreshCw
} from 'lucide-react'

import {
  IGRPButtonPrimitive,
  IGRPTooltipContentPrimitive,
  IGRPDialogPrimitive,
  IGRPDialogContentPrimitive,
  IGRPDialogHeaderPrimitive,
  IGRPDialogTitlePrimitive,
  IGRPDialogDescriptionPrimitive,
  IGRPDialogFooterPrimitive
} from '@igrp/igrp-framework-react-design-system'
import {
  IGRPTooltipPrimitive,
  IGRPTooltipProviderPrimitive,
  IGRPTooltipTriggerPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { IGRPSeparator } from '@igrp/igrp-framework-react-design-system'
import { useTranslation } from 'react-i18next'
import { DebugTerminal } from '@renderer/components/debug-terminal'
import Doctor from '@renderer/components/doctor'

interface UpdateMessage {
  type: 'checking' | 'available' | 'not-available' | 'error' | 'progress' | 'downloaded'
  message: string
  version?: string
  currentVersion?: string
  releaseNotes?: string
  releaseDate?: string
  progress?: number
  error?: string
}

// No type extension needed - handled in preload/index.d.ts

export function Footer(): JSX.Element {
  const [isOnline, setIsOnline] = useState(true)
  const [appVersion, setAppVersion] = useState('')
  const [newVersion, setNewVersion] = useState<string>('')
  const [open, setOpen] = useState<boolean>(false)
  const [updateDialogOpen, setUpdateDialogOpen] = useState<boolean>(false)
  const [updateInfo, setUpdateInfo] = useState<UpdateMessage | null>(null)
  const [log, setLog] = useState<string>('')
  const { t } = useTranslation()

  // Monitor online status
  useEffect(() => {
    const handleOnlineStatus = (): void => {
      setIsOnline(navigator.onLine)
    }

    window.addEventListener('online', handleOnlineStatus)
    window.addEventListener('offline', handleOnlineStatus)

    // Initial check
    handleOnlineStatus()

    return () => {
      window.removeEventListener('online', handleOnlineStatus)
      window.removeEventListener('offline', handleOnlineStatus)
    }
  }, [])

  useEffect(() => {
    const handleUpdateMessage = (_event: Electron.IpcRendererEvent, data: UpdateMessage): void => {
      setUpdateInfo(data)
      setLog(data.message)

      // Show dialog for available updates, progress, or downloaded updates
      if (data.type === 'available' || data.type === 'progress' || data.type === 'downloaded') {
        if (data.version) {
          setNewVersion(data.version)
        }
        setUpdateDialogOpen(true)
      }

      // Auto-close dialog after install prompt
      if (data.type === 'downloaded') {
        setTimeout(() => {
          setUpdateDialogOpen(false)
        }, 30000) // Close after 30 seconds if user doesn't act
      }
    }

    window.electron.ipcRenderer.on('message-update', handleUpdateMessage)

    return () => {
      window.electron.ipcRenderer.removeListener('message-update', handleUpdateMessage)
    }
  }, [])

  useEffect(() => {
    // Fetch app version from Electron
    window.electron
      .getAppVersion?.()
      .then((version: string) => {
        setAppVersion(version)
      })
      .catch((err: Error) => console.error('Failed to get app version:', err))
  }, [])

  useEffect(() => {
    const handleCheckUpdate = async (): Promise<void> => {
      try {
        await window.electron.checkForUpdates?.().then((version: string) => {
          if (!version) return
          setNewVersion(version)
          if (version !== appVersion) {
            setLog(t('versionAvailable', { version }))
          } else {
            setLog('')
          }
        })
      } catch (error) {
        console.error('Error checking for updates:', error)
      }
    }
    if (appVersion) handleCheckUpdate()
  }, [appVersion, t])

  const simulateError = (): void => {
    const error = new Error('This is a simulated error from the renderer process.')

    if (window.electron?.reportError) {
      window.electron.reportError(error)
      setLog('Simulated error sent to logger')
    } else {
      console.error('Electron reportError bridge is not available')
      throw error
    }
  }

  const handleInstallUpdate = async (): Promise<void> => {
    try {
      await window.electron.installUpdate?.()
    } catch (error) {
      console.error('Error installing update:', error)
    }
  }

  const formatReleaseNotes = (notes?: string): JSX.Element[] | null => {
    if (!notes) return null

    // Basic markdown-to-HTML conversion for simple formatting
    return notes.split('\n').map((line, i) => {
      if (line.startsWith('## ')) {
        return (
          <h3 key={i} className="font-semibold mt-3 mb-1">
            {line.replace('## ', '')}
          </h3>
        )
      }
      if (line.startsWith('- ')) {
        return (
          <li key={i} className="ml-4">
            {line.replace('- ', '')}
          </li>
        )
      }
      if (line.trim() === '') {
        return <br key={i} />
      }
      return (
        <p key={i} className="text-sm">
          {line}
        </p>
      )
    })
  }

  return (
    <IGRPTooltipProviderPrimitive>
      <footer className="h-8 border-t bg-card flex items-center px-3 justify-between text-xs fixed bottom-0 left-0 right-0 z-50">
        <div className="flex items-center space-x-3">
          <span className="text-muted-foreground whitespace-nowrap flex-none">
            {`${import.meta.env.VITE_APP_TITLE}`} &copy; {new Date().getFullYear()}
          </span>

          <span className="text-muted-foreground">
            {newVersion === appVersion ? (
              `v${appVersion}`
            ) : (
              <span className="flex items-center space-x-1 text-amber-600">
                <AlertCircle className="h-4 w-4" />
                <span className="truncate max-w-[calc(100vw_-_500px)]">{log}</span>
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <IGRPSeparator orientation="vertical" className="h-4" />

          <button onClick={simulateError} className="">
            Simulate Error
          </button>

          <IGRPTooltipPrimitive>
            <IGRPTooltipTriggerPrimitive asChild>
              <IGRPButtonPrimitive
                size={'icon'}
                variant={'ghost'}
                className="h-6 w-6"
                onClick={() => setOpen(!open)}
              >
                <Stethoscope className="text-muted-foreground" />
              </IGRPButtonPrimitive>
            </IGRPTooltipTriggerPrimitive>
            <IGRPTooltipContentPrimitive side="top">Doctor</IGRPTooltipContentPrimitive>
          </IGRPTooltipPrimitive>

          <DebugTerminal />

          <IGRPTooltipPrimitive>
            <IGRPTooltipTriggerPrimitive asChild>
              <div className="flex items-center space-x-1">
                {isOnline ? (
                  <Wifi className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <WifiOff className="h-3.5 w-3.5 text-destructive" />
                )}
                <span className="text-muted-foreground">{isOnline ? 'Online' : 'Offline'}</span>
              </div>
            </IGRPTooltipTriggerPrimitive>
            <IGRPTooltipContentPrimitive side="top">
              <p>{t('networkStatus')}</p>
            </IGRPTooltipContentPrimitive>
          </IGRPTooltipPrimitive>

          <IGRPTooltipPrimitive>
            <IGRPTooltipTriggerPrimitive asChild>
              <IGRPButtonPrimitive variant="ghost" size="icon" className="h-6 w-6">
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
              </IGRPButtonPrimitive>
            </IGRPTooltipTriggerPrimitive>
            <IGRPTooltipContentPrimitive side="top">
              <p>{t('helpCenter')}</p>
            </IGRPTooltipContentPrimitive>
          </IGRPTooltipPrimitive>

          <Doctor open={open} setOpen={setOpen} />
        </div>
      </footer>

      {/* Update Dialog with Release Notes */}
      <IGRPDialogPrimitive open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <IGRPDialogContentPrimitive className="max-w-2xl max-h-[80vh]">
          <IGRPDialogHeaderPrimitive>
            <IGRPDialogTitlePrimitive className="flex items-center gap-2">
              {(updateInfo?.type === 'available' || updateInfo?.type === 'progress') && (
                <>
                  <Download className="h-5 w-5 text-blue-500 animate-pulse" />
                  Downloading Update...
                </>
              )}
              {updateInfo?.type === 'downloaded' && (
                <>
                  <RefreshCw className="h-5 w-5 text-green-500" />
                  Update Ready to Install
                </>
              )}
            </IGRPDialogTitlePrimitive>
            <IGRPDialogDescriptionPrimitive>
              {updateInfo?.currentVersion && updateInfo?.version && (
                <span className="text-sm">
                  Version {updateInfo.currentVersion} &rarr; {updateInfo.version}
                </span>
              )}
              {updateInfo?.releaseDate && (
                <span className="text-xs text-muted-foreground ml-2">
                  Released: {new Date(updateInfo.releaseDate).toLocaleDateString()}
                </span>
              )}
            </IGRPDialogDescriptionPrimitive>
          </IGRPDialogHeaderPrimitive>

          {/* Release Notes Section */}
          {updateInfo?.releaseNotes && (
            <div className="mt-4 space-y-2">
              <h4 className="font-semibold text-sm">What&apos;s New:</h4>
              <div className="bg-muted/50 rounded-md p-4 max-h-[400px] overflow-y-auto">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {formatReleaseNotes(updateInfo.releaseNotes)}
                </div>
              </div>
            </div>
          )}

          {/* Progress indicator */}
          {updateInfo?.type === 'progress' && updateInfo.progress !== undefined && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Downloading...</span>
                <span className="text-sm font-semibold">{updateInfo.progress}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${updateInfo.progress}%`
                  }}
                />
              </div>
            </div>
          )}

          <IGRPDialogFooterPrimitive className="mt-6">
            {(updateInfo?.type === 'available' || updateInfo?.type === 'progress') && (
              <IGRPButtonPrimitive variant="outline" onClick={() => setUpdateDialogOpen(false)}>
                Continue in Background
              </IGRPButtonPrimitive>
            )}
            {updateInfo?.type === 'downloaded' && (
              <>
                <IGRPButtonPrimitive variant="outline" onClick={() => setUpdateDialogOpen(false)}>
                  Install Later
                </IGRPButtonPrimitive>
                <IGRPButtonPrimitive onClick={handleInstallUpdate}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Install & Restart
                </IGRPButtonPrimitive>
              </>
            )}
          </IGRPDialogFooterPrimitive>
        </IGRPDialogContentPrimitive>
      </IGRPDialogPrimitive>
    </IGRPTooltipProviderPrimitive>
  )
}
