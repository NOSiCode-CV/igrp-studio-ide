/**
 * Renderer-side hook for the Prototype Builder's skill corpus.
 *
 * What this does (Fase 1 + 3):
 *   - On mount (and on every `tree-changed` event for the right basePath),
 *     scan `<basePath>/.agents/skills/*` via IPC and cache the parsed
 *     metadata + companion file list.
 *   - Expose `loadCompanionSection(skillName, filename, sectionHeading?)`
 *     so the `contextProvider` can lazily pull just the relevant chunk of a
 *     companion `.md` file into the system prompt (section-level injection
 *     — keeps prompt size predictable when files grow).
 *   - Expose `installSkill(skillName)` so the install banner can spawn the
 *     CLI via IPC and refresh the local list on success.
 *
 * Why a hook + cache (not a Redux slice):
 *   - Skills change rarely; recomputing on every dispatch would be waste.
 *   - The data is local to a single basePath — there's no cross-component
 *     coordination need that justifies the slice ceremony.
 *
 * The hook also re-reads on `tree-changed` events because installing a
 * skill emits one (see `spec-prototype-handler.ts`), and the user may also
 * install skills from a terminal in parallel — refresh keeps us in sync.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

export interface InstalledSkillSummary {
    name: string
    folderPath: string
    frontmatter: { name?: string; description?: string }
    skillMdBody: string
    companions: Array<{ filename: string; size: number }>
    version: string | null
}

export interface SkillUpdateSummary {
    name: string
    installed: string | null
    latest: string | null
    hasUpdate: boolean
    error?: string
}

export interface UsePrototypeSkillsResult {
    skills: InstalledSkillSummary[]
    isLoading: boolean
    /**
     * One entry per installed skill. Entries with `hasUpdate: true` are
     * what the update banner consumes; entries with `error` describe a
     * transient registry failure (offline / 5xx).
     */
    updates: SkillUpdateSummary[]
    /** Reload — useful after manual install / file-tree refresh. */
    refresh: () => Promise<void>
    /** Force a registry probe now (otherwise runs on mount + on tree-changed). */
    checkUpdates: () => Promise<void>
    /**
     * Read a whole companion file (e.g. `patterns.md`). Cached in-memory by
     * `${skillName}/${filename}` so repeated reads in the same session
     * don't hit IPC.
     */
    readCompanion: (skillName: string, filename: string) => Promise<string | null>
    /**
     * Same as `readCompanion` but returns just the markdown section under
     * the heading that matches `sectionHeading` (case-insensitive `##` or
     * `###`). Falls back to the full file when no match. Useful to budget
     * prompt size when only one slice of a file is relevant.
     */
    readCompanionSection: (
        skillName: string,
        filename: string,
        sectionHeading: string
    ) => Promise<string | null>
    /** Trigger `igrp skill add` via IPC. Refreshes on success. */
    installSkill: (skillName: string) => Promise<{ ok: boolean; error?: string }>
    /** Trigger `igrp skill update <name>` via IPC. Refreshes + re-checks on success. */
    updateSkill: (skillName: string) => Promise<{ ok: boolean; error?: string }>
}

export function usePrototypeSkills(basePath: string | undefined): UsePrototypeSkillsResult {
    const [skills, setSkills] = useState<InstalledSkillSummary[]>([])
    const [updates, setUpdates] = useState<SkillUpdateSummary[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const cacheRef = useRef<Map<string, string>>(new Map())
    // Tracks the last registry-probe timestamp so we can throttle in-renderer.
    // The main process doesn't cache (it's per-window), so the hook does it.
    const lastCheckRef = useRef<number>(0)

    const refresh = useCallback(async () => {
        if (!basePath) {
            setSkills([])
            cacheRef.current.clear()
            return
        }
        setIsLoading(true)
        try {
            const result = await window.specPrototype.listSkills(basePath)
            setSkills(result.skills as InstalledSkillSummary[])
            // Invalidate companion cache — file contents may have changed
            // (skill update, manual edit).
            cacheRef.current.clear()
        } finally {
            setIsLoading(false)
        }
    }, [basePath])

    const checkUpdates = useCallback(async () => {
        if (!basePath) {
            setUpdates([])
            return
        }
        try {
            const result = await window.specPrototype.checkSkillUpdates(basePath)
            setUpdates(result.updates)
            lastCheckRef.current = Date.now()
        } catch {
            // Network blip — keep whatever state we had. The banner just
            // doesn't update; no need to alarm the user.
        }
    }, [basePath])

    useEffect(() => {
        void refresh()
    }, [refresh])

    // Decoupled from `refresh` because the local list always succeeds and
    // we don't want a slow registry to block UI. Runs on mount + when the
    // user re-focuses the window (typing in another app, coming back).
    useEffect(() => {
        if (!basePath) return
        void checkUpdates()
        const onFocus = () => {
            // Throttle: at most one registry hit per hour per window.
            if (Date.now() - lastCheckRef.current > 60 * 60 * 1000) {
                void checkUpdates()
            }
        }
        window.addEventListener('focus', onFocus)
        return () => window.removeEventListener('focus', onFocus)
    }, [basePath, checkUpdates])

    useEffect(() => {
        if (!basePath) return
        const off = window.specPrototype.onTreeChanged((payload) => {
            if (payload.basePath === basePath) {
                void refresh()
                // After an install/update the local version changed — the
                // registry-side `latest` didn't, so re-checking lets the
                // banner disappear without waiting for the next focus.
                void checkUpdates()
            }
        })
        return off
    }, [basePath, refresh, checkUpdates])

    const readCompanion = useCallback(
        async (skillName: string, filename: string): Promise<string | null> => {
            if (!basePath) return null
            const cacheKey = `${skillName}/${filename}`
            const hit = cacheRef.current.get(cacheKey)
            if (hit !== undefined) return hit
            const result = await window.specPrototype.readSkillFile(
                basePath,
                skillName,
                filename
            )
            if (result.content !== null) {
                cacheRef.current.set(cacheKey, result.content)
            }
            return result.content
        },
        [basePath]
    )

    const readCompanionSection = useCallback(
        async (
            skillName: string,
            filename: string,
            sectionHeading: string
        ): Promise<string | null> => {
            const full = await readCompanion(skillName, filename)
            if (!full) return null
            const section = extractMarkdownSection(full, sectionHeading)
            return section ?? full
        },
        [readCompanion]
    )

    const install = useCallback(
        async (skillName: string) => {
            if (!basePath) return { ok: false, error: 'No project path.' }
            const result = await window.specPrototype.installSkill(basePath, skillName)
            if (result.ok) {
                await refresh()
                await checkUpdates()
            }
            return result
        },
        [basePath, refresh, checkUpdates]
    )

    const update = useCallback(
        async (skillName: string) => {
            if (!basePath) return { ok: false, error: 'No project path.' }
            const result = await window.specPrototype.updateSkill(basePath, skillName)
            if (result.ok) {
                await refresh()
                await checkUpdates()
            }
            return result
        },
        [basePath, refresh, checkUpdates]
    )

    return {
        skills,
        isLoading,
        updates,
        refresh,
        checkUpdates,
        readCompanion,
        readCompanionSection,
        installSkill: install,
        updateSkill: update
    }
}

/**
 * Pull the markdown subsection whose heading text matches `heading`
 * (case-insensitive substring match across `##`/`###` levels). The match
 * keeps everything from that heading down to the next sibling-or-greater
 * heading, exclusive. Returns `null` when no heading matches.
 *
 * Why substring + multi-level: skill authors use varied heading text
 * ("## List page", "### List pattern", "## 1. List with stats"). Demanding
 * an exact match would miss obvious targets; matching across `##` + `###`
 * keeps the heuristic forgiving without becoming sloppy.
 */
export function extractMarkdownSection(
    content: string,
    heading: string
): string | null {
    if (!heading.trim()) return null
    const needle = heading.toLowerCase().trim()
    const lines = content.split('\n')
    let startIdx = -1
    let startLevel = 0
    for (let i = 0; i < lines.length; i++) {
        const m = lines[i].match(/^(#{2,4})\s+(.+?)\s*$/)
        if (!m) continue
        const level = m[1].length
        const text = m[2].toLowerCase()
        if (text.includes(needle)) {
            startIdx = i
            startLevel = level
            break
        }
    }
    if (startIdx === -1) return null
    let endIdx = lines.length
    for (let i = startIdx + 1; i < lines.length; i++) {
        const m = lines[i].match(/^(#{1,4})\s+/)
        if (!m) continue
        if (m[1].length <= startLevel) {
            endIdx = i
            break
        }
    }
    return lines.slice(startIdx, endIdx).join('\n').trim()
}

/**
 * Pick the most relevant skill content for a given user message + spec
 * context. Heuristic for Fase 1 (keyword → companion + section):
 *
 *   keyword match → file        → section heading hint
 *   ───────────────────────────────────────────────────────────
 *   "list" / "table"          → patterns.md     → "list"
 *   "form" / "create" / "new" → patterns.md     → "form"
 *   "modal" / "dialog"        → patterns.md     → "modal"
 *   "filter"                  → patterns.md     → "filter"
 *   "stats" / "card"          → patterns.md     → "stats"
 *   "dashboard"               → patterns.md     → "dashboard"
 *   "process" / "step"        → process-steps.md → null (whole file)
 *   "error" / "fix" / "fail"  → troubleshooting.md → null
 *   "component" / componentName looking word → component-reference.md → null
 *
 * Returns a list of `{skill, filename, sectionHeading?}` ordered by
 * estimated relevance. The contextProvider picks the top-K and reads them
 * via `readCompanionSection`.
 */
export interface SkillContextHint {
    skillName: string
    filename: string
    sectionHeading?: string
    /** Human-readable label of why this was picked — for debugging. */
    reason: string
}

export function pickSkillHints(
    skills: InstalledSkillSummary[],
    userMessage: string
): SkillContextHint[] {
    const studio = skills.find((s) => s.name === 'igrp-studio-metadata')
    if (!studio) return []
    const msg = userMessage.toLowerCase()
    const hints: SkillContextHint[] = []
    const has = (s: string) => msg.includes(s)
    const companionExists = (filename: string) =>
        studio.companions.some((c) => c.filename === filename)

    // Order matters — most specific first.
    if ((has('error') || has('fix') || has('fail') || has('issue')) && companionExists('troubleshooting.md')) {
        hints.push({
            skillName: 'igrp-studio-metadata',
            filename: 'troubleshooting.md',
            reason: 'user message mentions an error / fix'
        })
    }
    if ((has('process') || has('step')) && companionExists('process-steps.md')) {
        hints.push({
            skillName: 'igrp-studio-metadata',
            filename: 'process-steps.md',
            reason: 'user message mentions process / step'
        })
    }
    if (companionExists('patterns.md')) {
        let section: string | undefined
        if (has('list') || has('table')) section = 'list'
        else if (has('form') || has('create') || has('new') || has('edit')) section = 'form'
        else if (has('modal') || has('dialog')) section = 'modal'
        else if (has('filter')) section = 'filter'
        else if (has('stats') || has('dashboard')) section = 'stats'
        if (section) {
            hints.push({
                skillName: 'igrp-studio-metadata',
                filename: 'patterns.md',
                sectionHeading: section,
                reason: `pattern section "${section}"`
            })
        }
    }
    if ((has('component') || has('button') || has('input') || has('select')) && companionExists('component-reference.md')) {
        hints.push({
            skillName: 'igrp-studio-metadata',
            filename: 'component-reference.md',
            reason: 'user message picks a component'
        })
    }
    return hints
}
