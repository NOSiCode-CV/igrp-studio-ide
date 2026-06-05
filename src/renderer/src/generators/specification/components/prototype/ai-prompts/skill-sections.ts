/**
 * Skill prompt-block configuration.
 *
 * The Prototype builder enriches its system prompt with the
 * `igrp-studio-metadata` SKILL.md — engine contracts that the LLM
 * silently gets wrong otherwise (naming character class, children
 * rules, variant gotchas, type-definition shape).
 *
 * Two knobs live here:
 *   1. `SKILL_BLOCK_MAX_BYTES` — hard cap on the combined skill block
 *      so prompt size stays predictable. Bumped from 6k → 10k once
 *      the baseline section list grew to 4 always-on entries (each
 *      ~600–1200 bytes); 4–5k baseline leaves enough room for the
 *      turn-specific `patterns.md` hint without truncation. Claude's
 *      context is huge — the budget exists mostly to keep the prompt
 *      focused, not to save tokens.
 *
 *   2. `ALWAYS_INJECT_SKILL_SECTIONS` — headings (substring-matched,
 *      case-insensitive) ALWAYS extracted from SKILL.md regardless of
 *      the user message. These describe contracts that produce
 *      unhelpful generic engine errors ("must only contain letters"…)
 *      when violated. Keep the list short — every entry is paid on
 *      every turn.
 *
 * Extracted from `PrototypePanel.tsx` as part of the prototype
 * refactor (P1).
 */
export const SKILL_BLOCK_MAX_BYTES = 10000

export const ALWAYS_INJECT_SKILL_SECTIONS: ReadonlyArray<{
    filename: string
    heading: string
}> = [
    { filename: 'SKILL.md', heading: 'Engine naming constraints' },
    { filename: 'SKILL.md', heading: 'Component children rules' },
    { filename: 'SKILL.md', heading: 'Component variant gotchas' },
    { filename: 'SKILL.md', heading: 'Engine type-definition shape' }
]
