/**
 * IPC handlers for the Specification Data Models tab.
 * All channels live under `spec:data:*` (see EVENTS.SPEC_DATA).
 *
 * M7.1 surface: CRUD only. Import / DDL export / chat streaming land in
 * later milestones using the same handler file.
 */
import { promises as fsp } from 'node:fs'
import { basename } from 'node:path'
import { BrowserWindow, dialog, ipcMain } from 'electron'
import { EVENTS } from '../constants/events'
import type { DdlDialect } from '../services/data/entities-to-ddl'
import {
    applyEntityOps,
    parseEntityOps,
    type ApplyResult
} from '../services/data/entity-ops'
import {
    specDataGeneratorService,
    type DataChunk
} from '../services/data/spec-data-generator-service'
import {
    specDataService,
    type CreateEntityInput,
    type Entity,
    type EntitySummary,
    type SchemaDiff,
    type UpdateEntityPatch
} from '../services/spec-data-service'

const activeGenerations = new Map<string, AbortController>()

function emitChunk(
    webContents: Electron.WebContents,
    requestId: string,
    chunk: DataChunk
): void {
    if (webContents.isDestroyed()) return
    webContents.send(EVENTS.SPEC_DATA.GENERATE_CHUNK, { requestId, chunk })
}

interface ProjectScopedPayload {
    basePath: string
}

ipcMain.handle(
    EVENTS.SPEC_DATA.LIST,
    async (_event, { basePath }: ProjectScopedPayload): Promise<EntitySummary[]> => {
        return specDataService.list(basePath)
    }
)

ipcMain.handle(
    EVENTS.SPEC_DATA.GET,
    async (
        _event,
        { basePath, entityId }: ProjectScopedPayload & { entityId: string }
    ): Promise<Entity | null> => {
        return specDataService.get(basePath, entityId)
    }
)

ipcMain.handle(
    EVENTS.SPEC_DATA.CREATE,
    async (
        _event,
        { basePath, input }: ProjectScopedPayload & { input: CreateEntityInput }
    ): Promise<Entity> => {
        return specDataService.create(basePath, input)
    }
)

ipcMain.handle(
    EVENTS.SPEC_DATA.UPDATE,
    async (
        _event,
        {
            basePath,
            entityId,
            patch
        }: ProjectScopedPayload & { entityId: string; patch: UpdateEntityPatch }
    ): Promise<Entity> => {
        return specDataService.update(basePath, entityId, patch)
    }
)

ipcMain.handle(
    EVENTS.SPEC_DATA.REMOVE,
    async (
        _event,
        { basePath, entityId }: ProjectScopedPayload & { entityId: string }
    ): Promise<{ ok: true }> => {
        await specDataService.remove(basePath, entityId)
        return { ok: true }
    }
)

ipcMain.handle(
    EVENTS.SPEC_DATA.IMPORT_FROM_DB,
    async (
        _event,
        {
            basePath,
            connectionName,
            tables
        }: ProjectScopedPayload & { connectionName: string; tables: string[] }
    ): Promise<Entity[]> => {
        return specDataService.importFromConnection(basePath, connectionName, tables)
    }
)

ipcMain.handle(
    EVENTS.SPEC_DATA.DIFF_WITH_DB,
    async (
        _event,
        { basePath, entityId }: ProjectScopedPayload & { entityId: string }
    ): Promise<SchemaDiff> => {
        return specDataService.diffWithDb(basePath, entityId)
    }
)

ipcMain.handle(
    EVENTS.SPEC_DATA.APPLY_OPS,
    async (
        _event,
        { basePath, raw }: ProjectScopedPayload & { raw: string }
    ): Promise<ApplyResult> => {
        const payload = parseEntityOps(raw)
        return applyEntityOps(basePath, payload)
    }
)

ipcMain.handle(
    EVENTS.SPEC_DATA.GENERATE_START,
    async (
        event,
        payload: {
            requestId: string
            basePath: string
            userMessage: string
            specContext?: string
            providerId: string
            model: string
        }
    ) => {
        const { requestId } = payload
        const controller = new AbortController()
        activeGenerations.set(requestId, controller)
        const sender = event.sender
        let sawDone = false
        try {
            const stream = specDataGeneratorService.generate({
                basePath: payload.basePath,
                userMessage: payload.userMessage,
                specContext: payload.specContext,
                providerId: payload.providerId,
                model: payload.model,
                signal: controller.signal
            })
            for await (const chunk of stream) {
                emitChunk(sender, requestId, chunk)
                if (chunk.type === 'done') {
                    sawDone = true
                    break
                }
            }
        } catch (err) {
            emitChunk(sender, requestId, {
                type: 'error',
                message: err instanceof Error ? err.message : String(err)
            })
        } finally {
            if (!sawDone) emitChunk(sender, requestId, { type: 'done' })
            activeGenerations.delete(requestId)
        }
        return { ok: true }
    }
)

ipcMain.handle(
    EVENTS.SPEC_DATA.GENERATE_CANCEL,
    async (_event, { requestId }: { requestId: string }) => {
        const controller = activeGenerations.get(requestId)
        controller?.abort()
        activeGenerations.delete(requestId)
        return { ok: true }
    }
)

ipcMain.handle(
    EVENTS.SPEC_DATA.EXPORT_DDL,
    async (
        event,
        {
            basePath,
            dialect
        }: ProjectScopedPayload & { dialect: DdlDialect }
    ): Promise<{ ok: boolean; path?: string; cancelled?: boolean }> => {
        const { sql } = await specDataService.exportDdl(basePath, dialect)
        const owner = BrowserWindow.fromWebContents(event.sender) ?? undefined
        const dialogOpts = {
            title: `Export DDL (${dialect})`,
            defaultPath: `data-models.${dialect === 'mysql' ? 'mysql' : 'pg'}.sql`,
            filters: [{ name: 'SQL', extensions: ['sql'] }]
        }
        const result = owner
            ? await dialog.showSaveDialog(owner, dialogOpts)
            : await dialog.showSaveDialog(dialogOpts)
        if (result.canceled || !result.filePath) {
            return { ok: false, cancelled: true }
        }
        let target = result.filePath
        if (!basename(target).toLowerCase().endsWith('.sql')) target = `${target}.sql`
        await fsp.writeFile(target, sql, 'utf-8')
        return { ok: true, path: target }
    }
)
