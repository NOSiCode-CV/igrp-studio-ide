const handlers = new Map<string, Function>()

export const ipcMain = {
    handle: jest.fn((channel: string, handler: Function) => {
        handlers.set(channel, handler)
    }),
    getHandler: (channel: string) => handlers.get(channel),
    clearHandlers: () => handlers.clear()
}
