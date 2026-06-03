/**
 * Create a fresh `StructuredComponent` ready to insert into the manifest.
 *
 * The "ready" part matters — engine validation requires `commonProperties`,
 * an `interactions: {}` object, and (for cell types) baseline shapes like
 * `headerTitle` + `dataProperties` to even produce a sane column. We
 * hydrate as much as the engine schema lets us so the user doesn't have
 * to walk into the props panel and remember every required key.
 *
 * The schema lookup is best-effort: we read `ComponentRegisterConfig
 * .properties` from the engine catalog (loaded via `useEngineCatalog`) and
 * map declared defaults onto the new node. When the engine doesn't ship a
 * default, we leave the prop out and trust the engine to use ITS own
 * fallback at codegen time.
 */

import type { ComponentRegisterConfig } from '@igrp/igrp-studio-nextjs-engine/types'
import type { StructuredComponent } from '@renderer/lib/dnd/types'

/**
 * Crockford-ish base32 — short, URL-safe, no ambiguous chars.
 * We don't need crypto strength here; uniqueness within a single manifest
 * is enough, and we guard against collisions at insert time by reading the
 * full tree's existing ids.
 */
const ID_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'
function shortId(len = 6): string {
    let out = ''
    for (let i = 0; i < len; i++) out += ID_ALPHABET[Math.floor(Math.random() * ID_ALPHABET.length)]
    return out
}

/**
 * Build a fresh node for `componentName`. `existingIds` lets callers prevent
 * collisions when the random suffix happens to match something already in
 * the tree (very rare, but observed in long sessions).
 */
export function buildNewNode(args: {
    componentName: string
    engineConfig?: ComponentRegisterConfig | null
    existingIds: ReadonlySet<string>
}): StructuredComponent {
    const { componentName, engineConfig, existingIds } = args
    const lowered = componentName.toLowerCase()
    // ID convention: <lowercase-componentname>_<short>. Mirrors the rule in
    // SKILL.md's "id naming convention" — engine resolves custom-component
    // imports from this prefix, so even for non-custom components keeping
    // the prefix consistent is the only safe default.
    let id: string
    do {
        id = `${lowered}_${shortId()}`
    } while (existingIds.has(id))

    // Tag: same scheme but with a 1-based suffix scoped to the tree's
    // current count of this componentName. Tags need to be unique within
    // the page — caller is expected to dedupe at insertion if multiple
    // adds happen in the same tick.
    const tag = nextTag(componentName, existingIds)

    const properties: Record<string, unknown> = hydrateDefaults(engineConfig)
    // Always present — engine rejects nodes without `commonProperties`.
    if (!properties.commonProperties) {
        properties.commonProperties = { generateReference: false }
    }

    const node: StructuredComponent = {
        id,
        componentName,
        tag,
        label: engineConfig?.label ?? capitalise(componentName),
        children: [],
        interactions: {},
        data: {},
        properties
    }

    // Containers carry `type: 'group'` per the engine convention. Cells
    // leave `type` blank. We classify by reading the engine's group:
    // `layout`/`structure` → group; anything else → leave undefined and
    // let the engine pick a default.
    const isContainer =
        (engineConfig?.group === 'layout' || engineConfig?.group === 'structure') ?? false
    if (isContainer) {
        ;(node as { type?: string }).type = 'group'
    }

    return node
}

/**
 * Walk the engine's property schema and lift any `default` values onto a
 * fresh properties object. Skip objects/arrays — those need user input.
 */
function hydrateDefaults(
    engineConfig: ComponentRegisterConfig | null | undefined
): Record<string, unknown> {
    if (!engineConfig?.properties || typeof engineConfig.properties !== 'object') {
        return {}
    }
    const out: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(engineConfig.properties as Record<string, unknown>)) {
        if (!value || typeof value !== 'object') continue
        const entry = value as { default?: unknown; type?: string }
        if (entry.default === undefined) continue
        // Lift primitives + booleans + numbers. Objects/arrays often
        // describe nested shapes (icon, validation rules) that the engine
        // fills in itself when missing.
        if (
            typeof entry.default === 'string' ||
            typeof entry.default === 'number' ||
            typeof entry.default === 'boolean'
        ) {
            out[key] = entry.default
        }
    }
    return out
}

/**
 * Compute a unique tag like `pageHeader1`, `pageHeader2` based on the
 * `existingIds` set (we infer count by id prefix — coarser than reading
 * the tree but doesn't require a tree traversal here).
 */
function nextTag(componentName: string, existingIds: ReadonlySet<string>): string {
    const lowered = componentName.toLowerCase()
    let n = 1
    while (existingIds.has(`${componentName}${n}`) || existingIds.has(`${lowered}${n}`)) n++
    return `${componentName}${n}`
}

function capitalise(s: string): string {
    return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1)
}
