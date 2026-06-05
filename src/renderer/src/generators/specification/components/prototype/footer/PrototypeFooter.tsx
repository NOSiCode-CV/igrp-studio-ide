import { Button } from '@renderer/components/ui/button'
import type { RootState } from '@renderer/redux'
import { AlertCircle, Download, FolderOpen, RotateCcw } from 'lucide-react'
import { useCallback, type JSX } from 'react'
import { useDispatch, useSelector } from 'react-redux'

/**
 * Bottom action bar of the Prototype tab.
 *
 * Exposes three actions:
 *   - Export project… — packages the prototype folder via
 *     `window.specPrototype.export`, then alerts the destination path.
 *   - Open folder — opens the prototype directory in the OS file
 *     manager via `window.specPrototype.openFolder`.
 *   - Reset prototype — confirm-then-stop-dev + dispatch
 *     `protoReset` to clear local state (files, logs, snapshots,
 *     manifest). Destructive, hence the red treatment.
 *
 * Also surfaces the last `state.specPrototype.error` inline so a
 * background failure isn't invisible while the user is in another
 * pane.
 *
 * Extracted from `PrototypePanel.tsx` as part of the prototype refactor
 * (P6 — chat chrome + footer).
 */
export const PrototypeFooter = ({ basePath }: { basePath?: string }): JSX.Element => {
    const dispatch = useDispatch<any>()
    const lastError = useSelector((s: RootState) => s.specPrototype.error)

    const handleExport = useCallback(async () => {
        if (!basePath) return
        try {
            const result = await window.specPrototype.export(basePath)
            if (result.ok && result.path) {
                window.alert(`Exported to:\n${result.path}`)
            }
        } catch (err) {
            window.alert(`Export failed: ${err instanceof Error ? err.message : String(err)}`)
        }
    }, [basePath])

    const handleOpenFolder = useCallback(async () => {
        if (!basePath) return
        try {
            const result = await window.specPrototype.openFolder(basePath)
            if (!result.ok && result.error) {
                window.alert(`Open folder failed: ${result.error}`)
            }
        } catch (err) {
            window.alert(`Open folder failed: ${err instanceof Error ? err.message : String(err)}`)
        }
    }, [basePath])

    const handleReset = useCallback(async () => {
        if (!basePath) return
        if (!window.confirm('Stop the dev server and clear local prototype state?')) return
        await window.specPrototype.stopDev(basePath)
        dispatch({ type: 'specPrototype/protoReset' })
    }, [basePath, dispatch])

    return (
        <footer className="flex h-12 shrink-0 items-center justify-between border-t bg-card px-4">
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-2 text-xs"
                    onClick={handleExport}
                    disabled={!basePath}
                >
                    <Download size={14} /> Export project…
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-2 text-xs"
                    onClick={handleOpenFolder}
                    disabled={!basePath}
                    title="Open the prototype folder in your file manager"
                >
                    <FolderOpen size={14} /> Open folder
                </Button>
                <span className="ml-2 truncate text-[10px] text-muted-foreground">
                    {basePath ?? '—'}
                </span>
                {lastError && (
                    <span className="ml-3 flex items-center gap-1 text-[10px] text-red-500">
                        <AlertCircle size={11} />
                        <span className="max-w-[280px] truncate" title={lastError}>
                            {lastError}
                        </span>
                    </span>
                )}
            </div>
            <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-2 text-xs text-red-500 hover:bg-red-500/10"
                onClick={handleReset}
                disabled={!basePath}
            >
                <RotateCcw size={14} /> Reset prototype
            </Button>
        </footer>
    )
}
