import { exec } from 'child_process'
import { type BrowserWindow, dialog } from 'electron'
import { promisify } from 'util'
import { checkAndReadBaseApi } from '../helpers'
import { escapePath } from '../helpers/utils'
import type { Commit, Repository } from '../types'
import { GitStore } from './git-store'

const execAsyncRaw = promisify(exec)

/** TOFU: accept unknown hosts once; never skip verification of known hosts. */
const GIT_SSH_TOFU = 'ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new'

function gitEnv(extra?: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
    return {
        ...process.env,
        GIT_TERMINAL_PROMPT: '0',
        GIT_SSH_COMMAND: GIT_SSH_TOFU,
        ...extra
    }
}

function execAsync(
    command: string,
    options: { cwd?: string; maxBuffer?: number; env?: NodeJS.ProcessEnv } = {}
) {
    return execAsyncRaw(command, {
        ...options,
        env: gitEnv(options.env)
    })
}

function gitErrorMessage(error: unknown): string {
    const err = error as { stderr?: string; stdout?: string; message?: string }
    return [err.stderr, err.stdout, err.message].filter(Boolean).join('\n')
}

function describeCloneFailure(error: unknown): string {
    const message = gitErrorMessage(error)
    if (/Host key verification failed/i.test(message)) {
        return (
            'SSH host key is not trusted. Clone via HTTPS (recommended) or accept the host key once from a terminal, then retry.'
        )
    }
    if (/Permission denied \(publickey\)/i.test(message) || /Could not read from remote repository/i.test(message)) {
        return 'SSH authentication failed. Connect a GitHub or GitLab account and clone via HTTPS, or configure an SSH key.'
    }
    if (/Authentication failed|could not read Username|terminal prompts disabled/i.test(message)) {
        return 'Git asked for credentials with no session. Sign in to GitHub or GitLab in Studio, or provide a token.'
    }
    return message || 'Failed to clone repository'
}

function hostnameOf(urlOrHost: string): string | null {
    try {
        const withScheme = /^https?:\/\//i.test(urlOrHost) ? urlOrHost : `https://${urlOrHost}`
        return new URL(withScheme).hostname.toLowerCase()
    } catch {
        return null
    }
}

function parseGitHostAndPath(repoUrl: string): { host: string; httpsUrl: string } | null {
    const trimmed = repoUrl.trim()
    const sshScp = trimmed.match(/^git@([^:]+):(.+)$/)
    if (sshScp) {
        const host = sshScp[1].toLowerCase()
        const repoPath = sshScp[2].replace(/^\/+/, '')
        return { host, httpsUrl: `https://${host}/${repoPath}` }
    }
    const sshUri = trimmed.match(/^ssh:\/\/(?:git@)?([^/]+)\/(.+)$/)
    if (sshUri) {
        const host = sshUri[1].toLowerCase()
        return { host, httpsUrl: `https://${host}/${sshUri[2]}` }
    }
    try {
        const parsed = new URL(trimmed)
        return { host: parsed.hostname.toLowerCase(), httpsUrl: trimmed }
    } catch {
        return null
    }
}

function normalizeGitUrl(url: string): string {
    const parsed = parseGitHostAndPath(url)
    let candidate = parsed?.httpsUrl ?? url.trim()
    try {
        const u = new URL(candidate)
        u.username = ''
        u.password = ''
        candidate = u.toString()
    } catch {
        // keep as-is
    }
    return candidate.replace(/\.git\/?$/i, '').replace(/\/+$/, '').toLowerCase()
}

function tokenForHost(host: string): { token: string; kind: 'github' | 'gitlab' } | null {
    const githubHost =
        hostnameOf(GitStore.getProviderHost('github') || 'https://github.com') || 'github.com'
    const gitlabHost =
        hostnameOf(
            GitStore.getProviderHost('gitlab') ||
                process.env.VITE_GITLAB_BASE_URL ||
                process.env.VITE_GITLAB_HOST ||
                'https://git.nosi.cv'
        ) || 'git.nosi.cv'

    const isGithub = host === githubHost || host === 'github.com' || host.endsWith('.github.com')
    if (isGithub) {
        const token = GitStore.getToken('github')
        return token ? { token, kind: 'github' } : null
    }

    const isGitlab =
        host === gitlabHost ||
        host === 'gitlab.com' ||
        host === 'git.nosi.cv' ||
        host.includes('gitlab')
    if (isGitlab) {
        const token = GitStore.getToken('gitlab')
        return token ? { token, kind: 'gitlab' } : null
    }

    return null
}

function withEmbeddedToken(httpsUrl: string, kind: 'github' | 'gitlab', token: string): string {
    const url = new URL(httpsUrl)
    if (kind === 'github') {
        url.username = token
        url.password = ''
    } else {
        url.username = 'oauth2'
        url.password = token
    }
    return url.toString()
}

function stripCredentials(httpsUrl: string): string {
    try {
        const url = new URL(httpsUrl)
        url.username = ''
        url.password = ''
        return url.toString()
    } catch {
        return httpsUrl
    }
}

export const GitService = {
    async isGitInitialized(projectPath: string) {
        try {
            await execAsync('git rev-parse --is-inside-work-tree', {
                cwd: projectPath
            })
            return true
        } catch {
            return false
        }
    },

    async getRepoRoot(projectPath: string): Promise<string | null> {
        try {
            const { stdout } = await execAsync('git rev-parse --show-toplevel', {
                cwd: projectPath
            })
            const root = stdout?.trim()
            return root ? root : null
        } catch {
            return null
        }
    },

    async initializeGit(projectPath: string) {
        try {
            await execAsync('git init', { cwd: projectPath })
            await execAsync('git add .', { cwd: projectPath })
            await execAsync('git commit -m "Initial commit"', {
                cwd: projectPath
            })
            await execAsync('git branch -M main', { cwd: projectPath })

            return true
        } catch (error: any) {
            throw new Error(error.stderr || 'Failed to initialize git')
        }
    },
    async isRemoteConfigured(projectPath: string) {
        try {
            await execAsync('git remote get-url origin', { cwd: projectPath })
            return true
        } catch {
            return false
        }
    },

    async listBranches(projectPath: string) {
        try {
            // Lista todos os branches (locais e remotos)
            const { stdout } = await execAsync('git branch -a', {
                cwd: projectPath
            })

            // Processa a saída para um formato mais amigável
            const branches = stdout
                .split('\n')
                .filter(Boolean)
                .map((branch) => {
                    const isActive = branch.startsWith('*')
                    const name = branch.replace('*', '').trim()
                    const isRemote = name.startsWith('remotes/origin/')
                    const cleanName = isRemote ? name.replace('remotes/origin/', '') : name

                    return {
                        name: cleanName,
                        isActive,
                        isRemote,
                        fullName: name
                    }
                })

            // Remove duplicatas (branches locais e remotos com mesmo nome)
            const uniqueBranches = branches.reduce(
                (acc: { name: string }[], current: { name: string }) => {
                    const x = acc.find((item) => item.name === current.name)
                    if (!x) {
                        return acc.concat([current])
                    }
                    return acc
                },
                []
            )

            return uniqueBranches
        } catch (error) {
            console.error('Error listing branches:', error)
            throw error
        }
    },

    async createBranch(projectPath: string, branchName: string) {
        try {
            const { stdout } = await execAsync(`git checkout -b ${branchName}`, {
                cwd: projectPath
            })
            return stdout
        } catch (error: any) {
            throw new Error(error.stderr || 'Failed to create branch')
        }
    },

    async cloneRepository(
        repoUrl: string,
        basePath: string,
        window: BrowserWindow,
        auth?: {
            type: string
            username?: string
            password?: string
            token?: string
        }
    ) {
        try {
            const encapeBasePath = escapePath(basePath)

            if (!basePath) {
                const { canceled, filePaths } = await dialog.showOpenDialog(window, {
                    title: 'Choose Clone Location',
                    properties: ['openDirectory', 'createDirectory'],
                    buttonLabel: 'Choose Folder'
                })

                if (canceled) {
                    throw new Error('Operation cancelled')
                }

                basePath = filePaths[0]
            }

            /*  const projectName = await new Promise<string>((resolve, reject) => {
                 window.webContents.send('request-project-name', {
                     defaultName: repoUrl.split('/').pop()?.replace('.git', ''),
                 });
 
                 const { ipcMain } = require('electron');
                 ipcMain.once('project-name-response', (_event, name) => {
                     if (!name) reject(new Error('No project name provided'));
                     resolve(name);
                 });
             });
 
             const targetDir = path.join(basePath, projectName); */

            window.webContents.send('clone-progress', {
                status: 'starting',
                message: `Starting to clone into ${encapeBasePath}...`
            })

            // Prepare git clone command with authentication
            let cloneTarget = repoUrl
            let cleanRemote: string | null = null
            const parsed = parseGitHostAndPath(repoUrl)
            const wantsExplicitAuth = Boolean(auth && auth.type && auth.type !== 'none')

            try {
                if (wantsExplicitAuth && parsed) {
                    if (auth!.type === 'basic' && auth!.username && auth!.password) {
                        const url = new URL(parsed.httpsUrl)
                        url.username = auth!.username
                        url.password = auth!.password
                        cloneTarget = url.toString()
                        cleanRemote = stripCredentials(parsed.httpsUrl)
                    } else if (auth!.type === 'token' && auth!.token) {
                        const kind =
                            parsed.host === 'github.com' || parsed.host.endsWith('.github.com')
                                ? 'github'
                                : 'gitlab'
                        cloneTarget = withEmbeddedToken(parsed.httpsUrl, kind, auth!.token)
                        cleanRemote = stripCredentials(parsed.httpsUrl)
                    }
                } else if (parsed) {
                    const stored = tokenForHost(parsed.host)
                    if (stored) {
                        cloneTarget = withEmbeddedToken(parsed.httpsUrl, stored.kind, stored.token)
                        cleanRemote = stripCredentials(parsed.httpsUrl)
                    }
                }
            } catch (urlError) {
                console.error('Failed to apply clone credentials:', urlError)
            }

            const cloneCommand = `git clone ${escapePath(cloneTarget)} ${encapeBasePath}`

            return new Promise((resolve, reject) => {
                exec(cloneCommand, { env: gitEnv() }, async (error) => {
                    if (error) {
                        const message = describeCloneFailure(error)
                        window.webContents.send('clone-progress', {
                            status: 'error',
                            message
                        })
                        reject(new Error(message))
                        return
                    }

                    if (cleanRemote) {
                        try {
                            await execAsync(`git remote set-url origin ${escapePath(cleanRemote)}`, {
                                cwd: basePath
                            })
                        } catch (remoteError) {
                            console.error('Failed to strip clone credentials from origin:', remoteError)
                        }
                    }

                    try {
                        // Usa a nova função checkAndReadBaseApi
                        const { folderExists, config } = await checkAndReadBaseApi(basePath)

                        if (!folderExists || !config) {
                            throw new Error('Invalid IGRP Studio project structure')
                        }

                        window.webContents.send('clone-progress', {
                            status: 'success',
                            message: `Successfully cloned to ${encapeBasePath}`,
                            path: basePath,
                            project: config
                        })
                        resolve({ path: basePath, project: config })
                    } catch (configError) {
                        window.webContents.send('clone-progress', {
                            status: 'error',
                            message: `Failed to read project configuration: ${(configError as Error).message}`
                        })
                        reject(configError)
                    }
                })
            })
        } catch (error) {
            window.webContents.send('clone-progress', {
                status: 'error',
                message: `Error: ${(error as Error).message}`
            })
            throw error
        }
    },

    async checkoutBranch(projectPath: string, branchName: string) {
        try {
            await execAsync(`git checkout ${branchName}`, { cwd: projectPath })
            return true
        } catch (error: any) {
            if (error.stderr?.includes('Please commit your changes or stash')) {
                throw new Error('Commits pending. Please commit changes before syncing.')
            }
            return false
        }
    },

    async createCommit(projectPath: string, message: string): Promise<boolean> {
        try {
            await execAsync('git add .', { cwd: projectPath })
            // Escape any double quotes the caller managed to leave in the
            // message. Backticks already get stripped upstream; double quotes
            // are the remaining shell hazard.
            const safe = message.replace(/"/g, '\\"')
            await execAsync(`git commit -m "${safe}"`, { cwd: projectPath })

            return true
        } catch (error: any) {
            // `git commit` prints "nothing to commit, working tree clean" on
            // **stdout** (not stderr) and exits non-zero. The previous version
            // only inspected stderr; widen the scan so we recognise the
            // benign no-op and return `false` instead of throwing.
            const combined = [error.stderr, error.stdout, error.message].filter(Boolean).join('\n')

            if (
                combined.includes('nothing to commit') ||
                combined.includes('no changes added to commit') ||
                combined.includes('nothing added to commit') ||
                combined.includes('working tree clean') ||
                combined.includes('not a git repository')
            ) {
                return false
            }

            throw new Error(combined || 'git commit failed')
        }
    },

    async pull(projectPath: string, branch: string) {
        try {
            const { stdout } = await execAsync(`git pull origin ${branch}`, {
                cwd: projectPath
            })
            return stdout
        } catch (error: any) {
            throw new Error(gitErrorMessage(error) || 'Failed to pull changes')
        }
    },

    async push(projectPath: string, branch: string) {
        try {
            const { stdout } = await execAsync(`git push origin ${branch}`, {
                cwd: projectPath
            })
            return stdout
        } catch (error: any) {
            throw new Error(error.stderr || 'Failed to push changes')
        }
    },

    async isRemoteBranchExists(projectPath: string, branch: string) {
        try {
            await execAsync(`git ls-remote --heads origin ${branch}`, {
                cwd: projectPath
            })
            return true
        } catch (error) {
            return false
        }
    },

    async publishBranch(projectPath: string, branch: string) {
        try {
            const { stdout } = await execAsync(`git push --set-upstream origin ${branch}`, {
                cwd: projectPath
            })
            return stdout
        } catch (error: any) {
            if (error.stderr.includes("couldn't find remote ref")) {
                try {
                    await execAsync(`git push -u origin ${branch}`, {
                        cwd: projectPath
                    })
                    return 'Branch created and published successfully'
                } catch (pushError: any) {
                    throw new Error(pushError.stderr || 'Failed to publish branch')
                }
            }
            throw new Error(error.stderr || 'Failed to publish branch')
        }
    },

    isValidRemoteUrl(url: string): boolean {
        const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/
        const sshRegex = /^git@[\w.-]+:[\w.-]+\/[\w.-]+\.git$/
        return urlRegex.test(url) || sshRegex.test(url)
    },

    async getChangesCount(projectPath: string) {
        try {
            const { stdout: status } = await execAsync(
                'git rev-list --left-right --count origin/HEAD...HEAD',
                {
                    cwd: projectPath.toString()
                }
            )

            const [behind, ahead] = status.split('\t').map(Number)

            const { stdout: changes } = await execAsync('git status --porcelain', {
                cwd: projectPath
            })
            const modified = changes.split('\n').filter(Boolean).length
            return {
                ahead,
                behind,
                modified
            }
        } catch (error) {
            console.error('Error getting changes count:', error)
            throw error
        }
    },

    async sync(projectPath: string, branch: string) {
        const hasRemote = await this.isRemoteConfigured(projectPath)
        if (!hasRemote) {
            throw new Error('NO_REMOTE_CONFIGURED')
        }

        try {
            await execAsync('git push --dry-run origin HEAD', {
                cwd: projectPath,
                timeout: 5000
            })
        } catch (error: any) {
            if (error.stderr?.includes('Permission denied') || error.stderr?.includes('403')) {
                throw new Error('PERMISSION_DENIED')
            }
            if (error.stderr?.includes('does not appear to be a git repository')) {
                throw new Error('NOT_GIT_REPOSITORY')
            }
            throw error
        }

        const remoteBranchExists = await this.isRemoteBranchExists(projectPath, branch)
        if (!remoteBranchExists) {
            await this.publishBranch(projectPath, branch)
        } else {
            await this.pull(projectPath, branch)
            await this.push(projectPath, branch)
        }

        return true
    },

    async addRemote(projectPath: string, remoteUrl: string) {
        if (!this.isValidRemoteUrl(remoteUrl)) {
            throw new Error('INVALID_REMOTE_URL')
        }

        try {
            const existingRemotes = await execAsync(`git remote`, {
                cwd: projectPath
            })
            if (existingRemotes.stdout.trim().split('\n').includes('origin')) {
                return false
            }

            try {
                await execAsync(`git ls-remote --get-url ${remoteUrl}`, {
                    cwd: projectPath,
                    timeout: 5000
                })
            } catch (accessError: any) {
                if (
                    accessError.stderr?.includes('Permission denied') ||
                    accessError.stderr?.includes('403')
                ) {
                    throw new Error('PERMISSION_DENIED')
                }
                throw accessError
            }

            await execAsync(`git remote add origin ${remoteUrl}`, {
                cwd: projectPath
            })
            return true
        } catch (error: any) {
            if (error.message === 'PERMISSION_DENIED') {
                throw error
            }
            throw new Error(error.stderr || 'Failed to add remote url')
        }
    },
    async getRemoteUrl(projectPath: string): Promise<string | null> {
        try {
            const { stdout } = await execAsync('git remote get-url origin', {
                cwd: projectPath
            })
            return stdout.trim()
        } catch {
            return null
        }
    },
    async isGitRepository(path: string): Promise<boolean> {
        try {
            await execAsync('git rev-parse --git-dir', { cwd: path })
            return true
        } catch {
            return false
        }
    },
    async hasCommits(path: string): Promise<boolean> {
        try {
            await execAsync('git rev-parse HEAD', { cwd: path })
            return true
        } catch {
            return false
        }
    },
    async listCommits(
        projectPath: string,
        branch: string = 'HEAD',
        limit: number = 50
    ): Promise<Commit[]> {
        try {
            const isRepo = await this.isGitRepository(projectPath)
            if (!isRepo) return []

            const hasAnyCommits = await this.hasCommits(projectPath)
            if (!hasAnyCommits) return []
            const command =
                process.platform === 'win32'
                    ? `git log ${branch} -n ${limit} --pretty=format:"%h - %an, %ar : %s"`
                    : `git log ${branch} -n ${limit} --pretty=format:'%h - %an, %ar : %s'`

            const { stdout } = await execAsync(command, {
                cwd: projectPath,
                env: { ...process.env, LANG: 'en_US.UTF-8' }
            })

            return stdout
                .split('\n')
                .filter(Boolean)
                .map((line) => {
                    const match = line.match(/^(.*?) - (.*?), (.*?) : (.*)$/)
                    if (!match) return null

                    const [_, hash, author, date, message] = match
                    return {
                        hash,
                        author,
                        date,
                        message
                    }
                })
                .filter(Boolean) as Commit[]
        } catch (error: any) {
            console.error('Error listing commits:', error)
            throw new Error(error.stderr || 'Failed to list commits')
        }
    },

    async checkGitRemotes(
        projects: { data?: any[] } | any[],
        githubRepos: Repository[]
    ): Promise<Record<number, string>> {
        try {
            const list = Array.isArray(projects) ? projects : (projects?.data ?? [])
            const results: Record<number, string> = {}

            for (const project of list) {
                const projectPath = project?.path
                if (!projectPath) continue

                const remoteUrl = await this.getRemoteUrl(projectPath)
                if (!remoteUrl) continue

                const remoteNorm = normalizeGitUrl(remoteUrl)
                const matchingRepo = githubRepos.find((repo) => {
                    const candidates = [repo.clone_url, repo.html_url, (repo as any).ssh_url]
                    return candidates.some(
                        (candidate) =>
                            typeof candidate === 'string' &&
                            candidate.length > 0 &&
                            normalizeGitUrl(candidate) === remoteNorm
                    )
                })

                if (matchingRepo) {
                    results[matchingRepo.id] = projectPath
                }
            }

            return results
        } catch (error) {
            console.error('Error checking git remotes:', error)
            return {}
        }
    },

    /**
     * Read the contents of a file as it existed at a given commit/ref.
     * Returns `null` when the file did not exist at that ref (new file —
     * a "modified" badge against HEAD~1 means the previous commit had no
     * such path) or when the ref itself does not resolve (e.g. the very
     * first commit has no HEAD~1).
     */
    async showFileAtCommit(
        projectPath: string,
        ref: string,
        relPath: string
    ): Promise<{ content: string | null }> {
        try {
            const { stdout } = await execAsync(`git show ${ref}:${relPath}`, {
                cwd: projectPath,
                maxBuffer: 10 * 1024 * 1024
            })
            return { content: stdout }
        } catch {
            return { content: null }
        }
    },

    async getContributors(projectPath: string): Promise<{ name: string; email: string }[]> {
        try {
            const { stdout } = await execAsync('git shortlog -sne --all', {
                cwd: projectPath
            })

            const contributors = stdout
                .split('\n')
                .filter((line) => line.trim().length > 0)
                .map((line) => {
                    const match = line.trim().match(/^\d+\s+(.+)\s+<(.+)>$/)
                    return match ? { name: match[1], email: match[2] } : null
                })
                .filter(Boolean) as { name: string; email: string }[]

            // Filter distinct emails (case-insensitive)
            const uniqueContributors = contributors.reduce<{ name: string; email: string }[]>(
                (acc, contributor) => {
                    if (
                        !acc.some((c) => c.email.toLowerCase() === contributor.email.toLowerCase())
                    ) {
                        acc.push(contributor)
                    }
                    return acc
                },
                []
            )

            return uniqueContributors
        } catch (error: any) {
            throw new Error(error.stderr || 'Failed to get contributors')
        }
    }
}
