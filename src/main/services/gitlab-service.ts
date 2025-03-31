import { Gitlab } from '@gitbeaker/node';
import { GitStore } from './git-store';
import { BrowserWindow } from 'electron';

let gitlab: any = null;

export const GitLabService = {
  async initializeServices() {
    try {
      const token = GitStore.getToken('gitlab');
      
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

      GitStore.setToken('gitlab', token);
      
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
            const branches = await gitlab.Branches.all(repo.id, { perPage: 5 })
              .catch(err => {
                console.log(`Error fetching branches for ${repo.name}:`, err.description || err.message);
                return [];
              });
            
            if (branches.length === 0) {
              console.log(`Repository ${repo.name} has no branches or is empty.`);
              return null;
            }
            
            const defaultBranch = repo.default_branch || 'main';
            
            const tree = await gitlab.Repositories.tree(repo.id, {
              path: '/',
              ref: defaultBranch
            }).catch(async err => {
              if (defaultBranch !== 'master') {
                return gitlab.Repositories.tree(repo.id, {
                  path: '/',
                  ref: 'master'
                }).catch(() => {
                  console.log(`Error fetching repository tree for ${repo.name}:`, err.description || err.message);
                  return [];
                });
              }
              return [];
            });
            
            // Check if .igrpstudio directory exists in the tree
            const hasIgrpStudioDir = tree.some(item => 
              item.name === '.igrpstudio' && item.type === 'tree'
            );
            
            if (hasIgrpStudioDir) {
              return {
                id: repo.id,
                name: repo.name,
                full_name: repo.path_with_namespace,
                description: repo.description,
                private: repo.visibility === 'private',
                html_url: repo.web_url,
                clone_url: repo.http_url_to_repo,
                updated_at: repo.last_activity_at,
                owner: repo.namespace.path,
                default_branch: defaultBranch
              };
            }
            
            return null;
          } catch (error: any) {
            console.log(`Error checking repo gitlab ${repo.name}:`, error.description || error.message);
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