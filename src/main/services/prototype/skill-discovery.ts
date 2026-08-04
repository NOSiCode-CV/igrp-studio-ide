/**
 * Skill discovery + companion-file IO for the Prototype Builder.
 *
 * Skills follow the Anthropic-style format established by the IGRP CLI
 * (`igrp skill add`): each skill lives in `<basePath>/.agents/skills/<name>/`
 * with a top-level `SKILL.md` (YAML frontmatter `name` + `description`,
 * markdown body) plus optional companion `.md` files referenced from the
 * body. The CLI publishes the registry; the Studio only consumes — never
 * writes the skill content itself, only invokes the CLI to install.
 *
 * What this service exposes to IPC:
 *   - `listSkills(basePath)`     — scan `.agents/skills/` for installed skills.
 *   - `readSkillFile(basePath, skillName, filename)` — read a companion `.md`.
 *   - `installSkill(basePath, skillName)` — spawn `igrp skill add` for the
 *     canonical install path (no manual file writes).
 *
 * Failure modes are non-fatal — the Studio always falls back to the
 * embedded `GOLDEN_LIST_PAGE_EXAMPLE` when discovery / install fails.
 */

import fs from 'node:fs'
import { promises as fsp } from 'node:fs'
import { join, normalize, relative } from 'node:path'
import { buildIgrpCliInstallCommand } from '@shared/igrp-cli'
import { spawnIgrpCli } from '../igrp-cli-service'

const SKILLS_DIR = '.agents/skills'
/** Companion-file paths exposed to the renderer. Anything outside this list
 *  is rejected to keep IPC reads constrained to the skill folder. */
const SKILL_FILE_RE = /^[a-zA-Z0-9._-]+\.md$/
const SKILL_MD = 'SKILL.md'

export interface SkillFrontmatter {
    name?: string
    description?: string
}

export interface InstalledSkillCompanion {
    /** Companion file name (e.g. `patterns.md`). */
    filename: string
    /** Bytes — useful to estimate prompt cost before reading. */
    size: number
}

export interface InstalledSkill {
    /** Folder name under `.agents/skills/`. */
    name: string
    /** Absolute path to the skill folder. */
    folderPath: string
    /** Parsed frontmatter — `name`/`description` when present. */
    frontmatter: SkillFrontmatter
    /** `SKILL.md` body (without frontmatter). */
    skillMdBody: string
    /** Companion `.md` files in the same folder, alphabetically sorted. */
    companions: InstalledSkillCompanion[]
    /**
     * Installed version used for update suggestions.
     * Prefer `.agents/skills/.installed.json` (CLI ledger from
     * `igrp skill add|update`) and fall back to `skill.json`. `null` when
     * neither has a version — skip update check.
     */
    version: string | null
}

interface InstalledLedgerEntry {
    version?: string
}

interface InstalledLedger {
    skills?: Record<string, InstalledLedgerEntry>
}

/**
 * Reads the CLI project ledger at `.agents/skills/.installed.json`.
 * Same source of truth `igrp skill update` uses for version compares.
 */
async function readInstalledLedger(
    basePath: string
): Promise<Record<string, InstalledLedgerEntry>> {
    const path = join(basePath, SKILLS_DIR, '.installed.json')
    if (!fs.existsSync(path)) return {}
    try {
        const raw = await fsp.readFile(path, 'utf-8')
        if (!raw.trim()) return {}
        const parsed = JSON.parse(raw) as InstalledLedger
        return parsed.skills && typeof parsed.skills === 'object' ? parsed.skills : {}
    } catch {
        return {}
    }
}

/**
 * Light-weight YAML frontmatter parser — only handles flat `key: value`
 * pairs which is what `SKILL.md` uses today. Avoids pulling `gray-matter`
 * into the main-process bundle just for this. Extend if the format grows
 * lists / nested objects.
 */
export function parseSkillFrontmatter(content: string): {
    frontmatter: SkillFrontmatter
    body: string
} {
    const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/)
    if (!match) return { frontmatter: {}, body: content }
    const block = match[1]
    const body = match[2] ?? ''
    const frontmatter: SkillFrontmatter = {}
    for (const line of block.split('\n')) {
        const kv = line.match(/^([a-zA-Z_][a-zA-Z0-9_-]*)\s*:\s*(.*?)\s*$/)
        if (!kv) continue
        const key = kv[1]
        let value = kv[2]
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1)
        if (key === 'name' || key === 'description') {
            frontmatter[key] = value
        }
    }
    return { frontmatter, body }
}

export async function listInstalledSkills(basePath: string): Promise<InstalledSkill[]> {
    const skillsRoot = join(basePath, SKILLS_DIR)
    if (!fs.existsSync(skillsRoot)) return []
    let entries: string[]
    try {
        entries = await fsp.readdir(skillsRoot)
    } catch {
        return []
    }
    const ledger = await readInstalledLedger(basePath)
    const out: InstalledSkill[] = []
    for (const name of entries) {
        if (name.startsWith('.')) continue // skip `.installed.json` and friends
        const folderPath = join(skillsRoot, name)
        const stat = await fsp.stat(folderPath).catch(() => null)
        if (!stat?.isDirectory()) continue
        const skill = await loadSkill(folderPath, name, ledger[name]?.version)
        if (skill) out.push(skill)
    }
    return out.sort((a, b) => a.name.localeCompare(b.name))
}

async function loadSkill(
    folderPath: string,
    name: string,
    ledgerVersion?: string
): Promise<InstalledSkill | null> {
    const skillMdPath = join(folderPath, SKILL_MD)
    if (!fs.existsSync(skillMdPath)) return null
    let content: string
    try {
        content = await fsp.readFile(skillMdPath, 'utf-8')
    } catch {
        return null
    }
    const { frontmatter, body } = parseSkillFrontmatter(content)
    const companions: InstalledSkillCompanion[] = []
    let entries: string[]
    try {
        entries = await fsp.readdir(folderPath)
    } catch {
        entries = []
    }
    for (const f of entries) {
        if (f === SKILL_MD) continue
        if (!SKILL_FILE_RE.test(f)) continue
        try {
            const s = await fsp.stat(join(folderPath, f))
            if (!s.isFile()) continue
            companions.push({ filename: f, size: s.size })
        } catch {
            // skip unreadable files silently
        }
    }
    companions.sort((a, b) => a.filename.localeCompare(b.filename))
    // Prefer CLI ledger — same version `igrp skill update` compares against.
    const fromLedger =
        typeof ledgerVersion === 'string' && ledgerVersion.trim() ? ledgerVersion.trim() : null
    const version = fromLedger ?? (await readSkillJsonVersion(folderPath))
    return { name, folderPath, frontmatter, skillMdBody: body, companions, version }
}

/**
 * Fallback: reads `skill.json` next to `SKILL.md` when `.installed.json`
 * has no entry (e.g. hand-authored skill folders).
 */
async function readSkillJsonVersion(folderPath: string): Promise<string | null> {
    const path = join(folderPath, 'skill.json')
    if (!fs.existsSync(path)) return null
    try {
        const raw = await fsp.readFile(path, 'utf-8')
        const parsed = JSON.parse(raw)
        return typeof parsed?.version === 'string' ? parsed.version : null
    } catch {
        return null
    }
}

/**
 * Read a companion file. Sandbox the path against the skill folder so the
 * renderer can't request `../../etc/passwd` through this IPC.
 */
export async function readSkillCompanion(
    basePath: string,
    skillName: string,
    filename: string
): Promise<{ content: string | null; error?: string }> {
    if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(skillName)) {
        return { content: null, error: 'Invalid skill name.' }
    }
    if (!SKILL_FILE_RE.test(filename)) {
        return { content: null, error: 'Companion filename must match /[a-zA-Z0-9._-]+\\.md/.' }
    }
    const folderPath = join(basePath, SKILLS_DIR, skillName)
    const target = normalize(join(folderPath, filename))
    const rel = relative(folderPath, target)
    if (rel.startsWith('..') || rel === '') {
        return { content: null, error: 'Path escapes the skill folder.' }
    }
    if (!fs.existsSync(target)) return { content: null }
    try {
        const content = await fsp.readFile(target, 'utf-8')
        return { content }
    } catch (err) {
        return {
            content: null,
            error: err instanceof Error ? err.message : String(err)
        }
    }
}

/**
 * Install a skill by spawning the `igrp` CLI. The CLI owns the registry
 * fetch + integrity check + install layout — we just kick it off.
 *
 * Streams CLI stdout/stderr lines through `onProgress` so the renderer
 * can show a live install log. Resolves to `{ ok, error? }`.
 *
 * Pre-conditions:
 *   - `igrp` must be on the user's PATH. If not, we report a clear error
 *     pointing at the install command.
 *   - `basePath` must exist (we don't try to mkdir).
 */
export async function installSkill(
    basePath: string,
    skillName: string,
    onProgress: (line: string, level: 'info' | 'warn' | 'error') => void
): Promise<{ ok: boolean; error?: string }> {
    if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(skillName)) {
        return { ok: false, error: 'Invalid skill name.' }
    }
    if (!fs.existsSync(basePath)) {
        return { ok: false, error: `Project path does not exist: ${basePath}` }
    }
    const spawned = await spawnIgrpCli(
        ['skill', 'add', skillName, '--project', basePath, '--quiet'],
        { cwd: basePath }
    )
    if (!spawned.ok) {
        return { ok: false, error: spawned.error }
    }
    const proc = spawned.proc
    return new Promise((resolve) => {
        const drain = (level: 'info' | 'warn' | 'error') => (chunk: Buffer) => {
            chunk
                .toString()
                .split(/\r?\n/)
                .map((l) => l.trimEnd())
                .filter(Boolean)
                .forEach((line) => onProgress(line, level))
        }
        proc.stdout?.on('data', drain('info'))
        proc.stderr?.on('data', drain('warn'))
        proc.on('error', (err) => {
            resolve({
                ok: false,
                error: `\`igrp\` spawn failed: ${err.message}. Install via: ${buildIgrpCliInstallCommand()}`
            })
        })
        proc.on('exit', (code) => {
            if (code === 0) resolve({ ok: true })
            else resolve({ ok: false, error: `\`igrp skill add\` exited with code ${code}` })
        })
    })
}

// ─── Update detection ──────────────────────────────────────────────────
//
// Same registry the CLI uses (`igrp skill` commands). We do NOT spawn the
// CLI for the check itself — it's a single HTTP GET to `index.json` and
// reading it inline keeps the UX snappy (banner can show in <500ms instead
// of paying the CLI startup cost). For applying the update we DO spawn
// the CLI (`igrp skill update <name>`) because it owns tarball download,
// integrity check, and atomic install layout.
//
// Cache: callers (the renderer hook) are expected to throttle. We don't
// cache inside main because two windows looking at different projects
// should each get a fresh check on demand.

/** Default registry — kept in sync with `studio/packages/cli/src/commands/skill/shared/paths.js`. */
const DEFAULT_SKILL_REGISTRY = 'https://sonatype.nosi.cv/repository/igrp-templates/@igrp/skills/'

function resolveSkillRegistry(): string {
    return process.env.IGRP_SKILL_REGISTRY || DEFAULT_SKILL_REGISTRY
}

function joinRegistryUrl(base: string, ...parts: string[]): string {
    const head = base.endsWith('/') ? base : base + '/'
    return head + parts.map((p) => p.replace(/^\/+|\/+$/g, '')).join('/')
}

interface RegistryIndexEntry {
    name: string
    latest: string
}

interface RegistryIndex {
    skills?: RegistryIndexEntry[]
}

/**
 * Strict `semver.gt` for the simple `MAJOR.MINOR.PATCH` shape the registry
 * uses. Inlined to avoid pulling `semver` into the main bundle — if the
 * scheme ever grows pre-release tags, replace with the real dep.
 */
function isNewerVersion(latest: string, installed: string): boolean {
    const parse = (v: string): [number, number, number] | null => {
        const m = /^(\d+)\.(\d+)\.(\d+)/.exec(v.trim())
        if (!m) return null
        return [Number(m[1]), Number(m[2]), Number(m[3])]
    }
    const a = parse(latest)
    const b = parse(installed)
    if (!a || !b) return false
    for (let i = 0; i < 3; i++) {
        if (a[i] > b[i]) return true
        if (a[i] < b[i]) return false
    }
    return false
}

export interface SkillUpdateInfo {
    name: string
    installed: string | null
    latest: string | null
    hasUpdate: boolean
    /** Populated when the registry lookup itself failed (offline, 5xx). */
    error?: string
}

/**
 * For every installed skill, ask the registry whether a newer version is
 * available. Installed versions come from `.installed.json` (via
 * `listInstalledSkills`) — same ledger the CLI update command uses.
 *
 * Failure mode: a registry error is reported per-skill (`error` field) and
 * `hasUpdate` stays `false`. The caller renders no banner in that case
 * rather than alarming the user about something that might be transient.
 */
export async function checkSkillUpdates(basePath: string): Promise<SkillUpdateInfo[]> {
    const installed = await listInstalledSkills(basePath)
    if (installed.length === 0) return []
    const baseUrl = resolveSkillRegistry()
    let index: RegistryIndex | null = null
    let indexError: string | null = null
    try {
        const res = await fetch(joinRegistryUrl(baseUrl, 'index.json'))
        if (!res.ok) {
            indexError = `Registry GET index.json → ${res.status}`
        } else {
            index = (await res.json()) as RegistryIndex
        }
    } catch (err) {
        indexError = err instanceof Error ? err.message : String(err)
    }
    return installed.map<SkillUpdateInfo>((skill) => {
        if (indexError) {
            return {
                name: skill.name,
                installed: skill.version,
                latest: null,
                hasUpdate: false,
                error: indexError
            }
        }
        const entry = index?.skills?.find((s) => s.name === skill.name)
        if (!entry) {
            // Skill is installed but not in the registry — could be a
            // hand-authored / private skill. Not an error, just no update.
            return {
                name: skill.name,
                installed: skill.version,
                latest: null,
                hasUpdate: false
            }
        }
        const installedV = skill.version
        const latest = entry.latest
        // Without a ledger/manifest version we cannot safely suggest an update.
        const hasUpdate = !!installedV && isNewerVersion(latest, installedV)
        return { name: skill.name, installed: installedV, latest, hasUpdate }
    })
}

/**
 * Spawn `igrp skill update <name>` — same shape as `installSkill`, just a
 * different verb. The CLI handles the tarball + atomic swap; we only
 * stream its log lines.
 */
export async function updateSkill(
    basePath: string,
    skillName: string,
    onProgress: (line: string, level: 'info' | 'warn' | 'error') => void
): Promise<{ ok: boolean; error?: string }> {
    if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(skillName)) {
        return { ok: false, error: 'Invalid skill name.' }
    }
    if (!fs.existsSync(basePath)) {
        return { ok: false, error: `Project path does not exist: ${basePath}` }
    }
    const spawned = await spawnIgrpCli(
        ['skill', 'update', skillName, '--project', basePath, '--quiet'],
        { cwd: basePath }
    )
    if (!spawned.ok) {
        return { ok: false, error: spawned.error }
    }
    const proc = spawned.proc
    return new Promise((resolve) => {
        const drain = (level: 'info' | 'warn' | 'error') => (chunk: Buffer) => {
            chunk
                .toString()
                .split(/\r?\n/)
                .map((l) => l.trimEnd())
                .filter(Boolean)
                .forEach((line) => onProgress(line, level))
        }
        proc.stdout?.on('data', drain('info'))
        proc.stderr?.on('data', drain('warn'))
        proc.on('error', (err) => {
            resolve({
                ok: false,
                error: `\`igrp\` spawn failed: ${err.message}. Install via: ${buildIgrpCliInstallCommand()}`
            })
        })
        proc.on('exit', (code) => {
            if (code === 0) resolve({ ok: true })
            else resolve({ ok: false, error: `\`igrp skill update\` exited with code ${code}` })
        })
    })
}
