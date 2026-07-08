import type { ComponentRegisterConfig } from '@igrp/igrp-studio-nextjs-engine/types'
import type { StructuredComponent } from '@renderer/lib/dnd/types'
import { getDefaultInteractions, getDefaultProperties, getRequiredDataSchema } from '../dnd/helpers'

/**
 * In-place component type conversion ("switch component") — e.g. turn an
 * `inputNumber` into an `inputText` without delete + re-add.
 *
 * The converted component keeps its identity (`id` → tree position and
 * editor references, `tag` → interactions/custom-code references, `label`)
 * and starts from the TARGET's defaults, overlaying every current value
 * whose key exists in the target's schema (intersection). Values the target
 * doesn't know are dropped and reported so the caller can surface them.
 */

export interface SwitchComponentResult {
    component: StructuredComponent
    /** Property keys of the source that the target schema doesn't accept. */
    droppedKeys: string[]
}

const intersect = (
    current: Record<string, unknown> | undefined,
    targetSchema: Record<string, unknown> | undefined
): { kept: Record<string, unknown>; dropped: string[] } => {
    const schemaKeys = new Set(Object.keys(targetSchema ?? {}))
    const kept: Record<string, unknown> = {}
    const dropped: string[] = []
    for (const [key, value] of Object.entries(current ?? {})) {
        if (schemaKeys.has(key)) kept[key] = value
        else dropped.push(key)
    }
    return { kept, dropped }
}

export function switchComponentType(
    comp: StructuredComponent,
    target: ComponentRegisterConfig
): SwitchComponentResult {
    const propertyDefaults = getDefaultProperties(target.properties, comp.tag)
    const { kept: keptProperties, dropped } = intersect(
        comp.properties,
        target.properties as Record<string, unknown> | undefined
    )

    const interactionDefaults = getDefaultInteractions(target.interactions)
    const { kept: keptInteractions } = intersect(
        comp.interactions,
        target.interactions as Record<string, unknown> | undefined
    )

    const requiredData = getRequiredDataSchema(target.data)
    const { kept: keptData } = intersect(
        comp.data,
        target.data as Record<string, unknown> | undefined
    )

    return {
        component: {
            ...comp,
            componentName: target.name,
            label: comp.label,
            allowTypes: target.allowTypes,
            properties: { ...propertyDefaults, ...keptProperties },
            interactions: { ...interactionDefaults, ...keptInteractions },
            data: { ...requiredData, ...keptData }
        },
        droppedKeys: dropped
    }
}

/** Groups whose members are user-defined — their prop schemas are arbitrary,
 * so cross-switching them is meaningless. */
const NON_SWITCHABLE_GROUPS = new Set(['customComponents', 'appComponents'])

/**
 * Eligible switch targets for a component: same engine group, leaf targets
 * only (no childrenTypes/defaultChildren — a target that expects children
 * would render broken with none). Components that already have children
 * can't switch (v1 guard).
 */
export function getSwitchTargets(
    registry: ComponentRegisterConfig[],
    comp: StructuredComponent | undefined
): ComponentRegisterConfig[] {
    if (!comp || (comp.children?.length ?? 0) > 0) return []

    const current = registry.find((entry) => entry.name === comp.componentName)
    if (!current?.group || NON_SWITCHABLE_GROUPS.has(current.group)) return []

    return registry
        .filter(
            (entry) =>
                entry.group === current.group &&
                entry.name !== current.name &&
                (entry.childrenTypes?.length ?? 0) === 0 &&
                (entry.defaultChildren?.length ?? 0) === 0
        )
        .sort((a, b) => (a.label || a.name).localeCompare(b.label || b.name))
}
