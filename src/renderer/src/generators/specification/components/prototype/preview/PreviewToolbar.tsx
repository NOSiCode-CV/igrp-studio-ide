import { Button } from '@renderer/components/ui/button'
import { cn } from '@renderer/lib/utils'
import {
    Bug,
    Edit3,
    ExternalLink,
    Monitor,
    MoveHorizontal,
    Pause,
    Play,
    RefreshCw,
    Smartphone,
    Tablet
} from 'lucide-react'
import type { JSX } from 'react'
import { MAX_CUSTOM_VIEWPORT, MIN_CUSTOM_VIEWPORT } from '../persistence/custom-viewport'
import { DeviceButton } from './DeviceButton'
import { PagesDropdown } from './PagesDropdown'
import { PreviewModeButton } from './PreviewModeButton'
import { PreviewUrlBar } from './PreviewUrlBar'
import type { DeviceFrame, PreviewMode } from './types'

/**
 * Top-of-preview toolbar. Hosts the Preview ⇄ Edit mode toggle, the
 * device-frame pill, the optional custom-width input, the URL bar, the
 * Pages dropdown, and the action buttons (reload, start/stop dev,
 * DevTools, open-in-browser).
 *
 * In `edit` mode the device picker becomes irrelevant (we render the
 * manifest wireframe, not the running app), so it's visually
 * de-emphasised but stays clickable.
 *
 * The reload / DevTools handlers reach into the DOM by querying
 * `webview.spec-prototype-preview` directly — Electron's <webview>
 * exposes those methods but they aren't part of the React refs tree.
 *
 * Extracted from `PrototypePanel.tsx` as part of the prototype refactor
 * (P4 — preview chrome).
 */
export const PreviewToolbar = ({
    previewMode,
    onChangePreviewMode,
    device,
    onChangeDevice,
    customWidth,
    onChangeCustomWidth,
    url,
    running,
    onToggleDev,
    basePath
}: {
    previewMode: PreviewMode
    onChangePreviewMode: (mode: PreviewMode) => void
    device: DeviceFrame
    onChangeDevice: (d: DeviceFrame) => void
    customWidth: number
    onChangeCustomWidth: (next: number) => void
    url: string | null
    running: boolean
    onToggleDev: () => void
    basePath: string | undefined
}): JSX.Element => {
    const reload = () => {
        const view = document.querySelector('webview.spec-prototype-preview') as {
            reload?: () => void
        } | null
        view?.reload?.()
    }
    const toggleDevTools = () => {
        // Each Electron <webview> has its own DevTools, decoupled from the
        // host window's DevTools. Useful when debugging the running prototype
        // without leaving the Studio.
        const view = document.querySelector('webview.spec-prototype-preview') as {
            isDevToolsOpened?: () => boolean
            openDevTools?: () => void
            closeDevTools?: () => void
        } | null
        if (!view) return
        if (view.isDevToolsOpened?.()) view.closeDevTools?.()
        else view.openDevTools?.()
    }
    return (
        <div className="flex items-center gap-2">
            {/* Preview ⇄ Edit toggle — primary affordance for the right-side
                main area. In `edit` mode the device picker becomes irrelevant
                (we render the manifest wireframe, not the running app), so
                we visually de-emphasise it. */}
            <div className="flex items-center gap-0.5 rounded-md border bg-card p-0.5">
                <PreviewModeButton
                    active={previewMode === 'live'}
                    onClick={() => onChangePreviewMode('live')}
                    icon={<Play size={11} />}
                    label="Preview"
                />
                <PreviewModeButton
                    active={previewMode === 'edit'}
                    onClick={() => onChangePreviewMode('edit')}
                    icon={<Edit3 size={11} />}
                    label="Edit"
                />
            </div>
            <div
                className={cn(
                    'flex items-center gap-1 rounded-md border bg-card p-1 transition-opacity',
                    previewMode === 'edit' && 'opacity-50'
                )}
            >
                <DeviceButton
                    active={device === 'desktop'}
                    onClick={() => onChangeDevice('desktop')}
                    icon={<Monitor size={13} />}
                    title="Desktop"
                />
                <DeviceButton
                    active={device === 'tablet'}
                    onClick={() => onChangeDevice('tablet')}
                    icon={<Tablet size={13} />}
                    title="Tablet"
                />
                <DeviceButton
                    active={device === 'mobile'}
                    onClick={() => onChangeDevice('mobile')}
                    icon={<Smartphone size={13} />}
                    title="Mobile"
                />
                <DeviceButton
                    active={device === 'custom'}
                    onClick={() => onChangeDevice('custom')}
                    icon={<MoveHorizontal size={13} />}
                    title="Custom width"
                />
            </div>
            {device === 'custom' && (
                <div className="flex items-center gap-1 rounded-md border bg-card px-2 py-1 text-[11px]">
                    <input
                        type="number"
                        value={customWidth}
                        min={MIN_CUSTOM_VIEWPORT}
                        max={MAX_CUSTOM_VIEWPORT}
                        onChange={(e) => {
                            const next = Number(e.target.value)
                            if (Number.isFinite(next)) onChangeCustomWidth(next)
                        }}
                        className="w-16 bg-transparent text-right outline-none"
                    />
                    <span className="text-muted-foreground">px</span>
                </div>
            )}
            <PreviewUrlBar url={url} />
            <PagesDropdown devUrl={url} basePath={basePath} />
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={reload}
                disabled={!running}
                title="Reload preview"
            >
                <RefreshCw size={14} />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onToggleDev}
                title={running ? 'Stop dev server' : 'Start dev server'}
            >
                {running ? <Pause size={14} /> : <Play size={14} />}
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={toggleDevTools}
                disabled={!running}
                title="Toggle DevTools for the preview"
            >
                <Bug size={14} />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={!url}
                onClick={() => url && window.open(url, '_blank')}
                title="Open in browser"
            >
                <ExternalLink size={14} />
            </Button>
        </div>
    )
}
