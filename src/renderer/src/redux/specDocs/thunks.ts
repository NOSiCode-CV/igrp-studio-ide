import type { Dispatch } from '@reduxjs/toolkit'
import {
    docNodeRemoved,
    docNodeUpserted,
    docSaveFailure,
    docSaveStart,
    docSaveSuccess,
    docSelected,
    docsLoadFailure,
    docsLoadStart,
    docsLoadSuccess,
    type DocNode,
    type DocNodeType
} from './reducer'

export const loadDocs = (basePath: string) => async (dispatch: Dispatch) => {
    if (!basePath) return
    dispatch(docsLoadStart())
    try {
        const nodes: DocNode[] = await window.specDoc.list(basePath)
        dispatch(docsLoadSuccess(nodes))
    } catch (err) {
        dispatch(docsLoadFailure(err instanceof Error ? err.message : String(err)))
    }
}

export const selectDoc =
    (basePath: string, docId: string | null) => async (dispatch: Dispatch) => {
        if (!basePath || !docId) {
            dispatch(docSelected({ id: null, content: '' }))
            return
        }
        const result = await window.specDoc.read(basePath, docId)
        dispatch(
            docSelected({
                id: result?.node.id ?? null,
                content: result?.content ?? ''
            })
        )
    }

export const createDocNode =
    (
        basePath: string,
        input: {
            name: string
            parentId?: string | null
            type?: DocNodeType
            content?: string
        }
    ) =>
    async (dispatch: Dispatch) => {
        const node: DocNode = await window.specDoc.create(basePath, input)
        dispatch(docNodeUpserted(node))
        if (node.type === 'file') {
            dispatch(docSelected({ id: node.id, content: input.content ?? '' }))
        }
        return node
    }

export const renameDocNode =
    (basePath: string, docId: string, name: string) => async (dispatch: Dispatch) => {
        const node = await window.specDoc.update(basePath, docId, { name })
        dispatch(docNodeUpserted(node))
        return node
    }

export const removeDocNode =
    (basePath: string, docId: string) => async (dispatch: Dispatch) => {
        await window.specDoc.remove(basePath, docId)
        dispatch(docNodeRemoved(docId))
    }

export const moveDocNode =
    (basePath: string, docId: string, newParentId: string | null) =>
    async (dispatch: Dispatch) => {
        const node = await window.specDoc.move(basePath, docId, newParentId)
        dispatch(docNodeUpserted(node))
        return node
    }

/** Debounced auto-save — flushes the editor buffer to disk. */
export const saveDocBuffer =
    (basePath: string, docId: string, content: string) => async (dispatch: Dispatch) => {
        dispatch(docSaveStart())
        try {
            const node = await window.specDoc.update(basePath, docId, { content })
            dispatch(docNodeUpserted(node))
            dispatch(docSaveSuccess())
        } catch (err) {
            dispatch(docSaveFailure(err instanceof Error ? err.message : String(err)))
        }
    }

/**
 * Toggle a KBItem in the doc's `kbRefs`. Centralised here so we only ship
 * the new array via IPC — easier for the backend to validate / persist.
 */
export const toggleDocKBRef =
    (basePath: string, docId: string, kbItemId: string) =>
    async (dispatch: Dispatch, getState: () => any) => {
        const node: DocNode | undefined = getState().specDocs.nodes.find(
            (n: DocNode) => n.id === docId
        )
        if (!node) return
        const current = new Set(node.kbRefs ?? [])
        if (current.has(kbItemId)) current.delete(kbItemId)
        else current.add(kbItemId)
        const updated = await window.specDoc.update(basePath, docId, {
            kbRefs: Array.from(current)
        })
        dispatch(docNodeUpserted(updated))
        return updated
    }

/** Subscribe to backend tree changes. Returns an unsubscribe. */
export const subscribeDocsChanged =
    (getBasePath: () => string) =>
    (dispatch: Dispatch): (() => void) => {
        return window.specDoc.onChanged(() => {
            const basePath = getBasePath()
            if (basePath) {
                window.specDoc
                    .list(basePath)
                    .then((nodes) => dispatch(docsLoadSuccess(nodes)))
                    .catch((err) =>
                        dispatch(docsLoadFailure(err instanceof Error ? err.message : String(err)))
                    )
            }
        })
    }
