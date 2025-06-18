import { useMemo } from 'react';
import { ComponentRegisterConfig } from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';
import { COMPONENT, GROUP_COMPONET, ICON_MAP } from '../ComponentTypes';

const HIDDEN_COMPONENTS = [COMPONENT.Column, COMPONENT.PageContent, COMPONENT.ComponentContent]

const useConfigdata = (components: ComponentRegisterConfig[]) => {

    const menuItems = useMemo(() => {
        if (!components || components.length === 0) return [];

        const groupedComponents = components.reduce((acc, component) => {
            const group = component.group || 'Others';
            if (!acc[group]) {
                acc[group] = [];
            }
            acc[group].push(component);
            return acc;
        }, {});

        console.log(groupedComponents)

        return Object.keys(groupedComponents).map((group) => ({
            id: group,
            label: GROUP_COMPONET[group] || group,
            type: 'group',
            subItems: groupedComponents[group].filter((component: ComponentRegisterConfig) =>
                !HIDDEN_COMPONENTS.includes(component.name)
            ).map((component: ComponentRegisterConfig) => ({
                id: component.name,
                label: component.label || component.name,
                icon: ICON_MAP[component.name],
                properties: component.properties,
                interactions: component.interactions,
                childrenTypes: component.childrenTypes,
                allowTypes: component.allowTypes,
                data: component.data,
            }))
        }));
    }, [components]);

    return { menuItems };
};
export { useConfigdata };
