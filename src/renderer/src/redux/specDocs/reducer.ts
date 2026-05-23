import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { applyEdits } from '@renderer/generators/specification/utils/searchReplaceParser'
import type {
    ProposalStatus,
    ProposalSummary,
    SREdit,
    SROp
} from '@renderer/generators/specification/utils/searchReplaceParser'
import type { RootState } from '@renderer/redux'

export type DocNodeType = 'file' | 'folder'
export type DocViewMode = 'edit' | 'preview' | 'split'

export interface DocNode {
    id: string
    name: string
    parentId: string | null
    type: DocNodeType
    createdAt: string
    updatedAt: string
    kbRefs?: string[]
}

export interface PendingProposal {
    messageId: string
    edits: SREdit[]
    snapshot: string
    /**
     * Per-edit selection — only the edits where `selected[i]` is true are
     * folded into `applied` (and into the eventual write to disk on Apply).
     * Failed edits stay false and disabled in the UI; ok edits start true
     * and the user can untick any to skip.
     */
    selected: boolean[]
    /** Snapshot with the currently-selected edits applied — drives the diff. */
    applied: string
    ops: SROp[]
}

/**
 * The right pane is mutually exclusive — it shows either the AI chat or the
 * doc inspector at a time, but never both. `null` collapses the pane.
 */
export type DocRightPane = 'chat' | 'inspector' | null

/** Per-document UI + edit state. Created lazily on first selection / open. */
export interface DocPerState {
    buffer: string
    dirty: boolean
    viewMode: DocViewMode
    rightPane: DocRightPane
    pendingProposal: PendingProposal | null
    proposalHistory: Record<string, ProposalStatus>
    proposalSummaries: Record<string, ProposalSummary[]>
}

export interface SpecDocsState {
    nodes: DocNode[]
    /** Currently focused tab. */
    selectedId: string | null
    /** Per-doc state map, keyed by docId. Entries created on first open. */
    byDoc: Record<string, DocPerState>
    /** Per-doc save-in-flight flag — concurrent saves don't stomp each other. */
    saving: Record<string, boolean>
    /**
     * Width of the right pane in px — global across all open docs and
     * persisted in localStorage so it survives reloads. Min 320, default 480.
     */
    rightPaneWidth: number
    isLoading: boolean
    error: string | null
}

const emptyDocState = (): DocPerState => ({
    buffer: '',
    dirty: false,
    viewMode: 'edit',
    rightPane: 'inspector',
    pendingProposal: null,
    proposalHistory: {},
    proposalSummaries: {}
})

const RIGHT_PANE_WIDTH_KEY = 'spec.docs.rightPaneWidth'
const DEFAULT_RIGHT_PANE_WIDTH = 480
const MIN_RIGHT_PANE_WIDTH = 320

const readPersistedRightPaneWidth = (): number => {
    if (typeof window === 'undefined') return DEFAULT_RIGHT_PANE_WIDTH
    const raw = window.localStorage?.getItem(RIGHT_PANE_WIDTH_KEY)
    const parsed = raw ? Number(raw) : NaN
    return Number.isFinite(parsed) && parsed >= MIN_RIGHT_PANE_WIDTH
        ? parsed
        : DEFAULT_RIGHT_PANE_WIDTH
}

export const initialSpecDocsState: SpecDocsState = {
    nodes: [],
    selectedId: null,
    byDoc: {},
    saving: {},
    rightPaneWidth: readPersistedRightPaneWidth(),
    isLoading: false,
    error: null
}

const ensureDoc = (state: SpecDocsState, docId: string): DocPerState => {
    if (!state.byDoc[docId]) state.byDoc[docId] = emptyDocState()
    return state.byDoc[docId]
}

const specDocsSlice = createSlice({
    name: 'specDocs',
    initialState: initialSpecDocsState,
    reducers: {
        docsLoadStart(state) {
            state.isLoading = true
            state.error = null
        },
        docsLoadSuccess(state, action: PayloadAction<DocNode[]>) {
            state.isLoading = false
            state.nodes = action.payload
        },
        docsLoadFailure(state, action: PayloadAction<string>) {
            state.isLoading = false
            state.error = action.payload
        },
        docNodeUpserted(state, action: PayloadAction<DocNode>) {
            const incoming = action.payload
            const idx = state.nodes.findIndex((n) => n.id === incoming.id)
            if (idx >= 0) state.nodes[idx] = incoming
            else state.nodes.push(incoming)
        },
        docNodeRemoved(state, action: PayloadAction<string>) {
            const id = action.payload
            state.nodes = state.nodes.filter((n) => n.id !== id)
            delete state.byDoc[id]
            delete state.saving[id]
            if (state.selectedId === id) state.selectedId = null
        },
        /**
         * Open a doc into a tab and focus it. Loads the buffer if the doc
         * isn't open yet; preserves the existing buffer otherwise (so
         * re-selecting a tab doesn't drop unsaved edits).
         */
        docSelected(state, action: PayloadAction<{ id: string | null; content: string }>) {
            state.selectedId = action.payload.id
            if (action.payload.id) {
                const docState = ensureDoc(state, action.payload.id)
                // Only seed buffer on first open; respect dirty state on re-focus.
                if (!docState.dirty && docState.buffer === '') {
                    docState.buffer = action.payload.content
                }
            }
        },
        /** Lightweight focus change — used when switching tabs without re-reading from disk. */
        docFocused(state, action: PayloadAction<string | null>) {
            state.selectedId = action.payload
            if (action.payload) ensureDoc(state, action.payload)
        },
        /** Force-reset a doc's buffer to the given content (e.g. after external change). */
        docBufferReset(state, action: PayloadAction<{ id: string; content: string }>) {
            const docState = ensureDoc(state, action.payload.id)
            docState.buffer = action.payload.content
            docState.dirty = false
        },
        /** Close a tab — drops the per-doc state. */
        docTabClosed(state, action: PayloadAction<string>) {
            const id = action.payload
            delete state.byDoc[id]
            delete state.saving[id]
            if (state.selectedId === id) state.selectedId = null
        },
        docBufferChanged(state, action: PayloadAction<{ id: string; content: string }>) {
            const docState = ensureDoc(state, action.payload.id)
            docState.buffer = action.payload.content
            docState.dirty = true
        },
        docSaveStart(state, action: PayloadAction<string>) {
            state.saving[action.payload] = true
        },
        docSaveSuccess(state, action: PayloadAction<string>) {
            delete state.saving[action.payload]
            const docState = state.byDoc[action.payload]
            if (docState) docState.dirty = false
        },
        docSaveFailure(state, action: PayloadAction<{ id: string; error: string }>) {
            delete state.saving[action.payload.id]
            state.error = action.payload.error
        },
        docViewModeChanged(state, action: PayloadAction<{ id: string; mode: DocViewMode }>) {
            ensureDoc(state, action.payload.id).viewMode = action.payload.mode
        },
        /**
         * Set the right pane to a specific mode. Passing `null` collapses it.
         * Toolbar buttons toggle: clicking the active mode again sends `null`.
         */
        docRightPaneSet(state, action: PayloadAction<{ id: string; pane: DocRightPane }>) {
            ensureDoc(state, action.payload.id).rightPane = action.payload.pane
        },
        rightPaneWidthChanged(state, action: PayloadAction<number>) {
            const next = Math.max(MIN_RIGHT_PANE_WIDTH, Math.round(action.payload))
            state.rightPaneWidth = next
            if (typeof window !== 'undefined') {
                try {
                    window.localStorage?.setItem(RIGHT_PANE_WIDTH_KEY, String(next))
                } catch {
                    // localStorage may be unavailable (private mode); width
                    // still works for the session.
                }
            }
        },
        /**
         * Stage an assistant proposal for review. If a different proposal is
         * already pending for this doc, the previous one is pushed into
         * history as 'stale' (matches the prior local-state behaviour).
         */
        docProposalStaged(
            state,
            action: PayloadAction<{ id: string; proposal: PendingProposal; summary: ProposalSummary[] }>
        ) {
            const docState = ensureDoc(state, action.payload.id)
            if (docState.pendingProposal && docState.pendingProposal.messageId !== action.payload.proposal.messageId) {
                docState.proposalHistory[docState.pendingProposal.messageId] = 'stale'
            }
            docState.pendingProposal = action.payload.proposal
            docState.proposalSummaries[action.payload.proposal.messageId] = action.payload.summary
        },
        /**
         * Flip the selection for one edit and re-fold the proposal so the
         * `applied` buffer reflects only the selected edits. Failed ops
         * never become selected (their match couldn't be resolved, so
         * applying them is a no-op anyway).
         */
        docProposalEditToggled(
            state,
            action: PayloadAction<{ id: string; messageId: string; editIndex: number }>
        ) {
            const docState = ensureDoc(state, action.payload.id)
            const proposal = docState.pendingProposal
            if (!proposal || proposal.messageId !== action.payload.messageId) return
            const idx = action.payload.editIndex
            if (idx < 0 || idx >= proposal.edits.length) return
            // Failed ops can't be applied — block the toggle so the UI stays honest.
            if (!proposal.ops[idx]?.ok) return

            proposal.selected[idx] = !proposal.selected[idx]
            const selectedEdits = proposal.edits.filter((_, i) => proposal.selected[i])
            proposal.applied = applyEdits(proposal.snapshot, selectedEdits).result
        },
        docProposalResolved(
            state,
            action: PayloadAction<{ id: string; messageId: string; status: 'applied' | 'rejected' }>
        ) {
            const docState = ensureDoc(state, action.payload.id)
            docState.proposalHistory[action.payload.messageId] = action.payload.status
            if (docState.pendingProposal?.messageId === action.payload.messageId) {
                docState.pendingProposal = null
            }
        },
        docsReset() {
            return initialSpecDocsState
        }
    }
})

export const {
    docsLoadStart,
    docsLoadSuccess,
    docsLoadFailure,
    docNodeUpserted,
    docNodeRemoved,
    docSelected,
    docFocused,
    docBufferReset,
    docTabClosed,
    docBufferChanged,
    docSaveStart,
    docSaveSuccess,
    docSaveFailure,
    docViewModeChanged,
    docRightPaneSet,
    rightPaneWidthChanged,
    docProposalStaged,
    docProposalEditToggled,
    docProposalResolved,
    docsReset
} = specDocsSlice.actions

export default specDocsSlice.reducer

// ─── Selectors (docId-scoped — never read the whole byDoc map) ────────────
//
// All consumers must use these. Reading `state.specDocs.byDoc` directly
// re-renders on every keystroke in any tab, defeating the per-doc design.

export const selectDocsRoot = (state: RootState): SpecDocsState => state.specDocs
export const selectDocNodes = (state: RootState): DocNode[] => state.specDocs.nodes
export const selectSelectedDocId = (state: RootState): string | null => state.specDocs.selectedId
export const selectDocsLoading = (state: RootState): boolean => state.specDocs.isLoading
export const selectDocsError = (state: RootState): string | null => state.specDocs.error
export const selectOpenDocIds = (state: RootState): string[] => Object.keys(state.specDocs.byDoc)

const EMPTY_DOC: DocPerState = emptyDocState()

export const selectDocState =
    (docId: string | null) =>
    (state: RootState): DocPerState =>
        (docId && state.specDocs.byDoc[docId]) || EMPTY_DOC

export const selectDocBuffer = (docId: string | null) => (state: RootState): string =>
    selectDocState(docId)(state).buffer

export const selectDocDirty = (docId: string | null) => (state: RootState): boolean =>
    selectDocState(docId)(state).dirty

export const selectDocSaving = (docId: string | null) => (state: RootState): boolean =>
    docId ? Boolean(state.specDocs.saving[docId]) : false

export const selectDocViewMode = (docId: string | null) => (state: RootState): DocViewMode =>
    selectDocState(docId)(state).viewMode

export const selectDocRightPane =
    (docId: string | null) =>
    (state: RootState): DocRightPane =>
        selectDocState(docId)(state).rightPane

export const selectRightPaneWidth = (state: RootState): number => state.specDocs.rightPaneWidth

export const selectDocPendingProposal =
    (docId: string | null) =>
    (state: RootState): PendingProposal | null =>
        selectDocState(docId)(state).pendingProposal

export const selectDocProposalHistory =
    (docId: string | null) =>
    (state: RootState): Record<string, ProposalStatus> =>
        selectDocState(docId)(state).proposalHistory

export const selectDocProposalSummaries =
    (docId: string | null) =>
    (state: RootState): Record<string, ProposalSummary[]> =>
        selectDocState(docId)(state).proposalSummaries

/** Combined status map (history + pending) — memoised per doc. */
export const makeSelectDocProposalStatus = (docId: string | null) =>
    createSelector(
        [selectDocPendingProposal(docId), selectDocProposalHistory(docId)],
        (pending, history): Record<string, ProposalStatus> => {
            if (!pending) return history
            return { ...history, [pending.messageId]: 'pending' }
        }
    )
