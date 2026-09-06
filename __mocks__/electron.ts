/**
 * Minimal Electron stub for Jest (testEnvironment: 'node').
 *
 * The main-process modules under `src/main/**` import from `electron`. Jest
 * resolves those imports to this file via `moduleNameMapper` in
 * `jest.config.ts`. Only the surface used by tested code is stubbed — extend
 * as new tests touch new electron surfaces.
 */

const handlers = new Map<string, Function>()

export const app = {
    isPackaged: false,
    getPath: (_name: string): string => '/tmp/igrp-studio-test',
    getVersion: (): string => '0.0.0-test',
    getName: (): string => 'igrp-studio-test'
}

export const ipcMain = {
    on: (_channel: string, _listener: (...args: any[]) => any): void => undefined,
    handle: jest.fn((channel: string, handler: Function) => {
        handlers.set(channel, handler)
    }),
    removeHandler: (_channel: string): void => undefined,
    removeAllListeners: (_channel?: string): void => undefined,
    getHandler: (channel: string) => handlers.get(channel),
    clearHandlers: () => handlers.clear()
}

export const ipcRenderer = {
    send: (_channel: string, ..._args: any[]): void => undefined,
    invoke: async (_channel: string, ..._args: any[]): Promise<unknown> => undefined,
    on: (_channel: string, _listener: (...args: any[]) => any): void => undefined,
    removeListener: (_channel: string, _listener: (...args: any[]) => any): void => undefined,
    removeAllListeners: (_channel?: string): void => undefined
}

export const dialog = {
    showOpenDialog: async () => ({ canceled: true, filePaths: [] as string[] }),
    showSaveDialog: async () => ({ canceled: true, filePath: undefined }),
    showMessageBox: async () => ({ response: 0, checkboxChecked: false })
}

export const net = {
    request: (..._args: any[]) => {
        const listeners = new Map<string, (...a: any[]) => void>()
        const request = {
            on: (event: string, callback: (...a: any[]) => void) => {
                listeners.set(event, callback)
                return request
            },
            end: () => {
                // Keep network checks deterministic and local in Jest. The
                // production Electron implementation performs the real HEAD
                // request; the test double reports a successful response on
                // the next microtask so callers never hang on an unhandled
                // request object.
                queueMicrotask(() => listeners.get('response')?.({ statusCode: 204 }))
            },
            write: (_chunk: any) => undefined,
            abort: () => listeners.get('abort')?.()
        }
        return request
    },
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

export const screen = {
    getDisplayMatching: (): unknown => ({ bounds: {} })
}

export const webUtils = {
    getPathForFile: (): string => ''
}

// Marker for `import type { IpcMainInvokeEvent } from 'electron'` consumers.
// At runtime, type-only imports are erased, so no value export is needed.
export type IpcMainInvokeEvent = unknown
