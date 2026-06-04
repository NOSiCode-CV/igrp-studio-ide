/**
 * Attached spec-document ids — persisted to `localStorage` PER PROJECT.
 *
 * Each project's prototype chat keeps its own list of attached
 * documents, so the key includes the `basePath` to scope the value.
 *
 * Extracted from `PrototypePanel.tsx` as part of the prototype refactor
 * (P1).
 */
export const attachedIdsKey = (basePath?: string): string =>
    basePath ? `spec.prototype.attachedSpecIds.${basePath}` : ''

export const readPersistedAttachedIds = (basePath?: string): string[] => {
    if (!basePath || typeof window === 'undefined') return []
    try {
        const raw = window.localStorage?.getItem(attachedIdsKey(basePath))
        if (!raw) return []
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
    } catch {
        return []
    }
}

export const writePersistedAttachedIds = (
    basePath: string | undefined,
    ids: string[]
): void => {
    if (!basePath || typeof window === 'undefined') return
    try {
        window.localStorage?.setItem(attachedIdsKey(basePath), JSON.stringify(ids))
    } catch {
        // noop — private mode etc.
    }
}
