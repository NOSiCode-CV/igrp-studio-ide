/**
 * Thunks for the manifest slice. Live IO sits here so the reducer stays a
 * pure state machine.
 */

import type { Dispatch } from '@reduxjs/toolkit'
import type { RootState } from '..'
import {
    loadFailed,
    loadStarted,
    manifestCleared,
    manifestLoaded,
    markSaved,
    saveFailed,
    saveStarted,
    type PrototypePageConfig
} from './reducer'

/**
 * Load the persisted manifest from `<basePath>/.igrpstudio/prototype/page.json`.
 * Returns `null` when the file doesn't exist yet (first-run prototype) — the
 * canvas renders an empty state in that case.
 */
export const loadManifest =
    (basePath: string) =>
    async (dispatch: Dispatch): Promise<PrototypePageConfig | null> => {
        if (!basePath) {
            dispatch(manifestCleared())
            return null
        }
        dispatch(loadStarted({ basePath }))
        try {
            const { manifest, error } = await window.specPrototype.readManifest(basePath)
            if (error) {
                dispatch(loadFailed({ error }))
                return null
            }
            const typed = manifest as PrototypePageConfig | null
            dispatch(manifestLoaded({ basePath, manifest: typed }))
            return typed
        } catch (err) {
            dispatch(
                loadFailed({
                    error: err instanceof Error ? err.message : String(err)
                })
            )
            return null
        }
    }

/**
 * Persist the in-memory manifest and regenerate code.
 *
 * Debouncing: the Edit canvas calls this on every mutation. We don't
 * debounce in the thunk itself because the React side already does (cleaner
 * separation of concerns — UI controls the timing, thunk is one-shot).
 */
export const saveManifest =
    () =>
    async (
        dispatch: Dispatch,
        getState: () => RootState
    ): Promise<{ ok: boolean; sha?: string | null; error?: string }> => {
        const state = getState().specPrototypeManifest
        const { manifest, basePath } = state
        if (!manifest || !basePath) {
            return { ok: false, error: 'No manifest loaded.' }
        }
        dispatch(saveStarted())
        try {
            const result = await window.specPrototype.applyManifest(
                basePath,
                manifest as unknown as Record<string, unknown>
            )
            if (!result.ok) {
                dispatch(saveFailed({ error: result.error ?? 'Engine rejected the manifest.' }))
                return { ok: false, error: result.error }
            }
            dispatch(markSaved({ at: Date.now() }))
            return { ok: true, sha: result.sha ?? null }
        } catch (err) {
            const error = err instanceof Error ? err.message : String(err)
            dispatch(saveFailed({ error }))
            return { ok: false, error }
        }
    }
