import { exec } from 'child_process';
import * as path from 'path';
import { promisify } from 'util';
import { BrowserWindow, dialog } from 'electron';
import { TokenService } from './token-service';

let Octokit: any = null;
let octokit: any = null;

const execAsync = promisify(exec);

export const GitHubService = {
  
  async initialize(token: string) {
    try {
      if (!Octokit) {
        Octokit = (await import('@octokit/rest')).Octokit;
      }
      octokit = new Octokit({ auth: token });
      
      // Verifica se o token é válido
      await this.getUserInfo();
      return true;
    } catch (error) {
      octokit = null;
      console.error('Failed to initialize GitHub client:', error);
      throw error;
    }
  },

  async getUserInfo() {
    if (!octokit) {
      throw new Error('GitHub client not initialized');
    }

    try {
      const { data } = await octokit.users.getAuthenticated();
      return data;
    } catch (error) {
      octokit = null;
      throw error;
    }
  },

  async listRepositories() {
    if (!octokit) {
      throw new Error('GitHub client not initialized');
    }

    try {
      const { data } = await octokit.repos.listForAuthenticatedUser({
        sort: 'updated',
        per_page: 100,
        visibility: 'all'
      });
      return data;
    } catch (error) {
      octokit = null;
      throw error;
    }
  },

  async listIGRPStudioRepositories(window: BrowserWindow ) {
    if (!octokit) {
      throw new Error('GitHub client not initialized');
    }

    try {
      const igrpRepos: any = [];
      let page = 1;
      const perPage = 100; // GitHub máximo por página
      let hasNextPage = true;

      // Interface para rastrear progresso
      const emitProgress = (progress: number, total: number) => {
        window.webContents.send('repo-scan-progress', { progress, total });
      };

      while (hasNextPage) {
        const { data: repos } = await octokit.repos.listForAuthenticatedUser({
          sort: 'updated',
          per_page: perPage,
          page,
          visibility: 'all'
        });

        // Verificação em lotes de 10 repositórios por vez
        const batchSize = 10;
        for (let i = 0; i < repos.length; i += batchSize) {
          const batch = repos.slice(i, i + batchSize);
          
          const promises = batch.map(async (repo) => {
            try {
              await octokit.repos.getContent({
                owner: repo.owner.login,
                repo: repo.name,
                path: '.igrpstudio' // Verifica diretamente a pasta
              });

              // Se não lançou erro, significa que a pasta existe
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

          // Emite progresso
          emitProgress(page * perPage + i + batchSize, repos.length);
        }

        // Verifica se tem mais páginas
        hasNextPage = repos.length === perPage;
        page++;
      }

      return igrpRepos;
    } catch (error) {
      console.error('Error listing repositories:', error);
      throw error;
    }
  },

  async initializeServices() {
    try {
      await TokenService.initialize();
      
      const savedToken = TokenService.getToken();
      if (savedToken) {
        await GitHubService.initialize(savedToken);
        console.log('GitHub service initialized with saved token');
      }
    } catch (error) {
      console.error('Error initializing services:', error);
    }
  },

  async cloneRepository(repoUrl: string, window: BrowserWindow) {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog(window, {
        title: 'Choose Clone Location',
        properties: ['openDirectory', 'createDirectory'],
        buttonLabel: 'Choose Folder'
      });

      if (canceled) {
        throw new Error('Operation cancelled');
      }

      const projectName = await new Promise<string>((resolve, reject) => {
        window.webContents.send('request-project-name', {
          defaultName: repoUrl.split('/').pop()?.replace('.git', '')
        });

        const { ipcMain } = require('electron');
        ipcMain.once('project-name-response', (_event, name) => {
          if (!name) reject(new Error('No project name provided'));
          resolve(name);
        });
      });

      const targetDir = path.join(filePaths[0], projectName);

      // Emite progresso
      window.webContents.send('clone-progress', {
        status: 'starting',
        message: `Starting to clone into ${targetDir}...`
      });

      return new Promise((resolve, reject) => {
        exec(`git clone ${repoUrl} "${targetDir}"`, (error) => {
          if (error) {
            window.webContents.send('clone-progress', {
              status: 'error',
              message: `Failed to clone: ${error.message}`
            });
            reject(error);
            return;
          }

          window.webContents.send('clone-progress', {
            status: 'success',
            message: `Successfully cloned to ${targetDir}`,
            path: targetDir
          });
          resolve(targetDir);
        });
      });
    } catch (error) {
      window.webContents.send('clone-progress', {
        status: 'error',
        message: `Error: ${(error as Error).message}`
      });
      throw error;
    }
  },

  async listBranches(projectPath: string) {
    try {
      // Lista todos os branches (locais e remotos)
      const { stdout } = await execAsync('git branch -a', { cwd: projectPath });
      
      // Processa a saída para um formato mais amigável
      const branches = stdout
        .split('\n')
        .filter(Boolean)
        .map(branch => {
          const isActive = branch.startsWith('*');
          const name = branch.replace('*', '').trim();
          const isRemote = name.startsWith('remotes/origin/');
          const cleanName = isRemote ? name.replace('remotes/origin/', '') : name;

          return {
            name: cleanName,
            isActive,
            isRemote,
            fullName: name
          };
        });

      // Remove duplicatas (branches locais e remotos com mesmo nome)
      const uniqueBranches = branches.reduce((acc: { name: string }[], current: { name: string }) => {
        const x = acc.find(item => item.name === current.name);
        if (!x) {
          return acc.concat([current]);
        }
        return acc;
      }, []);

      return uniqueBranches;
    } catch (error) {
      console.error('Error listing branches:', error);
      throw error;
    }
  },

  async checkoutBranch(projectPath: string, branchName: string) {
    try {
      await execAsync(`git checkout ${branchName}`, { cwd: projectPath });
      return true;
    } catch (error) {
      console.error('Error checking out branch:', error);
      throw error;
    }
  }
};
 
