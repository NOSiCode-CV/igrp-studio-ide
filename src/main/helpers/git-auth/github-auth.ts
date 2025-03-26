import { GitAuth } from './git-auth';
import { TokenService } from '../../services/token-service';
import { GitHubService } from '../../services/github-service';

const githubConfig = {
  clientId: process.env.MAIN_VITE_GITHUB_CLIENT_ID || 'Ov23li025TPMBGbaLfOS',
  clientSecret: process.env.MAIN_VITE_GITHUB_CLIENT_SECRET || 'e38aa4c18b6c3086d51221b7b634b35e9a2e13e1',
  scopes: ['repo', 'read:user', 'read:org'],
  authUrl: 'https://github.com/login/oauth/authorize',
  tokenUrl: 'https://github.com/login/oauth/access_token',
  provider: 'github' as const
};

export const githubAuth = new GitAuth(githubConfig, TokenService, GitHubService);