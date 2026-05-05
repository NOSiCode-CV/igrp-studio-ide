import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

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

export interface SpecDocsState {
    nodes: DocNode[]
    selectedId: string | null
    /** Editor buffer for the selected file. Persisted on debounced save. */
    buffer: string
    /** True when buffer differs from last-loaded content. */
    dirty: boolean
    /** True while a save IPC roundtrip is in flight. */
    saving: boolean
    viewMode: DocViewMode
    inspectorOpen: boolean
    chatOpen: boolean
    isLoading: boolean
    error: string | null
}

export const initialSpecDocsState: SpecDocsState = {
    nodes: [],
    selectedId: null,
    buffer: '',
    dirty: false,
    saving: false,
    viewMode: 'edit',
    inspectorOpen: true,
    chatOpen: false,
    isLoading: false,
    error: null
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
            state.nodes = state.nodes.filter((n) => n.id !== action.payload)
            if (state.selectedId === action.payload) {
                state.selectedId = null
                state.buffer = ''
                state.dirty = false
            }
        },
        docSelected(state, action: PayloadAction<{ id: string | null; content: string }>) {
            state.selectedId = action.payload.id
            state.buffer = action.payload.content
            state.dirty = false
        },
        docBufferChanged(state, action: PayloadAction<string>) {
            state.buffer = action.payload
            state.dirty = true
        },
        docSaveStart(state) {
            state.saving = true
        },
        docSaveSuccess(state) {
            state.saving = false
            state.dirty = false
        },
        docSaveFailure(state, action: PayloadAction<string>) {
            state.saving = false
            state.error = action.payload
        },
        docViewModeChanged(state, action: PayloadAction<DocViewMode>) {
            state.viewMode = action.payload
        },
        docInspectorToggled(state, action: PayloadAction<boolean | undefined>) {
            state.inspectorOpen = action.payload ?? !state.inspectorOpen
        },
        docChatToggled(state, action: PayloadAction<boolean | undefined>) {
            state.chatOpen = action.payload ?? !state.chatOpen
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
    docBufferChanged,
    docSaveStart,
    docSaveSuccess,
    docSaveFailure,
    docViewModeChanged,
    docInspectorToggled,
    docChatToggled,
    docsReset
} = specDocsSlice.actions

export default specDocsSlice.reducer
