// noinspection ES6MissingAwait

'use client'

import {
    IGRPButtonPrimitive,
    IGRPCombobox,
    IGRPLabelPrimitive,
    IGRPSeparator
} from '@igrp/igrp-framework-react-design-system'
import logo from '@renderer/assets/images/igrp-green.svg'
import { SHOW_UPDATE_MODAL_EVENT } from '@renderer/components/update-banner'
import useToast from '@renderer/hooks/useToast'
import { CircleArrowUp, Download, Loader2, RefreshCw } from 'lucide-react'
import { type JSX, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

type UpdateChannel = 'stable' | 'beta'

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

export function AboutSettings(): JSX.Element {
    const { t } = useTranslation()
    const { showWarningToast, showSuccessToast } = useToast()
    const [appVersion, setAppVersion] = useState('')
    const [updateInfo, setUpdateInfo] = useState<UpdateMessage | null>(null)
    const [isCheckingUpdate, setIsCheckingUpdate] = useState(false)
    const [updateChannel, setUpdateChannel] = useState<UpdateChannel>('stable')

    const checkForUpdates = async (): Promise<void> => {
        setIsCheckingUpdate(true)
        try {
            const newVersion = await window.electron.checkForUpdates?.()
            if (!newVersion || newVersion === appVersion) {
                showSuccessToast(t('you_are_running_latest_version'))
            } else {
                showSuccessToast(t('found_new_version') + ' ' + newVersion)
                window.dispatchEvent(new CustomEvent(SHOW_UPDATE_MODAL_EVENT))
            }
        } catch {
            showWarningToast(t('update_check_failed'))
        } finally {
            setIsCheckingUpdate(false)
        }
    }

    const openUpdateModal = (): void => {
        window.dispatchEvent(new CustomEvent(SHOW_UPDATE_MODAL_EVENT))
    }

    useEffect(() => {
        if (window.electron?.getAppVersion) {
            window.electron.getAppVersion().then((version: string) => {
                setAppVersion(version)
            })
        }
    }, [])

    useEffect(() => {
        const electron = window.electron as Window['electron'] & {
            getUpdateChannel?: () => Promise<UpdateChannel>
            setUpdateChannel?: (c: UpdateChannel) => Promise<void>
            reconfigureUpdateChannel?: () => Promise<void>
        }
        electron?.getUpdateChannel?.().then((channel: UpdateChannel) => {
            setUpdateChannel(channel)
        })
    }, [])

    const handleUpdateChannelChange = async (channel: string): Promise<void> => {
        const value = channel as UpdateChannel
        if (value !== 'stable' && value !== 'beta') return
        const electron = window.electron as Window['electron'] & {
            setUpdateChannel?: (c: UpdateChannel) => Promise<void>
            reconfigureUpdateChannel?: () => Promise<void>
        }
        try {
            await electron?.setUpdateChannel?.(value)
            await electron?.reconfigureUpdateChannel?.()
            setUpdateChannel(value)
            showSuccessToast(t('update_channel_changed'))
        } catch {
            showWarningToast(t('update_check_failed'))
        }
    }

    useEffect(() => {
        const handleUpdateMessage = (
            _event: Electron.IpcRendererEvent,
            data: UpdateMessage
        ): void => {
            setUpdateInfo(data)

            if (
                data.type === 'available' ||
                data.type === 'progress' ||
                data.type === 'downloaded'
            ) {
                setIsCheckingUpdate(false)
                window.dispatchEvent(new CustomEvent(SHOW_UPDATE_MODAL_EVENT))
            }

            if (data.type === 'not-available') {
                setIsCheckingUpdate(false)
            }

            if (data.type === 'error') {
                setIsCheckingUpdate(false)
                showWarningToast(data.error || data.message || t('update_check_failed'))
            }
        }

        window.electron.ipcRenderer.on('message-update', handleUpdateMessage)

        return () => {
            window.electron.ipcRenderer.removeListener('message-update', handleUpdateMessage)
        }
    }, [])

    return (
        <div>
            <div className="pb-4">
                <h2 className="text-lg font-semibold">{t('about')}</h2>
            </div>
            <div className="space-y-6">
                {/* App Info */}
                <div className="flex items-start space-x-4">
                    <div className="relative h-16 w-16 overflow-hidden rounded-lg border bg-background flex items-center justify-center">
                        <img
                            src={logo}
                            alt="App icon"
                            width={56}
                            height={56}
                            className="object-cover"
                        />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-xl font-semibold">{import.meta.env.VITE_APP_TITLE}</h2>

                        {updateInfo?.version && updateInfo.version !== appVersion ? (
                            <div className="space-y-1">
                                <p className="text-sm text-igrp font-medium">
                                    {t('found_new_version')} {updateInfo.version}
                                </p>
                                {updateInfo.type === 'progress' && (
                                    <p className="text-xs text-muted-foreground">
                                        {t('downloading')}... {updateInfo.progress}%
                                    </p>
                                )}
                                {updateInfo.type === 'downloaded' && (
                                    <p className="text-xs text-green-600">
                                        ✓ {t('ready_to_install')}
                                    </p>
                                )}
                                <IGRPButtonPrimitive
                                    className="gap-2 mt-1"
                                    size="sm"
                                    variant="outline"
                                    onClick={openUpdateModal}
                                >
                                    {updateInfo.type === 'downloaded' ? (
                                        <RefreshCw className="h-4 w-4" />
                                    ) : (
                                        <Download className="h-4 w-4" />
                                    )}
                                    {updateInfo.type === 'downloaded'
                                        ? t('install_restart')
                                        : t('view_progress')}
                                </IGRPButtonPrimitive>
                            </div>
                        ) : (
                            <p className="text-muted-foreground">
                                {t('currentVersion', {
                                    version: appVersion
                                }) || `Version ${appVersion}`}
                            </p>
                        )}
                        <div className="flex items-center gap-2 pt-1">
                            {(!updateInfo?.version || updateInfo.version === appVersion) && (
                                <IGRPButtonPrimitive
                                    className="gap-2"
                                    size="sm"
                                    onClick={checkForUpdates}
                                    disabled={isCheckingUpdate}
                                >
                                    {isCheckingUpdate ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <CircleArrowUp className="h-4 w-4" />
                                    )}
                                    {t('check_update')}
                                </IGRPButtonPrimitive>
                            )}
                        </div>
                    </div>
                </div>

                <IGRPSeparator />

                {/* Update channel (beta / stable) */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium">{t('updateChannel')}</h3>
                    <p className="text-xs text-muted-foreground">{t('updateChannelDescription')}</p>
                    <div className="space-y-2 flex flex-col">
                        <IGRPLabelPrimitive htmlFor="update-channel">
                            {t('updateChannel')}
                        </IGRPLabelPrimitive>
                        <IGRPCombobox
                            id="update-channel"
                            value={updateChannel}
                            options={[
                                { value: 'stable', label: t('updateChannelStable') },
                                { value: 'beta', label: t('updateChannelBeta') }
                            ]}
                            onChange={(value) => handleUpdateChannelChange(value as string)}
                        />
                    </div>
                </div>

                <IGRPSeparator />

                {/* Software Update */}
                {/*  <div className="space-y-4">
          <h3 className="text-sm font-medium">{t('software_update')}</h3>
          <div className="flex items-center space-x-2">
            <IGRPCheckboxPrimitive id="notifications" />
            <label
              htmlFor="notifications"
              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {t('remind_me')}
            </label>
          </div>
        </div> */}

                {/*  <IGRPSeparator /> */}

                {/* Other Information */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium">{t('other_information')}</h3>
                    <div className="flex flex-row items-start space-y-1">
                        <IGRPButtonPrimitive
                            variant="link"
                            size={'sm'}
                            onClick={() =>
                                window.electron.ipcRenderer.send(
                                    'open-external-url',
                                    'https://docs3.igrp.cv/instalacao/download-exe'
                                )
                            }
                        >
                            {t('get_latest_version')}
                        </IGRPButtonPrimitive>
                        <IGRPButtonPrimitive
                            variant="link"
                            size={'sm'}
                            onClick={() =>
                                window.electron.ipcRenderer.send(
                                    'open-external-url',
                                    'https://igrp.cv/en/terms'
                                )
                            }
                        >
                            {t('terms_of_service')}
                        </IGRPButtonPrimitive>
                        <IGRPButtonPrimitive
                            variant="link"
                            size={'sm'}
                            onClick={() =>
                                window.electron.ipcRenderer.send(
                                    'open-external-url',
                                    'https://igrp.cv/en/privacy'
                                )
                            }
                        >
                            {t('privacy_policy')}
                        </IGRPButtonPrimitive>
                    </div>
                </div>
            </div>
        </div>
    )
}
