/**
 * Named Tailwind groups for canvas hover.
 *
 * Do not use `String.includes(componentName)`: `group/row-container` contains
 * the substring `container`, so nested Containers reused one tag group and
 * `group-hover/row-container` lit every ancestor toolbar at once.
 */
export const getHoverClasses = ({
    group,
    hoverClass,
    componentName
}: {
    group?: string
    hoverClass?: string
    componentName: string
}) => {
    const suffix = group?.split('/').pop()?.replace(/-child$/, '')
    const matches = suffix === componentName

    return {
        group: matches ? group : undefined,
        hoverClass: matches ? hoverClass : undefined
    }
}

