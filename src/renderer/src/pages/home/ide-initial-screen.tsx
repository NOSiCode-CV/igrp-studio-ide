import { useTranslation } from 'react-i18next';
import { Button } from '@renderer/components/ui/button';
import { FolderOpen, GitFork } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import useToast from '@renderer/components/useToast';
import {
    navigateToNextPage,
    setBasePath,
    setConfig,
} from '@renderer/redux/thunks';
import RecentsProjects from './components/recents-projects';
import { PageHeader } from '@igrp/igrp-design-system';
import { ProjectWizard } from '../project';
import { IOpenProject } from 'src/main/types';
import UserDialog from '@renderer/components/user-dialog';
import { RootState } from '@renderer/redux';
import { useEffect } from 'react';
import { setRepositories, setUser } from '@renderer/redux/git/reducer';

const IDEInitialScreen = (): JSX.Element => {
    const { t } = useTranslation();

    const navigate = useNavigate();
    const { isInitialized } = useSelector((state: RootState) => state.git);
    const dispatch: any = useDispatch();
    const { user } = useSelector((state: RootState) => state.git);

    const { showErrorToast } = useToast();

    const onHandleOpenProjectClick = async (): Promise<void> => {
        const result: IOpenProject = await window.api.openDirectory('');

        const { canceled, basePath, config, folderExists } = result;

        if (canceled || !basePath || !config) {
            return; // User canceled the directory selection
        }

        if (!folderExists || !config.framework) {
            showErrorToast(t('notFoundProject'));
            return;
        }

        dispatch(setBasePath(basePath));

        dispatch(setConfig(config));

        await window.repo.project.save(config);

        // Navigate to the next page
        navigateToNextPage(navigate, config);
    };

    const handleGitHubLogin = () => {
      window.electron.ipcRenderer.send('github-oauth');
    };

    
    useEffect(() => {
        const loadInitialData = async () => {
            if (!isInitialized) {
                try {
                    const [userInfo] = await Promise.all([
                        window.electron.ipcRenderer.invoke('github-user-info'),
                    ]);

                    dispatch(setUser(userInfo));
                } catch (error) {
                    console.log('Not authenticated yet');
                } 
            }
        };

        loadInitialData();
    }, [isInitialized, dispatch]);

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6 mb-10">
            <PageHeader title="Welcome to IGRP Studio">
                <div className="flex justify-end space-x-3 ">
                    <ProjectWizard />
                    
                    <Button
                        variant="outline"
                        onClick={onHandleOpenProjectClick}
                    >
                        <FolderOpen className="w-4 h-4 mr-2" />
                        {t('Open Project')}
                    </Button>
                    {user ? (
                      <UserDialog user={user} />
                    ) : (
                    <Button variant="outline" onClick={handleGitHubLogin}>
                      <GitFork className="w-4 h-4 mr-2" />
                      {t('Clone Project')}
                    </Button>
                    )}
                </div>
            </PageHeader>

            <RecentsProjects />
        </div>
    );
};

export default IDEInitialScreen;
