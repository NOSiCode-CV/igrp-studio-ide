import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ConfigOptions, FolderFiles } from "src/main/types";

export interface StudioState {
    config: ConfigOptions;
    basePath: string;
    folderFiles?: {};
    changeStatus: boolean;
    currentItem: null
}

export const initialState: StudioState = {
    config: {
        type: "",
        name: "",
        group: "",
        description: "",
        artifact: "",
        database: ""
    },
    basePath: "",
    folderFiles: {},
    changeStatus: false,
    currentItem: null
}

const StudioSlice = createSlice({
    name: 'Studio',
    initialState,
    reducers: {
        setConfigAction(state, action: PayloadAction<ConfigOptions>) {
            state.config = action.payload;
        },
        setBasePathAction(state, action: PayloadAction<string>) {
            state.basePath = action.payload;
        },
        setFolderFilesAction(state, action: PayloadAction<FolderFiles>) {
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