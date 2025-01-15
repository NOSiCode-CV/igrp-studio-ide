import { createSlice } from '@reduxjs/toolkit';
import { Repository } from 'src/main/types';

export interface GitState {
    repositories: Repository[];
    isInitialized: boolean;
    user: any | null;
}

const initialState: GitState = {
  repositories: [],
  isInitialized: false,
  user: null,
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
  },
});

export const { setRepositories, setUser } = gitSlice.actions;

export default gitSlice.reducer;
