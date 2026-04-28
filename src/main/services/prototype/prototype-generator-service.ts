/**
 * Drives a prototype build turn: streams the LLM, parses the file-ops payload,
 * applies the changes inside `<basePath>/prototype/`, then commits the result
 * with `git-service` so the History tab can restore later.
 *
 * Streaming events surface to the renderer through the IPC handler:
 *   - delta:        raw text from the model (for the chat bubble)
 *   - op-applied:   one entry per applied/failed op (for the snapshot card)
 *   - commit:       { sha, summary } once `git commit` lands
 *   - error / done
 *
 * Cancellation: caller passes an AbortController; we forward it to the LLM
 * adapter so cloud streams stop gracefully and CLI subprocesses get killed.
 */
import fs from 'node:fs'
import { promises as fsp } from 'node:fs'
import { execFile } from 'node:child_process'
import { join, relative } from 'node:path'
import { promisify } from 'node:util'
import { GitService } from '../git-service'
import { llmRouter } from '../llm/llm-router'
import type { LLMMessage } from '../llm/types'
import {
    applyFileOps,
    parseFileOps,
    type AppliedFileOp,
    type FileOp
} from './file-ops'

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
const MAX_TREE_ENTRIES = 200

export type PrototypeChunk =
    | { type: 'delta'; content: string }
    | { type: 'op-applied'; op: AppliedFileOp }
    | { type: 'op-failed'; op: FileOp; error: string }
    | { type: 'commit'; sha: string | null; summary: string }
    | { type: 'parse-error'; message: string; raw: string }
    | { type: 'error'; message: string; code?: string }
    | { type: 'done' }

export interface GenerateInput {
    basePath: string
    /** User message describing the change to apply. */
    userMessage: string
    /** Renderer-built spec context (active doc + linked KB summary). */
    specContext?: string
    /** Optional concise summary of the last applied turn for continuity. */
    lastTurnSummary?: string
    providerId: string
    model: string
    signal?: AbortSignal
}

class PrototypeGeneratorService {
    async *generate(input: GenerateInput): AsyncIterable<PrototypeChunk> {
        const { basePath, userMessage, signal } = input
        const prototypeRoot = join(basePath, PROTOTYPE_SUBDIR)
        if (!fs.existsSync(prototypeRoot)) {
            yield {
                type: 'error',
                message: `Prototype folder missing at ${prototypeRoot}`,
                code: 'PROTOTYPE_MISSING'
            }
            yield { type: 'done' }
            return
        }

        const fileTree = await listPrototypeTree(prototypeRoot)
        const systemPrompt = buildSystemPrompt({
            specContext: input.specContext,
            lastTurnSummary: input.lastTurnSummary,
            fileTree
        })

        const messages: LLMMessage[] = [{ role: 'user', content: userMessage }]

        let buffer = ''
        try {
            const stream = llmRouter.chat(input.providerId, messages, {
                model: input.model,
                systemPrompt,
                signal
            })

            for await (const chunk of stream) {
                if (chunk.type === 'delta') {
                    buffer += chunk.content
                    yield { type: 'delta', content: chunk.content }
                } else if (chunk.type === 'error') {
                    yield { type: 'error', message: chunk.message, code: chunk.code }
                } else if (chunk.type === 'done') {
                    break
                }
            }
        } catch (err) {
            yield {
                type: 'error',
                message: err instanceof Error ? err.message : String(err)
            }
            yield { type: 'done' }
            return
        }

        // Empty replies (cancelled, network error) — skip parse + commit.
        if (!buffer.trim()) {
            yield { type: 'done' }
            return
        }

        let payload
        try {
            payload = parseFileOps(buffer)
        } catch (err) {
            yield {
                type: 'parse-error',
                message: err instanceof Error ? err.message : String(err),
                raw: buffer
            }
            yield { type: 'done' }
            return
        }

        const { applied, failed } = await applyFileOps(basePath, payload)
        for (const op of applied) yield { type: 'op-applied', op }
        for (const f of failed) yield { type: 'op-failed', op: f.op, error: f.error }

        // Commit even partial successes so users can roll back via History.
        let sha: string | null = null
        try {
            await ensureGitRepo(prototypeRoot)
            const committed = await GitService.createCommit(
                prototypeRoot,
                sanitizeCommitMessage(payload.summary)
            )
            if (committed) sha = await readHeadSha(prototypeRoot)
        } catch (err) {
            // Don't fail the turn if git fails — emit a notice and move on.
            yield {
                type: 'error',
                message: `Git commit failed: ${err instanceof Error ? err.message : String(err)}`,
                code: 'GIT_COMMIT_FAILED'
            }
        }

        yield { type: 'commit', sha, summary: payload.summary }
        yield { type: 'done' }
    }
}

// ─── prompt + tree helpers ──────────────────────────────────────────────

interface PromptInput {
    specContext?: string
    lastTurnSummary?: string
    fileTree: string[]
}

function buildSystemPrompt({
    specContext,
    lastTurnSummary,
    fileTree
}: PromptInput): string {
    const sections: string[] = []
    sections.push(
        [
            'You are the Prototype Builder of an IGRP Studio "Specification" project. You evolve a Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui app rooted at <basePath>/prototype/ based on the spec the user authored.',
            '',
            'Output contract — MANDATORY:',
            '- Reply with **one fenced JSON block** that follows this exact schema:',
            '  ```json',
            '  {',
            '    "summary": "<short description of this turn, used as the git commit message>",',
            '    "ops": [',
            '      { "op": "create", "path": "<relative path>", "content": "<full file contents>" },',
            '      { "op": "update", "path": "<relative path>", "content": "<full file contents>" },',
            '      { "op": "delete", "path": "<relative path>" }',
            '    ]',
            '  }',
            '  ```',
            '- Paths MUST be relative to `<basePath>/prototype/`. Forward slashes only. No `..` or absolute paths.',
            '- For `update`, return the **complete** file contents (we overwrite, not patch).',
            '- Keep the change minimal and focused on the user request. Do not edit unrelated files.',
            '- Use shadcn/ui components when they fit (`@/components/ui/...`). Tailwind for styling. Server components by default.',
            '- Do not include `node_modules`, `.next`, lockfiles, or any binary file in the ops.',
            '- No prose outside the JSON block. No commentary. The Studio parses your reply directly.'
        ].join('\n')
    )

    if (specContext && specContext.trim()) {
        sections.push(`## Specification context\n\n${specContext.trim()}`)
    }

    if (lastTurnSummary && lastTurnSummary.trim()) {
        sections.push(`## Previous turn\n\n${lastTurnSummary.trim()}`)
    }

    sections.push(
        `## Current prototype tree (top ${fileTree.length} entries)\n\n` +
            (fileTree.length > 0
                ? '```\n' + fileTree.join('\n') + '\n```'
                : '_(empty — this is the first turn; scaffold what is necessary)_')
    )

    return sections.join('\n\n')
}

async function listPrototypeTree(root: string): Promise<string[]> {
    const out: string[] = []
    const stack: string[] = [root]
    while (stack.length > 0 && out.length < MAX_TREE_ENTRIES) {
        const dir = stack.pop()
        if (!dir) break
        let entries
        try {
            entries = await fsp.readdir(dir, { withFileTypes: true })
        } catch {
            continue
        }
        for (const entry of entries) {
            if (TREE_IGNORE.has(entry.name)) continue
            const full = join(dir, entry.name)
            const rel = relative(root, full).replace(/\\/g, '/')
            if (entry.isDirectory()) {
                stack.push(full)
            } else {
                out.push(rel)
                if (out.length >= MAX_TREE_ENTRIES) break
            }
        }
    }
    return out.sort()
}

async function ensureGitRepo(prototypeRoot: string): Promise<void> {
    if (fs.existsSync(join(prototypeRoot, '.git'))) return
    await execFileAsync('git', ['init', '-b', 'main'], { cwd: prototypeRoot })
    // Best-effort initial commit so subsequent ones have a parent.
    await execFileAsync('git', ['add', '-A'], { cwd: prototypeRoot }).catch(
        () => undefined
    )
    await execFileAsync('git', ['commit', '--allow-empty', '-m', 'init'], {
        cwd: prototypeRoot
    }).catch(() => undefined)
}

async function readHeadSha(prototypeRoot: string): Promise<string | null> {
    try {
        const { stdout } = await execFileAsync('git', ['rev-parse', 'HEAD'], {
            cwd: prototypeRoot
        })
        return stdout.trim() || null
    } catch {
        return null
    }
}

function sanitizeCommitMessage(summary: string): string {
    // Single line, escape backticks and double quotes. Fall back to a generic
    // message when the LLM gives nothing usable.
    const cleaned = summary
        .replace(/[`"]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    return cleaned ? cleaned.slice(0, 200) : 'prototype turn'
}

export const prototypeGeneratorService = new PrototypeGeneratorService()
