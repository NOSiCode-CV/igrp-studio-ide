import { BrowserWindow, powerMonitor, screen } from 'electron'

/**
 * Recover Electron windows from GPU context loss after the OS resumes
 * from hibernate / suspend, or when the active display configuration
 * changes (e.g. unplugging an external monitor).
 *
 * Both cases manifest as a white/blank window because the Chromium
 * renderer keeps running but its compositor surface points at a stale
 * D3D / GL context. The cheapest reliable fix is to ask the
 * webContents to invalidate (forcing a repaint) and, on Windows, give
 * the compositor a hide/show nudge so it re-attaches to the new GPU
 * surface. We avoid full reloadIgnoringCache() because it would drop
 * unsaved renderer state.
 *
 * Inspired by the workaround proposed in
 * https://github.com/anthropics/claude-code/issues/21803 with the
 * magic-timer + full-reload smells removed.
 */
export function registerPowerRecovery(): void {
    const recover = (): void => {
        for (const win of BrowserWindow.getAllWindows()) {
            if (win.isDestroyed()) continue
            try {
                win.webContents.invalidate()
                if (process.platform === 'win32' && win.isVisible()) {
                    win.hide()
                    win.show()
                }
            } catch (error) {
                console.error('[power-recovery] failed to refresh window:', error)
            }
        }
    }

    powerMonitor.on('resume', recover)
    powerMonitor.on('unlock-screen', recover)
    screen.on('display-metrics-changed', recover)
}
