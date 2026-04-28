import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type FileChangeKind = 'new' | 'modified' | 'deleted'

export interface PrototypeFile {
    path: string
    type: 'file' | 'folder'
}

export interface PrototypeDevStatus {
    running: boolean
    port: number | null
    url: string | null
    pid: number | null
    startedAt: number | null
}

export interface PrototypeLog {
    timestamp: number
    level: 'info' | 'warn' | 'error'
    line: string
}

export interface PrototypeSnapshot {
    hash: string
    author: string
    date: string
    message: string
}

/** Per-turn metadata: surfaces in the snapshot card on the chat bubble. */
export interface PrototypeTurn {
    requestId: string
    summary: string | null
    sha: string | null
    /** Paths created or modified in this turn (used for tree badges). */
    appliedPaths: string[]
    /** Paths deleted in this turn. */
    deletedPaths: string[]
    failedOps: { path: string; error: string }[]
    parseError?: string
    inFlight: boolean
}

export interface SpecPrototypeState {
    devStatus: PrototypeDevStatus
    logs: PrototypeLog[]
    files: PrototypeFile[]
    snapshots: PrototypeSnapshot[]
    /** Map keyed by requestId so chat bubbles can render their own snapshot card. */
    turns: Record<string, PrototypeTurn>
    /** The most recent turn id — used to surface tree-change badges. */
    lastTurnId: string | null
    activeFile: string | null
    activeFileContent: string | null
    activeFileLoading: boolean
    /** Convenience: paths the latest turn touched, for the Files tab badges. */
    changedPaths: Record<string, FileChangeKind>
    error: string | null
}

const LOG_BUFFER_LIMIT = 500

const initialDevStatus: PrototypeDevStatus = {
    running: false,
    port: null,
    url: null,
    pid: null,
    startedAt: null
}

export const initialSpecPrototypeState: SpecPrototypeState = {
    devStatus: initialDevStatus,
    logs: [],
    files: [],
    snapshots: [],
    turns: {},
    lastTurnId: null,
    activeFile: null,
    activeFileContent: null,
    activeFileLoading: false,
    changedPaths: {},
    error: null
}

const slice = createSlice({
    name: 'specPrototype',
    initialState: initialSpecPrototypeState,
    reducers: {
        protoDevStatus(state, action: PayloadAction<PrototypeDevStatus>) {
            state.devStatus = action.payload
        },
        protoLogAppended(state, action: PayloadAction<PrototypeLog>) {
            state.logs.push(action.payload)
            if (state.logs.length > LOG_BUFFER_LIMIT) {
                state.logs.splice(0, state.logs.length - LOG_BUFFER_LIMIT)
            }
        },
        protoLogsReplaced(state, action: PayloadAction<PrototypeLog[]>) {
            state.logs = action.payload.slice(-LOG_BUFFER_LIMIT)
        },
        protoFilesReplaced(state, action: PayloadAction<PrototypeFile[]>) {
            state.files = action.payload
        },
        protoSnapshotsReplaced(state, action: PayloadAction<PrototypeSnapshot[]>) {
            state.snapshots = action.payload
        },
        protoActiveFileLoadStart(state, action: PayloadAction<string>) {
            state.activeFile = action.payload
            state.activeFileContent = null
            state.activeFileLoading = true
        },
        protoActiveFileLoaded(
            state,
            action: PayloadAction<{ path: string; content: string }>
        ) {
            // Race guard: only commit when path still matches current selection.
            if (state.activeFile === action.payload.path) {
                state.activeFileContent = action.payload.content
                state.activeFileLoading = false
            }
        },
        protoActiveFileCleared(state) {
            state.activeFile = null
            state.activeFileContent = null
            state.activeFileLoading = false
        },
        protoTurnStarted(
            state,
            action: PayloadAction<{ requestId: string }>
        ) {
            state.turns[action.payload.requestId] = {
                requestId: action.payload.requestId,
                summary: null,
                sha: null,
                appliedPaths: [],
                deletedPaths: [],
                failedOps: [],
                inFlight: true
            }
            state.lastTurnId = action.payload.requestId
            state.changedPaths = {}
        },
        protoTurnApplied(
            state,
            action: PayloadAction<{
                requestId: string
                op: 'create' | 'update' | 'delete'
                path: string
            }>
        ) {
            const turn = state.turns[action.payload.requestId]
            if (!turn) return
            if (action.payload.op === 'delete') {
                turn.deletedPaths.push(action.payload.path)
                state.changedPaths[action.payload.path] = 'deleted'
            } else {
                turn.appliedPaths.push(action.payload.path)
                state.changedPaths[action.payload.path] =
                    action.payload.op === 'create' ? 'new' : 'modified'
            }
        },
        protoTurnFailed(
            state,
            action: PayloadAction<{ requestId: string; path: string; error: string }>
        ) {
            const turn = state.turns[action.payload.requestId]
            if (!turn) return
            turn.failedOps.push({
                path: action.payload.path,
                error: action.payload.error
            })
        },
        protoTurnCommitted(
            state,
            action: PayloadAction<{ requestId: string; sha: string | null; summary: string }>
        ) {
            const turn = state.turns[action.payload.requestId]
            if (!turn) return
            turn.sha = action.payload.sha
            turn.summary = action.payload.summary
        },
        protoTurnParseError(
            state,
            action: PayloadAction<{ requestId: string; message: string }>
        ) {
            const turn = state.turns[action.payload.requestId]
            if (!turn) return
            turn.parseError = action.payload.message
        },
        protoTurnFinished(state, action: PayloadAction<{ requestId: string }>) {
            const turn = state.turns[action.payload.requestId]
            if (turn) turn.inFlight = false
        },
        protoError(state, action: PayloadAction<string | null>) {
            state.error = action.payload
        },
        protoReset() {
            return initialSpecPrototypeState
        }
    }
})

export const {
    protoDevStatus,
    protoLogAppended,
    protoLogsReplaced,
    protoFilesReplaced,
    protoSnapshotsReplaced,
    protoActiveFileLoadStart,
    protoActiveFileLoaded,
    protoActiveFileCleared,
    protoTurnStarted,
    protoTurnApplied,
    protoTurnFailed,
    protoTurnCommitted,
    protoTurnParseError,
    protoTurnFinished,
    protoError,
    protoReset
} = slice.actions

export default slice.reducer
