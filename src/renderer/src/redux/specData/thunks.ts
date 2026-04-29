import type { Dispatch } from 'redux'
import {
    dataTurnApplied,
    dataTurnError,
    dataTurnFailed,
    dataTurnFinished,
    dataTurnParseError,
    dataTurnStarted,
    dataTurnSummary
} from './reducer'

/**
 * Subscribes to `window.specData.onChunk` and forwards events into the
 * `specData` slice. Call once on app startup (mirrors the prototype
 * subscriber in App.tsx). Returns the unsubscribe function.
 */
export function subscribeToSpecDataChunks(dispatch: Dispatch): () => void {
    return window.specData.onChunk(({ requestId, chunk }) => {
        switch (chunk.type) {
            case 'op-applied':
                dispatch(dataTurnApplied({ requestId, op: chunk.op }))
                break
            case 'op-failed':
                dispatch(
                    dataTurnFailed({
                        requestId,
                        op: { op: chunk.op.op, error: chunk.error }
                    })
                )
                break
            case 'summary':
                dispatch(dataTurnSummary({ requestId, summary: chunk.summary }))
                break
            case 'parse-error':
                dispatch(dataTurnParseError({ requestId, message: chunk.message }))
                break
            case 'error':
                dispatch(dataTurnError({ requestId, message: chunk.message }))
                break
            case 'done':
                dispatch(dataTurnFinished({ requestId }))
                break
            // 'delta' chunks go to the chat bubble directly (handled elsewhere).
            default:
                break
        }
    })
}

/**
 * Convenience used by `DataChatPanel` to seed a turn entry the moment a
 * generation starts (so the bubble's snapshot card has something to render).
 */
export function startSpecDataTurn(dispatch: Dispatch, requestId: string): void {
    dispatch(dataTurnStarted({ requestId }))
}
