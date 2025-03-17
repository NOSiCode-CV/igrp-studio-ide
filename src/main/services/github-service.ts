import { BrowserWindow } from 'electron';
import { TokenService } from './token-service';

let octokit: any = null;

export const GitHubService = {
  
  async initializeServices() {
    try {
      const token = TokenService.getToken('github');
      
      if (token) {
        await this.initialize(token);
        return true;
      } 
    } catch (error) {
      console.error('Failed to initialize GitHub service:', error);
    }
    return false;
  },

  async initialize(token: string) {
    try {
      const { Octokit } = await import('@octokit/rest');
      octokit = new Octokit({ auth: token });
      await octokit.users.getAuthenticated();
      return true;
    } catch (error) {
      console.error('Failed to initialize GitHub client:', error);
      octokit = null;
      throw error;
    }
  },

  async getUserInfo() {
    const { data } = await octokit.users.getAuthenticated();
    return data;
  },

  async listIGRPStudioRepositoriesGithub(_window: BrowserWindow) {
    try {
      const igrpRepos: any = [];
      const batchSize = 10;

      const { data: repos } = await octokit.repos.listForAuthenticatedUser({
        sort: 'updated',
        per_page: 100,
        page: 1,
        visibility: 'all'
      });

      for (let i = 0; i < repos.length; i += batchSize) {
        const batch = repos.slice(i, i + batchSize);
        
        const promises = batch.map(async (repo) => {
          try {
            await octokit.repos.getContent({
              owner: repo.owner.login,
              repo: repo.name,
              path: '.igrpstudio'
            });

            return {
              id: repo.id,
              name: repo.name,
              full_name: repo.full_name,
              description: repo.description,
              private: repo.private,
              html_url: repo.html_url,
              clone_url: repo.clone_url,
              updated_at: repo.updated_at,
              owner: repo.owner.login
            };
          } catch (error) {
            if ((error as any).status !== 404) {
              console.log(`Error checking repo ${repo.name}:`, error);
            }
            return null;
          }
        });

        const results = await Promise.all(promises);
        igrpRepos.push(...results.filter(r => r !== null));
      }

      return igrpRepos;
    } catch (error) {
      throw error;
    }
  }
};
