import { GitAuth } from './git-auth';
import { TokenService } from '../../services/token-service';
import { GitLabService } from '../../services/gitlab-service';

const gitlabConfig = {
  clientId: process.env.GITLAB_CLIENT_ID || '',
  clientSecret: process.env.GITLAB_CLIENT_SECRET || '',
  scopes: ['api', 'read_user', 'read_repository'],
  authUrl: 'https://gitlab.com/oauth/authorize',
  tokenUrl: 'https://gitlab.com/oauth/token',
  provider: 'gitlab' as const
};

export const gitlabAuth = new GitAuth(gitlabConfig, TokenService, GitLabService);