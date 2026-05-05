import { randomUUID } from 'crypto'
import { dialog, ipcMain } from 'electron'
import fs from 'fs'
import path from 'path'
import { EVENTS } from '../constants/events'
import { MARKITDOWN_SUPPORTED_EXTENSIONS } from '../helpers/markitdown/constants'
import { getDefaultHistoryStore } from '../helpers/markitdown/history'
import { convertFileToMarkdown, type MarkItDownConvertResult } from '../helpers/markitdown/runner'
import { MarkItDownWindowManager } from '../helpers/markitdown/window'

export const markItDownWindowManager = new MarkItDownWindowManager()

ipcMain.on(EVENTS.MARKITDOWN.OPEN_WINDOW, () => {
    markItDownWindowManager.open()
})

ipcMain.handle(
    EVENTS.MARKITDOWN.CONVERT,
    async (_event, filePath: string): Promise<MarkItDownConvertResult> => {
        if (!filePath || typeof filePath !== 'string') {
            return { ok: false, error: 'No file path provided', code: 'not-found' }
        }

        const result = await convertFileToMarkdown(filePath)

        if (result.ok) {
            try {
                const stats = await fs.promises.stat(filePath)
                await getDefaultHistoryStore().add({
                    id: randomUUID(),
                    fileName: path.basename(filePath),
                    filePath,
                    sizeBytes: stats.size,
                    markdown: result.markdown,
                    convertedAt: Date.now(),
                    durationMs: result.durationMs
                })
            } catch (err) {
                console.error('Failed to persist markitdown history entry:', err)
            }
        }

        return result
    }
)

ipcMain.handle(EVENTS.MARKITDOWN.PICK_FILE, async (): Promise<string | null> => {
    const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
            {
                name: 'Supported files',
                extensions: [...MARKITDOWN_SUPPORTED_EXTENSIONS]
            }
        ]
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
})

ipcMain.handle(
    EVENTS.MARKITDOWN.SAVE_MARKDOWN,
    async (
        _event,
        payload: { markdown: string; suggestedName?: string }
    ): Promise<{ ok: true; path: string } | { ok: false; error?: string }> => {
        if (!payload?.markdown) {
            return { ok: false, error: 'No markdown content to save' }
        }

        const result = await dialog.showSaveDialog({
            defaultPath: payload.suggestedName ? `${payload.suggestedName}.md` : 'converted.md',
            filters: [{ name: 'Markdown', extensions: ['md'] }]
        })

        if (result.canceled || !result.filePath) {
            return { ok: false }
        }

        try {
            const target = path.extname(result.filePath) ? result.filePath : `${result.filePath}.md`
            await fs.promises.writeFile(target, payload.markdown, 'utf-8')
            return { ok: true, path: target }
        } catch (err) {
            return {
                ok: false,
                error: err instanceof Error ? err.message : 'Failed to write file'
            }
        }
    }
)

ipcMain.handle(EVENTS.MARKITDOWN.GET_HISTORY, async () => {
    return await getDefaultHistoryStore().read()
})

ipcMain.handle(EVENTS.MARKITDOWN.DELETE_HISTORY_ITEM, async (_event, id: string) => {
    await getDefaultHistoryStore().remove(id)
})

ipcMain.handle(EVENTS.MARKITDOWN.CLEAR_HISTORY, async () => {
    await getDefaultHistoryStore().clear()
})
