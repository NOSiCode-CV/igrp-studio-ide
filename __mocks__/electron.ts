<<<<<<< HEAD
const handlers = new Map<string, Function>()

export const ipcMain = {
    handle: jest.fn((channel: string, handler: Function) => {
        handlers.set(channel, handler)
    }),
    getHandler: (channel: string) => handlers.get(channel),
    clearHandlers: () => handlers.clear()
}
=======
export const app = {
    isPackaged: false,
    getPath: (_name: string): string => '/tmp/igrp-studio-test',
    getVersion: (): string => '0.0.0-test'
}

export const ipcMain = {
    on: (): void => undefined,
    handle: (): void => undefined,
    removeAllListeners: (): void => undefined
}

export const ipcRenderer = {
    send: (): void => undefined,
    invoke: async (): Promise<unknown> => undefined,
    on: (): void => undefined,
    removeAllListeners: (): void => undefined
}

export const BrowserWindow = class {}
export const dialog = {
    showOpenDialog: async (): Promise<unknown> => ({ canceled: true, filePaths: [] }),
    showSaveDialog: async (): Promise<unknown> => ({ canceled: true })
}
export const shell = { openExternal: (): void => undefined }
export const screen = { getDisplayMatching: (): unknown => ({ bounds: {} }) }
export const webUtils = { getPathForFile: (): string => '' }
>>>>>>> 005b03579fa56b07662536df7b88901cf2a4549a
