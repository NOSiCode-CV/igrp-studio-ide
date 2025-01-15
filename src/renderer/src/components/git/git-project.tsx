import { useEffect, useState } from 'react';
import { Repository } from 'src/main/types';
import useToast from '../useToast';
import { ProjectNameDialog } from './dialog-project-name';
import { CardGitProject } from './card-git-project';
import { ProgressDisplay } from './display-progress';
import { EmptyState } from '../empty-state';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { navigateToNextPage, setBasePath, setConfig } from '@renderer/redux/thunks';
import { RootState } from '@renderer/redux';
import { setRepositories, setUser } from '@renderer/redux/git/reducer';

export default function GitProject() {
    const { showErrorToast, showSuccessToast } = useToast();

    const [isLoading, setIsLoading] = useState(false);
    const [scanProgress, setScanProgress] = useState({ progress: 0, total: 0 });
    const [isCloning, setIsCloning] = useState(false);

    const navigate = useNavigate()
    const dispatch: any = useDispatch()

    const [nameDialog, setNameDialog] = useState({
        isOpen: false,
        defaultName: '',
        onConfirm: (name: string) => {},
    });
    
    const { repositories, isInitialized } = useSelector((state: RootState) => state.git);

    useEffect(() => {
        const loadInitialData = async () => {
            if (!isInitialized) {
                setIsLoading(true);
                try {
                    const [userInfo, repos] = await Promise.all([
                        window.electron.ipcRenderer.invoke('github-user-info'),
                        window.electron.ipcRenderer.invoke('github-repositories'),
                    ]);

                    dispatch(setUser(userInfo));
                    dispatch(setRepositories(repos as Repository[]));
                } catch (error) {
                    console.log('Not authenticated yet');
                } finally {
                    setIsLoading(false);
                }
            }
        };

        loadInitialData();
    }, [isInitialized, dispatch]);

    useEffect(() => {
        window.electron.ipcRenderer.on(
            'github-oauth-success',
            async (_event, data) => {
                setIsLoading(true);
                try {
                    await window.electron.ipcRenderer.invoke(
                        'github-initialize',
                        data.access_token
                    );

                    const [userInfo, repos] = await Promise.all([
                        window.electron.ipcRenderer.invoke('github-user-info'),
                        window.electron.ipcRenderer.invoke(
                            'github-repositories'
                        ),
                    ]);

                    setUser(userInfo);
                    setRepositories(repos as Repository[]);
                } catch (error) {
                    console.error('Error loading GitHub data:', error);
                } finally {
                    setIsLoading(false);
                }
            }
        );

        return () => {
            window.electron.ipcRenderer.removeAllListeners(
                'github-oauth-success'
            );
        };
    }, []);

    useEffect(() => {
        window.electron.ipcRenderer.on('repo-scan-progress', (_event, data) => {
            setScanProgress(data);
        });

        return () => {
            window.electron.ipcRenderer.removeAllListeners(
                'repo-scan-progress'
            );
        };
    }, []);

    useEffect(() => {
        window.electron.ipcRenderer.on('clone-progress', async (_event, data) => {
            if (data.status === 'success') {
                setIsCloning(false);
                showSuccessToast(`Repository successfully cloned to ${data.path}`);
                
                try {
                    // Save and open project using the clone data
                    await window.repo.project.save({
                        config: data.config, 
                        path: data.path,
                        framework: data.config.framework,
                        name: data.config.name
                    });
                    
                    dispatch(setBasePath(data.path));
                    dispatch(setConfig(data.config));
                    
                    // Navigate to the next page
                    navigateToNextPage(navigate, data.config);
                } catch (error) {
                    showErrorToast('Failed to open project after cloning');
                    console.error('Error opening project:', error);
                }
            } else if (data.status === 'error') {
                setIsCloning(false);
                showErrorToast(`Failed to clone repository: ${data.message}`);
            }
        });

        window.electron.ipcRenderer.on(
            'request-project-name',
            (_event, { defaultName }) => {
                setNameDialog({
                    isOpen: true,
                    defaultName,
                    onConfirm: async (name) => {
                        window.electron.ipcRenderer.send(
                            'project-name-response',
                            name
                        );
                        setNameDialog((prev) => ({ ...prev, isOpen: false }));
                    },
                });
            }
        );
    
        return () => {
            window.electron.ipcRenderer.removeAllListeners('clone-progress');
            window.electron.ipcRenderer.removeAllListeners('request-project-name');
        };
    }, [dispatch, navigate, showSuccessToast, showErrorToast]);

    const handleClone = async (repo: Repository) => {
        setIsCloning(true);
        try {
            await window.electron.ipcRenderer.invoke(
                'clone-repository',
                repo.clone_url
            );
        } catch (error) {
            setIsCloning(false);
        }
    };

    return (
        <div>
            {isLoading ? (
                <ProgressDisplay scanProgress={scanProgress} />
            ) : (
                repositories?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {repositories?.map((repo) => (
                            <CardGitProject
                                repo={repo}
                                key={repo.id}
                                handleClone={handleClone}
                                isCloning={isCloning}
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        message="No projects found in your git repository. Start by creating a new project!"
                        className="text-muted-foreground"
                    />
                )
            )}

            <ProjectNameDialog
                isOpen={nameDialog.isOpen}
                defaultName={nameDialog.defaultName}
                onClose={() =>
                    setNameDialog((prev) => ({ ...prev, isOpen: false }))
                }
                onConfirm={nameDialog.onConfirm}
            />
        </div>
    );
}
