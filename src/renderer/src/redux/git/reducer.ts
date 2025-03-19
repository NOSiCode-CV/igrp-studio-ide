import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Branch } from '@renderer/components/git/git-branch-switcher';
import { Repository } from 'src/main/types';

export interface GitState {
    repositoriesGitHub: Repository[];
    repositoriesGitLab: Repository[];
    isInitialized: boolean;
    userGitHub: any | null;
    userGitLab: any | null;
    activeBranch: string;
    isGitEnabled: boolean; // Add this
    branches: Branch[];
}

const initialState: GitState = {
    repositoriesGitHub: [],
    repositoriesGitLab: [],
    isInitialized: false,
    userGitHub: null,
    userGitLab: null,
    activeBranch: '',
    isGitEnabled: false,
    branches: [],
};

export const gitSlice = createSlice({
    name: 'git',
    initialState,
    reducers: {
        setRepositoriesGitHub: (state, action) => {
            state.repositoriesGitHub = action.payload;
            state.isInitialized = true;
        },
        setRepositoriesGitLab: (state, action) => {
            state.repositoriesGitLab = action.payload;
            state.isInitialized = true;
        },
        setUserGithub: (state, action) => {
            state.userGitHub = action.payload;
        },
        setUserGitLab: (state, action) => {
            state.userGitLab = action.payload;
        },
        setActiveBranch: (state, action: PayloadAction<string>) => {
            state.activeBranch = action.payload;
        },
        setGitEnabled: (state, action: PayloadAction<boolean>) => {
            state.isGitEnabled = action.payload;
        },
        setBranches: (state, action: PayloadAction<Branch[]>) => {
            state.branches = action.payload;
        },
    },
});

export const {
    setRepositoriesGitHub,
    setRepositoriesGitLab,
    setUserGithub,
    setUserGitLab,
    setActiveBranch,
    setGitEnabled,
    setBranches,
} = gitSlice.actions;

export default gitSlice.reducer;
