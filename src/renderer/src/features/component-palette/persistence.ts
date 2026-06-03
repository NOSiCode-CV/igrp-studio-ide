/**
 * Per-project localStorage persistence for the user's pinned palette
 * components. Lifted out of `PrototypePanel.tsx` so any future surface
 * (data-models palette, secondary generator chats) can reuse the exact
 * same key shape and validation.
 */

const componentsKey = (basePath: string, namespace: string): string =>
    `spec.${namespace}.attachedComponentIds.${basePath}`

export interface ComponentPersistenceOptions {
    /** Sub-key under `spec.<namespace>.attachedComponentIds.<basePath>`. */
    namespace: string
}

/**
 * Read pinned component ids from localStorage. Only validates shape
 * (string + array). Catalog membership is validated downstream by the
 * surface that owns the live catalog — engine catalog ids change between
 * sessions, so we'd otherwise drop legitimate values here.
 */
export function readPersistedComponentIds(
    basePath: string | undefined,
    { namespace }: ComponentPersistenceOptions
): string[] {
    if (!basePath || typeof window === 'undefined') return []
    try {
        const raw = window.localStorage?.getItem(componentsKey(basePath, namespace))
        if (!raw) return []
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
    } catch {
        return []
    }
}

export function writePersistedComponentIds(
    basePath: string | undefined,
    ids: string[],
    { namespace }: ComponentPersistenceOptions
): void {
    if (!basePath || typeof window === 'undefined') return
    try {
        window.localStorage?.setItem(componentsKey(basePath, namespace), JSON.stringify(ids))
    } catch {
        // noop — private mode etc.
    }
}
