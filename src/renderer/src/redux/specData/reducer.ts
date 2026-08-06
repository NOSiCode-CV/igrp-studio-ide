import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type SpecDataOpKind =
    | 'entity-create'
    | 'entity-update'
    | 'entity-delete'
    | 'relation-add'
    | 'relation-remove'

export interface SpecDataAppliedOp {
    op: SpecDataOpKind
    entityId?: string
    name?: string
}

export interface SpecDataFailedOp {
    op: SpecDataOpKind
    error: string
}

/** Per-turn metadata: surfaces in the snapshot card on the chat bubble. */
export interface SpecDataTurn {
    requestId: string
    summary: string | null
    applied: SpecDataAppliedOp[]
    failed: SpecDataFailedOp[]
    parseError?: string
    error?: string
    inFlight: boolean
}

export interface SpecDataState {
    /** Map keyed by requestId so chat bubbles can render their own snapshot card. */
    turns: Record<string, SpecDataTurn>
    lastTurnId: string | null
    /** Convenience: ids the latest turn touched, for editor/list badges. */
    changedEntityIds: string[]
    error: string | null
}

export const initialSpecDataState: SpecDataState = {
    turns: {},
    lastTurnId: null,
    changedEntityIds: [],
    error: null
}

const slice = createSlice({
    name: 'specData',
    initialState: initialSpecDataState,
    reducers: {
        dataTurnStarted(state, action: PayloadAction<{ requestId: string }>) {
            state.turns[action.payload.requestId] = {
                requestId: action.payload.requestId,
                summary: null,
                applied: [],
                failed: [],
                inFlight: true
            }
            state.lastTurnId = action.payload.requestId
            state.changedEntityIds = []
        },
        dataTurnApplied(
            state,
            action: PayloadAction<{ requestId: string; op: SpecDataAppliedOp }>
        ) {
            const turn = state.turns[action.payload.requestId]
            if (!turn) return
            turn.applied.push(action.payload.op)
            const id = action.payload.op.entityId
            if (id && !state.changedEntityIds.includes(id)) {
                state.changedEntityIds.push(id)
            }
        },
        dataTurnFailed(state, action: PayloadAction<{ requestId: string; op: SpecDataFailedOp }>) {
            const turn = state.turns[action.payload.requestId]
            if (!turn) return
            turn.failed.push(action.payload.op)
        },
        dataTurnSummary(state, action: PayloadAction<{ requestId: string; summary: string }>) {
            const turn = state.turns[action.payload.requestId]
            if (turn) turn.summary = action.payload.summary
        },
        dataTurnParseError(state, action: PayloadAction<{ requestId: string; message: string }>) {
            const turn = state.turns[action.payload.requestId]
            if (turn) turn.parseError = action.payload.message
        },
        dataTurnError(state, action: PayloadAction<{ requestId: string; message: string }>) {
            const turn = state.turns[action.payload.requestId]
            if (turn) turn.error = action.payload.message
        },
        dataTurnFinished(state, action: PayloadAction<{ requestId: string }>) {
            const turn = state.turns[action.payload.requestId]
            if (turn) turn.inFlight = false
        },
        dataError(state, action: PayloadAction<string | null>) {
            state.error = action.payload
        },
        dataReset() {
            return initialSpecDataState
        }
    }
})

export const {
    dataTurnStarted,
    dataTurnApplied,
    dataTurnFailed,
    dataTurnSummary,
    dataTurnParseError,
    dataTurnError,
    dataTurnFinished,
    dataError,
    dataReset
} = slice.actions

export default slice.reducer
