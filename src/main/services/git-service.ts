import { exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs/promises';
import { BrowserWindow, dialog } from 'electron';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const GitService = {
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
            const { canceled, filePaths } = await dialog.showOpenDialog(
                window,
                {
                    title: 'Choose Clone Location',
                    properties: ['openDirectory', 'createDirectory'],
                    buttonLabel: 'Choose Folder',
                }
            );

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
                        const configPath = path.join(
                            targetDir,
                            '.igrpstudio',
                            'baseApp.json'
                        );
                        const config = JSON.parse(
                            await fs.readFile(configPath, 'utf8')
                        );

                        window.webContents.send('clone-progress', {
                            status: 'success',
                            message: `Successfully cloned to ${targetDir}`,
                            path: targetDir,
                            config: {
                                type: config.type,
                                name: config.appName,
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
        } catch (error) {
            console.error('Error checking out branch:', error);
            throw error;
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

    async pull(projectPath: string) {
        try {
            const { stdout } = await execAsync('git pull', {
                cwd: projectPath,
            });
            return stdout;
        } catch (error: any) {
            throw new Error(error.stderr || 'Failed to pull changes');
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

    async sync(projectPath: string, branch: string) {
        try {
            await this.pull(projectPath);
            await this.push(projectPath, branch);
            return true;
        } catch (error: any) {
            throw error;
        }
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
};
