import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ProjectData, FileTree } from "src/main/types";

export interface StudioState {
    config: ProjectData | undefined;
    basePath: string;
    filesThree?: FileTree[];
    changeStatus: boolean;
    currentItem: null
}

export const initialState: StudioState = {
    config: undefined,
    basePath: "",
    filesThree: [],
    changeStatus: false,
    currentItem: null
}

const StudioSlice = createSlice({
    name: 'Studio',
    initialState,
    reducers: {
        setConfigAction(state, action: PayloadAction<ProjectData>) {
            state.config = action.payload;
        },
        setBasePathAction(state, action: PayloadAction<string>) {
            state.basePath = action.payload;
        },
        setFilesThreeAction(state, action: PayloadAction<FileTree[]>) {
            state.filesThree = action.payload;
        },
        setChangeStatusAction(state, action: PayloadAction<boolean>) {
            state.changeStatus = action.payload;
        },
        setCurrentItemAction(state, action: PayloadAction<null>) {
            state.currentItem = action.payload;
        }
    }
});

export const {
    setConfigAction,
    setBasePathAction,
    setFilesThreeAction,
    setChangeStatusAction,
    setCurrentItemAction
} = StudioSlice.actions;

export default StudioSlice.reducer;