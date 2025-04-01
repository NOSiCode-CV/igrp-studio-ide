import { GitAuth } from './git-auth';
import { GitStore } from '../../services/git-store';
import { GitLabService } from '../../services/gitlab-service';

const gitlabConfig = {
  clientId: import.meta.env.VITE_GITLAB_CLIENT_ID || 'f6e59564a7757385e3939768b5a8e806e1e9f4415e8ef1829e127914b9b207a9',
  clientSecret: import.meta.env.VITE_GITLAB_CLIENT_SECRET || '2a59060de7c0f9355fe235865a11d289db34330581965dae17b9c64d177e28cd',
  scopes: ['api', 'read_user', 'read_repository'],
  authUrl: 'https://git.nosi.cv/oauth/authorize',
  tokenUrl: 'https://git.nosi.cv/oauth/token',
  provider: 'gitlab' as const
};

export const gitlabAuth = new GitAuth(gitlabConfig, GitStore, GitLabService);