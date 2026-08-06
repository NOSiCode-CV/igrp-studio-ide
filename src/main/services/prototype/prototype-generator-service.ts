/**
 * Drives a prototype build turn — **manifest-first** (M6).
 *
 * Pipeline:
 *   1. Stream the LLM. The renderer's `contextProvider` carries the bulk of
 *      the system prompt (output contract, engine catalog subset, schema);
 *      we only append the live file tree + the previous turn summary here.
 *   2. On `done`, parse the response as a `PageConfig` JSON block.
 *   3. Persist the raw manifest to `<basePath>/.igrpstudio/prototype/page.json`
 *      (audit trail + manifest is the source-of-truth deliverable).
 *   4. Hand the manifest to `EngineFactory.getEngine('nextjs').createPage(...)`
 *      with `basePath = <basePath>/prototype` — same entry point the Page
 *      Builder uses on Save. The engine writes TSX into `<prototype>/app/...`.
 *   5. Commit via git so the History tab can restore.
 *
 * Streaming chunks (mirrored to the renderer through
 * `spec:prototype:generate-chunk`):
 *   - delta:           raw text from the model (chat bubble)
 *   - manifest-parsed: { pageName, path, componentCount } — emitted on
 *                      successful parse so the UI can show "Applying…"
 *   - manifest-applied:{ pageName, outputPath } — engine returned cleanly
 *   - commit:          { sha, summary } once git lands
 *   - parse-error:     malformed JSON / failed validation
 *   - error / done
 *
 * Legacy file-ops chunks (`op-applied`, `op-failed`) are kept in the union
 * for backwards-compatible Redux/UI handling during the transition window.
 */
import fs from 'node:fs'
import { promises as fsp } from 'node:fs'
import { execFile } from 'node:child_process'
import { join, relative, dirname } from 'node:path'
import { promisify } from 'node:util'
import { EngineFactory } from '../../engines/EngineFactory'
import { GitService } from '../git-service'
import { llmRouter } from '../llm/llm-router'
import type { LLMMessage } from '../llm/types'
import type { AppliedFileOp, FileOp } from './file-ops'
import { seedPreviewMockData, type SeedResult } from './prototype-mock-seeder'

const execFileAsync = promisify(execFile)

const PROTOTYPE_SUBDIR = 'prototype'
const MANIFEST_RELATIVE_PATH = '.igrpstudio/prototype/page.json'
const TREE_IGNORE = new Set([
    'node_modules',
    '.next',
    '.turbo',
    '.git',
    'dist',
    'build',
    'out',
    '.cache',
    '.igrpstudio'
])
const MAX_TREE_ENTRIES = 200

interface AppliedManifest {
    pageName: string
    path: string
    outputPath: string
    componentCount: number
}

export type PrototypeChunk =
    | { type: 'delta'; content: string }
    | { type: 'manifest-parsed'; manifest: AppliedManifest }
    | { type: 'manifest-applied'; manifest: AppliedManifest }
    // Auto-retry on engine/parse failure (M8). The first attempt is
    // attempt=1; we surface `retry-attempt` BEFORE re-streaming so the
    // user sees "Attempt 2/3 — fixing: …" in the chat without us having
    // to swap the existing message bubble.
    | {
          type: 'retry-attempt'
          attempt: number
          maxAttempts: number
          reason: string
      }
    // Preview seeding (M7) — runs after manifest-applied, before commit.
    // `mock-seeding` lets the renderer say "Seeding preview data…";
    // `mock-seeded` carries the resulting file paths + row count;
    // `mock-skipped` surfaces the reason when there's nothing to seed
    // (form-only pages, no array states).
    | { type: 'mock-seeding' }
    | {
          type: 'mock-seeded'
          mockJsonPath: string
          previewTsPath: string
          rowCount: number
      }
    | { type: 'mock-skipped'; reason: string }
    // Legacy file-ops chunks — kept so the renderer's existing handlers
    // (snapshot card, error badges) keep compiling while M6 lands.
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
    /** Renderer-built spec context (active doc + linked KB + catalog block). */
    specContext?: string
    /** Optional concise summary of the last applied turn for continuity. */
    lastTurnSummary?: string
    providerId: string
    model: string
    signal?: AbortSignal
}

/**
 * Max LLM attempts per generate() call. Attempt 1 is the fresh prompt;
 * attempts 2..N include the previous attempt's manifest + engine error
 * folded into the prompt so the model can self-correct. We cap at 3 to
 * bound cost — the engine errors we see in practice resolve in 1 retry
 * when the system prompt has the right baseline injections.
 */
const MAX_GENERATION_ATTEMPTS = 3

class PrototypeGeneratorService {
    async *generate(input: GenerateInput): AsyncIterable<PrototypeChunk> {
        const { basePath, userMessage, signal } = input
        const prototypeRoot = join(basePath, PROTOTYPE_SUBDIR)
        if (!fs.existsSync(prototypeRoot)) {
            try {
                await fsp.mkdir(prototypeRoot, { recursive: true })
            } catch (err) {
                yield {
                    type: 'error',
                    message: `Failed to create prototype folder: ${err instanceof Error ? err.message : String(err)}`,
                    code: 'PROTOTYPE_MKDIR_FAILED'
                }
                yield { type: 'done' }
                return
            }
        }

        const fileTree = await listPrototypeTree(prototypeRoot)
        const systemPrompt = buildSystemPrompt({
            specContext: input.specContext,
            lastTurnSummary: input.lastTurnSummary,
            fileTree
        })

        // Retry loop. Each attempt streams its own `delta` chunks to the
        // chat bubble so the user can SEE the model thinking through the
        // fix. Between attempts we yield a `retry-attempt` chunk + a
        // separator line so the bubble shows a clear "Attempt N — fixing
        // X" break.
        let manifest: PageConfigLike | null = null
        let applied: AppliedManifest | null = null
        let priorAttempt: {
            manifestText: string
            failure: { kind: 'parse'; message: string } | { kind: 'engine'; message: string }
        } | null = null

        for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt++) {
            if (attempt > 1 && priorAttempt) {
                // Visible separator in the chat between attempts.
                yield {
                    type: 'delta',
                    content:
                        `\n\n---\n\n_Attempt ${attempt}/${MAX_GENERATION_ATTEMPTS} — fixing previous error:_\n\n` +
                        `> ${priorAttempt.failure.message.split('\n')[0]}\n\n`
                }
                yield {
                    type: 'retry-attempt',
                    attempt,
                    maxAttempts: MAX_GENERATION_ATTEMPTS,
                    reason: priorAttempt.failure.message
                }
            }

            // Build the per-attempt message. Attempt 1 is just the user's
            // message; subsequent attempts prepend the prior manifest +
            // error so the model has full context to fix.
            const messages: LLMMessage[] =
                attempt === 1 || !priorAttempt
                    ? [{ role: 'user', content: userMessage }]
                    : [
                          {
                              role: 'user',
                              content: buildRetryPrompt({
                                  originalUserMessage: userMessage,
                                  priorManifestText: priorAttempt.manifestText,
                                  failure: priorAttempt.failure
                              })
                          }
                      ]

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
                        yield {
                            type: 'error',
                            message: chunk.message,
                            code: chunk.code
                        }
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

            if (!buffer.trim()) {
                // Cancelled / empty — abort the whole turn.
                yield { type: 'done' }
                return
            }

            // Parse PageConfig.
            let attemptManifest: PageConfigLike
            let attemptManifestText: string
            try {
                attemptManifestText = extractJsonBlock(buffer)
                attemptManifest = parsePageConfig(attemptManifestText)
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err)
                if (attempt < MAX_GENERATION_ATTEMPTS) {
                    // Re-loop: feed the bad JSON + error to the next attempt.
                    priorAttempt = {
                        manifestText: tryExtractRawJson(buffer),
                        failure: { kind: 'parse', message: msg }
                    }
                    continue
                }
                yield {
                    type: 'parse-error',
                    message: msg,
                    raw: buffer
                }
                yield { type: 'done' }
                return
            }

            const componentCount = countComponents(attemptManifest.components)
            const attemptApplied: AppliedManifest = {
                pageName: attemptManifest.pageName,
                path: attemptManifest.path,
                outputPath: `app/pages/${attemptManifest.pageName}/page.tsx`,
                componentCount
            }
            yield { type: 'manifest-parsed', manifest: attemptApplied }

            // Persist the manifest. We do this BEFORE engine.createPage
            // so the manifest is always recoverable on disk even when
            // engine validation fails — the user can inspect what the
            // LLM proposed.
            try {
                const manifestFile = join(basePath, MANIFEST_RELATIVE_PATH)
                await fsp.mkdir(dirname(manifestFile), { recursive: true })
                await fsp.writeFile(manifestFile, JSON.stringify(attemptManifest, null, 2), 'utf-8')
            } catch (err) {
                yield {
                    type: 'error',
                    message: `Could not persist manifest: ${err instanceof Error ? err.message : String(err)}`,
                    code: 'MANIFEST_PERSIST_FAILED'
                }
            }

            // Engine apply — the make-or-break step. If it fails, we
            // loop with the error baked into the prompt; if it succeeds,
            // we exit the retry loop and proceed to seeding + commit.
            try {
                const engine = EngineFactory.getEngine('nextjs')
                await engine.createPage?.(attemptManifest, prototypeRoot)
            } catch (err) {
                const formatted = formatEngineError(err)
                if (attempt < MAX_GENERATION_ATTEMPTS) {
                    priorAttempt = {
                        manifestText: attemptManifestText,
                        failure: {
                            kind: 'engine',
                            message: `Engine generation failed: ${formatted}`
                        }
                    }
                    continue
                }
                yield {
                    type: 'error',
                    message: `Engine generation failed after ${MAX_GENERATION_ATTEMPTS} attempts: ${formatted}`,
                    code: 'ENGINE_FAILED'
                }
                yield { type: 'done' }
                return
            }

            // Success — break out of retry loop.
            manifest = attemptManifest
            applied = attemptApplied
            break
        }

        if (!manifest || !applied) {
            // All attempts exhausted somehow without yielding terminal
            // chunks — defensive bailout, shouldn't reach here.
            yield { type: 'done' }
            return
        }

        yield { type: 'manifest-applied', manifest: applied }

        // ─── preview seeding (M7) ─────────────────────────────────────
        //
        // Runs only when the manifest has at least one array-state bound
        // to a typed row (the common list/table shape). Failures are
        // surfaced via `error` chunks but DON'T abort the turn — the dev
        // can keep iterating; preview just won't show seed rows.
        yield { type: 'mock-seeding' }
        const pageTsxAbs = join(
            prototypeRoot,
            'src',
            'app',
            '(igrp)',
            '(generated)',
            manifest.path || manifest.pageName,
            'page.tsx'
        )
        let seedResult: SeedResult
        try {
            seedResult = await seedPreviewMockData({
                basePath,
                manifest: {
                    pageName: manifest.pageName,
                    path: manifest.path,
                    types: manifest.types,
                    states: manifest.states
                },
                pageTsxPath: pageTsxAbs,
                providerId: input.providerId,
                model: input.model,
                signal: input.signal
            })
        } catch (err) {
            seedResult = {
                ok: false,
                error: err instanceof Error ? err.message : String(err)
            }
        }
        if (seedResult.ok) {
            if (seedResult.skippedReason) {
                yield { type: 'mock-skipped', reason: seedResult.skippedReason }
            } else if (
                seedResult.mockJsonPath &&
                seedResult.previewTsPath &&
                typeof seedResult.rowCount === 'number'
            ) {
                yield {
                    type: 'mock-seeded',
                    mockJsonPath: relative(basePath, seedResult.mockJsonPath),
                    previewTsPath: relative(basePath, seedResult.previewTsPath),
                    rowCount: seedResult.rowCount
                }
            }
        } else {
            // Non-fatal: the page is on disk and renderable; just no seed.
            yield {
                type: 'error',
                message: `Preview seeding failed: ${seedResult.error ?? 'unknown'}`,
                code: 'PREVIEW_SEED_FAILED'
            }
        }

        // ─── git snapshot ──────────────────────────────────────────────
        let sha: string | null = null
        const summary = sanitizeCommitMessage(
            manifest.label
                ? `page: ${manifest.pageName} — ${manifest.label}`
                : `page: ${manifest.pageName} (${applied.componentCount} components)`
        )
        try {
            await ensureGitRepo(prototypeRoot)
            const committed = await GitService.createCommit(prototypeRoot, summary)
            if (committed) sha = await readHeadSha(prototypeRoot)
        } catch (err) {
            yield {
                type: 'error',
                message: `Git commit failed: ${err instanceof Error ? err.message : String(err)}`,
                code: 'GIT_COMMIT_FAILED'
            }
        }

        yield { type: 'commit', sha, summary }
        yield { type: 'done' }
    }
}

// ─── prompt + tree helpers ──────────────────────────────────────────────

interface PromptInput {
    specContext?: string
    lastTurnSummary?: string
    fileTree: string[]
}

/**
 * Minimal system-prompt wrapper. The renderer's `contextProvider` carries
 * the bulk of the instructions (PageConfig schema, engine catalog, role
 * directives, spec attachments, KB) — we only append the live filesystem
 * tree (only the main process can see it) and a brief continuity hint.
 */
function buildSystemPrompt({ specContext, lastTurnSummary, fileTree }: PromptInput): string {
    const sections: string[] = []

    if (specContext && specContext.trim()) {
        sections.push(specContext.trim())
    } else {
        // Defensive fallback if no renderer context arrived — shouldn't
        // happen in practice, but stops the LLM from improvising freely.
        sections.push(
            [
                'You are the IGRP Prototype Builder. Reply with exactly one fenced',
                '```json``` block containing a `PageConfig` object. No prose outside.'
            ].join(' ')
        )
    }

    if (lastTurnSummary && lastTurnSummary.trim()) {
        sections.push(`## Previous turn\n\n${lastTurnSummary.trim()}`)
    }

    sections.push(
        `## Current prototype tree (top ${fileTree.length} entries)\n\n` +
            (fileTree.length > 0
                ? '```\n' + fileTree.join('\n') + '\n```'
                : '_(empty — this is the first turn for the prototype)_')
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

// ─── PageConfig parsing / validation ────────────────────────────────────
//
// Minimal validation — we trust the engine to flag deeper shape issues
// (which it will surface as runtime errors that bubble up via the
// `engine.createPage` reject path). What we check here are the bits the
// engine assumes are non-null: type discriminator, pageName, path,
// components root. Catching them at this boundary gives the user a clean
// parse-error chunk instead of an opaque main-process exception.

interface StructuredComponentLike {
    id: string
    componentName: string
    tag?: string
    label?: string
    properties?: Record<string, unknown>
    interactions?: Record<string, unknown>
    children?: StructuredComponentLike[]
    [key: string]: unknown
}

interface PageConfigLike {
    type: 'page'
    pageName: string
    path: string
    label?: string
    components: StructuredComponentLike | Record<string, never>
    types: unknown[]
    imports: unknown[]
    states: unknown[]
    functions: unknown[]
    [key: string]: unknown
}

const IDENTIFIER_RE = /^[a-zA-Z][a-zA-Z0-9_-]*$/

/**
 * Pull the first fenced ` ```json … ``` ` block from the LLM reply. Falls
 * back to a balanced-brace scan when the LLM forgot the fence — common
 * enough that the extra robustness pays for itself.
 */
function extractJsonBlock(reply: string): string {
    const fenced = reply.match(/```(?:json)?\s*([\s\S]*?)```/i)
    if (fenced && fenced[1].trim()) return fenced[1].trim()

    // Balanced-brace fallback. Walk until we find a `{` then count braces.
    const first = reply.indexOf('{')
    if (first === -1) {
        throw new Error('No JSON block in reply (neither fenced nor inline).')
    }
    let depth = 0
    for (let i = first; i < reply.length; i++) {
        const ch = reply[i]
        if (ch === '{') depth++
        else if (ch === '}') {
            depth--
            if (depth === 0) return reply.slice(first, i + 1)
        }
    }
    throw new Error('JSON object never closed in reply.')
}

/**
 * Best-effort raw JSON capture for the retry prompt. Even when
 * `extractJsonBlock` failed (no balanced braces, no fence), we still
 * want to show the model what it produced so it can identify what went
 * wrong syntactically. Falls back to a 4KB tail of the raw buffer.
 */
function tryExtractRawJson(reply: string): string {
    try {
        return extractJsonBlock(reply)
    } catch {
        return reply.length > 4000 ? reply.slice(-4000) : reply
    }
}

/**
 * Build the per-attempt user message for retries. Folds:
 *   - The original ask (so the LLM doesn't drift on what the page is about)
 *   - The failed manifest verbatim (anchored — the model often spots the
 *     issue by comparing the schema rule to its own output)
 *   - The actual error message from the engine / parser (the most
 *     concrete diagnostic available)
 *
 * Designed to keep the surface tight: no leading "you are a …" preamble
 * (that's in the system prompt), no chain-of-thought scaffolding —
 * just data + the directive to emit a corrected manifest.
 */
function buildRetryPrompt(args: {
    originalUserMessage: string
    priorManifestText: string
    failure: { kind: 'parse'; message: string } | { kind: 'engine'; message: string }
}): string {
    const failureLabel =
        args.failure.kind === 'parse'
            ? 'JSON parse / shape validation failed'
            : 'Engine validation failed'
    return [
        `Your previous manifest was rejected. ${failureLabel}:`,
        '',
        '```',
        args.failure.message,
        '```',
        '',
        'Manifest that failed (verbatim):',
        '',
        '```json',
        args.priorManifestText,
        '```',
        '',
        '## Original request',
        '',
        args.originalUserMessage,
        '',
        '## Your task',
        '',
        'Emit ONE corrected `PageConfig` JSON block that fixes the error above',
        'while honouring every STRICT rule and baseline section in the system',
        'prompt (engine naming, type-definition shape, children rules, variant',
        'gotchas, clean manifest). Do not repeat the original request — go',
        'straight to the corrected JSON.'
    ].join('\n')
}

function parsePageConfig(raw: string): PageConfigLike {
    let parsed: unknown
    try {
        parsed = JSON.parse(raw)
    } catch (err) {
        throw new Error(`Invalid JSON: ${err instanceof Error ? err.message : String(err)}`)
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Manifest root must be an object.')
    }
    const obj = parsed as Record<string, unknown>

    if (obj.type !== 'page') {
        throw new Error(
            `Manifest \`type\` must be "page" (got ${JSON.stringify(obj.type)}). Component / processStep manifests are not yet supported by this generator.`
        )
    }
    if (typeof obj.pageName !== 'string' || !IDENTIFIER_RE.test(obj.pageName)) {
        throw new Error(
            'Manifest `pageName` must be a non-empty identifier (alphanumeric + dash/underscore, leading letter).'
        )
    }
    // `path` is a Next.js route-segment path WITHOUT a leading slash —
    // the engine's regex validator rejects `/foo`. Examples that pass:
    //   `dashboard`, `contribuintes`, `caixa/dias/[uuid]/atendedores/novo`,
    //   `(parametrizacao)/categorias`. We auto-derive from `pageName` when
    //   missing and strip an erroneous leading slash if the LLM added one.
    if (!('path' in obj) || obj.path === null || obj.path === undefined) {
        obj.path = (obj.pageName as string).toLowerCase()
    } else if (typeof obj.path !== 'string') {
        throw new Error(`Manifest \`path\` must be a string (got ${typeof obj.path}).`)
    } else {
        obj.path = (obj.path as string).trim().replace(/^\/+/, '')
    }
    if (!('components' in obj)) {
        throw new Error('Manifest must include `components` (root StructuredComponent).')
    }

    // Engine expects these arrays even when empty.
    obj.types = Array.isArray(obj.types) ? obj.types : []
    obj.imports = Array.isArray(obj.imports) ? obj.imports : []
    obj.states = Array.isArray(obj.states) ? obj.states : []
    obj.functions = Array.isArray(obj.functions) ? obj.functions : []

    return obj as unknown as PageConfigLike
}

function countComponents(node: unknown): number {
    if (!node || typeof node !== 'object') return 0
    let count = 1
    const children = (node as { children?: unknown }).children
    if (Array.isArray(children)) {
        for (const child of children) count += countComponents(child)
    }
    return count
}

async function ensureGitRepo(prototypeRoot: string): Promise<void> {
    if (fs.existsSync(join(prototypeRoot, '.git'))) return
    await execFileAsync('git', ['init', '-b', 'main'], { cwd: prototypeRoot })
    await execFileAsync('git', ['add', '-A'], { cwd: prototypeRoot }).catch(() => undefined)
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

/**
 * Format whatever the engine package threw into something a human can read.
 * The IGRP Next.js engine surfaces validation problems as arrays of issue
 * objects (Zod-style `{ path, code, message }`) or as `{ errors: [...] }`
 * wrappers. Default JS coercion gives `[object Object]` for those shapes —
 * we walk them explicitly.
 */
function formatEngineError(err: unknown): string {
    if (!err) return 'Unknown engine error.'
    if (err instanceof Error) {
        return err.message + (err.stack ? `\n${firstStackLine(err.stack)}` : '')
    }
    if (Array.isArray(err)) {
        return err.map(formatEngineIssue).join('\n')
    }
    if (typeof err === 'object') {
        const obj = err as Record<string, unknown>
        // Zod-like wrapper.
        if (Array.isArray(obj.errors)) {
            return (obj.errors as unknown[]).map(formatEngineIssue).join('\n')
        }
        if (Array.isArray(obj.issues)) {
            return (obj.issues as unknown[]).map(formatEngineIssue).join('\n')
        }
        if (typeof obj.message === 'string') {
            return obj.message as string
        }
        // Last resort — JSON-stringify the whole thing, but bound the size
        // so the chat bubble doesn't blow up.
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
    // The engine's validator stack mixes Zod (`path: string[]`) with AJV
    // (`instancePath: "/types/0/path"` or legacy `dataPath: ".types[0].path"`).
    // Try all three so per-item paths surface when the engine doesn't
    // collapse them into a parent `errorMessage`.
    let path = ''
    if (Array.isArray(obj.path)) path = (obj.path as unknown[]).join('.')
    else if (typeof obj.path === 'string') path = obj.path
    else if (typeof obj.instancePath === 'string' && obj.instancePath !== '')
        path = obj.instancePath
    else if (typeof obj.dataPath === 'string' && obj.dataPath !== '') path = obj.dataPath
    // AJV `required` errors put the missing prop under `params.missingProperty`
    // — fold it into the path so the message stays clean.
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

function firstStackLine(stack: string): string {
    const lines = stack.split('\n')
    return lines.find((l) => l.includes('at ')) ?? ''
}

function sanitizeCommitMessage(summary: string): string {
    const cleaned = summary.replace(/[`"]/g, '').replace(/\s+/g, ' ').trim()
    return cleaned ? cleaned.slice(0, 200) : 'prototype turn'
}

export const prototypeGeneratorService = new PrototypeGeneratorService()
