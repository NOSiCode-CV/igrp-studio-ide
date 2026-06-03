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
import { dirname, join, relative } from 'node:path'
import { EVENTS } from '../constants/events'
import { EngineFactory } from '../engines/EngineFactory'
import { GitService } from '../services/git-service'
import {
    checkSkillUpdates,
    installSkill,
    listInstalledSkills,
    readSkillCompanion,
    updateSkill
} from '../services/prototype/skill-discovery'
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

// ─── manifest CRUD (M6 — Etapa A) ──────────────────────────────────────
//
// `<basePath>/.igrpstudio/prototype/page.json` is the source-of-truth
// PageConfig for the prototype. The LLM-driven turn (M6.2) writes it on
// success; the canvas/edit tab (future) reads + mutates it directly.

const MANIFEST_RELATIVE = '.igrpstudio/prototype/page.json'

ipcMain.handle(
    EVENTS.SPEC_PROTOTYPE.READ_MANIFEST,
    async (
        _event,
        { basePath }: { basePath: string }
    ): Promise<{ manifest: unknown | null; error?: string }> => {
        try {
            const manifestPath = join(basePath, MANIFEST_RELATIVE)
            if (!fs.existsSync(manifestPath)) return { manifest: null }
            const raw = await fsp.readFile(manifestPath, 'utf-8')
            const manifest = JSON.parse(raw)
            return { manifest }
        } catch (err) {
            return {
                manifest: null,
                error: err instanceof Error ? err.message : String(err)
            }
        }
    }
)

/**
 * Apply a PageConfig manifest *directly* (no LLM in the loop). Used by the
 * Edit canvas after the user mutates the tree visually. Mirrors the tail
 * of `prototypeGeneratorService.generate` from M6.3 but skips the streaming
 * and the LLM call — just persist + engine.createPage + git commit.
 */
ipcMain.handle(
    EVENTS.SPEC_PROTOTYPE.APPLY_MANIFEST,
    async (
        event,
        { basePath, manifest }: { basePath: string; manifest: Record<string, unknown> }
    ): Promise<{
        ok: boolean
        sha?: string | null
        pageName?: string
        error?: string
    }> => {
        const prototypeRoot = join(basePath, PROTOTYPE_SUBDIR)
        try {
            if (!fs.existsSync(prototypeRoot)) {
                await fsp.mkdir(prototypeRoot, { recursive: true })
            }

            // Minimal validation — engine handles deeper shape errors.
            if (!manifest || typeof manifest !== 'object') {
                return { ok: false, error: 'Manifest must be an object.' }
            }
            if (manifest.type !== 'page') {
                return { ok: false, error: 'Manifest `type` must be "page".' }
            }
            const pageName = typeof manifest.pageName === 'string' ? manifest.pageName : ''
            if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(pageName)) {
                return { ok: false, error: 'Manifest `pageName` is invalid.' }
            }

            // Persist raw manifest before code gen so a crash mid-write
            // doesn't leave us with code but no source-of-truth JSON.
            const manifestPath = join(basePath, MANIFEST_RELATIVE)
            await fsp.mkdir(dirname(manifestPath), { recursive: true })
            await fsp.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8')

            // Code gen via the same engine entry the Page Builder uses.
            const engine = EngineFactory.getEngine('nextjs')
            await engine.createPage?.(manifest, prototypeRoot)

            // Git snapshot — same pattern as the LLM-driven turn.
            let sha: string | null = null
            try {
                if (!fs.existsSync(join(prototypeRoot, '.git'))) {
                    await execFileAsync('git', ['init', '-b', 'main'], { cwd: prototypeRoot })
                    await execFileAsync('git', ['add', '-A'], {
                        cwd: prototypeRoot
                    }).catch(() => undefined)
                    await execFileAsync('git', ['commit', '--allow-empty', '-m', 'init'], {
                        cwd: prototypeRoot
                    }).catch(() => undefined)
                }
                const summary = `edit: ${pageName} (canvas edit)`
                const committed = await GitService.createCommit(prototypeRoot, summary)
                if (committed) {
                    const { stdout } = await execFileAsync('git', ['rev-parse', 'HEAD'], {
                        cwd: prototypeRoot
                    })
                    sha = stdout.trim() || null
                }
            } catch {
                // Non-fatal — code was written, git just didn't snapshot.
            }

            // Notify the renderer so the file tree + webview refresh.
            event.sender.send(EVENTS.SPEC_PROTOTYPE.TREE_CHANGED, { basePath })

            return { ok: true, sha, pageName }
        } catch (err) {
            // Engine may throw arrays of Zod-like issues — format them
            // properly so the canvas header shows actionable detail instead
            // of `[object Object],[object Object]`.
            return {
                ok: false,
                error: formatEngineError(err)
            }
        }
    }
)

/** Mirrors `formatEngineError` from the generator service. Kept inline here
 *  because the canvas's manual apply path lives in this handler and we don't
 *  want to leak a private helper across module boundaries.
 */
function formatEngineError(err: unknown): string {
    if (!err) return 'Unknown engine error.'
    if (err instanceof Error) return err.message
    if (Array.isArray(err)) {
        return err.map(formatEngineIssue).join('\n')
    }
    if (typeof err === 'object') {
        const obj = err as Record<string, unknown>
        if (Array.isArray(obj.errors)) {
            return (obj.errors as unknown[]).map(formatEngineIssue).join('\n')
        }
        if (Array.isArray(obj.issues)) {
            return (obj.issues as unknown[]).map(formatEngineIssue).join('\n')
        }
        if (typeof obj.message === 'string') return obj.message as string
        try {
            const json = JSON.stringify(obj, null, 2)
            return json.length > 800 ? `${json.slice(0, 800)}…` : json
        } catch {
            return '[unserializable engine error]'
        }
    }
    return String(err)
}

function formatEngineIssue(issue: unknown): string {
    if (typeof issue === 'string') return `- ${issue}`
    if (!issue || typeof issue !== 'object') return `- ${String(issue)}`
    const obj = issue as Record<string, unknown>
    // Engine mixes Zod (`path: string[]`) and AJV (`instancePath` / legacy
    // `dataPath`). Look at all three so nested issues like
    // `/types/0/path: must have required property` actually reach the chat.
    let path = ''
    if (Array.isArray(obj.path)) path = (obj.path as unknown[]).join('.')
    else if (typeof obj.path === 'string') path = obj.path
    else if (typeof obj.instancePath === 'string' && obj.instancePath !== '')
        path = obj.instancePath
    else if (typeof obj.dataPath === 'string' && obj.dataPath !== '') path = obj.dataPath
    if (
        path &&
        obj.params &&
        typeof obj.params === 'object' &&
        typeof (obj.params as Record<string, unknown>).missingProperty === 'string'
    ) {
        path = `${path}/${(obj.params as { missingProperty: string }).missingProperty}`
    }
    const message =
        typeof obj.message === 'string'
            ? (obj.message as string)
            : typeof obj.code === 'string'
              ? (obj.code as string)
              : JSON.stringify(obj)
    return path ? `- ${path}: ${message}` : `- ${message}`
}

// ─── Skill discovery (M-Skill Fase 1/2) ────────────────────────────────
//
// The Prototype Builder consumes Anthropic-style skill capsules installed
// at `<basePath>/.agents/skills/<name>/` by the `igrp skill` CLI. Three
// IPCs cover the renderer's needs:
//
//   - LIST_SKILLS:      scan `.agents/skills/` and return parsed metadata
//                       (frontmatter + companion file names).
//   - READ_SKILL_FILE:  fetch the body of a specific companion `.md` so
//                       the contextProvider can inject the relevant section
//                       into the system prompt on demand.
//   - INSTALL_SKILL:    spawn `igrp skill add <name> --project <basePath>`
//                       and stream the install log back to the renderer
//                       via dev-log events (same channel the npm-install
//                       progress uses, so the user sees it in the Logs tab).

ipcMain.handle(
    EVENTS.SPEC_PROTOTYPE.LIST_SKILLS,
    async (_event, { basePath }: { basePath: string }) => {
        const skills = await listInstalledSkills(basePath)
        return { skills }
    }
)

ipcMain.handle(
    EVENTS.SPEC_PROTOTYPE.READ_SKILL_FILE,
    async (
        _event,
        { basePath, skillName, filename }: { basePath: string; skillName: string; filename: string }
    ) => {
        return readSkillCompanion(basePath, skillName, filename)
    }
)

ipcMain.handle(
    EVENTS.SPEC_PROTOTYPE.INSTALL_SKILL,
    async (
        event,
        { basePath, skillName }: { basePath: string; skillName: string }
    ): Promise<{ ok: boolean; error?: string }> => {
        const broadcastLog = (line: string, level: 'info' | 'warn' | 'error') => {
            event.sender.send(EVENTS.SPEC_PROTOTYPE.DEV_LOG, {
                basePath,
                entry: { timestamp: Date.now(), level, line: `[skill] ${line}` }
            })
        }
        broadcastLog(`installing ${skillName}…`, 'info')
        const result = await installSkill(basePath, skillName, broadcastLog)
        if (result.ok) {
            broadcastLog(`installed ${skillName}`, 'info')
            // Skill landed on disk — tell the renderer to re-scan files +
            // the prototype tree so the next turn sees the new corpus.
            event.sender.send(EVENTS.SPEC_PROTOTYPE.TREE_CHANGED, { basePath })
        } else if (result.error) {
            broadcastLog(result.error, 'error')
        }
        return result
    }
)

// CHECK_SKILL_UPDATES: read-only registry probe — no spawn, no side effects.
// Returns one entry per installed skill, including those with no update so
// the renderer can render a "last checked at" line.
ipcMain.handle(
    EVENTS.SPEC_PROTOTYPE.CHECK_SKILL_UPDATES,
    async (_event, { basePath }: { basePath: string }) => {
        const updates = await checkSkillUpdates(basePath)
        return { updates }
    }
)

// UPDATE_SKILL: spawns `igrp skill update <name>`, mirrors INSTALL_SKILL's
// log + TREE_CHANGED contract so the existing refresh path picks up the
// new file contents.
ipcMain.handle(
    EVENTS.SPEC_PROTOTYPE.UPDATE_SKILL,
    async (
        event,
        { basePath, skillName }: { basePath: string; skillName: string }
    ): Promise<{ ok: boolean; error?: string }> => {
        const broadcastLog = (line: string, level: 'info' | 'warn' | 'error') => {
            event.sender.send(EVENTS.SPEC_PROTOTYPE.DEV_LOG, {
                basePath,
                entry: { timestamp: Date.now(), level, line: `[skill] ${line}` }
            })
        }
        broadcastLog(`updating ${skillName}…`, 'info')
        const result = await updateSkill(basePath, skillName, broadcastLog)
        if (result.ok) {
            broadcastLog(`updated ${skillName}`, 'info')
            event.sender.send(EVENTS.SPEC_PROTOTYPE.TREE_CHANGED, { basePath })
        } else if (result.error) {
            broadcastLog(result.error, 'error')
        }
        return result
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
