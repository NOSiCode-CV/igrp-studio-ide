// utils/tailwindGroups.ts

export const getHoverClasses = ({
    group,
    hoverClass,
    componentName,
}: {
    group?: string;
    hoverClass?: string;
    componentName: string;
}) => {
    //RESET Hover if parent is diff current component
    const _group = group?.includes(componentName) ? group : undefined;
    const _hoverClass = hoverClass?.includes(componentName)
        ? hoverClass
        : undefined;

    return { group: _group, hoverClass: _hoverClass };
};
