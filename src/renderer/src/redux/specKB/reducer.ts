import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type KBItemStatus = 'pending' | 'converting' | 'indexing' | 'indexed' | 'error'
export type KBItemType =
    | 'pdf'
    | 'docx'
    | 'pptx'
    | 'xlsx'
    | 'html'
    | 'image'
    | 'audio'
    | 'url'
    | 'youtube'
    | 'other'

export interface KBItem {
    id: string
    name: string
    type: KBItemType
    status: KBItemStatus
    origin: string
    size?: number
    createdAt: string
    updatedAt: string
    chunks?: number
    error?: string
    filePath?: string
    mdPath?: string
}

export interface KBSearchHit {
    id: string
    score: number
    text: string
    metadata?: Record<string, unknown>
}

export interface SpecKBState {
    items: KBItem[]
    selectedId: string | null
    searchQuery: string
    isLoading: boolean
    error: string | null
    /** Last semantic-search results, keyed by query string for the active session. */
    lastSearch: { query: string; hits: KBSearchHit[] } | null
}

export const initialSpecKBState: SpecKBState = {
    items: [],
    selectedId: null,
    searchQuery: '',
    isLoading: false,
    error: null,
    lastSearch: null
}

const specKBSlice = createSlice({
    name: 'specKB',
    initialState: initialSpecKBState,
    reducers: {
        kbLoadStart(state) {
            state.isLoading = true
            state.error = null
        },
        kbLoadSuccess(state, action: PayloadAction<KBItem[]>) {
            state.isLoading = false
            state.items = action.payload
        },
        kbLoadFailure(state, action: PayloadAction<string>) {
            state.isLoading = false
            state.error = action.payload
        },
        /** Upsert from progress events or local actions. */
        kbItemUpserted(state, action: PayloadAction<KBItem>) {
            const incoming = action.payload
            const idx = state.items.findIndex((i) => i.id === incoming.id)
            if (idx >= 0) state.items[idx] = incoming
            else state.items.unshift(incoming)
        },
        kbItemRemoved(state, action: PayloadAction<string>) {
            state.items = state.items.filter((i) => i.id !== action.payload)
            if (state.selectedId === action.payload) state.selectedId = null
        },
        kbSelected(state, action: PayloadAction<string | null>) {
            state.selectedId = action.payload
        },
        kbSearchQueryChanged(state, action: PayloadAction<string>) {
            state.searchQuery = action.payload
        },
        kbSemanticSearchSucceeded(
            state,
            action: PayloadAction<{ query: string; hits: KBSearchHit[] }>
        ) {
            state.lastSearch = action.payload
        },
        kbSemanticSearchCleared(state) {
            state.lastSearch = null
        },
        kbReset() {
            return initialSpecKBState
        }
    }
})

export const {
    kbLoadStart,
    kbLoadSuccess,
    kbLoadFailure,
    kbItemUpserted,
    kbItemRemoved,
    kbSelected,
    kbSearchQueryChanged,
    kbSemanticSearchSucceeded,
    kbSemanticSearchCleared,
    kbReset
} = specKBSlice.actions

export default specKBSlice.reducer
