import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Branch } from '@renderer/components/git/git-branch-switcher';
import { Repository } from 'src/main/types';

export interface GitState {
  repositories: Repository[];
  isInitialized: boolean;
  user: any | null;
  activeBranch: string;
  isGitEnabled: boolean;  // Add this
  branches: Branch[];
}

const initialState: GitState = {
  repositories: [],
  isInitialized: false,
  user: null,
  activeBranch: '',
  isGitEnabled: false,
  branches: [],
};

export const gitSlice = createSlice({
  name: 'git',
  initialState,
  reducers: {
    setRepositories: (state, action) => {
      state.repositories = action.payload;
      state.isInitialized = true;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setActiveBranch: (state, action: PayloadAction<string>) => {
      state.activeBranch = action.payload;
    },
    setGitEnabled: (state, action: PayloadAction<boolean>) => {
      state.isGitEnabled = action.payload;
    },
    setBranches: (state, action: PayloadAction<Branch[]>) => {
      state.branches = action.payload;
    }
  },
});

export const { setRepositories, setUser, setActiveBranch, setGitEnabled, setBranches } = gitSlice.actions;

export default gitSlice.reducer;
