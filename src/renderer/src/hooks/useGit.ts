import useToast from '@renderer/components/useToast';
import { useCallback } from 'react';
import { Repository } from 'src/main/types';
import { useTranslation } from 'react-i18next';

type GitErrorType =
    | 'INVALID_REMOTE_URL'
    | 'PERMISSION_DENIED'
    | 'NOT_GIT_REPOSITORY'
    | 'COMMITS_PENDING'
    | 'NO_REMOTE_CONFIGURED';

export const useGit = () => {
    const { showErrorToast, showSuccessToast } = useToast();
    const { t } = useTranslation();

    const getGitErrorType = (error: Error): GitErrorType | null => {
        const message = error.message.toUpperCase();
        return (
            (Object.keys(GIT_ERROR_MESSAGES) as GitErrorType[]).find((type) =>
                message.includes(type)
            ) || null
        );
    };

    const GIT_ERROR_MESSAGES: Record<GitErrorType, string> = {
        INVALID_REMOTE_URL: t('invalidRemoteUrl'),
        PERMISSION_DENIED: t('permissionDenied'),
        NOT_GIT_REPOSITORY: t('notGitRepository'),
        NO_REMOTE_CONFIGURED: t('noRemoteConfigured'),
        COMMITS_PENDING: t('commitsPending'),
    };

    const createGitCommit = useCallback(
        async (projectPath: string, message: string) => {
            try {
                await window.electron.ipcRenderer.invoke('create-commit', {
                    projectPath,
                    message,
                });
                showSuccessToast(t('createCommit'));
                return true;
            } catch (error) {
                if (error instanceof Error) {
                    showErrorToast(error.message || t('failedCreateCommit'));
                } else {
                    showErrorToast(t('failedCreateCommit'));
                }
                return false;
            }
        },
        [showErrorToast, showSuccessToast]
    );

    const listCommits = useCallback(
        async (projectPath: string, branch?: string) => {
            try {
                const commits = await window.electron.ipcRenderer.invoke(
                    'list-commits',
                    {
                        projectPath,
                        branch,
                    }
                );

                return commits;
            } catch (error) {
                console.error(t('failedListCommit'), error);
                throw error;
            }
        },
        []
    );

    const pullChanges = useCallback(
        async (projectPath: string) => {
            try {
                await window.electron.ipcRenderer.invoke('pull-changes', {
                    projectPath,
                });
                showSuccessToast(t('successPull'));
                return true;
            } catch (error) {
                if (error instanceof Error) {
                    showErrorToast(error.message || t('gitFailedOperation'));
                } else {
                    showErrorToast(t('gitFailedOperation'));
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
                showSuccessToast(t('gitSuccessOperation'));
                return true;
            } catch (error) {
                if (error instanceof Error) {
                    showErrorToast(error.message || t('gitFailedOperation'));
                } else {
                    showErrorToast(t('gitFailedOperation'));
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
                showSuccessToast(t('gitSuccessOperation'));
                return true;
            } catch (error: any) {
                const errorType = getGitErrorType(error);
                if (!errorType) {
                    showErrorToast(error.message || t('gitFailedOperation'));
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
            return await window.electron.ipcRenderer.invoke(
                'get-changes-count',
                projectPath
            );
        } catch (error) {
            return { ahead: 0, behind: 0, modified: 0 };
        }
    }, []);

    const checkLocalProjects = useCallback(
        async (githubRepos: Repository[]) => {
            const localProjects = await window.repo.project.findAllRecent();
            const results = await window.electron.ipcRenderer.invoke(
                'check-git-remotes',
                { projects: localProjects, githubRepos }
            );

            return results;
        },
        []
    );

    return {
        createGitCommit,
        pullChanges,
        pushChanges,
        syncChanges,
        getChangesCount,
        listCommits,
        checkLocalProjects,
    };
};
