/**
 * Checks for a newer `@igrp/cli` and surfaces it in the header notifications bell.
 *
 * Throttled to at most once per hour (on mount + window focus), matching the
 * skill-update check pattern. Dismiss is keyed by the offered latest version
 * so a newer release reappears.
 */
import { useCallback, useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
    removeNotification,
    upsertNotification,
    type AppNotification
} from '@renderer/redux/notifications/reducer'

export const CLI_UPDATE_NOTIFICATION_ID = 'cli-update'
export const CLI_UPDATE_DISMISS_KEY = 'igrp-cli-update-dismissed'
const CHECK_THROTTLE_MS = 60 * 60 * 1000

function readDismissedVersion(): string | null {
    try {
        return window.localStorage?.getItem(CLI_UPDATE_DISMISS_KEY) ?? null
    } catch {
        return null
    }
}

export function dismissCliUpdate(version: string): void {
    try {
        window.localStorage?.setItem(CLI_UPDATE_DISMISS_KEY, version)
    } catch {
        // private mode etc.
    }
}

export function clearCliUpdateDismiss(): void {
    try {
        window.localStorage?.removeItem(CLI_UPDATE_DISMISS_KEY)
    } catch {
        // noop
    }
}

export function useIgrpCliUpdateCheck(): void {
    const dispatch = useDispatch()
    const { t } = useTranslation()
    const lastCheckRef = useRef(0)
    const inFlightRef = useRef(false)

    const runCheck = useCallback(async () => {
        if (typeof window === 'undefined' || !window.api?.checkIGRPCLI) return
        if (inFlightRef.current) return
        if (Date.now() - lastCheckRef.current < CHECK_THROTTLE_MS && lastCheckRef.current > 0) {
            return
        }

        inFlightRef.current = true
        try {
            const result = await window.api.checkIGRPCLI()
            lastCheckRef.current = Date.now()

            if (!result.hasUpdate || !result.latest || !result.installed) {
                dispatch(removeNotification(CLI_UPDATE_NOTIFICATION_ID))
                return
            }

            if (readDismissedVersion() === result.latest) {
                dispatch(removeNotification(CLI_UPDATE_NOTIFICATION_ID))
                return
            }

            const notification: AppNotification = {
                id: CLI_UPDATE_NOTIFICATION_ID,
                title: t('cliUpdateAvailableTitle'),
                message: t('cliUpdateAvailableMessage', {
                    installed: result.installed,
                    latest: result.latest
                }),
                timestamp: Date.now(),
                read: false,
                type: 'warning',
                action: {
                    type: 'update-igrp-cli',
                    labelKey: 'cliUpdateAction'
                },
                meta: {
                    installed: result.installed,
                    latest: result.latest
                }
            }
            dispatch(upsertNotification(notification))
        } catch {
            // Network / PATH blip — keep previous state; don't alarm.
        } finally {
            inFlightRef.current = false
        }
    }, [dispatch, t])

    useEffect(() => {
        void runCheck()
        const onFocus = () => {
            void runCheck()
        }
        window.addEventListener('focus', onFocus)
        return () => window.removeEventListener('focus', onFocus)
    }, [runCheck])
}
