import dotenv from 'dotenv'
import { GitStore } from '../../services/git-store'
import { GitLabService } from '../../services/gitlab-service'
import { GitAuth } from './git-auth'

// Load environment variables
dotenv.config()

const gitlabConfig = {
    clientId: process.env.VITE_GITLAB_CLIENT_ID || '',
    clientSecret: process.env.VITE_GITLAB_CLIENT_SECRET || '',
    scopes: ['api', 'read_user', 'read_repository'],
    authUrl: `${process.env.VITE_GITLAB_BASE_URL || 'https://git.nosi.cv'}/oauth/authorize`,
    tokenUrl: `${process.env.VITE_GITLAB_BASE_URL || 'https://git.nosi.cv'}/oauth/token`,
    provider: 'gitlab' as const
}

export const gitlabAuth = new GitAuth(gitlabConfig, GitStore, GitLabService)
