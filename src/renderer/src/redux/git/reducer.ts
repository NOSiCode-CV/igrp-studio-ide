import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Branch } from '@renderer/components/git/git-branch-switcher';
import { Repository } from 'src/main/types';

export interface GitLabProvider {
    id: string;
    name: string;
    baseUrl: string;
    clientId: string;
    clientSecret: string;
    active: boolean;
    isDefault?: boolean;
    isConfigured?: boolean;
    user?: any;
    repositories?: Repository[];
}

export interface GitState {
    repositoriesGitHub: Repository[];
    repositoriesGitLab: Repository[];
    isInitialized: boolean;
    userGitHub: any | null;
    userGitLab: any | null;
    activeBranch: string;
    isGitEnabled: boolean;
    branches: Branch[];
    gitLabProviders: GitLabProvider[];
    activeProviderId: string | null;
}

// Helper function to create default GitLab NOSi provider
const createDefaultGitLabProvider = (): GitLabProvider => {
    const baseUrl = process.env.VITE_GITLAB_BASE_URL;
    const clientId = process.env.VITE_GITLAB_CLIENT_ID;
    const clientSecret = process.env.VITE_GITLAB_CLIENT_SECRET;
    
    // Always create the default provider, but mark it as unconfigured if env vars are missing
    return {
        id: 'gitlab-nosi',
        name: 'GitLab NOSi',
        baseUrl: baseUrl || 'https://git.nosi.cv',
        clientId: clientId || '',
        clientSecret: clientSecret || '',
        active: false,
        isDefault: true,
        isConfigured: !!(baseUrl && clientId && clientSecret),
    };
};

// Create the default provider once
const defaultProvider = createDefaultGitLabProvider();

const initialState: GitState = {
    repositoriesGitHub: [],
    repositoriesGitLab: [],
    isInitialized: false,
    userGitHub: null,
    userGitLab: null,
    activeBranch: '',
    isGitEnabled: false,
    branches: [],
    gitLabProviders: [defaultProvider],
    activeProviderId: null,
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
        setGitLabProviders: (state, action: PayloadAction<GitLabProvider[]>) => {
            state.gitLabProviders = action.payload;
        },
        addGitLabProvider: (state, action: PayloadAction<GitLabProvider>) => {
            state.gitLabProviders.push(action.payload);
        },
        updateGitLabProvider: (state, action: PayloadAction<{ id: string; updates: Partial<GitLabProvider> }>) => {
            const { id, updates } = action.payload;
            const providerIndex = state.gitLabProviders.findIndex(p => p.id === id);
            if (providerIndex !== -1) {
                state.gitLabProviders[providerIndex] = { ...state.gitLabProviders[providerIndex], ...updates };
            }
        },
        removeGitLabProvider: (state, action: PayloadAction<string>) => {
            state.gitLabProviders = state.gitLabProviders.filter(p => p.id !== action.payload);
        },
        setActiveProvider: (state, action: PayloadAction<string | null>) => {
            state.gitLabProviders.forEach(provider => {
                provider.active = false;
            });
            state.activeProviderId = action.payload;
            
            if (action.payload && action.payload !== 'github') {
                const provider = state.gitLabProviders.find(p => p.id === action.payload);
                if (provider) {
                    provider.active = true;
                }
            }
        },
        setProviderUser: (state, action: PayloadAction<{ providerId: string; user: any }>) => {
            const { providerId, user } = action.payload;
            if (providerId === 'github') {
                state.userGitHub = user;
            } else {
                const provider = state.gitLabProviders.find(p => p.id === providerId);
                if (provider) {
                    provider.user = user;
                }
            }
        },
        setProviderRepositories: (state, action: PayloadAction<{ providerId: string; repositories: Repository[] }>) => {
            const { providerId, repositories } = action.payload;
            if (providerId === 'github') {
                state.repositoriesGitHub = repositories;
            } else {
                const provider = state.gitLabProviders.find(p => p.id === providerId);
                if (provider) {
                    provider.repositories = repositories;
                }
            }
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
    setGitLabProviders,
    addGitLabProvider,
    updateGitLabProvider,
    removeGitLabProvider,
    setActiveProvider,
    setProviderUser,
    setProviderRepositories,
} = gitSlice.actions;

export default gitSlice.reducer;
