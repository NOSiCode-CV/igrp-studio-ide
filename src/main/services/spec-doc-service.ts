/**
 * Specification Documents service.
 *
 * Owns the project's `<basePath>/docs/` workspace:
 *   - `index.json` is the source of truth for the tree (DocNode[]).
 *   - `<docId>.md` holds each file's content.
 *   - `assets/<docId>/...` for images / binaries inserted via drop.
 *
 * Folders are virtual (parentId pointer). The filesystem layout stays flat,
 * which avoids fighting the OS on rename/move and keeps reconcile cheap.
 *
 * Mutations broadcast `spec:doc:changed` so the renderer can refresh the tree.
 * Send-to-KB delegates to spec-kb-service so the KB stays the single owner of
 * vector indexing; the doc just tracks the resulting KBItem id.
 */
import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import { promises as fsp } from 'node:fs'
import { dirname, join } from 'node:path'
import { BrowserWindow } from 'electron'
import { EVENTS } from '../constants/events'
import { ensureDirectoryExists } from '../helpers'
import { convertFileToMarkdown } from '../helpers/markitdown/runner'

export type DocNodeType = 'file' | 'folder'

export interface DocNode {
    id: string
    name: string
    parentId: string | null
    type: DocNodeType
    createdAt: string
    updatedAt: string
    /**
     * KBItem ids the user has explicitly attached to this doc as context for
     * the AI Assistant and the Prototype builder. Stays empty until the user
     * picks references from the Inspector. Folders never carry refs.
     */
    kbRefs?: string[]
}

const DOCS_SUBDIR = 'docs'
const ASSETS_SUBDIR = 'assets'
const INDEX_FILE = 'index.json'

export class SpecDocService {
    async list(basePath: string): Promise<DocNode[]> {
        return readIndex(basePath)
    }

    async read(
        basePath: string,
        docId: string
    ): Promise<{ node: DocNode; content: string } | null> {
        const nodes = await readIndex(basePath)
        const node = nodes.find((n) => n.id === docId)
        if (!node || node.type !== 'file') return null
        const content = await readFileContent(basePath, docId)
        return { node, content }
    }

    async create(
        basePath: string,
        input: {
            name: string
            parentId?: string | null
            type?: DocNodeType
            content?: string
        }
    ): Promise<DocNode> {
        await ensureDocDirs(basePath)
        const nodes = await readIndex(basePath)

        if (input.parentId) {
            const parent = nodes.find((n) => n.id === input.parentId)
            if (!parent || parent.type !== 'folder') {
                throw new Error('Parent must be an existing folder')
            }
        }

        const now = new Date().toISOString()
        const node: DocNode = {
            id: randomUUID(),
            name: input.name,
            parentId: input.parentId ?? null,
            type: input.type ?? 'file',
            createdAt: now,
            updatedAt: now
        }
        nodes.push(node)
        await writeIndex(basePath, nodes)

        if (node.type === 'file') {
            await fsp.writeFile(filePath(basePath, node.id), input.content ?? '', 'utf-8')
        }

        broadcast()
        return node
    }

    async update(
        basePath: string,
        docId: string,
        patch: { content?: string; name?: string; kbRefs?: string[] }
    ): Promise<DocNode> {
        const nodes = await readIndex(basePath)
        const idx = nodes.findIndex((n) => n.id === docId)
        if (idx < 0) throw new Error(`Doc ${docId} not found`)
        const node = nodes[idx]

        if (typeof patch.content === 'string' && node.type === 'file') {
            await fsp.writeFile(filePath(basePath, node.id), patch.content, 'utf-8')
        }
        if (typeof patch.name === 'string') {
            node.name = patch.name
        }
        if (Array.isArray(patch.kbRefs)) {
            // Dedupe and reject empty ids defensively.
            node.kbRefs = Array.from(
                new Set(patch.kbRefs.filter((id) => typeof id === 'string' && id))
            )
        }
        node.updatedAt = new Date().toISOString()
        nodes[idx] = node
        await writeIndex(basePath, nodes)

        broadcast()
        return node
    }

    async move(basePath: string, docId: string, newParentId: string | null): Promise<DocNode> {
        const nodes = await readIndex(basePath)
        const idx = nodes.findIndex((n) => n.id === docId)
        if (idx < 0) throw new Error(`Doc ${docId} not found`)
        if (newParentId) {
            const parent = nodes.find((n) => n.id === newParentId)
            if (!parent || parent.type !== 'folder') {
                throw new Error('Target must be a folder')
            }
            // Prevent cycles.
            if (isDescendant(nodes, newParentId, docId)) {
                throw new Error('Cannot move a folder into its own descendant')
            }
        }
        nodes[idx] = { ...nodes[idx], parentId: newParentId, updatedAt: new Date().toISOString() }
        await writeIndex(basePath, nodes)
        broadcast()
        return nodes[idx]
    }

    async remove(basePath: string, docId: string): Promise<void> {
        const nodes = await readIndex(basePath)
        const target = nodes.find((n) => n.id === docId)
        if (!target) return

        const toRemove = collectSubtree(nodes, docId)
        const removeIds = new Set(toRemove.map((n) => n.id))

        for (const node of toRemove) {
            if (node.type === 'file') {
                await fsp.unlink(filePath(basePath, node.id)).catch(() => undefined)
                await fsp
                    .rm(assetsDir(basePath, node.id), { recursive: true, force: true })
                    .catch(() => undefined)
            }
        }

        const remaining = nodes.filter((n) => !removeIds.has(n.id))
        await writeIndex(basePath, remaining)
        broadcast()
    }

    /**
     * Converts an external file via MarkItDown and returns the markdown so the
     * renderer can splice it into the active editor. Does NOT touch the doc
     * file itself — the renderer owns the cursor position and writes back via
     * `update`.
     */
    async convertAndInsert(sourcePath: string): Promise<{ markdown: string }> {
        const result = await convertFileToMarkdown(sourcePath)
        if (!result.ok) throw new Error(`MarkItDown failed: ${result.error}`)
        return { markdown: result.markdown }
    }
}

// ─── helpers ───────────────────────────────────────────────────────────────

function indexPath(basePath: string): string {
    return join(basePath, DOCS_SUBDIR, INDEX_FILE)
}

function filePath(basePath: string, docId: string): string {
    return join(basePath, DOCS_SUBDIR, `${docId}.md`)
}

function assetsDir(basePath: string, docId: string): string {
    return join(basePath, DOCS_SUBDIR, ASSETS_SUBDIR, docId)
}

async function ensureDocDirs(basePath: string): Promise<void> {
    await ensureDirectoryExists(join(basePath, DOCS_SUBDIR))
    await ensureDirectoryExists(join(basePath, DOCS_SUBDIR, ASSETS_SUBDIR))
}

async function readIndex(basePath: string): Promise<DocNode[]> {
    const file = indexPath(basePath)
    if (!fs.existsSync(file)) return []
    try {
        const raw = await fsp.readFile(file, 'utf-8')
        const parsed = JSON.parse(raw) as DocNode[]
        return Array.isArray(parsed) ? parsed : []
    } catch {
        return []
    }
}

async function writeIndex(basePath: string, nodes: DocNode[]): Promise<void> {
    await ensureDirectoryExists(dirname(indexPath(basePath)))
    await fsp.writeFile(indexPath(basePath), JSON.stringify(nodes, null, 2), 'utf-8')
}

async function readFileContent(basePath: string, docId: string): Promise<string> {
    const path = filePath(basePath, docId)
    if (!fs.existsSync(path)) return ''
    return fsp.readFile(path, 'utf-8')
}

function collectSubtree(nodes: DocNode[], rootId: string): DocNode[] {
    const root = nodes.find((n) => n.id === rootId)
    if (!root) return []
    const out: DocNode[] = [root]
    if (root.type === 'folder') {
        const children = nodes.filter((n) => n.parentId === rootId)
        for (const c of children) out.push(...collectSubtree(nodes, c.id))
    }
    return out
}

function isDescendant(nodes: DocNode[], candidateChildId: string, ancestorId: string): boolean {
    let cursor = nodes.find((n) => n.id === candidateChildId)
    while (cursor) {
        if (cursor.id === ancestorId) return true
        if (!cursor.parentId) return false
        cursor = nodes.find((n) => n.id === cursor!.parentId)
    }
    return false
}

function broadcast(): void {
    for (const win of BrowserWindow.getAllWindows()) {
        win.webContents.send(EVENTS.SPEC_DOC.CHANGED)
    }
}

export const specDocService = new SpecDocService()
