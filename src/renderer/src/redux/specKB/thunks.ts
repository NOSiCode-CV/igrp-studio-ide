import type { Dispatch } from '@reduxjs/toolkit'
import {
    kbItemRemoved,
    kbItemUpserted,
    kbLoadFailure,
    kbLoadStart,
    kbLoadSuccess,
    kbSemanticSearchCleared,
    kbSemanticSearchSucceeded,
    type KBItem,
    type KBSearchHit
} from './reducer'

/** Loads all KB items for the active project. */
export const loadKB = (basePath: string) => async (dispatch: Dispatch) => {
    if (!basePath) return
    dispatch(kbLoadStart())
    try {
        const items: KBItem[] = await window.specKB.list(basePath)
        dispatch(kbLoadSuccess(items))
    } catch (err) {
        dispatch(kbLoadFailure(err instanceof Error ? err.message : String(err)))
    }
}

export const addKBFile =
    (basePath: string, filePath: string) => async (dispatch: Dispatch) => {
        const item: KBItem = await window.specKB.addFile(basePath, filePath)
        dispatch(kbItemUpserted(item))
        return item
    }

export const addKBUrl =
    (basePath: string, url: string, youtube = false) =>
    async (dispatch: Dispatch) => {
        const item: KBItem = await window.specKB.addUrl(basePath, url, youtube)
        dispatch(kbItemUpserted(item))
        return item
    }

export const reindexKBItem =
    (basePath: string, itemId: string) => async (dispatch: Dispatch) => {
        const item: KBItem | null = await window.specKB.reindex(basePath, itemId)
        if (item) dispatch(kbItemUpserted(item))
        return item
    }

export const removeKBItem =
    (basePath: string, itemId: string) => async (dispatch: Dispatch) => {
        await window.specKB.remove(basePath, itemId)
        dispatch(kbItemRemoved(itemId))
    }

export const semanticSearchKB =
    (basePath: string, query: string, topK = 8) =>
    async (dispatch: Dispatch) => {
        const trimmed = query.trim()
        if (!trimmed) {
            dispatch(kbSemanticSearchCleared())
            return [] as KBSearchHit[]
        }
        const hits: KBSearchHit[] = await window.specKB.search(basePath, trimmed, topK)
        dispatch(kbSemanticSearchSucceeded({ query: trimmed, hits }))
        return hits
    }

/**
 * Subscribes to `spec:kb:progress` events. Returns an unsubscribe function;
 * call once on app/store init.
 */
export const subscribeKBProgress =
    () => (dispatch: Dispatch): (() => void) => {
        return window.specKB.onProgress((item: KBItem) => {
            dispatch(kbItemUpserted(item))
        })
    }
