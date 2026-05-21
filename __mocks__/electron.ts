/**
 * Minimal Electron stub for Jest (testEnvironment: 'node').
 *
 * The main-process modules under `src/main/**` import from `electron`. Jest
 * resolves those imports to this file via `moduleNameMapper` in
 * `jest.config.ts`. Only the surface used by tested code is stubbed — extend
 * as new tests touch new electron surfaces.
 */

export const app = {
    getVersion: () => '0.0.0-test',
    getPath: (_name: string) => '/tmp/test-app',
    getName: () => 'igrp-studio-test',
    isPackaged: false
}

export const ipcMain = {
    handle: (_channel: string, _listener: (...args: any[]) => any) => undefined,
    on: (_channel: string, _listener: (...args: any[]) => any) => undefined,
    removeHandler: (_channel: string) => undefined,
    removeAllListeners: (_channel?: string) => undefined
}

export const ipcRenderer = {
    invoke: async (_channel: string, ..._args: any[]) => undefined,
    send: (_channel: string, ..._args: any[]) => undefined,
    on: (_channel: string, _listener: (...args: any[]) => any) => undefined,
    removeListener: (_channel: string, _listener: (...args: any[]) => any) => undefined
}

export const dialog = {
    showOpenDialog: async () => ({ canceled: true, filePaths: [] as string[] }),
    showSaveDialog: async () => ({ canceled: true, filePath: undefined }),
    showMessageBox: async () => ({ response: 0, checkboxChecked: false })
}

export const net = {
    request: (..._args: any[]) => ({
        on: (_evt: string, _cb: (...a: any[]) => void) => undefined,
        end: () => undefined,
        write: (_chunk: any) => undefined,
        abort: () => undefined
    }),
    isOnline: () => true
}

export class BrowserWindow {
    static getAllWindows() {
        return [] as BrowserWindow[]
    }
    static getFocusedWindow(): BrowserWindow | null {
        return null
    }
    webContents = {
        send: (_channel: string, ..._args: any[]) => undefined,
        on: (_channel: string, _listener: (...args: any[]) => any) => undefined
    }
    close() { /* noop */ }
    loadURL(_url: string) { /* noop */ }
    loadFile(_file: string) { /* noop */ }
}

export const shell = {
    openExternal: async (_url: string) => undefined,
    openPath: async (_path: string) => ''
}

export const Menu = {
    setApplicationMenu: () => undefined,
    buildFromTemplate: () => ({ popup: () => undefined })
}

export const Notification = class {
    constructor(_opts?: any) {}
    show() { /* noop */ }
}

// Marker for `import type { IpcMainInvokeEvent } from 'electron'` consumers.
// At runtime, type-only imports are erased, so no value export is needed.
export type IpcMainInvokeEvent = unknown
