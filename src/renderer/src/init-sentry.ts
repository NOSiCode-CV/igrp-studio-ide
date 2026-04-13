/**
 * Sentry renderer (Electron) — Phase 1.
 * DSN comes from import.meta.env.VITE_SENTRY_DSN (injected from SENTRY_DSN at build in electron.vite.config).
 */
import * as Sentry from '@sentry/electron/renderer'

export function initRendererSentry(): void {
    const dsn = import.meta.env.VITE_SENTRY_DSN
    if (!dsn) {
        if (import.meta.env.DEV) {
            console.info('[Sentry] Renderer: no DSN (set SENTRY_DSN in .env for dev)')
        }
        return
    }

    const environment = import.meta.env.DEV ? 'development' : 'production'

    try {
        Sentry.init({
            dsn,
            environment,
            autoSessionTracking: false,
            tracesSampleRate: 0,
            attachStacktrace: true
        })

        if (import.meta.env.DEV && import.meta.env.VITE_SENTRY_TEST === 'true') {
            Sentry.captureMessage('IGRP Studio — Sentry renderer smoke test (dev)')
            console.info('[Sentry] Dev smoke test event sent (VITE_SENTRY_TEST=true)')
        }
    } catch (e) {
        console.error('[Sentry] Renderer init failed:', e)
    }
}

export function captureRendererException(
    error: Error,
    context?: Record<string, unknown>
): void {
    if (!import.meta.env.VITE_SENTRY_DSN) return
    Sentry.withScope((scope) => {
        if (context) {
            for (const [k, v] of Object.entries(context)) {
                scope.setExtra(k, v)
            }
        }
        Sentry.captureException(error)
    })
}
