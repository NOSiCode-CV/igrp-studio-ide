/**
 * Monitoring phase 1: Sentry on main process only (no OTLP).
 * Call initMainSentryEarly() right after dotenv; registerMainMonitoringHooks() when the app window is created.
 */

import * as Sentry from '@sentry/electron/main'
import { app, ipcMain } from 'electron'
import { v4 as uuidv4 } from 'uuid'

const sessionId: string = uuidv4()
let sentryMainEnabled = false
let monitoringHooksRegistered = false

function applyMainScope(metadata?: Record<string, string>): void {
    Sentry.withScope((scope: Sentry.Scope) => {
        scope.setTag('session_id', sessionId)
        scope.setTag('process_type', process.type ?? 'browser')
        scope.setContext('device', {
            osVersion: process.getSystemVersion(),
            platform: process.platform,
            electronVersion: process.versions.electron
        })
        if (metadata) {
            for (const [k, v] of Object.entries(metadata)) {
                scope.setTag(k, v)
            }
        }
    })
}

/**
 * Call immediately after `dotenv.config()` so uncaught errors during startup can be reported.
 */
export function initMainSentryEarly(metadata?: Record<string, string>): void {
    if (sentryMainEnabled) return

    const sentryDsn = process.env.SENTRY_DSN
    if (!sentryDsn) {
        console.warn('[Sentry] SENTRY_DSN not set; main process monitoring disabled.')
        return
    }

    const environment =
        process.env.SENTRY_ENVIRONMENT ?? (app.isPackaged ? 'production' : 'development')

    try {
        Sentry.init({
            dsn: sentryDsn,
            environment,
            release: app.getVersion(),
            tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE
                ? Number(process.env.SENTRY_TRACES_SAMPLE_RATE)
                : 0,
            attachStacktrace: true,
            beforeSend(event) {
                event.tags = {
                    ...event.tags,
                    session_id: sessionId,
                    process_type: process.type ?? 'browser'
                }
                return event
            }
        })
        applyMainScope(metadata)
        sentryMainEnabled = true
        console.log('[Sentry] Main process initialized')
    } catch (error) {
        console.error('[Sentry] Main init failed:', error)
    }
}

/**
 * IPC and app-level hooks (call once when creating the main window).
 */
export function registerMainMonitoringHooks(): void {
    if (monitoringHooksRegistered) return
    monitoringHooksRegistered = true

    ipcMain.handle(
        'send-error-report',
        async (
            _event,
            {
                error,
                context = {}
            }: {
                error: unknown
                context?: Record<string, unknown>
            }
        ) => {
            return await sendErrorReport(deserializeError(error), context)
        }
    )

    process.on('unhandledRejection', (reason) => {
        const err = reason instanceof Error ? reason : new Error(String(reason))
        void sendErrorReport(err, { errorType: 'unhandledRejection' })
    })

    app.on('render-process-gone', (_event, _webContents, details) => {
        const err = new Error(`Renderer process gone: ${details.reason}`)
        void sendErrorReport(err, {
            errorType: 'rendererProcessGone',
            exitCode: details.exitCode,
            reason: details.reason
        })
    })
}

/** @deprecated Phase 1: use initMainSentryEarly + registerMainMonitoringHooks; kept for call sites. */
export async function initializeLogger(_config?: {
    metadata?: Record<string, string>
}): Promise<void> {
    initMainSentryEarly(_config?.metadata)
    registerMainMonitoringHooks()
    console.log('[Monitoring] Logger registered (Sentry main), session:', sessionId)
}

function deserializeError(errorObj: unknown): Error {
    if (errorObj instanceof Error) return errorObj

    const serializedError = errorObj as { message?: string; name?: string; stack?: string }

    const error = new Error(serializedError.message || 'Unknown error')
    error.name = serializedError.name || 'Error'
    error.stack = serializedError.stack
    return error
}

export async function sendErrorReport(
    error: Error,
    additionalAttributes: Record<string, unknown> = {}
): Promise<string | null> {
    if (!sentryMainEnabled) {
        console.error('[Monitoring] Sentry not configured:', error)
        return null
    }

    try {
        const timestamp = Date.now()
        const errorId = uuidv4()

        Sentry.withScope((scope) => {
            scope.setTag('error_id', errorId)
            scope.setTag('process_type', process.type ?? 'browser')
            scope.setExtra('sessionId', sessionId)
            scope.setExtra('appVersion', app.getVersion())
            for (const [key, value] of Object.entries(additionalAttributes)) {
                scope.setExtra(key, value)
            }
            scope.setContext('error', {
                timestamp: new Date(timestamp).toISOString(),
                osVersion: process.getSystemVersion(),
                electronVersion: process.versions.electron
            })
            Sentry.captureException(error)
        })

        return errorId
    } catch (e) {
        console.error('[Monitoring] sendErrorReport failed:', e)
        return null
    }
}

export async function shutdownLogger(): Promise<void> {
    try {
        if (sentryMainEnabled) {
            await Sentry.close(2000)
            sentryMainEnabled = false
        }
        console.log('[Monitoring] Shutdown complete')
    } catch (error) {
        console.error('[Monitoring] Shutdown failed:', error)
    }
}
