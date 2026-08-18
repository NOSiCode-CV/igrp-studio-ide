import { GitStore } from '../../services/git-store'
import { GitLabService } from '../../services/gitlab-service'
import { GitAuth } from './git-auth'

const gitlabDefaultHost = (
    process.env.VITE_GITLAB_BASE_URL ||
    process.env.VITE_GITLAB_HOST ||
    'https://git.nosi.cv'
).replace(/\/+$/, '')

const gitlabConfig = {
    clientId: process.env.VITE_GITLAB_CLIENT_ID || '',
    clientSecret: process.env.VITE_GITLAB_CLIENT_SECRET || '',
    scopes: ['api', 'read_user', 'read_repository'],
    authUrl: `${gitlabDefaultHost}/oauth/authorize`,
    tokenUrl: `${gitlabDefaultHost}/oauth/token`,
    provider: 'gitlab' as const,
    baseUrl: gitlabDefaultHost,
    configId: 'gitlab-nosi'
}

export const gitlabAuth = new GitAuth(gitlabConfig, GitStore, GitLabService)
