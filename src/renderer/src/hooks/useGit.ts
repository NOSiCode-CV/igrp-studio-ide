import useToast from '@renderer/components/useToast';
import { useCallback } from 'react';

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
            } catch (error) {
                if (error instanceof Error) {
                    showErrorToast(error.message || 'Failed to sync changes');
                } else {
                    showErrorToast('Failed to sync changes');
                }
                return false;
            }
        },
        [showErrorToast, showSuccessToast]
    );

    const getChangesCount = useCallback(async (projectPath: string) => {
        try {
          return await window.electron.ipcRenderer.invoke('get-changes-count', projectPath);
        } catch (error) {
          console.error('Failed to get changes count:', error);
          return { ahead: 0, behind: 0, modified: 0 };
        }
    }, []);

    return {
        createGitCommit,
        pullChanges,
        pushChanges,
        syncChanges,
        getChangesCount
    };
};
