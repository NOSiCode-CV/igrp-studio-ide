import { GitStore } from '../../services/git-store'
import { GitHubService } from '../../services/github-service'
import { GitAuth } from './git-auth'

const githubConfig = {
    clientId: process.env.VITE_GITHUB_CLIENT_ID || '',
    clientSecret: process.env.VITE_GITHUB_CLIENT_SECRET || '',
    scopes: ['repo', 'read:user', 'read:org'],
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    provider: 'github' as const
}

export const githubAuth = new GitAuth(githubConfig, GitStore, GitHubService)
