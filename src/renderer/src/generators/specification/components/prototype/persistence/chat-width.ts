/**
 * Prototype chat panel width — persisted to `localStorage`.
 *
 * Width is a GLOBAL preference (all projects share the same comfortable
 * size), unlike per-project state like attached spec ids.
 *
 * Default chosen to fit the AI composer comfortably without dominating
 * the main pane. Previous default (480) felt oversized once the palette
 * tab landed; sticking to ~33% of a 1280-wide window feels balanced.
 *
 * `MAX_PERSISTED_CHAT_WIDTH` is an upper guard for the persisted value
 * — localStorage can carry over from earlier builds when the user
 * dragged way too wide; clamping on read prevents a stale 800px from
 * following them forever.
 *
 * Extracted from `PrototypePanel.tsx` as part of the prototype refactor
 * (P1).
 */
export const CHAT_WIDTH_KEY = 'spec.prototype.chatWidth'
export const DEFAULT_CHAT_WIDTH = 380
export const MIN_CHAT_WIDTH = 300
export const MAX_PERSISTED_CHAT_WIDTH = 560

export const readPersistedChatWidth = (): number => {
    if (typeof window === 'undefined') return DEFAULT_CHAT_WIDTH
    try {
        const raw = window.localStorage?.getItem(CHAT_WIDTH_KEY)
        const parsed = raw ? Number(raw) : NaN
        if (!Number.isFinite(parsed) || parsed < MIN_CHAT_WIDTH) return DEFAULT_CHAT_WIDTH
        return Math.min(parsed, MAX_PERSISTED_CHAT_WIDTH)
    } catch {
        return DEFAULT_CHAT_WIDTH
    }
}

export const writePersistedChatWidth = (px: number): void => {
    if (typeof window === 'undefined') return
    try {
        window.localStorage?.setItem(CHAT_WIDTH_KEY, String(Math.round(px)))
    } catch {
        // noop — private mode etc.
    }
}
