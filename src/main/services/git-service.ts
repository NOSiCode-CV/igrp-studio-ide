import { exec } from 'child_process';
import * as path from 'path';
import { BrowserWindow, dialog } from 'electron';
import { promisify } from 'util';
import { checkAndReadBaseApi } from '../helpers';
import { Commit, Repository } from '../types';

const execAsync = promisify(exec);

export const GitService = {
    async isGitInitialized(projectPath: string) {
        try {
            await execAsync('git rev-parse --is-inside-work-tree', { cwd: projectPath });
            return true;
        } catch {
            return false;
        }
    },
    
    async initializeGit(projectPath: string) {
        try {
            await execAsync('git init', { cwd: projectPath });
            await execAsync('git add .', { cwd: projectPath });
            await execAsync('git commit -m "Initial commit"', { cwd: projectPath });
            await execAsync('git branch -M main', { cwd: projectPath });
            
            return true;
        } catch (error: any) {
            throw new Error(error.stderr || 'Failed to initialize git');
        }
    },
    async isRemoteConfigured(projectPath: string) {
        try {
            await execAsync('git remote get-url origin', { cwd: projectPath });
            return true;
        } catch {
            return false;
        }
    },
    async listBranches(projectPath: string) {
        try {
            // Lista todos os branches (locais e remotos)
            const { stdout } = await execAsync('git branch -a', {
                cwd: projectPath,
            });

            // Processa a saída para um formato mais amigável
            const branches = stdout
                .split('\n')
                .filter(Boolean)
                .map((branch) => {
                    const isActive = branch.startsWith('*');
                    const name = branch.replace('*', '').trim();
                    const isRemote = name.startsWith('remotes/origin/');
                    const cleanName = isRemote
                        ? name.replace('remotes/origin/', '')
                        : name;

                    return {
                        name: cleanName,
                        isActive,
                        isRemote,
                        fullName: name,
                    };
                });

            // Remove duplicatas (branches locais e remotos com mesmo nome)
            const uniqueBranches = branches.reduce(
                (acc: { name: string }[], current: { name: string }) => {
                    const x = acc.find((item) => item.name === current.name);
                    if (!x) {
                        return acc.concat([current]);
                    }
                    return acc;
                },
                []
            );

            return uniqueBranches;
        } catch (error) {
            console.error('Error listing branches:', error);
            throw error;
        }
    },

    async createBranch(projectPath: string, branchName: string) {
        try {
            const { stdout } = await execAsync(
                `git checkout -b ${branchName}`,
                {
                    cwd: projectPath,
                }
            );
            return stdout;
        } catch (error: any) {
            throw new Error(error.stderr || 'Failed to create branch');
        }
    },

    async cloneRepository(repoUrl: string, window: BrowserWindow) {
        try {
            const { canceled, filePaths } = await dialog.showOpenDialog(window, {
                title: 'Choose Clone Location',
                properties: ['openDirectory', 'createDirectory'],
                buttonLabel: 'Choose Folder',
            });
    
            if (canceled) {
                throw new Error('Operation cancelled');
            }
    
            const projectName = await new Promise<string>((resolve, reject) => {
                window.webContents.send('request-project-name', {
                    defaultName: repoUrl.split('/').pop()?.replace('.git', ''),
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
                message: `Starting to clone into ${targetDir}...`,
            });
    
            return new Promise((resolve, reject) => {
                exec(`git clone ${repoUrl} "${targetDir}"`, async (error) => {
                    if (error) {
                        window.webContents.send('clone-progress', {
                            status: 'error',
                            message: `Failed to clone: ${error.message}`,
                        });
                        reject(error);
                        return;
                    }
    
                    try {
                        // Usa a nova função checkAndReadBaseApi
                        const { folderExists, config } = await checkAndReadBaseApi(targetDir);
    
                        if (!folderExists || !config) {
                            throw new Error('Invalid IGRP Studio project structure');
                        }

                        window.webContents.send('clone-progress', {
                            status: 'success',
                            message: `Successfully cloned to ${targetDir}`,
                            path: targetDir,
                            config: {
                                type: config.type,
                                name: config.name,
                                framework: config.framework,
                                config: config.config
                            },
                        });
                        resolve({ path: targetDir, config });
                    } catch (configError) {
                        window.webContents.send('clone-progress', {
                            status: 'error',
                            message: `Failed to read project configuration: ${(configError as Error).message}`,
                        });
                        reject(configError);
                    }
                });
            });
        } catch (error) {
            window.webContents.send('clone-progress', {
                status: 'error',
                message: `Error: ${(error as Error).message}`,
            });
            throw error;
        }
    },

    async checkoutBranch(projectPath: string, branchName: string) {
        try {
            await execAsync(`git checkout ${branchName}`, { cwd: projectPath });
            return true;
        } catch (error: any) {
            if (error.stderr?.includes('Please commit your changes or stash')) {
                throw new Error('Commits pending. Please commit changes before syncing.');
            }
            return false;
        }
    },

    async createCommit(projectPath: string, message: string) {
        try {
            await execAsync('git add .', { cwd: projectPath });
            await execAsync(`git commit -m "${message}"`, { cwd: projectPath });

            return true;
        } catch (error: any) {
            throw new Error(error.stderr || 'Failed to create commit');
        }
    },
    
    async pull(projectPath: string, branch: string) {
        try {
            const { stdout } = await execAsync(`git pull origin ${branch}`, {
                cwd: projectPath,
            });
            return stdout;
        } catch (error: any) {
            await execAsync(`git push -u origin ${branch}`, { cwd: projectPath });
            return "Branch pushed successfully after pull failure";
        }
    },
    
    async push(projectPath: string, branch: string) {
        try {
            const { stdout } = await execAsync(`git push origin ${branch}`, {
                cwd: projectPath,
            });
            return stdout;
        } catch (error: any) {
            throw new Error(error.stderr || 'Failed to push changes');
        }
    },
    
    async isRemoteBranchExists(projectPath: string, branch: string) {
        try {
            await execAsync(`git ls-remote --heads origin ${branch}`, {
                cwd: projectPath,
            });
            return true;
        } catch (error) {
            return false;
        }
    },
    
    async publishBranch(projectPath: string, branch: string) {
        try {
            const { stdout } = await execAsync(
                `git push --set-upstream origin ${branch}`,
                { cwd: projectPath }
            );
            return stdout;
        } catch (error: any) {
            
            if (error.stderr.includes("couldn't find remote ref")) {
                try {
                    await execAsync(`git push -u origin ${branch}`, { cwd: projectPath });
                    return 'Branch created and published successfully';
                } catch (pushError: any) {
                    throw new Error(pushError.stderr || 'Failed to publish branch');
                }
            }
            throw new Error(error.stderr || 'Failed to publish branch');
        }
    },
    
    isValidRemoteUrl(url: string): boolean {
        const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
        const sshRegex = /^git@[\w.-]+:[\w.-]+\/[\w.-]+\.git$/;
        return urlRegex.test(url) || sshRegex.test(url);
    },
    
    async getChangesCount(projectPath: string) {
        try {
            const { stdout: status } = await execAsync(
                'git rev-list --left-right --count origin/HEAD...HEAD',
                {
                    cwd: projectPath.toString(),
                }
            );

            const [behind, ahead] = status.split('\t').map(Number);

            const { stdout: changes } = await execAsync(
                'git status --porcelain',
                {
                    cwd: projectPath,
                }
            );
            const modified = changes.split('\n').filter(Boolean).length;
            return {
                ahead,
                behind,
                modified,
            };
        } catch (error) {
            console.error('Error getting changes count:', error);
            throw error;
        }
    },

    async sync(projectPath: string, branch: string) {
        try {
            const hasRemote = await this.isRemoteConfigured(projectPath);
            if (!hasRemote) {
                throw new Error('NO_REMOTE_CONFIGURED');
            }
    
            try {
                await execAsync('git push --dry-run origin HEAD', { 
                    cwd: projectPath,
                    timeout: 5000 
                });
            } catch (error: any) {
                if (error.stderr?.includes('Permission denied') || error.stderr?.includes('403')) {
                    throw new Error('PERMISSION_DENIED');
                }
                if (error.stderr?.includes('does not appear to be a git repository')) {
                    throw new Error('NOT_GIT_REPOSITORY');
                }
                throw error;
            }
    
            const remoteBranchExists = await this.isRemoteBranchExists(projectPath, branch);
            if (!remoteBranchExists) {
                await this.publishBranch(projectPath, branch);
            } else {
                await this.pull(projectPath, branch);
                await this.push(projectPath, branch);
            }
            
            return true;
        } catch (error: any) {
            throw error;
        }
    },

    async addRemote(projectPath: string, remoteUrl: string) {
        if (!this.isValidRemoteUrl(remoteUrl)) {
            throw new Error('INVALID_REMOTE_URL');
        }
    
        try {
            const existingRemotes = await execAsync(`git remote`, { cwd: projectPath });
            if (existingRemotes.stdout.trim().split('\n').includes('origin')) {
                return false;
            }
    
            try {
                await execAsync(`git ls-remote --get-url ${remoteUrl}`, { 
                    cwd: projectPath,
                    timeout: 5000
                });
            } catch (accessError: any) {
                if (accessError.stderr?.includes('Permission denied') || 
                    accessError.stderr?.includes('403')) {
                    throw new Error('PERMISSION_DENIED');
                }
                throw accessError;
            }
    
            await execAsync(`git remote add origin ${remoteUrl}`, { cwd: projectPath });
            return true;
    
        } catch (error: any) {
            if (error.message === 'PERMISSION_DENIED') {
                throw error;
            }
            throw new Error(error.stderr || 'Failed to add remote url');
        }
    },
    async getRemoteUrl(projectPath: string): Promise<string | null> {
        try {
            const { stdout } = await execAsync('git remote get-url origin', { cwd: projectPath });
            return stdout.trim();
        } catch {
            return null;
        }
    },
    async isGitRepository(path: string): Promise<boolean> {
        try {
            await execAsync('git rev-parse --git-dir', { cwd: path });
            return true;
        } catch {
            return false;
        }
    },
    async hasCommits(path: string): Promise<boolean> {
        try {
            await execAsync('git rev-parse HEAD', { cwd: path });
            return true;
        } catch {
            return false;
        }
    },
    async listCommits(projectPath: string, branch: string = 'HEAD', limit: number = 50): Promise<Commit[]> {
        try {
            const isRepo = await this.isGitRepository(projectPath);
            if (!isRepo) return [];

            const hasAnyCommits = await this.hasCommits(projectPath);
            if (!hasAnyCommits) return [];
            const command = process.platform === 'win32'
                ? `git log ${branch} -n ${limit} --pretty=format:"%h - %an, %ar : %s"`
                : `git log ${branch} -n ${limit} --pretty=format:'%h - %an, %ar : %s'`;
            
            const { stdout } = await execAsync(command, { 
                cwd: projectPath,
                env: { ...process.env, LANG: 'en_US.UTF-8' }
            });
    
            return stdout
                .split('\n')
                .filter(Boolean)
                .map(line => {
                    const match = line.match(/^(.*?) - (.*?), (.*?) : (.*)$/);
                    if (!match) return null;
                    
                    const [_, hash, author, date, message] = match;
                    return {
                        hash,
                        author,
                        date,
                        message
                    };
                })
                .filter(Boolean) as Commit[];
    
        } catch (error: any) {
            console.error('Error listing commits:', error);
            throw new Error(error.stderr || 'Failed to list commits');
        }
    },

    async checkGitRemotes(projects: { data: any[] }, githubRepos: Repository[]): Promise<Record<number, string>> {
        try {
            const results = {};

            for (const project of projects.data) {
                const remoteUrl = await this.getRemoteUrl(project.path);
                if (remoteUrl) {
                    const matchingRepo = githubRepos.find(repo => 
                        repo.clone_url === remoteUrl || 
                        repo.html_url === remoteUrl
                    );

                    if (matchingRepo) {
                        results[matchingRepo.id] = project.path;
                    }
                }
            }

            return results;
        } catch (error) {
            console.error('Error checking git remotes:', error);
            return {};
        }
    }
};
