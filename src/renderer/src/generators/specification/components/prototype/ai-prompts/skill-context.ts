import { pickSkillHints, type InstalledSkillSummary } from '../../../hooks/usePrototypeSkills'
import { ALWAYS_INJECT_SKILL_SECTIONS, SKILL_BLOCK_MAX_BYTES } from './skill-sections'

/**
 * Build the `## Skill — <name>` block from the most relevant companion
 * sections for the current user message.
 *
 * Two stages combine:
 *
 *   1. **Always-on baseline** — engine rules that apply to every
 *      generation (naming character class, children rules, variant
 *      gotchas, type-definition shape). Pulled by exact heading via
 *      `readSection`. If the installed skill predates a heading the
 *      `readSection` returns `null` and we skip silently.
 *
 *   2. **Turn-specific hints** — `pickSkillHints` selects companion
 *      sections matching keywords in the user message
 *      (list / form / modal / …).
 *
 * The combined block is hard-capped at `SKILL_BLOCK_MAX_BYTES` to keep
 * prompt size predictable. When the budget runs out we trim in
 * selection order (most specific first), appending a `…(truncated)`
 * marker so the LLM sees the cut-off explicitly.
 *
 * Returns `null` when no skill is installed AND no baseline / hints
 * matched — the caller (Prototype's system prompt builder) falls back
 * to the embedded golden anatomy.
 *
 * Extracted from `PrototypePanel.tsx` as part of the prototype refactor
 * (P2 — pure helper functions).
 */
export async function buildSkillContextBlock(
    userMessage: string,
    skills: InstalledSkillSummary[],
    readSection: (
        skillName: string,
        filename: string,
        sectionHeading: string
    ) => Promise<string | null>
): Promise<string | null> {
    if (!skills || skills.length === 0) return null
    const studio = skills.find((s) => s.name === 'igrp-studio-metadata')

    // 1. Always-on baseline sections — engine rules that apply to every
    //    generation. We pull them from SKILL.md (or companions) by exact
    //    heading. If the installed skill is older than the version that
    //    introduced the heading, `readSection` returns null and we skip
    //    silently (no broken-link noise in the prompt).
    const baseline: string[] = []
    let usedBytes = 0
    if (studio) {
        for (const item of ALWAYS_INJECT_SKILL_SECTIONS) {
            if (usedBytes >= SKILL_BLOCK_MAX_BYTES) break
            // `readSection` is wired to the renderer hook's
            // `readCompanionSection`, which for `SKILL.md` reads the same
            // body that listSkills already cached. That's fine — the IPC
            // round-trip is short and the hook caches by `${name}/${file}`.
            const content = await readSection(studio.name, item.filename, item.heading)
            if (!content) continue
            const remaining = SKILL_BLOCK_MAX_BYTES - usedBytes
            const slice =
                content.length > remaining
                    ? `${content.slice(0, remaining)}\n…(truncated)`
                    : content
            baseline.push(
                [`### Baseline — ${studio.name}/${item.filename} § "${item.heading}"`, slice].join(
                    '\n'
                )
            )
            usedBytes += slice.length
        }
    }

    // 2. Turn-specific hints — `pickSkillHints` selects companion sections
    //    matching keywords in the user message (list/form/modal/etc).
    const hints = pickSkillHints(skills, userMessage)

    if (hints.length === 0) {
        // No hint matched. If we have at least a baseline, ship it alone.
        if (baseline.length > 0) {
            return ['## Skill — relevant patterns for this turn', '', ...baseline].join('\n\n')
        }
        // Otherwise fall back to dumping SKILL.md body so the LLM at least
        // sees the corpus map + "when to invoke" guidance.
        if (!studio) return null
        return [
            `## Skill — ${studio.frontmatter.name ?? studio.name}`,
            '',
            (studio.frontmatter.description ?? '').trim(),
            '',
            studio.skillMdBody.trim().slice(0, SKILL_BLOCK_MAX_BYTES)
        ].join('\n')
    }

    const sections: string[] = []
    for (const hint of hints) {
        if (usedBytes >= SKILL_BLOCK_MAX_BYTES) break
        const content = hint.sectionHeading
            ? await readSection(hint.skillName, hint.filename, hint.sectionHeading)
            : await readSection(hint.skillName, hint.filename, '')
        if (!content) continue
        const remaining = SKILL_BLOCK_MAX_BYTES - usedBytes
        const slice =
            content.length > remaining ? `${content.slice(0, remaining)}\n…(truncated)` : content
        sections.push(
            [
                `### From ${hint.skillName}/${hint.filename}${hint.sectionHeading ? ` — section "${hint.sectionHeading}"` : ''}`,
                slice
            ].join('\n')
        )
        usedBytes += slice.length
    }
    if (sections.length === 0 && baseline.length === 0) return null
    return ['## Skill — relevant patterns for this turn', '', ...baseline, ...sections].join('\n\n')
}
