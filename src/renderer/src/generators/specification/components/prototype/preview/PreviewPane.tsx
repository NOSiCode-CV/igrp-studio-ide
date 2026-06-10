import { cn } from '@renderer/lib/utils'
import type { RootState } from '@renderer/redux'
import { Layout as LayoutIcon } from 'lucide-react'
import { type CSSProperties, type JSX } from 'react'
import { useSelector } from 'react-redux'
import type { DeviceFrame } from './types'

/**
 * The "device frame" preview viewport for the Prototype's Preview tab.
 *
 * Wraps the Electron `<webview>` in a chrome-styled rectangle whose
 * width follows the active `DeviceFrame`. The traffic-light header is
 * cosmetic — it makes the framed preview feel like a real browser
 * window instead of a bare iframe.
 *
 * Empty / error states surface inline:
 *   - `installing`     → "Installing dependencies…" + link to Logs.
 *   - `running` but no `url` → "Starting preview…" (port not bound).
 *   - last error       → red banner + "Open Logs tab" CTA.
 *   - else             → "Dev server is stopped" + start hint.
 *
 * `lastError` is sourced from the last `error`-level entry in
 * `state.specPrototype.logs` so a failed start has *some* hint without
 * requiring the user to switch tabs first.
 *
 * Extracted from `PrototypePanel.tsx` as part of the prototype refactor
 * (P5 — panes).
 */
export const PreviewPane = ({
    device,
    customWidth,
    url,
    running,
    installing,
    onSwitchToLogs
}: {
    device: DeviceFrame
    customWidth: number
    url: string | null
    running: boolean
    installing: boolean
    onSwitchToLogs: () => void
}): JSX.Element => {
    // Surface the latest install/dev-server error inline. Without this, a
    // failed start would only show "Dev server is stopped" with no clue.
    const lastError = useSelector((s: RootState) => {
        const logs = s.specPrototype.logs
        for (let i = logs.length - 1; i >= 0; i--) {
            if (logs[i].level === 'error') return logs[i]
        }
        return null
    })
    const widthStyle: CSSProperties =
        device === 'desktop'
            ? { width: '100%' }
            : device === 'tablet'
              ? { width: 768 }
              : device === 'mobile'
                ? { width: 375 }
                : { width: customWidth, maxWidth: '100%' }
    return (
        <div className="flex h-full items-center justify-center">
            <div
                style={widthStyle}
                className={cn(
                    'relative h-full overflow-hidden rounded-xl border bg-white shadow-2xl transition-[width] duration-300'
                )}
            >
                <div className="flex h-8 items-center gap-1.5 border-b bg-gray-100 px-4">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                </div>
                <div className="h-[calc(100%-32px)] bg-gray-50">
                    {running && url ? (
                        <webview
                            src={url}
                            className="spec-prototype-preview"
                            style={{ width: '100%', height: '100%', border: 'none' }}
                        />
                    ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-gray-500">
                            <LayoutIcon size={48} className="opacity-20" />
                            <div className="max-w-md space-y-2 text-center text-sm">
                                {installing ? (
                                    <>
                                        <p className="font-medium text-gray-700">
                                            Installing dependencies…
                                        </p>
                                        <p className="text-[11px] italic text-gray-500">
                                            Running <code>npm install</code> for the first time.
                                            This can take a couple of minutes — see the Logs tab for
                                            live progress.
                                        </p>
                                    </>
                                ) : running ? (
                                    <>
                                        <p className="italic">Starting preview…</p>
                                        <p className="text-[11px] italic">
                                            Waiting for the dev server to bind to its port.
                                        </p>
                                    </>
                                ) : lastError ? (
                                    <>
                                        <p className="font-medium text-red-600">
                                            Dev server failed to start.
                                        </p>
                                        <pre className="max-h-32 overflow-y-auto rounded-md border border-red-200 bg-red-50 p-2 text-left text-[11px] text-red-700">
                                            {lastError.line}
                                        </pre>
                                        <button
                                            type="button"
                                            onClick={onSwitchToLogs}
                                            className="text-[11px] text-primary hover:underline"
                                        >
                                            Open Logs tab for details →
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <p className="italic">Dev server is stopped.</p>
                                        <p className="text-[11px] italic">
                                            Click ▶ in the toolbar to start, or describe a feature
                                            in the Build chat.
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
