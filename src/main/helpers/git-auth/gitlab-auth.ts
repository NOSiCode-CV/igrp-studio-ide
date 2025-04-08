import { GitAuth } from './git-auth';
import { GitStore } from '../../services/git-store';
import { GitLabService } from '../../services/gitlab-service';

const gitlabConfig = {
  clientId: import.meta.env.VITE_GITLAB_CLIENT_ID,
  clientSecret: import.meta.env.VITE_GITLAB_CLIENT_SECRET,
  scopes: ['api', 'read_user', 'read_repository'],
  authUrl: 'https://git.nosi.cv/oauth/authorize',
  tokenUrl: 'https://git.nosi.cv/oauth/token',
  provider: 'gitlab' as const
};

export const gitlabAuth = new GitAuth(gitlabConfig, GitStore, GitLabService);