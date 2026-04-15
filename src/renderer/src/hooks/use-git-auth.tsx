import {
    addGitLabProvider,
    type GitLabProvider,
    removeGitLabProvider,
    setActiveProvider,
    setGitLabProviders,
    setProviderRepositories,
    setProviderUser,
    updateGitLabProvider
} from '@renderer/redux/git/reducer'
import {
    selectActiveProvider,
    selectActiveProviderId,
    selectGitLabProviders,
    selectIsInitialized,
    selectRepositoriesGitHub,
    selectRepositoriesGitLab,
    selectUserGitHub,
    selectUserGitLab
} from '@renderer/redux/git/selectors'
import { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { Repository } from 'src/main/types'

const useGitAuth = () => {
    const dispatch = useDispatch()
    const [isLoading, setIsLoading] = useState(false)
    const userGitHub = useSelector(selectUserGitHub)
    const userGitLab = useSelector(selectUserGitLab)
    const repositoriesGitHub = useSelector(selectRepositoriesGitHub)
    const repositoriesGitLab = useSelector(selectRepositoriesGitLab)
    const isInitialized = useSelector(selectIsInitialized)
    const gitLabProviders = useSelector(selectGitLabProviders)
    const activeProviderId = useSelector(selectActiveProviderId)
    const activeProvider = useSelector(selectActiveProvider)

    const loadGithubData = useCallback(async (): Promise<void> => {
        setIsLoading(true)

        const processGitHubUserInfo = async (): Promise<void> => {
            try {
                const userGitHub = await window.electron.ipcRenderer.invoke('github-user-info')
                if (userGitHub) {
                    dispatch(
                        setProviderUser({
                            providerId: 'github',
                            user: userGitHub
                        })
                    )
                }
            } catch (error) {
                console.error('Falha ao carregar informações do usuário GitHub:', error)
            }
        }

        const processGitLabUserInfo = async (): Promise<void> => {
            try {
                const userGitLab = await window.electron.ipcRenderer.invoke('gitlab-user-info')
                if (userGitLab && activeProviderId && activeProviderId !== 'github') {
                    dispatch(
                        setProviderUser({
                            providerId: activeProviderId,
                            user: userGitLab
                        })
                    )
                }
            } catch (error) {
                console.error('Falha ao carregar informações do usuário GitLab:', error)
            }
        }

        const processGitHubRepositories = async (): Promise<void> => {
            try {
                const repoGithub = await window.electron.ipcRenderer.invoke('github-repositories')
                if (repoGithub) {
                    dispatch(
                        setProviderRepositories({
                            providerId: 'github',
                            repositories: repoGithub as Repository[]
                        })
                    )
                }
            } catch (error) {
                console.error('Falha ao carregar repositórios do GitHub:', error)
            }
        }

        const processGitLabRepositories = async (): Promise<void> => {
            try {
                const repoGitlab = await window.electron.ipcRenderer.invoke('gitlab-repositories')
                if (repoGitlab && activeProviderId && activeProviderId !== 'github') {
                    dispatch(
                        setProviderRepositories({
                            providerId: activeProviderId,
                            repositories: repoGitlab as Repository[]
                        })
                    )
                }
            } catch (error) {
                console.error('Falha ao carregar repositórios do GitLab:', error)
            }
        }

        const promises = [
            processGitHubUserInfo(),
            processGitLabUserInfo(),
            processGitHubRepositories(),
            processGitLabRepositories()
        ]

        await Promise.allSettled(promises)

        setIsLoading(false)
    }, [activeProviderId, dispatch])

    useEffect(() => {
        const onGitHubOAuthSuccess = async (_event: any, data: any): Promise<void> => {
            await window.electron.ipcRenderer.invoke('gitauth-initialize', data.access_token)
            dispatch(setActiveProvider('github'))
            await loadGithubData()
        }

        const onGitLabOAuthSuccess = async (_event: any, data: any): Promise<void> => {
            const providerId = data.providerId || activeProviderId
            if (providerId && providerId !== 'github') {
                await window.electron.ipcRenderer.invoke(
                    'gitlab-initialize',
                    data.access_token,
                    providerId
                )
                dispatch(setActiveProvider(providerId))
                await loadGithubData()
            }
        }

        window.electron.ipcRenderer.on('github-oauth-success', onGitHubOAuthSuccess)
        window.electron.ipcRenderer.on('gitlab-oauth-success', onGitLabOAuthSuccess)

        if (!isInitialized) {
            loadGithubData()
        }

        return () => {
            window.electron.ipcRenderer.removeListener('github-oauth-success', onGitHubOAuthSuccess)
            window.electron.ipcRenderer.removeListener('gitlab-oauth-success', onGitLabOAuthSuccess)
        }
    }, [isInitialized, dispatch, activeProviderId, loadGithubData])

    const handleLoginGithub = (): void => {
        dispatch(setActiveProvider('github'))
        window.electron.ipcRenderer.send('github-oauth')
    }

    const handleLoginGitLab = (providerId?: string): void => {
        const targetProviderId =
            providerId ||
            activeProviderId ||
            (gitLabProviders.length > 0 ? gitLabProviders[0].id : null)
        if (targetProviderId) {
            dispatch(setActiveProvider(targetProviderId))
            window.electron.ipcRenderer.send('gitlab-oauth', targetProviderId)
        }
    }

    const handleLogout = async (): Promise<void> => {
        await window.electron.ipcRenderer.invoke('logout-github')
        dispatch(setProviderUser({ providerId: 'github', user: null }))
        dispatch(setProviderRepositories({ providerId: 'github', repositories: [] }))
        dispatch(setActiveProvider(null))
    }

    const handleLogoutGitLab = async (providerId?: string): Promise<void> => {
        const targetProviderId = providerId || activeProviderId
        if (targetProviderId && targetProviderId !== 'github') {
            await window.electron.ipcRenderer.invoke('logout-gitlab', targetProviderId)
            dispatch(setProviderUser({ providerId: targetProviderId, user: null }))
            dispatch(
                setProviderRepositories({
                    providerId: targetProviderId,
                    repositories: []
                })
            )
            dispatch(setActiveProvider(null))
        }
    }

    const saveGitlabConfig = async (
        config: GitLabProvider
    ): Promise<{ success: boolean; error?: any }> => {
        try {
            await window.electron.ipcRenderer.invoke('save-gitlab-config', config)

            // Update Redux state
            if (config.id) {
                dispatch(updateGitLabProvider({ id: config.id, updates: config }))
            } else {
                dispatch(addGitLabProvider(config))
            }

            return { success: true }
        } catch (error) {
            console.error('Falha ao gravar configuração do GitLab:', error)
            return { success: false, error }
        }
    }

    const getGitlabConfig = async (): Promise<GitLabProvider[] | null> => {
        try {
            const config = await window.electron.ipcRenderer.invoke('get-gitlab-config')

            // Create default provider if environment variables are available
            const baseUrl = import.meta.env.VITE_GITLAB_BASE_URL
            const clientId = import.meta.env.VITE_GITLAB_CLIENT_ID
            const clientSecret = import.meta.env.VITE_GITLAB_CLIENT_SECRET

            const defaultProvider = {
                id: 'gitlab-nosi',
                name: 'GitLab NOSi',
                baseUrl: baseUrl || 'https://git.nosi.cv',
                clientId: clientId || '',
                clientSecret: clientSecret || '',
                active: false,
                isDefault: true,
                isConfigured: !!(baseUrl && clientId && clientSecret)
            }

            // Merge saved configurations with default provider
            const mergedProviders = [defaultProvider, ...config.filter((p: any) => !p.isDefault)]

            dispatch(setGitLabProviders(mergedProviders))

            return mergedProviders
        } catch (error) {
            console.error('Falha ao carregar configurações do GitLab:', error)
        }
        return null
    }

    const setActiveGitlabConfig = async (
        providerId: string
    ): Promise<{ success: boolean; error?: any }> => {
        try {
            await window.electron.ipcRenderer.invoke('set-active-gitlab-config', providerId)
            dispatch(setActiveProvider(providerId))
            return { success: true }
        } catch (error) {
            console.error('Falha ao definir configuração ativa do GitLab:', error)
            return { success: false, error }
        }
    }

    const handleRemoveGitLabProvider = async (providerId: string) => {
        try {
            await window.electron.ipcRenderer.invoke('remove-gitlab-config', providerId)
            dispatch(removeGitLabProvider(providerId))

            // If this was the active provider, clear active state
            if (activeProviderId === providerId) {
                dispatch(setActiveProvider(null))
            }

            return { success: true }
        } catch (error) {
            console.error('Falha ao remover configuração do GitLab:', error)
            return { success: false, error }
        }
    }

    return {
        userGitHub,
        userGitLab,
        repositoriesGitHub,
        repositoriesGitLab,
        gitLabProviders,
        activeProviderId,
        activeProvider,
        isAuthenticated: !!activeProvider?.user,
        loginGithub: handleLoginGithub,
        loginGitLab: handleLoginGitLab,
        logoutGithub: handleLogout,
        logoutGitLab: handleLogoutGitLab,
        reloadData: loadGithubData,
        saveGitlabConfig,
        getGitlabConfig,
        setActiveGitlabConfig,
        handleRemoveGitLabProvider,
        setActiveProvider: (providerId: string | null) => dispatch(setActiveProvider(providerId)),
        isLoading
    }
}

export default useGitAuth
