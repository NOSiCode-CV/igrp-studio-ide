import { GitAuth } from './git-auth';
import { TokenService } from '../../services/token-service';
import { GitHubService } from '../../services/github-service';

const githubConfig = {
  clientId: process.env.GITHUB_CLIENT_ID || 'Ov23lic9e0U4Ffd3kBc1',
  clientSecret: process.env.GITHUB_CLIENT_SECRET || '7e5f57551227b598027903457254c2a25b199dcd',
  scopes: ['repo', 'read:user', 'read:org'],
  authUrl: 'https://github.com/login/oauth/authorize',
  tokenUrl: 'https://github.com/login/oauth/access_token',
  provider: 'github' as const
};

export const githubAuth = new GitAuth(githubConfig, TokenService, GitHubService);