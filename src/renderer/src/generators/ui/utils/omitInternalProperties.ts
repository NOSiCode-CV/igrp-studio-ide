/**
 * Studio model fields that must never be forwarded to DOM nodes or
 * design-system hosts. They live on `comp.properties` for the engine,
 * but React treats unknown camelCase keys as invalid DOM attributes.
 */
export function omitInternalProperties<T extends Record<string, unknown>>(
    properties?: T | null
): Omit<T, 'commonProperties' | 'dataProperties' | 'iconProperties'> {
    if (!properties) {
        return {} as Omit<T, 'commonProperties' | 'dataProperties' | 'iconProperties'>
    }

    const {
        commonProperties: _commonProperties,
        dataProperties: _dataProperties,
        iconProperties: _iconProperties,
        ...rest
    } = properties as T & {
        commonProperties?: unknown
        dataProperties?: unknown
        iconProperties?: unknown
    }

    return rest
}
