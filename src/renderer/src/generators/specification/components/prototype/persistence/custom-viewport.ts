/**
 * Custom preview viewport width (M4.19) — persisted to `localStorage`.
 *
 * Width is a GLOBAL preference; it applies to the custom-device frame
 * in the Prototype preview regardless of which project is open.
 *
 * Extracted from `PrototypePanel.tsx` as part of the prototype refactor
 * (P1).
 */
export const CUSTOM_VIEWPORT_KEY = 'spec.prototype.customViewportWidth'
export const DEFAULT_CUSTOM_VIEWPORT = 1024
export const MIN_CUSTOM_VIEWPORT = 240
export const MAX_CUSTOM_VIEWPORT = 2560

export const readPersistedCustomViewport = (): number => {
    if (typeof window === 'undefined') return DEFAULT_CUSTOM_VIEWPORT
    try {
        const raw = window.localStorage?.getItem(CUSTOM_VIEWPORT_KEY)
        const parsed = raw ? Number(raw) : NaN
        if (
            Number.isFinite(parsed) &&
            parsed >= MIN_CUSTOM_VIEWPORT &&
            parsed <= MAX_CUSTOM_VIEWPORT
        ) {
            return parsed
        }
        return DEFAULT_CUSTOM_VIEWPORT
    } catch {
        return DEFAULT_CUSTOM_VIEWPORT
    }
}

export const writePersistedCustomViewport = (px: number): void => {
    if (typeof window === 'undefined') return
    try {
        window.localStorage?.setItem(CUSTOM_VIEWPORT_KEY, String(Math.round(px)))
    } catch {
        // noop — private mode etc.
    }
}
