import { GitAuth } from './git-auth';
import { GitStore } from '../../services/git-store';
import { GitLabService } from '../../services/gitlab-service';

const gitlabConfig = {
  clientId: process.env.GITLAB_CLIENT_ID || '7a0b38edcf3d7aae9b491432bbc88aa0a2392c0dfaa19805cf826d3d476509c1',
  clientSecret: process.env.GITLAB_CLIENT_SECRET || 'gloas-9f42545e2609a93e88b815956deaa4dfecf4c76a6978c6b8ed2b48a492ed66ef',
  scopes: ['api', 'read_user', 'read_repository'],
  authUrl: 'https://gitlab.com/oauth/authorize',
  tokenUrl: 'https://gitlab.com/oauth/token',
  provider: 'gitlab' as const
};

export const gitlabAuth = new GitAuth(gitlabConfig, GitStore, GitLabService);