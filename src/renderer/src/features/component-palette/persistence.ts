/**
 * Per-project localStorage persistence for the user's pinned palette
 * components. Lifted out of `PrototypePanel.tsx` so any future surface
 * (data-models palette, secondary generator chats) can reuse the exact
 * same key shape and validation.
 */

import { PALETTE_BY_ID } from './catalog'

const componentsKey = (basePath: string, namespace: string): string =>
    `spec.${namespace}.attachedComponentIds.${basePath}`

export interface ComponentPersistenceOptions {
    /** Sub-key under `spec.<namespace>.attachedComponentIds.<basePath>`. */
    namespace: string
}

/**
 * Read pinned component ids from localStorage. Validates each id against
 * the static `PALETTE` so a stale entry from an older catalog version
 * gets quietly dropped.
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
        return Array.isArray(parsed)
            ? parsed.filter(
                  (x): x is string => typeof x === 'string' && PALETTE_BY_ID.has(x)
              )
            : []
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
