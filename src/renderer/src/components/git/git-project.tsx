import { useEffect, useState } from 'react';
import { Repository } from 'src/main/types';
import useToast from '../useToast';
import { ProjectNameDialog } from './dialog-project-name';
import { CardGitProject } from './card-git-project';
import { EmptyState } from '../empty-state';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { navigateToNextPage, setBasePath, setConfig } from '@renderer/redux/thunks';
import useGitAuth from '@renderer/hooks/useGitAuth';
import { LoadingSpinner } from '../loading-spinner';
import { useGit } from '@renderer/hooks/useGit';
import { useTranslation } from 'react-i18next';

export default function GitProject() {
    const { t } = useTranslation();
    const { showErrorToast, showSuccessToast } = useToast();
    const [cloningRepoId, setCloningRepoId] = useState<number | null>(null);
    const [clonedRepos, setClonedRepos] = useState<number[]>([]);
    const [projectPaths, setProjectPaths] = useState<Record<number, string>>({});
    
    const navigate = useNavigate()
    const dispatch: any = useDispatch()

    const [nameDialog, setNameDialog] = useState({
        isOpen: false,
        defaultName: '',
        onConfirm: (_name: string) => {},
    });

    const { repositoriesGitHub, isLoading,  } = useGitAuth();
    const {checkLocalProjects} = useGit();

    useEffect(() => {
        window.electron.ipcRenderer.on('clone-progress', async (_event, data) => {
            if (data.status === 'success' || data.status === 'error') {
                setCloningRepoId(null);
            } 
            if (data.status === 'success') {
                showSuccessToast(t('repositoryClonedSuccessfully', { path: data.path }));
                try {
                    await window.repo.project.save({
                        name: data.config.name,
                        framework: data.config.type,
                        config: data.config.config,
                        path: data.path
                    });

                    await window.electron.ipcRenderer.invoke('add-cloned-repo', cloningRepoId);
                    await window.electron.ipcRenderer.invoke('set-project-path', {
                        repoId: cloningRepoId,
                        path: data.path
                    });

                    // Update local states
                    setClonedRepos(prevRepos => [...prevRepos, cloningRepoId!]);
                    setProjectPaths(prevPaths => ({
                        ...prevPaths,
                        [cloningRepoId!]: data.path
                    }));
                    
                    dispatch(setBasePath(data.path));
                    dispatch(setConfig(data.config));
                    navigateToNextPage(navigate, data.config);
                } catch (error) {
                    showErrorToast(t('failedOpenProjectAfterCloning'));
                    console.error(t('errorOpeningProject'), error);
                }
            } else if (data.status === 'error') {
                showErrorToast(t('failedCloneRepository', { message: data.message }));
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
    }, [dispatch, navigate, showSuccessToast, showErrorToast, t]);

    const handleClone = async (repo: Repository) => {
        setCloningRepoId(repo.id);
        try {
            await window.electron.ipcRenderer.invoke(
                'clone-repository',
                repo.clone_url
            );
        } catch (error) {
            setCloningRepoId(null);
        }
    };

    useEffect(() => {
        const loadClonedReposData = async () => {
            try {
                const [cloned, paths] = await Promise.all([
                    window.electron.ipcRenderer.invoke('get-cloned-repos'),
                    window.electron.ipcRenderer.invoke('get-project-paths')
                ]);
                setClonedRepos(cloned);
                setProjectPaths(paths);
            } catch (error) {
                console.error(t('errorLoadingClonedReposData'), error);
                showErrorToast(t('failedLoadRepositoryData'));
            }
        };
        
        loadClonedReposData();
    }, [t]);

    useEffect(() => {
        const checkLocalProjectsExist = async () => {
            if (!repositoriesGitHub) return;
            
            const results = await checkLocalProjects(repositoriesGitHub);
            
            setClonedRepos(prev => [...prev, ...Object.keys(results).map(Number)]);
            setProjectPaths(prev => ({ ...prev, ...results }));
        };
    
        checkLocalProjectsExist();
    }, [repositoriesGitHub, checkLocalProjects]);

    return (
        <div>
            {isLoading ? (
                <LoadingSpinner />
            ) : (
                repositoriesGitHub?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {repositoriesGitHub?.map((repo) => (
                            <CardGitProject
                                repo={repo}
                                key={repo.id}
                                handleClone={handleClone}
                                clonedRepos={clonedRepos}
                                projectPaths={projectPaths}
                                isCloning={cloningRepoId === repo.id}
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        message={t('noProjectsFound')}
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