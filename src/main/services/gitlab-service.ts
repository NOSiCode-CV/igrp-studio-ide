import { Gitlab } from '@gitbeaker/node';
import { TokenService } from './token-service';
import { BrowserWindow } from 'electron';

let gitlab: any = null;

export const GitLabService = {
  async initializeServices() {
    try {
      const token = TokenService.getToken('gitlab');
      
      if (token) {
        await this.initialize(token);
        return true;
      }
    } catch (error) {
      console.error('Failed to initialize GitLab service:', error);
    }
    return false;
  },

  async initialize(token: string) {
    try {
      gitlab = new Gitlab({
        oauthToken: token,
        host: 'https://gitlab.com'
      });

      TokenService.setToken('gitlab', token);
      
      return true;
    } catch (error) {
      console.error('Failed to initialize GitLab client:', error);
      gitlab = null;
      throw error;
    }
  },

  async getUserInfo() {
    if (!gitlab) throw new Error('GitLab client not initialized');
    return gitlab.Users.current();
  },

  async listIGRPStudioRepositoriesGitlab(_window: BrowserWindow) {
    try {
      if (!gitlab) throw new Error('GitLab client not initialized');
      
      const igrpRepos: any = [];
      const batchSize = 10;
  
      const repos = await gitlab.Projects.all({
        membership: true,
        orderBy: 'last_activity_at',
        sort: 'desc',
        perPage: 100
      });
  
      for (let i = 0; i < repos.length; i += batchSize) {
        const batch = repos.slice(i, i + batchSize);
        
        const promises = batch.map(async (repo) => {
          try {
            await gitlab.RepositoryFiles.show(
              repo.id,
              '.igrpstudio',
              'main'
            ).catch(async () => {
              return gitlab.RepositoryFiles.show(
                repo.id,
                '.igrpstudio',
                'master'
              );
            });
  
            return {
              id: repo.id,
              name: repo.name,
              full_name: repo.path_with_namespace,
              description: repo.description,
              private: repo.visibility === 'private',
              html_url: repo.web_url,
              clone_url: repo.http_url_to_repo,
              updated_at: repo.last_activity_at,
              owner: repo.namespace.path
            };
          } catch (error) {
            if ((error as any).response?.status !== 404) {
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
      console.error('Error listing GitLab repositories:', error);
      throw error;
    }
  }
};