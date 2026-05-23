/**
 * IPC handlers for the Specification Knowledge Base.
 *
 * All channels are namespaced under `spec:kb:*` (see EVENTS.SPEC_KB). Progress
 * updates are pushed by `spec-kb-service` directly via `webContents.send` —
 * the renderer subscribes through the preload wrapper.
 */
import { ipcMain } from 'electron'
import { EVENTS } from '../constants/events'
import { specKBService, type KBItem } from '../services/spec-kb-service'

interface ProjectScopedPayload {
    basePath: string
}

ipcMain.handle(
    EVENTS.SPEC_KB.LIST,
    async (_event, { basePath }: ProjectScopedPayload): Promise<KBItem[]> => {
        return specKBService.list(basePath)
    }
)

ipcMain.handle(
    EVENTS.SPEC_KB.GET,
    async (
        _event,
        { basePath, itemId }: ProjectScopedPayload & { itemId: string }
    ): Promise<{ item: KBItem; markdown?: string } | null> => {
        return specKBService.get(basePath, itemId)
    }
)

ipcMain.handle(
    EVENTS.SPEC_KB.ADD_FILE,
    async (
        _event,
        { basePath, filePath }: ProjectScopedPayload & { filePath: string }
    ): Promise<KBItem> => {
        return specKBService.addSource(basePath, { kind: 'file', filePath })
    }
)

ipcMain.handle(
    EVENTS.SPEC_KB.ADD_URL,
    async (
        _event,
        { basePath, url, youtube }: ProjectScopedPayload & { url: string; youtube?: boolean }
    ): Promise<KBItem> => {
        return specKBService.addSource(basePath, {
            kind: youtube ? 'youtube' : 'url',
            url
        })
    }
)

ipcMain.handle(
    EVENTS.SPEC_KB.REINDEX,
    async (
        _event,
        { basePath, itemId }: ProjectScopedPayload & { itemId: string }
    ): Promise<KBItem | null> => {
        return specKBService.reindex(basePath, itemId)
    }
)

ipcMain.handle(
    EVENTS.SPEC_KB.REMOVE,
    async (
        _event,
        { basePath, itemId }: ProjectScopedPayload & { itemId: string }
    ): Promise<{ ok: true }> => {
        await specKBService.remove(basePath, itemId)
        return { ok: true }
    }
)

ipcMain.handle(
    EVENTS.SPEC_KB.SEARCH,
    async (
        _event,
        {
            basePath,
            query,
            topK,
            kbItemIds
        }: ProjectScopedPayload & {
            query: string
            topK?: number
            kbItemIds?: string[]
        }
    ) => {
        return specKBService.search(basePath, query, topK ?? 8, { kbItemIds })
    }
)
