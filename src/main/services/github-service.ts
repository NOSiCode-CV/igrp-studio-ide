import { exec } from 'child_process';
import * as path from 'path';
import { promisify } from 'util';
import { BrowserWindow, dialog } from 'electron';
import * as fs from 'fs/promises';
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

  async listIGRPStudioRepositories(window: BrowserWindow) {
    if (!octokit) {
      throw new Error('GitHub client not initialized');
    }

    try {
      const igrpRepos: any = [];
      const batchSize = 10;
      let processedCount = 0;

      // Get all repositories in one call
      const { data: repos } = await octokit.repos.listForAuthenticatedUser({
        sort: 'updated',
        per_page: 100,
        page: 1,
        visibility: 'all'
      });

      const totalRepos = repos.length;

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

        processedCount = Math.min(i + batchSize, totalRepos);
        window.webContents.send('repo-scan-progress', {
          progress: processedCount,
          total: totalRepos
        });
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

      window.webContents.send('clone-progress', {
        status: 'starting',
        message: `Starting to clone into ${targetDir}...`
      });

      return new Promise((resolve, reject) => {
        exec(`git clone ${repoUrl} "${targetDir}"`, async (error) => {
          if (error) {
            window.webContents.send('clone-progress', {
              status: 'error',
              message: `Failed to clone: ${error.message}`
            });
            reject(error);
            return;
          }

          try {
            // Read the project configuration after successful clone
            const configPath = path.join(targetDir, '.igrpstudio', 'baseApp.json');
            const config = JSON.parse(await fs.readFile(configPath, 'utf8'));

            window.webContents.send('clone-progress', {
              status: 'success',
              message: `Successfully cloned to ${targetDir}`,
              path: targetDir,
              config: config
            });
            resolve({ path: targetDir, config });
          } catch (configError) {
            window.webContents.send('clone-progress', {
              status: 'error',
              message: `Failed to read project configuration: ${(configError as Error).message}`
            });
            reject(configError);
          }
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
 
