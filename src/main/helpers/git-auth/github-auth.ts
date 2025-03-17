import { GitAuth } from './git-auth';
import { TokenService } from '../../services/token-service';
import { GitHubService } from '../../services/github-service';

const githubConfig = {
  clientId: process.env.GITHUB_CLIENT_ID || '',
  clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
  scopes: ['repo', 'read:user', 'read:org'],
  authUrl: 'https://github.com/login/oauth/authorize',
  tokenUrl: 'https://github.com/login/oauth/access_token',
  provider: 'github' as const
};

export const githubAuth = new GitAuth(githubConfig, TokenService, GitHubService);