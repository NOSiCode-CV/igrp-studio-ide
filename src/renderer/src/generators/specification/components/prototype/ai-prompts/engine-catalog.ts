import { ALWAYS_INCLUDED_COMPONENTS } from './always-included'

/**
 * Build the `## Engine catalog` block for the Prototype's system prompt
 * (M6.1).
 *
 * The full engine catalog can be ~100 components × dozens of properties
 * each — too large to inline in every chat turn. We pick a curated set
 * of always-included "structural" components (see
 * `ALWAYS_INCLUDED_COMPONENTS`) plus whatever the user pinned via the
 * palette. Property names are listed but not their value schemas; the
 * LLM has enough signal from labels + property keys + the spec context
 * to produce a valid manifest.
 *
 * Component entries are grouped by their engine group (structure /
 * containers / formElements / …) in a stable, curated order so the
 * prompt reads consistently across turns. Pinned components are
 * additionally re-listed under their own section to nudge the LLM
 * toward the user's current vocabulary.
 *
 * Extracted from `PrototypePanel.tsx` as part of the prototype refactor
 * (P2 — pure helper functions).
 */
export function buildEngineCatalogBlock(
    componentsRegistered: ReadonlyArray<{
        name: string
        label?: string
        group?: string
        properties?: unknown
        deprecated?: boolean
    }>,
    pinned: ReadonlyArray<{ id: string; name: string; groupLabel: string }>
): string {
    if (componentsRegistered.length === 0) {
        // Engine catalog hasn't loaded yet (or is empty). Fall back to a hint
        // so the LLM doesn't fabricate component names from training data.
        return [
            '## Engine catalog',
            '',
            '_Catalog not loaded yet — emit a minimal placeholder page using `section` + `paragraph` only._'
        ].join('\n')
    }

    const wantedNames = new Set<string>(ALWAYS_INCLUDED_COMPONENTS)
    for (const p of pinned) wantedNames.add(p.id)

    type Entry = {
        name: string
        label: string
        group: string
        propertyKeys: string[]
        deprecated: boolean
    }

    const entriesByGroup = new Map<string, Entry[]>()
    for (const c of componentsRegistered) {
        if (!wantedNames.has(c.name)) continue
        const props =
            c.properties && typeof c.properties === 'object'
                ? Object.keys(c.properties as Record<string, unknown>)
                : []
        const group = c.group || 'others'
        const entry: Entry = {
            name: c.name,
            label: c.label || c.name,
            group,
            propertyKeys: props.slice(0, 8), // cap to keep prompt tight
            deprecated: Boolean(c.deprecated)
        }
        const list = entriesByGroup.get(group) ?? []
        list.push(entry)
        entriesByGroup.set(group, list)
    }

    const lines: string[] = ['## Engine catalog (allowed `componentName` values)', '']
    lines.push(
        "Use these — and only these — values for the `componentName` field of each `StructuredComponent`. Names are listed under their engine group. Property keys after the dash are the recognised props for that component (omit any prop you don't need).",
        ''
    )

    // Stable group order: prefer the curated `GROUP_LABELS` insertion order,
    // then anything else alphabetical.
    const groupOrder = [
        'structure',
        'containers',
        'layout',
        'typography',
        'formElements',
        'basicElements',
        'dataDisplay',
        'widget',
        'advanced',
        'appComponents',
        'customComponents'
    ]
    const orderedGroups = Array.from(entriesByGroup.keys()).sort((a, b) => {
        const ia = groupOrder.indexOf(a)
        const ib = groupOrder.indexOf(b)
        if (ia === -1 && ib === -1) return a.localeCompare(b)
        if (ia === -1) return 1
        if (ib === -1) return -1
        return ia - ib
    })

    for (const group of orderedGroups) {
        const entries = entriesByGroup.get(group)
        if (!entries || entries.length === 0) continue
        lines.push(`### ${group}`)
        for (const e of entries) {
            const propsHint =
                e.propertyKeys.length > 0 ? ` — props: ${e.propertyKeys.join(', ')}` : ''
            const depHint = e.deprecated ? ' _(deprecated — avoid unless requested)_' : ''
            lines.push(`- \`${e.name}\` (${e.label})${propsHint}${depHint}`)
        }
        lines.push('')
    }

    if (pinned.length > 0) {
        lines.push('### Pinned by user (prioritise these for this turn)')
        for (const p of pinned) lines.push(`- \`${p.id}\` (${p.name}, ${p.groupLabel})`)
    }

    return lines.join('\n')
}
