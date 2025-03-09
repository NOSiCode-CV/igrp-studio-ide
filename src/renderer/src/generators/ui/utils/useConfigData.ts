import { useEffect, useMemo, useState } from 'react';
import useStudio from '@renderer/hooks/useStudio';
import { ComponentRegisterConfig } from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';
import { GROUP_COMPONET, ICON_MAP } from '../ComponentTypes';

const useConfigdata = () => {

    const { getRegistryComponent } = useStudio()
    const [components, setComponents] = useState<ComponentRegisterConfig[]>([]);

    useEffect(() => {
        getRegistryComponent().then(data => setComponents(data));
    }, [getRegistryComponent]);

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
            subItems: groupedComponents[group].map((component: ComponentRegisterConfig) => ({
                id: component.name,
                label: component.label,
                icon: ICON_MAP[component.name],
                properties: component.properties
            })),
        }));
    }, [components]);

    return { menuItems };
};
export { useConfigdata };
