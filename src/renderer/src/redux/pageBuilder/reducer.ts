import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ProjectData, FileTree } from "src/main/types";

export interface StudioState {
    config: ProjectData | undefined;
    basePath: string;
    folderFiles?: FileTree[];
    changeStatus: boolean;
    currentItem: null
}

export const initialState: StudioState = {
    config: undefined,
    basePath: "",
    folderFiles: [],
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
        setFolderFilesAction(state, action: PayloadAction<FileTree[]>) {
            state.folderFiles = action.payload;
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
    setFolderFilesAction,
    setChangeStatusAction,
    setCurrentItemAction
} = StudioSlice.actions;

export default StudioSlice.reducer;