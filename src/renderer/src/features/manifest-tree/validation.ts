/**
 * Validation rules for palette → tree and tree → tree drops.
 *
 * Two flavours of "no":
 *   - **HARD** — the destination container has a finite `acceptedChildren`
 *     whitelist AND/OR a `maxChildren` cap extracted from the engine bundle.
 *     We block these drops outright (cursor "not-allowed", red border) because
 *     the engine will explode at generation time anyway and the failure is
 *     obvious in the IGRP semantics (`card` IS NOT a generic container).
 *   - **SOFT** — best-practice violations (e.g. dropping a `tableTextCell`
 *     outside a `tableColumns`). Allowed but flagged in the UI as a warning;
 *     the engine will produce something but it likely won't render right.
 *
 * The 4 hard-constrained containers were extracted by reading
 * `loadChildrenMax(N)` + `loadAcceptedChildren([...])` calls in the engine
 * bundle (`@igrp/igrp-studio-nextjs-engine/dist/index.cjs.js`). Keep this
 * table in sync with the skill's `## Component children rules` section —
 * both should describe the SAME contract.
 */

import type { StructuredComponent } from '@renderer/lib/dnd/types'

export interface ContainerRule {
    maxChildren: number
    acceptedChildren: ReadonlyArray<string>
}

/**
 * Engine-enforced (`loadChildrenMax` + `loadAcceptedChildren`) — the
 * generation step fails or produces broken code if violated.
 */
export const HARD_CONTAINER_RULES: Readonly<Record<string, ContainerRule>> = {
    card: {
        maxChildren: 3,
        acceptedChildren: ['cardHeader', 'cardContent', 'cardFooter']
    },
    table: {
        maxChildren: 3,
        acceptedChildren: ['tableColumns', 'tableFilters', 'tableRowSubcomponent']
    },
    modalDialog: {
        maxChildren: 3,
        acceptedChildren: ['modalDialogContent', 'modalDialogTrigger']
    },
    textListItem: {
        maxChildren: 2,
        acceptedChildren: ['textListItemContent', 'textListSubItems']
    }
}

/**
 * Containers whose ACCEPTED children are well-defined even without a max.
 * Dropping anything else is a "soft" failure — allowed, warned. We list the
 * most-error-prone parents (cell families) here; everything else is treated
 * as a generic container that accepts any component.
 */
export const SOFT_CONTAINER_RULES: Readonly<Record<string, ContainerRule>> = {
    tableColumns: {
        maxChildren: 99,
        acceptedChildren: [
            'tableTextCell',
            'tableBadgeCell',
            'tableHiddenCell',
            'tableAmountCell',
            'tableDateCell',
            'tableActionListCell',
            'tableExpandableCell',
            'tableLinkCell',
            'tableImageCell',
            'tableRowsSelectCell'
        ]
    },
    tableActionListCell: {
        maxChildren: 99,
        acceptedChildren: ['tableLinkAction', 'tableAlertAction', 'tableLinkDropdownItem']
    },
    form: {
        maxChildren: 99,
        // Forms accept inputs + headlines + flex/grid layout helpers — too
        // broad to whitelist cleanly. We don't gate `form`; the soft warning
        // would fire too often. Listed here as a placeholder for future
        // refinement.
        acceptedChildren: []
    }
}

export type DropVerdict =
    | { kind: 'allow' }
    | { kind: 'warn'; reason: string }
    | { kind: 'block'; reason: string }

/**
 * Decide whether `incomingComponentName` can drop into `parent`.
 *
 * `extraDelta` lets callers test "if I drop one more, would I exceed the
 * cap?" — when moving within the same parent, pass `extraDelta = 0`; when
 * inserting from the palette, pass `1`.
 */
export function evaluateDrop(args: {
    parent: StructuredComponent
    incomingComponentName: string
    /** +1 for new insert, 0 for in-place reorder, +N for multi-drop. */
    extraDelta?: number
}): DropVerdict {
    const { parent, incomingComponentName, extraDelta = 1 } = args
    const cn = parent.componentName
    if (!cn) return { kind: 'allow' }

    // Hard rules — engine will reject the manifest or the page crashes.
    const hard = HARD_CONTAINER_RULES[cn]
    if (hard) {
        const childCount = Array.isArray(parent.children) ? parent.children.length : 0
        if (childCount + extraDelta > hard.maxChildren) {
            return {
                kind: 'block',
                reason: `${cn} accepts only ${hard.maxChildren} children`
            }
        }
        if (!hard.acceptedChildren.includes(incomingComponentName)) {
            return {
                kind: 'block',
                reason: `${cn} accepts only ${hard.acceptedChildren.join(', ')}`
            }
        }
        return { kind: 'allow' }
    }

    // Soft rules — best practice, allowed with a warning so the user can
    // override deliberately (e.g. a custom cell type during prototyping).
    const soft = SOFT_CONTAINER_RULES[cn]
    if (soft && soft.acceptedChildren.length > 0) {
        if (!soft.acceptedChildren.includes(incomingComponentName)) {
            return {
                kind: 'warn',
                reason: `${cn} usually expects ${soft.acceptedChildren.slice(0, 3).join(', ')}…`
            }
        }
    }

    return { kind: 'allow' }
}

/**
 * Sanity check used by tree-reorder: can't drop a node into itself or any
 * of its descendants (would create a cycle).
 */
export function isDescendantOf(candidate: StructuredComponent, ancestorId: string): boolean {
    if (candidate.id === ancestorId) return true
    if (!Array.isArray(candidate.children)) return false
    return candidate.children.some((c) => isDescendantOf(c, ancestorId))
}
