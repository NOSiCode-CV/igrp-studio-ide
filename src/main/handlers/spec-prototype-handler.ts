/**
 * IPC for the Prototype builder. Mirrors the LLM streaming pattern: renderer
 * starts a request with a `requestId`, main streams chunks back via
 * `spec:prototype:generate-chunk`, and the renderer can cancel via
 * `generate-cancel`.
 *
 * The other channels are conventional request/response (file tree, snapshots,
 * dev server lifecycle, export).
 */
import { execFile } from 'node:child_process'
import fs from 'node:fs'
import { promises as fsp } from 'node:fs'
import { promisify } from 'node:util'
import { BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { join, relative } from 'node:path'
import { EVENTS } from '../constants/events'
import { GitService } from '../services/git-service'
import { applyFileOps, parseFileOps } from '../services/prototype/file-ops'
import { prototypeDevServer } from '../services/prototype/prototype-dev-server'
import {
    prototypeGeneratorService,
    type PrototypeChunk
} from '../services/prototype/prototype-generator-service'

const execFileAsync = promisify(execFile)

const PROTOTYPE_SUBDIR = 'prototype'
const TREE_IGNORE = new Set([
    'node_modules',
    '.next',
    '.turbo',
    '.git',
    'dist',
    'build',
    'out',
    '.cache'
])

const activeGenerations = new Map<string, AbortController>()

function emit(webContents: Electron.WebContents, requestId: string, chunk: PrototypeChunk): void {
    if (webContents.isDestroyed()) return
    webContents.send(EVENTS.SPEC_PROTOTYPE.GENERATE_CHUNK, { requestId, chunk })
}

ipcMain.handle(
    EVENTS.SPEC_PROTOTYPE.GENERATE_START,
    async (
        event,
        payload: {
            requestId: string
            basePath: string
            userMessage: string
            specContext?: string
            lastTurnSummary?: string
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
            const stream = prototypeGeneratorService.generate({
                basePath: payload.basePath,
                userMessage: payload.userMessage,
                specContext: payload.specContext,
                lastTurnSummary: payload.lastTurnSummary,
                providerId: payload.providerId,
                model: payload.model,
                signal: controller.signal
            })
            for await (const chunk of stream) {
                emit(sender, requestId, chunk)
                if (chunk.type === 'done') {
                    sawDone = true
                    break
                }
            }
        } catch (err) {
            emit(sender, requestId, {
                type: 'error',
                message: err instanceof Error ? err.message : String(err)
            })
        } finally {
            if (!sawDone) emit(sender, requestId, { type: 'done' })
            activeGenerations.delete(requestId)
            // Tree changed (likely) — ping the renderer so the Files tab refreshes.
            if (!sender.isDestroyed())
                sender.send(EVENTS.SPEC_PROTOTYPE.TREE_CHANGED, { basePath: payload.basePath })
        }
        return { ok: true }
    }
)

ipcMain.handle(
    EVENTS.SPEC_PROTOTYPE.GENERATE_CANCEL,
    async (_event, { requestId }: { requestId: string }) => {
        const controller = activeGenerations.get(requestId)
        controller?.abort()
        activeGenerations.delete(requestId)
        return { ok: true }
    }
)

/**
 * Manual fallback — applies a JSON ops payload that the user pasted/edited.
 * Used by the renderer when it wants to re-apply a snapshot's ops without
 * going through the LLM again.
 */
ipcMain.handle(
    EVENTS.SPEC_PROTOTYPE.APPLY_OPS,
    async (
        _event,
        { basePath, raw }: { basePath: string; raw: string }
    ): Promise<{ summary: string; applied: number; failed: number }> => {
        const payload = parseFileOps(raw)
        const result = await applyFileOps(basePath, payload)
        return {
            summary: payload.summary,
            applied: result.applied.length,
            failed: result.failed.length
        }
    }
)

ipcMain.handle(
    EVENTS.SPEC_PROTOTYPE.LIST_FILES,
    async (_event, { basePath }: { basePath: string }) => {
        const root = join(basePath, PROTOTYPE_SUBDIR)
        if (!fs.existsSync(root)) return []
        return walkTree(root)
    }
)

ipcMain.handle(
    EVENTS.SPEC_PROTOTYPE.READ_FILE,
    async (
        _event,
        { basePath, path }: { basePath: string; path: string }
    ): Promise<{ content: string } | null> => {
        const root = join(basePath, PROTOTYPE_SUBDIR)
        const target = join(root, path)
        const rel = relative(root, target)
        if (rel.startsWith('..') || !fs.existsSync(target)) return null
        const content = await fsp.readFile(target, 'utf-8')
        return { content }
    }
)

ipcMain.handle(
    EVENTS.SPEC_PROTOTYPE.READ_FILE_AT,
    async (
        _event,
        { basePath, ref, path }: { basePath: string; ref: string; path: string }
    ): Promise<{ content: string | null }> => {
        // Sandbox the path against the prototype root so the IPC can't be
        // tricked into reading arbitrary files via `..` traversal. We resolve
        // the join result and require it to land inside the root.
        const root = join(basePath, PROTOTYPE_SUBDIR)
        const target = join(root, path)
        const rel = relative(root, target)
        if (rel.startsWith('..') || rel === '') return { content: null }
        // Refs are constrained to a small alphabet to keep them out of the
        // shell — `git show` accepts SHAs, branch names, `HEAD`, `HEAD~N`.
        if (!/^[A-Za-z0-9_/.~^-]+$/.test(ref)) return { content: null }
        return GitService.showFileAtCommit(root, ref, rel)
    }
)

ipcMain.handle(
    EVENTS.SPEC_PROTOTYPE.START_DEV,
    async (_event, { basePath }: { basePath: string }) => {
        return prototypeDevServer.start(basePath)
    }
)

ipcMain.handle(
    EVENTS.SPEC_PROTOTYPE.STOP_DEV,
    async (_event, { basePath }: { basePath: string }) => {
        return prototypeDevServer.stop(basePath)
    }
)

ipcMain.handle(
    EVENTS.SPEC_PROTOTYPE.DEV_STATUS,
    async (_event, { basePath }: { basePath: string }) => {
        return prototypeDevServer.status(basePath)
    }
)

ipcMain.handle(
    EVENTS.SPEC_PROTOTYPE.GET_DEV_LOG_BUFFER,
    async (_event, { basePath, limit }: { basePath: string; limit?: number }) => {
        return prototypeDevServer.getLogBuffer(basePath, limit ?? 200)
    }
)

ipcMain.handle(
    EVENTS.SPEC_PROTOTYPE.LIST_SNAPSHOTS,
    async (_event, { basePath }: { basePath: string }) => {
        const root = join(basePath, PROTOTYPE_SUBDIR)
        if (!fs.existsSync(join(root, '.git'))) return []
        return GitService.listCommits(root, 'HEAD', 50)
    }
)

ipcMain.handle(
    EVENTS.SPEC_PROTOTYPE.RESTORE_SNAPSHOT,
    async (_event, { basePath, sha }: { basePath: string; sha: string }) => {
        const root = join(basePath, PROTOTYPE_SUBDIR)
        if (!fs.existsSync(join(root, '.git'))) {
            throw new Error('Prototype is not under version control yet.')
        }
        if (!/^[a-f0-9]{4,40}$/i.test(sha)) {
            throw new Error(`Invalid commit hash: ${sha}`)
        }
        await execFileAsync('git', ['reset', '--hard', sha], { cwd: root })
        return { ok: true, sha }
    }
)

ipcMain.handle(
    EVENTS.SPEC_PROTOTYPE.EXPORT,
    async (
        event,
        { basePath }: { basePath: string }
    ): Promise<{
        ok: boolean
        path?: string
        cancelled?: boolean
    }> => {
        const root = join(basePath, PROTOTYPE_SUBDIR)
        if (!fs.existsSync(root)) {
            throw new Error('Prototype folder does not exist yet.')
        }
        const win = BrowserWindow.fromWebContents(event.sender)
        const dialogOptions = {
            title: 'Export prototype to…',
            properties: ['openDirectory', 'createDirectory'] as Array<
                'openDirectory' | 'createDirectory'
            >
        }
        const result = win
            ? await dialog.showOpenDialog(win, dialogOptions)
            : await dialog.showOpenDialog(dialogOptions)
        if (result.canceled || result.filePaths.length === 0) {
            return { ok: false, cancelled: true }
        }
        const target = join(result.filePaths[0], 'prototype-export')
        await copyDir(root, target)
        return { ok: true, path: target }
    }
)

ipcMain.handle(
    EVENTS.SPEC_PROTOTYPE.OPEN_FOLDER,
    async (
        _event,
        { basePath }: { basePath: string }
    ): Promise<{ ok: boolean; error?: string }> => {
        const root = join(basePath, PROTOTYPE_SUBDIR)
        if (!fs.existsSync(root)) {
            return { ok: false, error: 'Prototype folder does not exist yet.' }
        }
        const errMsg = await shell.openPath(root)
        return errMsg ? { ok: false, error: errMsg } : { ok: true }
    }
)

// ─── helpers ────────────────────────────────────────────────────────────

interface TreeEntry {
    path: string
    type: 'file' | 'folder'
}

function walkTree(root: string): TreeEntry[] {
    const out: TreeEntry[] = []
    const stack = [root]
    while (stack.length > 0) {
        const dir = stack.pop()
        if (!dir) break
        let entries
        try {
            entries = fs.readdirSync(dir, { withFileTypes: true })
        } catch {
            continue
        }
        for (const entry of entries) {
            if (TREE_IGNORE.has(entry.name)) continue
            const full = join(dir, entry.name)
            const rel = relative(root, full).replace(/\\/g, '/')
            if (entry.isDirectory()) {
                out.push({ path: rel, type: 'folder' })
                stack.push(full)
            } else {
                out.push({ path: rel, type: 'file' })
            }
        }
    }
    return out.sort((a, b) => a.path.localeCompare(b.path))
}

async function copyDir(from: string, to: string): Promise<void> {
    await fsp.mkdir(to, { recursive: true })
    const entries = await fsp.readdir(from, { withFileTypes: true })
    for (const entry of entries) {
        if (TREE_IGNORE.has(entry.name)) continue
        const src = join(from, entry.name)
        const dst = join(to, entry.name)
        if (entry.isDirectory()) {
            await copyDir(src, dst)
        } else {
            await fsp.copyFile(src, dst)
        }
    }
}
