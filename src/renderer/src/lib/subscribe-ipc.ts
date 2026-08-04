/**
 * Safe IPC subscription for the renderer.
 *
 * Always use the unsubscribe function returned by `ipcRenderer.on`.
 * Calling `removeListener(channel, fn)` across the contextBridge often fails
 * identity matching and leaks handlers — which multiplies toasts / side effects.
 */
export function subscribeIpc(
    channel: string,
    listener: (...args: any[]) => void
): () => void {
    const unsubscribe = window.electron.ipcRenderer.on(channel, listener)
    return typeof unsubscribe === 'function'
        ? unsubscribe
        : () => window.electron.ipcRenderer.removeListener(channel, listener)
}
