/**
 * Skill onboarding banner dismissal keys — persisted to `localStorage`.
 *
 * Two banners live in the Prototype panel:
 *   - `SkillInstallBanner`  — shown when the canonical skill is missing.
 *   - `SkillUpdateBanner`   — shown when a newer skill version exists.
 *
 * Both can be dismissed per project; the key prefixes are scoped with
 * the `basePath` at the call site (`${PREFIX}${basePath}`).
 *
 * `CANONICAL_SKILL` is the name of the skill the banners look for. If
 * the engine ever ships under a different name this is the single
 * place to update.
 *
 * Extracted from `PrototypePanel.tsx` as part of the prototype refactor
 * (P1).
 */
export const SKILL_BANNER_DISMISS_KEY_PREFIX = 'spec.prototype.skillBanner.dismissed.'
export const SKILL_UPDATE_DISMISS_KEY_PREFIX = 'spec.prototype.skillUpdate.dismissed.'
export const CANONICAL_SKILL = 'igrp-studio-metadata'
