import { BrowserWindow, ipcMain } from 'electron'
import { GitAuthExpiredError } from '../helpers/git-auth/git-auth-errors'
import { getProviderConfigById } from '../helpers/git-auth/git-auth-factory'
import { clearRepoCache } from '../helpers/git-auth/repo-cache'
import { GitService } from '../services/git-service'
import { GitStore } from '../services/git-store'
import { GitHubService } from '../services/github-service'
import { GitLabService } from '../services/gitlab-service'
import type { GitProviderConfig, GitProviderType } from '../types'

/**
 * Notify all renderer windows that a provider's token is no longer valid.
 * The renderer should clear the user/repos state for that provider and
 * prompt the user to reconnect.
 */
function notifyTokenExpired(providerType: GitProviderType, status: number): void {
    for (const win of BrowserWindow.getAllWindows()) {
        win.webContents.send('git-token-expired', { providerType, status })
    }
}

/**
 * Notify renderer windows that a provider hit its rate limit so the
 * UI can fall back to a friendly toast instead of an opaque error.
 */
function notifyRateLimited(providerType: GitProviderType): void {
    for (const win of BrowserWindow.getAllWindows()) {
        win.webContents.send('git-rate-limited', { providerType })
    }
}

/**
 * Run a git API call, intercept GitAuthExpiredError and rate-limit
 * errors and broadcast the matching renderer event before re-throwing.
 * Keeps every IPC handler focussed on its happy path.
 */
async function withAuthErrorHandling<T>(fn: () => Promise<T>): Promise<T> {
    try {
        return await fn()
    } catch (error) {
        if (error instanceof GitAuthExpiredError) {
            notifyTokenExpired(error.providerType, error.status)
        } else if (error && typeof error === 'object' && (error as any).code === 'RATE_LIMITED') {
            notifyRateLimited((error as any).providerType as GitProviderType)
        }
        throw error
    }
}

// GitHub
ipcMain.handle('gitauth-initialize', async (_event, token: string, baseUrl?: string) => {
    try {
        // GitAuth.handleAuthSuccess already initialised the matching
        // service with the right baseUrl. This handler exists so the
        // renderer can re-establish state after a reload; we forward
        // the baseUrl so a previously-configured Enterprise instance
        // is not silently downgraded to github.com.
        await GitHubService.initialize(token, baseUrl)
        GitStore.setToken('github', token)
        return true
    } catch (error) {
        console.error('GitAuth initialization failed:', error)
        throw error
    }
})
ipcMain.handle('logout-github', async () => {
    GitHubService.logout()
    return true
})
ipcMain.handle('logout-gitlab', async () => {
    GitLabService.logout()
    return true
})

ipcMain.handle(
    'git-provider:invalidate-repo-cache',
    async (_event, providerType?: GitProviderType) => {
        clearRepoCache(providerType)
        return true
    }
)
ipcMain.handle(
    'gitlab-initialize',
    async (_event, token: string, baseUrlOrProviderId?: string) => {
        try {
            let baseUrl: string | undefined
            if (typeof baseUrlOrProviderId === 'string' && baseUrlOrProviderId.length > 0) {
                if (/^https?:\/\//i.test(baseUrlOrProviderId)) {
                    baseUrl = baseUrlOrProviderId
                } else {
                    const cfg = getProviderConfigById(baseUrlOrProviderId)
                    baseUrl = cfg?.baseUrl
                }
            }
            await GitLabService.initialize(token, baseUrl)
            GitStore.setToken('gitlab', token)
            return true
        } catch (error) {
            console.error('GitLab initialization failed:', error)
            throw error
        }
    }
)
ipcMain.handle('add-cloned-repo', (_event, repoId: number) => {
    GitStore.addClonedRepo(repoId)
})
ipcMain.handle('remove-cloned-repo', (_event, repoId: number) => {
    GitStore.removeClonedRepo(repoId)
})
ipcMain.handle('get-cloned-repos', () => {
    const repos = GitStore.getClonedRepos()
    return repos
})

ipcMain.handle('get-project-paths', () => {
    return GitStore.getProjectPaths()
})
ipcMain.handle('set-project-path', (_event, { repoId, path }: { repoId: number; path: string }) => {
    GitStore.setProjectPath(repoId, path)
})
ipcMain.handle('github-user-info', async () => {
    return withAuthErrorHandling(() => GitHubService.getUserInfo())
})
ipcMain.handle('gitlab-user-info', async () => {
    return withAuthErrorHandling(() => GitLabService.getUserInfo())
})
ipcMain.handle('github-repositories', async (event) => {
    const mainWindow = BrowserWindow.fromWebContents(event.sender)
    return withAuthErrorHandling(() =>
        GitHubService.listIGRPStudioRepositoriesGithub(mainWindow as BrowserWindow)
    )
})
ipcMain.handle('gitlab-repositories', async (event) => {
    const mainWindow = BrowserWindow.fromWebContents(event.sender)
    return withAuthErrorHandling(() =>
        GitLabService.listIGRPStudioRepositoriesGitlab(mainWindow as BrowserWindow)
    )
})

// Git
ipcMain.handle('check-git-remotes', async (_event, { projects, githubRepos }) => {
    return GitService.checkGitRemotes(projects, githubRepos)
})
ipcMain.handle('clone-repository', async (event, repoUrl, basePath, auth) => {
    const mainWindow = BrowserWindow.fromWebContents(event.sender)
    return GitService.cloneRepository(repoUrl, basePath, mainWindow as BrowserWindow, auth)
})
ipcMain.handle('list-branches', async (_event, projectPath) => {
    return GitService.listBranches(projectPath)
})
ipcMain.handle('checkout-branch', async (_event, { projectPath, branchName }) => {
    return GitService.checkoutBranch(projectPath, branchName)
})
ipcMain.handle('create-branch', async (_event, { projectPath, branchName }) => {
    return GitService.createBranch(projectPath, branchName)
})
ipcMain.handle('create-commit', async (_event, { projectPath, message }) => {
    return GitService.createCommit(projectPath, message)
})
ipcMain.handle('pull-changes', async (_event, { projectPath, branch }) => {
    return GitService.pull(projectPath, branch)
})
ipcMain.handle('push-changes', async (_event, { projectPath, branch }) => {
    return GitService.push(projectPath, branch)
})
ipcMain.handle('sync-changes', async (_event, { projectPath, branch }) => {
    return GitService.sync(projectPath, branch)
})
ipcMain.handle('get-changes-count', async (_event, projectPath: string) => {
    return GitService.getChangesCount(projectPath)
})
ipcMain.handle('is-git-initialized', async (_event, projectPath: string) => {
    return GitService.isGitInitialized(projectPath)
})
ipcMain.handle('git-repo-root', async (_event, projectPath: string) => {
    return GitService.getRepoRoot(projectPath)
})
ipcMain.handle('initialize-git', async (_event, projectPath: string) => {
    return GitService.initializeGit(projectPath)
})
ipcMain.handle('get-remote-git', async (_event, projectPath: string) => {
    return GitService.getRemoteUrl(projectPath)
})
ipcMain.handle('add-git-remote', async (_event, { projectPath, remoteUrl }) => {
    return GitService.addRemote(projectPath, remoteUrl)
})
ipcMain.handle('list-commits', async (_event, { projectPath, branch, limit }) => {
    return GitService.listCommits(projectPath, branch, limit)
})
ipcMain.handle('get-contributors-git', async (_event, { projectPath }) => {
    return GitService.getContributors(projectPath)
})
ipcMain.handle('set-auto-commit', async (_, prompt: boolean) => {
    return GitStore.setAutoCommit(prompt)
})
ipcMain.handle('is-auto-commit', async () => {
    return GitStore.isAutoCommit()
})

/* ------------------------------------------------------------------ */
/*  Generic provider configs (works for any GitProviderType)          */
/* ------------------------------------------------------------------ */
ipcMain.handle('git-provider:list-configs', async (_event, type?: 'github' | 'gitlab') => {
    return GitStore.getProviderConfigs(type)
})

ipcMain.handle('git-provider:save-config', async (_event, config: GitProviderConfig) => {
    try {
        GitStore.saveProviderConfig(config)
        return { success: true as const }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        return { success: false as const, error: message }
    }
})

ipcMain.handle('git-provider:remove-config', async (_event, id: string): Promise<void> => {
    return GitStore.removeProviderConfig(id)
})

ipcMain.handle('git-provider:set-active', async (_event, id: string): Promise<void> => {
    return GitStore.setActiveProviderConfig(id)
})

/* ------------------------------------------------------------------ */
/*  Legacy GitLab-only aliases (renderer hooks still target these)    */
/* ------------------------------------------------------------------ */
ipcMain.handle('get-gitlab-config', async () => {
    return GitLabService.getGitlabConfigs()
})
ipcMain.handle('set-active-gitlab-config', async (_event, id: string): Promise<void> => {
    return GitLabService.setActiveGitlabConfig(id)
})

ipcMain.handle('save-gitlab-config', async (_event, config: GitProviderConfig) => {
    return GitLabService.saveGitlabConfig(config)
})

ipcMain.handle('remove-gitlab-config', async (_event, id: string): Promise<void> => {
    return GitLabService.removeGitlabConfig(id)
})
