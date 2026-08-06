import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { FileTree, IWorkspace, ProjectData } from 'src/main/types'

export interface StudioState {
    config: ProjectData | undefined
    basePath: string
    filesThree?: FileTree[]
    changeStatus: boolean
    currentItem: null
    workspace: IWorkspace | null
}

export const initialState: StudioState = {
    config: undefined,
    basePath: '',
    filesThree: [],
    changeStatus: false,
    currentItem: null,
    workspace: null
}

const StudioSlice = createSlice({
    name: 'Studio',
    initialState,
    reducers: {
        setConfigAction(state, action: PayloadAction<ProjectData | undefined>) {
            state.config = action.payload
        },
        setBasePathAction(state, action: PayloadAction<string>) {
            state.basePath = action.payload
        },
        setFilesThreeAction(state, action: PayloadAction<FileTree[]>) {
            state.filesThree = action.payload
        },
        setChangeStatusAction(state, action: PayloadAction<boolean>) {
            state.changeStatus = action.payload
        },
        setCurrentItemAction(state, action: PayloadAction<null>) {
            state.currentItem = action.payload
        },
        setWorkspaceAction(state, action: PayloadAction<IWorkspace | null>) {
            state.workspace = action.payload
        },
        clearStudioProjectAction(state) {
            state.config = undefined
            state.basePath = ''
            state.filesThree = []
            state.currentItem = null
            state.changeStatus = false
        }
    }
})

export const {
    setConfigAction,
    setBasePathAction,
    setFilesThreeAction,
    setChangeStatusAction,
    setCurrentItemAction,
    setWorkspaceAction,
    clearStudioProjectAction
} = StudioSlice.actions

export default StudioSlice.reducer
