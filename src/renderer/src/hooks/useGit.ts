import useToast from '@renderer/components/useToast';
import { useCallback } from 'react';

type GitErrorType = 
 | 'INVALID_REMOTE_URL'
 | 'PERMISSION_DENIED' 
 | 'NOT_GIT_REPOSITORY'
 | 'NO_REMOTE_CONFIGURED';

const GIT_ERROR_MESSAGES: Record<GitErrorType, string> = {
 INVALID_REMOTE_URL: 'Invalid remote URL. Please provide a valid remote URL.',
 PERMISSION_DENIED: 'Permission denied. Please check repository access.',
 NOT_GIT_REPOSITORY: 'Not a git repository. Please check repository access.',
 NO_REMOTE_CONFIGURED: 'No remote configured for this repository.',
};

const getGitErrorType = (error: Error): GitErrorType | null => {
 const message = error.message.toUpperCase();
 return (Object.keys(GIT_ERROR_MESSAGES) as GitErrorType[])
   .find(type => message.includes(type)) || null;
};

export const useGit = () => {
    const { showErrorToast, showSuccessToast } = useToast();

    const createGitCommit = useCallback(
        async (projectPath: string, message: string) => {
            try {
                await window.electron.ipcRenderer.invoke('create-commit', {
                    projectPath,
                    message,
                });
                showSuccessToast('Changes committed successfully');
                return true;
            } catch (error) {
                if (error instanceof Error) {
                    showErrorToast(error.message || 'Failed to commit changes');
                } else {
                    showErrorToast('Failed to commit changes');
                }
                return false;
            }
        },
        [showErrorToast, showSuccessToast]
    );

    const listCommits = useCallback(async (projectPath: string, branch?: string) => {
        try {
          const commits = await window.electron.ipcRenderer.invoke('list-commits', {
            projectPath,
            branch
          });

          return commits;
        } catch (error) {
          console.error('Failed to list commits:', error);
          throw error;
        }
      }, []);

    const pullChanges = useCallback(
        async (projectPath: string) => {
            try {
                await window.electron.ipcRenderer.invoke('pull-changes', {
                    projectPath,
                });
                showSuccessToast('Changes pulled successfully');
                return true;
            } catch (error) {
                if (error instanceof Error) {
                    showErrorToast(error.message || 'Failed to pull changes');
                } else {
                    showErrorToast('Failed to pull changes');
                }
                return false;
            }
        },
        [showErrorToast, showSuccessToast]
    );

    const pushChanges = useCallback(
        async (projectPath: string, branch: string) => {
            try {
                await window.electron.ipcRenderer.invoke('push-changes', {
                    projectPath,
                    branch,
                });
                showSuccessToast('Changes pushed successfully');
                return true;
            } catch (error) {
                if (error instanceof Error) {
                    showErrorToast(error.message || 'Failed to push changes');
                } else {
                    showErrorToast('Failed to push changes');
                }
                return false;
            }
        },
        [showErrorToast, showSuccessToast]
    );

    const syncChanges = useCallback(
        async (projectPath: string, branch: string) => {
            try {
                await window.electron.ipcRenderer.invoke('sync-changes', {
                    projectPath,
                    branch,
                });
                showSuccessToast('Changes synced successfully');
                return true;
            } catch (error: any) {
                const errorType = getGitErrorType(error);
                if (!errorType) {
                    showErrorToast(error.message || 'Failed to sync changes');
                    return false;
                }
                
                if (errorType === 'NO_REMOTE_CONFIGURED') {
                    error.name = errorType;
                    throw error;
                }
                showErrorToast(GIT_ERROR_MESSAGES[errorType]);
                return false;
            }
        },
        [showErrorToast, showSuccessToast]
    );

    const getChangesCount = useCallback(async (projectPath: string) => {
        try {
          return await window.electron.ipcRenderer.invoke('get-changes-count', projectPath);
        } catch (error) {
          return { ahead: 0, behind: 0, modified: 0 };
        }
    }, []);

    return {
        createGitCommit,
        pullChanges,
        pushChanges,
        syncChanges,
        getChangesCount,
        listCommits
    };
};
