/**
 * Group labels and hidden-component list — shared metadata for any surface
 * that renders the IGRP engine's component catalog. Lifted from
 * `generators/ui/ComponentTypes.ts` (`GROUP_COMPONET` + `HIDDEN_COMPONENTS`
 * inside `useConfigData`) so the Prototype palette and other consumers
 * read from the same source of truth.
 *
 * The `engine` (Next.js) emits a `group` field per `ComponentRegisterConfig`
 * — e.g. `'structure'`, `'formElements'`. This module maps those keys to
 * human-readable labels.
 */

/**
 * engine group key → user-facing label (canonical English fallback).
 * Key set verified against the engine bundle's `loadGroup("...")` calls
 * (nextjs-engine 0.2.0-beta.20) — some keys are capitalized at the source
 * (`Filters`, `Columns`, `Table`); keep them verbatim.
 * For display, prefer `translateGroupLabel` (i18n-aware).
 */
export const GROUP_LABELS: Record<string, string> = {
    structure: 'Structure',
    containers: 'Containers',
    formElements: 'Form Elements',
    basicElements: 'Basic Elements',
    dataDisplay: 'Data Display',
    layout: 'Layout',
    widget: 'Widgets',
    advanced: 'Advanced',
    typography: 'Typography',
    customComponents: 'Custom Components',
    appComponents: 'Application Components',
    feedback: 'Feedback',
    navigation: 'Navigation',
    overlays: 'Overlays',
    forms: 'Forms',
    media: 'Media',
    Filters: 'Filters',
    Columns: 'Columns',
    Table: 'Table',
    others: 'Others'
} as const

/**
 * Component names hidden from any palette UI. These are layout-tree internals
 * (page/component/process container roots, the `column` cell that's always
 * an implicit child of `columns`). Users never pin them directly.
 */
export const HIDDEN_COMPONENT_NAMES: ReadonlyArray<string> = [
    'column',
    'page',
    'component',
    'process',
    'processStep'
] as const

/** Back-compat alias for old UI-generator code that reads `GROUP_COMPONET`. */
export const GROUP_COMPONET = GROUP_LABELS

/** Resolve a group key to a label, falling back to the key itself. */
export const resolveGroupLabel = (groupKey: string | undefined): string =>
    GROUP_LABELS[groupKey ?? ''] ?? groupKey ?? 'Others'

/**
 * i18n-aware variant of `resolveGroupLabel`. Looks up
 * `componentGroups.<groupKey>` in the active locale and falls back to the
 * canonical English label (never emits a missingKey warning thanks to
 * `defaultValue`). Pass the `t` from `useTranslation()`.
 */
export const translateGroupLabel = (
    groupKey: string | undefined,
    t: (key: string, options?: { defaultValue?: string }) => string
): string => {
    const key = groupKey ?? 'others'
    return t(`componentGroups.${key}`, { defaultValue: resolveGroupLabel(key) })
}

/** Whether a component name is in the always-hidden list. */
export const isHiddenComponent = (componentName: string): boolean =>
    HIDDEN_COMPONENT_NAMES.includes(componentName)
