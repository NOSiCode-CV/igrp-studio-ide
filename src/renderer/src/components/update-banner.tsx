'use client'

import { useState, useEffect, useCallback, JSX } from 'react'
import { Package, Download, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  IGRPButtonPrimitive,
  IGRPDialogPrimitive,
  IGRPDialogContentPrimitive,
  IGRPDialogHeaderPrimitive,
  IGRPDialogTitlePrimitive,
  IGRPDialogDescriptionPrimitive,
  IGRPDialogFooterPrimitive
} from '@igrp/igrp-framework-react-design-system'

const STORAGE_KEY = 'igrp-studio-update-dismissed'
export const SHOW_UPDATE_MODAL_EVENT = 'igrp-studio:show-update-modal'

export interface UpdateMessage {
  type: 'checking' | 'available' | 'not-available' | 'error' | 'progress' | 'downloaded'
  message: string
  version?: string
  currentVersion?: string
  releaseNotes?: string
  releaseDate?: string
  progress?: number
  error?: string
}

function formatReleaseNotes(notes?: string): JSX.Element[] | null {
  if (!notes) return null
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

export function UpdateModalBottomLeft(): JSX.Element | null {
  const { t } = useTranslation()
  const [updateInfo, setUpdateInfo] = useState<UpdateMessage | null>(null)
  const [dismissedVersion, setDismissedVersion] = useState<string | null>(null)
  const [userRequestedOpen, setUserRequestedOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const isDismissed = useCallback(() => {
    if (!updateInfo?.version) return false
    try {
      return sessionStorage.getItem(STORAGE_KEY) === updateInfo.version
    } catch {
      return false
    }
  }, [updateInfo?.version])

  const handleLater = useCallback(() => {
    if (updateInfo?.version) {
      try {
        sessionStorage.setItem(STORAGE_KEY, updateInfo.version)
      } catch {
        // ignore
      }
      setDismissedVersion(updateInfo.version)
      setUserRequestedOpen(false)
    }
  }, [updateInfo?.version])

  const handleInstallNow = useCallback(async () => {
    if (updateInfo?.type === 'downloaded') {
      try {
        await window.electron.installUpdate?.()
      } catch (err) {
        console.error('Error installing update:', err)
      }
      return
    }
    // type === 'available' ou 'progress': garantir que o download arranca e abrir modal com progresso
    if (updateInfo?.type === 'available' || updateInfo?.type === 'progress') {
      try {
        await window.electron.downloadUpdate?.()
      } catch (err) {
        console.error('Error starting download:', err)
      }
    }
    setDetailsOpen(true)
  }, [updateInfo?.type])

  useEffect(() => {
    const handleUpdateMessage = (_event: Electron.IpcRendererEvent, data: UpdateMessage): void => {
      setUpdateInfo(data)
      // Não restaurar dismissedVersion do sessionStorage: ao abrir a app o modal deve mostrar
      // quando há atualização. "Later" só esconde até o utilizador clicar no footer ou reabrir a app.
    }
    window.electron?.ipcRenderer?.on('message-update', handleUpdateMessage)
    return () => {
      window.electron?.ipcRenderer?.removeListener('message-update', handleUpdateMessage)
    }
  }, [])

  useEffect(() => {
    const onShowRequest = (): void => setUserRequestedOpen(true)
    window.addEventListener(SHOW_UPDATE_MODAL_EVENT, onShowRequest)
    return () => window.removeEventListener(SHOW_UPDATE_MODAL_EVENT, onShowRequest)
  }, [])

  const hasUpdate =
    updateInfo &&
    (updateInfo.type === 'available' ||
      updateInfo.type === 'progress' ||
      updateInfo.type === 'downloaded') &&
    updateInfo.version

  const show =
    hasUpdate && (userRequestedOpen || (dismissedVersion !== updateInfo.version && !isDismissed()))

  if (!show) return null

  const isDownloaded = updateInfo.type === 'downloaded'
  const isProgress = updateInfo.type === 'progress'

  return (
    <>
      {/* Modal fixo no canto inferior esquerdo (acima do footer) */}
      <div
        className="fixed bottom-10 left-4 z-50 w-[320px] rounded-lg border border-border bg-card p-3 shadow-lg text-card-foreground"
        role="alert"
      >
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Package className="h-4 w-4 text-primary" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">{t('new_update_available')}</p>
            {updateInfo.version && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {isDownloaded
                  ? t('update_ready')
                  : isProgress && updateInfo.progress != null
                    ? `${t('downloading')} ${updateInfo.progress}%`
                    : `${updateInfo.currentVersion || ''} → ${updateInfo.version}`}
              </p>
            )}
            <div className="flex items-center gap-2 mt-3">
              <IGRPButtonPrimitive
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground text-xs"
                onClick={handleLater}
              >
                {t('later')}
              </IGRPButtonPrimitive>
              <IGRPButtonPrimitive
                size="sm"
                className="rounded-full px-3 text-xs bg-primary text-primary-foreground hover:opacity-90"
                onClick={handleInstallNow}
              >
                {isDownloaded ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    {t('install_now')}
                  </>
                ) : (
                  <>
                    <Download className="h-3 w-3 mr-1" />
                    {t('install_now')}
                  </>
                )}
              </IGRPButtonPrimitive>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de detalhes (release notes + progress) */}
      <IGRPDialogPrimitive open={detailsOpen} onOpenChange={setDetailsOpen}>
        <IGRPDialogContentPrimitive className="max-w-2xl max-h-[80vh]">
          <IGRPDialogHeaderPrimitive>
            <IGRPDialogTitlePrimitive className="flex items-center gap-2">
              {(updateInfo?.type === 'available' || updateInfo?.type === 'progress') && (
                <>
                  <Download className="h-5 w-5 text-blue-500 animate-pulse" />
                  {t('downloading_update')}
                </>
              )}
              {updateInfo?.type === 'downloaded' && (
                <>
                  <RefreshCw className="h-5 w-5 text-green-500" />
                  {t('update_ready')}
                </>
              )}
            </IGRPDialogTitlePrimitive>
            <IGRPDialogDescriptionPrimitive>
              {updateInfo?.currentVersion && updateInfo?.version && (
                <span className="text-sm">
                  {t('version')} {updateInfo.currentVersion} → {updateInfo.version}
                </span>
              )}
              {updateInfo?.releaseDate && (
                <span className="text-xs text-muted-foreground ml-2">
                  {t('released')}: {new Date(updateInfo.releaseDate).toLocaleDateString()}
                </span>
              )}
            </IGRPDialogDescriptionPrimitive>
          </IGRPDialogHeaderPrimitive>

          {updateInfo?.releaseNotes && (
            <div className="mt-4 space-y-2">
              <h4 className="font-semibold text-sm">{t('whats_new')}</h4>
              <div className="bg-muted/50 rounded-md p-4 max-h-[400px] overflow-y-auto">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {formatReleaseNotes(updateInfo.releaseNotes)}
                </div>
              </div>
            </div>
          )}

          {updateInfo?.type === 'progress' && updateInfo.progress != null && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">{t('downloading')}</span>
                <span className="text-sm font-semibold">{updateInfo.progress}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${updateInfo.progress}%` }}
                />
              </div>
            </div>
          )}

          <IGRPDialogFooterPrimitive className="mt-6">
            <IGRPButtonPrimitive variant="outline" onClick={() => setDetailsOpen(false)}>
              {t('continue_background')}
            </IGRPButtonPrimitive>
            {updateInfo?.type === 'downloaded' && (
              <IGRPButtonPrimitive
                onClick={async () => {
                  try {
                    await window.electron.installUpdate?.()
                  } catch (err) {
                    console.error(err)
                  }
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('install_restart')}
              </IGRPButtonPrimitive>
            )}
          </IGRPDialogFooterPrimitive>
        </IGRPDialogContentPrimitive>
      </IGRPDialogPrimitive>
    </>
  )
}
