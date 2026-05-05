/**
 * IPC handlers for the Specification Documents tab.
 * All channels live under `spec:doc:*` (see EVENTS.SPEC_DOC).
 */
import { dialog, ipcMain, BrowserWindow } from 'electron'
import { basename } from 'node:path'
import { EVENTS } from '../constants/events'
import { specDocService, type DocNode, type DocNodeType } from '../services/spec-doc-service'
import {
    specDocExportService,
    type DocExportFormat
} from '../services/spec-doc-export-service'

interface ProjectScopedPayload {
    basePath: string
}

ipcMain.handle(
    EVENTS.SPEC_DOC.LIST,
    async (_event, { basePath }: ProjectScopedPayload): Promise<DocNode[]> => {
        return specDocService.list(basePath)
    }
)

ipcMain.handle(
    EVENTS.SPEC_DOC.READ,
    async (
        _event,
        { basePath, docId }: ProjectScopedPayload & { docId: string }
    ): Promise<{ node: DocNode; content: string } | null> => {
        return specDocService.read(basePath, docId)
    }
)

ipcMain.handle(
    EVENTS.SPEC_DOC.CREATE,
    async (
        _event,
        {
            basePath,
            name,
            parentId,
            type,
            content
        }: ProjectScopedPayload & {
            name: string
            parentId?: string | null
            type?: DocNodeType
            content?: string
        }
    ): Promise<DocNode> => {
        return specDocService.create(basePath, { name, parentId, type, content })
    }
)

ipcMain.handle(
    EVENTS.SPEC_DOC.UPDATE,
    async (
        _event,
        {
            basePath,
            docId,
            content,
            name,
            kbRefs
        }: ProjectScopedPayload & {
            docId: string
            content?: string
            name?: string
            kbRefs?: string[]
        }
    ): Promise<DocNode> => {
        return specDocService.update(basePath, docId, { content, name, kbRefs })
    }
)

ipcMain.handle(
    EVENTS.SPEC_DOC.MOVE,
    async (
        _event,
        {
            basePath,
            docId,
            newParentId
        }: ProjectScopedPayload & { docId: string; newParentId: string | null }
    ): Promise<DocNode> => {
        return specDocService.move(basePath, docId, newParentId)
    }
)

ipcMain.handle(
    EVENTS.SPEC_DOC.REMOVE,
    async (
        _event,
        { basePath, docId }: ProjectScopedPayload & { docId: string }
    ): Promise<{ ok: true }> => {
        await specDocService.remove(basePath, docId)
        return { ok: true }
    }
)

ipcMain.handle(
    EVENTS.SPEC_DOC.CONVERT_AND_INSERT,
    async (
        _event,
        { sourcePath }: { sourcePath: string }
    ): Promise<{ markdown: string }> => {
        return specDocService.convertAndInsert(sourcePath)
    }
)

ipcMain.handle(
    EVENTS.SPEC_DOC.EXPORT,
    async (
        event,
        {
            basePath,
            docId,
            format
        }: ProjectScopedPayload & { docId: string; format: DocExportFormat }
    ): Promise<{ ok: boolean; path?: string; cancelled?: boolean }> => {
        const doc = await specDocService.read(basePath, docId)
        if (!doc) throw new Error(`Document ${docId} not found`)

        const baseName = doc.node.name.replace(/\.md$/i, '') || 'document'
        const extension = format === 'pdf' ? 'pdf' : 'docx'
        const filters =
            format === 'pdf'
                ? [{ name: 'PDF', extensions: ['pdf'] }]
                : [{ name: 'Word document', extensions: ['docx'] }]

        const owner = BrowserWindow.fromWebContents(event.sender) ?? undefined
        const dialogOpts = {
            title: `Export "${doc.node.name}" to ${format.toUpperCase()}`,
            defaultPath: `${baseName}.${extension}`,
            filters
        }
        const result = owner
            ? await dialog.showSaveDialog(owner, dialogOpts)
            : await dialog.showSaveDialog(dialogOpts)

        if (result.canceled || !result.filePath) {
            return { ok: false, cancelled: true }
        }

        // Make sure the chosen filename keeps the right extension; some users
        // strip it inadvertently in the save dialog.
        let target = result.filePath
        if (basename(target).toLowerCase().endsWith(`.${extension}`) === false) {
            target = `${target}.${extension}`
        }

        if (format === 'pdf') {
            await specDocExportService.exportPdf({ basePath, docId, targetPath: target })
        } else {
            await specDocExportService.exportDocx({ basePath, docId, targetPath: target })
        }
        return { ok: true, path: target }
    }
)

