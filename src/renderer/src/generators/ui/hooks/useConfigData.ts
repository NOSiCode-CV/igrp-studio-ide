/**
 * UI-generator hook over the engine palette — adds the manifest-editing
 * fields (`properties`, `interactions`, `childrenTypes`, …) on top of the
 * group/hide/label logic shared via `features/component-palette`.
 *
 * Single consumer today: `page-builder.tsx`. Kept here (not in `features/`)
 * because the extra fields are specific to the visual page builder's
 * drop/edit workflow — the Prototype palette uses the leaner
 * `useEnginePalette` directly.
 */

import type { ComponentRegisterConfig } from '@igrp/igrp-studio-nextjs-engine/types'
import { useMemo } from 'react'
import { GROUP_LABELS, HIDDEN_COMPONENT_NAMES } from '@renderer/features/component-palette'
import { ICON_MAP } from '@renderer/features/component-icons'

const useConfigdata = (components: ComponentRegisterConfig[]) => {
    const menuItems = useMemo(() => {
        if (!components || components.length === 0) return []

        const groupedComponents = components.reduce(
            (
                acc: Record<string, ComponentRegisterConfig[]>,
                component: ComponentRegisterConfig
            ) => {
                const group = component.group || 'Others'
                if (!acc[group]) {
                    acc[group] = []
                }
                acc[group].push(component)
                return acc
            },
            {}
        )

        return Object.keys(groupedComponents).map((group: string) => ({
            id: group,
            label: GROUP_LABELS[group] || group,
            type: 'group',
            subItems: groupedComponents[group]
                .filter(
                    (component: ComponentRegisterConfig) =>
                        !HIDDEN_COMPONENT_NAMES.includes(component.name)
                )
                .map((component: ComponentRegisterConfig) => ({
                    id: component.name,
                    label: component.label || component.name,
                    icon: ICON_MAP[component.name],
                    properties: component.properties,
                    interactions: component.interactions,
                    childrenTypes: component.childrenTypes,
                    defaultChildren: component.defaultChildren,
                    allowTypes: component.allowTypes,
                    data: component.data,
                    deprecated: component.deprecated,
                    allowChildren: component.allowChildren
                }))
        }))
    }, [components])

    return { menuItems }
}
export { useConfigdata }
