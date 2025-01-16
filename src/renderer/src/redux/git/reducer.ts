import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Repository } from 'src/main/types';

export interface GitState {
    repositories: Repository[];
    isInitialized: boolean;
    user: any | null;
    activeBranch: string;
}

const initialState: GitState = {
  repositories: [],
  isInitialized: false,
  user: null,
  activeBranch: '',
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
    }
  },
});

export const { setRepositories, setUser, setActiveBranch } = gitSlice.actions;

export default gitSlice.reducer;
