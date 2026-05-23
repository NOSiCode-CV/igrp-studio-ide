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

/** engine group key → user-facing label. */
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
    appComponents: 'Application Components'
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

/** Whether a component name is in the always-hidden list. */
export const isHiddenComponent = (componentName: string): boolean =>
    HIDDEN_COMPONENT_NAMES.includes(componentName)
