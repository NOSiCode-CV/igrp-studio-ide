import { BrowserWindow, ipcMain } from 'electron'
import { GitService } from '../services/git-service'
import { GitStore } from '../services/git-store'
import { GitHubService } from '../services/github-service'
import { GitLabService } from '../services/gitlab-service'
import type { GitProviderConfig } from '../types'

// GitHub
ipcMain.handle('gitauth-initialize', async (_event, token) => {
    try {
        await GitHubService.initialize(token)
        await GitLabService.initialize(token)
        GitStore.setToken('github', token)
        GitStore.setToken('gitlab', token)
        return true
    } catch (error) {
        console.error('GitAuth initialization failed:', error)
        throw error
    }
})
ipcMain.handle('logout-github', async () => {
    return GitStore.logoutGithub()
})
ipcMain.handle('logout-gitlab', async () => {
    return GitStore.logoutGitlab()
})
ipcMain.handle('gitlab-initialize', async (_event, token) => {
    try {
        await GitLabService.initialize(token)
        GitStore.setToken('gitlab', token)
        return true
    } catch (error) {
        console.error('GitLab initialization failed:', error)
        throw error
    }
})
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
    return GitHubService.getUserInfo()
})
ipcMain.handle('gitlab-user-info', async () => {
    return GitLabService.getUserInfo()
})
ipcMain.handle('github-repositories', async (event) => {
    const mainWindow = BrowserWindow.fromWebContents(event.sender)
    return GitHubService.listIGRPStudioRepositoriesGithub(mainWindow as BrowserWindow)
})
ipcMain.handle('gitlab-repositories', async (event) => {
    const mainWindow = BrowserWindow.fromWebContents(event.sender)
    return GitLabService.listIGRPStudioRepositoriesGitlab(mainWindow as BrowserWindow)
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

///GitLabService store config
ipcMain.handle('get-gitlab-config', async () => {
    return GitLabService.getGitlabConfigs()
})
ipcMain.handle('set-ative-gitlab-config', async (_event, id: string): Promise<void> => {
    return GitLabService.setActiveGitlabConfig(id)
})

ipcMain.handle('save-gitlab-config', async (_event, config: GitProviderConfig) => {
    return GitLabService.saveGitlabConfig(config)
})
