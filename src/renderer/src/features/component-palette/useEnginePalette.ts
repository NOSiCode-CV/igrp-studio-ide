/**
 * Adapter hook — projects the Next.js engine's `ComponentRegisterConfig[]`
 * onto the leaner `EnginePaletteComponent` shape used by palette UIs.
 *
 * Two consumers today:
 *  - UI generator's `useConfigdata` (thin wrapper that adds engine-only
 *    fields like `properties` / `interactions` / `childrenTypes` back on top
 *    for the visual builder).
 *  - Prototype palette (consumes this directly — it doesn't need the
 *    manifest-editing fields).
 *
 * Memoised — re-evaluates only when the input array reference changes.
 */

import type { ComponentRegisterConfig } from '@igrp/igrp-studio-nextjs-engine/types'
import { resolveIcon } from '@renderer/features/component-icons'
import type React from 'react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { HIDDEN_COMPONENT_NAMES, translateGroupLabel } from './groups'

export interface EnginePaletteComponent {
    /** Component name as the engine emits it — stable identifier. */
    id: string
    /** Human-readable label (falls back to `id` when engine omits one). */
    name: string
    /** Engine group key (`structure`, `formElements`, …). */
    groupKey: string
    /** User-facing group label resolved from `GROUP_LABELS`. */
    groupLabel: string
    /** Resolved lucide icon for use in palette chips. */
    icon: React.ElementType
    /** Engine flagged as deprecated — UIs may grey out or hide. */
    deprecated?: boolean
}

export interface EnginePaletteGroup {
    key: string
    label: string
    items: EnginePaletteComponent[]
}

export interface UseEnginePaletteResult {
    /** Flat list — useful for search across all groups. */
    all: EnginePaletteComponent[]
    /** Grouped by `groupKey`, in insertion order from the input. */
    groups: EnginePaletteGroup[]
}

export const useEnginePalette = (
    components: ComponentRegisterConfig[] | undefined | null
): UseEnginePaletteResult => {
    const { t } = useTranslation()

    return useMemo(() => {
        if (!components || components.length === 0) {
            return { all: [], groups: [] }
        }

        const all: EnginePaletteComponent[] = []
        const groupMap = new Map<string, EnginePaletteGroup>()

        for (const component of components) {
            if (HIDDEN_COMPONENT_NAMES.includes(component.name)) continue

            const groupKey = component.group || 'others'
            const item: EnginePaletteComponent = {
                id: component.name,
                name: component.label || component.name,
                groupKey,
                groupLabel: translateGroupLabel(groupKey, t),
                icon: resolveIcon(component.name),
                deprecated: component.deprecated
            }

            all.push(item)

            let group = groupMap.get(groupKey)
            if (!group) {
                group = { key: groupKey, label: item.groupLabel, items: [] }
                groupMap.set(groupKey, group)
            }
            group.items.push(item)
        }

        return { all, groups: Array.from(groupMap.values()) }
    }, [components, t])
}
