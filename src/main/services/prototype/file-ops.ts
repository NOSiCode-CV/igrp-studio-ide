/**
 * File-ops contract used by the Prototype builder.
 *
 * The LLM emits one fenced JSON block describing the changes to apply to
 * `<basePath>/prototype/`. We parse it tolerantly (LLMs occasionally wrap the
 * JSON in prose), validate the structure, sandbox every path against the
 * prototype root, then write to disk and return a normalized result the
 * renderer can show as a "snapshot card".
 *
 * Output schema (the LLM is told to follow this):
 *
 * ```json
 * {
 *   "summary": "Add login page",
 *   "ops": [
 *     { "op": "create", "path": "app/login/page.tsx", "content": "..." },
 *     { "op": "update", "path": "app/layout.tsx", "content": "..." },
 *     { "op": "delete", "path": "app/old.tsx" }
 *   ]
 * }
 * ```
 */
import { promises as fsp } from 'node:fs'
import fs from 'node:fs'
import { dirname, isAbsolute, relative, resolve } from 'node:path'
import { ensureDirectoryExists } from '../../helpers'

export type FileOpKind = 'create' | 'update' | 'delete'

export interface FileOp {
    op: FileOpKind
    /** Path relative to `<basePath>/prototype/`. Forward slashes preferred. */
    path: string
    /** Required for create/update; ignored for delete. */
    content?: string
}

export interface FileOpsPayload {
    summary: string
    ops: FileOp[]
}

export interface AppliedFileOp {
    op: FileOpKind
    path: string
    /** Number of bytes written (create/update). 0 for delete or no-op. */
    bytes?: number
    /** True when the path didn't exist before the op (create). */
    created?: boolean
    /** True when content matched the existing file (no-op). */
    skipped?: boolean
}

export class FileOpsParseError extends Error {
    code = 'FILE_OPS_PARSE_ERROR'
}

export class FileOpsSandboxError extends Error {
    code = 'FILE_OPS_SANDBOX_ERROR'
}

const PROTOTYPE_SUBDIR = 'prototype'

// ─── Parsing ────────────────────────────────────────────────────────────

/**
 * Extracts and parses the first valid JSON file-ops payload from arbitrary
 * LLM output. Walks fenced blocks first, then attempts a "first balanced
 * brace" scan when no fence is present.
 */
export function parseFileOps(raw: string): FileOpsPayload {
    const candidates = collectJSONCandidates(raw)
    const errors: string[] = []
    for (const candidate of candidates) {
        try {
            const parsed = JSON.parse(candidate)
            return validatePayload(parsed)
        } catch (err) {
            errors.push(err instanceof Error ? err.message : String(err))
        }
    }
    throw new FileOpsParseError(
        errors.length > 0
            ? `Could not parse file ops: ${errors[errors.length - 1]}`
            : 'Could not find a JSON block matching the file-ops schema in the assistant reply.'
    )
}

function collectJSONCandidates(raw: string): string[] {
    const out: string[] = []
    const trimmed = raw.trim()
    if (!trimmed) return out

    // 1) Fenced JSON blocks (```json ... ``` or generic ``` ... ```).
    const fenceRegex = /```(?:json)?\n([\s\S]*?)\n```/g
    let match: RegExpExecArray | null
    // eslint-disable-next-line no-cond-assign
    while ((match = fenceRegex.exec(trimmed)) !== null) {
        out.push(match[1].trim())
    }

    // 2) Fall back to balanced-brace scan starting at the first `{`.
    if (out.length === 0) {
        const start = trimmed.indexOf('{')
        if (start >= 0) {
            const balanced = extractBalanced(trimmed.slice(start))
            if (balanced) out.push(balanced)
        }
    }

    // 3) Last resort: pass the whole string through (some LLMs emit raw JSON).
    if (out.length === 0) out.push(trimmed)
    return out
}

function extractBalanced(text: string): string | null {
    let depth = 0
    let inString: false | '"' | "'" = false
    let escape = false
    for (let i = 0; i < text.length; i++) {
        const ch = text[i]
        if (escape) {
            escape = false
            continue
        }
        if (ch === '\\') {
            escape = true
            continue
        }
        if (inString) {
            if (ch === inString) inString = false
            continue
        }
        if (ch === '"' || ch === "'") {
            inString = ch
            continue
        }
        if (ch === '{') depth++
        else if (ch === '}') {
            depth--
            if (depth === 0) return text.slice(0, i + 1)
        }
    }
    return null
}

function validatePayload(value: unknown): FileOpsPayload {
    if (!value || typeof value !== 'object') {
        throw new FileOpsParseError('payload must be an object')
    }
    const root = value as Record<string, unknown>
    if (typeof root.summary !== 'string') {
        throw new FileOpsParseError('payload.summary must be a string')
    }
    if (!Array.isArray(root.ops)) {
        throw new FileOpsParseError('payload.ops must be an array')
    }
    const ops: FileOp[] = root.ops.map((entry, idx) => {
        if (!entry || typeof entry !== 'object') {
            throw new FileOpsParseError(`ops[${idx}] must be an object`)
        }
        const item = entry as Record<string, unknown>
        if (item.op !== 'create' && item.op !== 'update' && item.op !== 'delete') {
            throw new FileOpsParseError(`ops[${idx}].op must be create/update/delete`)
        }
        if (typeof item.path !== 'string' || !item.path.trim()) {
            throw new FileOpsParseError(`ops[${idx}].path must be a non-empty string`)
        }
        if (
            (item.op === 'create' || item.op === 'update') &&
            typeof item.content !== 'string'
        ) {
            throw new FileOpsParseError(`ops[${idx}].content is required for ${item.op}`)
        }
        return {
            op: item.op,
            path: item.path,
            content: typeof item.content === 'string' ? item.content : undefined
        }
    })
    return { summary: root.summary, ops }
}

// ─── Sandbox + Apply ────────────────────────────────────────────────────

function sandboxedAbsolute(basePath: string, relativePath: string): string {
    if (!relativePath || isAbsolute(relativePath)) {
        throw new FileOpsSandboxError(
            `Path must be relative to prototype/: "${relativePath}"`
        )
    }
    const root = resolve(basePath, PROTOTYPE_SUBDIR)
    const target = resolve(root, relativePath)
    const rel = relative(root, target)
    if (rel.startsWith('..') || isAbsolute(rel)) {
        throw new FileOpsSandboxError(
            `Path escapes the prototype sandbox: "${relativePath}"`
        )
    }
    return target
}

/**
 * Applies a parsed payload to disk. Each op is best-effort isolated — if one
 * fails we still report what succeeded so the renderer can show partial
 * progress and the caller can decide whether to roll back.
 */
export async function applyFileOps(
    basePath: string,
    payload: FileOpsPayload
): Promise<{ applied: AppliedFileOp[]; failed: Array<{ op: FileOp; error: string }> }> {
    const applied: AppliedFileOp[] = []
    const failed: Array<{ op: FileOp; error: string }> = []

    for (const op of payload.ops) {
        try {
            const absolute = sandboxedAbsolute(basePath, op.path)
            if (op.op === 'delete') {
                if (fs.existsSync(absolute)) {
                    await fsp.rm(absolute, { force: true })
                    applied.push({ op: 'delete', path: op.path })
                } else {
                    applied.push({ op: 'delete', path: op.path, skipped: true })
                }
                continue
            }

            const content = op.content ?? ''
            const existed = fs.existsSync(absolute)
            if (existed) {
                const current = await fsp.readFile(absolute, 'utf-8')
                if (current === content) {
                    applied.push({ op: op.op, path: op.path, skipped: true })
                    continue
                }
            } else {
                await ensureDirectoryExists(dirname(absolute))
            }
            await fsp.writeFile(absolute, content, 'utf-8')
            applied.push({
                op: op.op,
                path: op.path,
                bytes: Buffer.byteLength(content, 'utf-8'),
                created: !existed
            })
        } catch (err) {
            failed.push({
                op,
                error: err instanceof Error ? err.message : String(err)
            })
        }
    }

    return { applied, failed }
}
