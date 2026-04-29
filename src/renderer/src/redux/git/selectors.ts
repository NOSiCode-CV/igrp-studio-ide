import type { RootState } from '@renderer/redux'
import { createSelector } from '@reduxjs/toolkit'

const selectGitState = (state: RootState) => state.git

export const selectUserGitHub = createSelector(selectGitState, (git) => git.userGitHub)
export const selectUserGitLab = createSelector(selectGitState, (git) => git.userGitLab)
export const selectRepositoriesGitHub = createSelector(
    selectGitState,
    (git) => git.repositoriesGitHub
)
export const selectRepositoriesGitLab = createSelector(
    selectGitState,
    (git) => git.repositoriesGitLab
)
export const selectIsInitialized = createSelector(selectGitState, (git) => git.isInitialized)
export const selectGitLabProviders = createSelector(selectGitState, (git) => git.gitLabProviders)
export const selectActiveProviderId = createSelector(selectGitState, (git) => git.activeProviderId)

export const selectActiveProvider = createSelector(
    selectActiveProviderId,
    selectUserGitHub,
    selectRepositoriesGitHub,
    selectGitLabProviders,
    (activeProviderId, userGitHub, repositoriesGitHub, gitLabProviders) => {
        if (activeProviderId === 'github') {
            return {
                id: 'github',
                name: 'GitHub',
                user: userGitHub,
                repositories: repositoriesGitHub
            }
        }

        return gitLabProviders.find((provider) => provider.id === activeProviderId)
    }
)
