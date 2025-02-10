import { useTranslation } from 'react-i18next';
import { Button } from '@renderer/components/ui/button';
import { FolderOpen, GitFork } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
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
import { CloneProjectModal } from '../../components/git/clone-project-modal';

const IDEInitialScreen = () => {
    const { t } = useTranslation();

    const navigate = useNavigate();
    const dispatch: any = useDispatch();
    const { showErrorToast } = useToast();

    const onHandleOpenProjectClick = async (): Promise<void> => {
        const result: IOpenProject = await window.api.openDirectory('');

        const { canceled, basePath, config, folderExists } = result;

        if (canceled || !basePath || !config) {
            return;
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

    const handleCloneProject = async (
        url: string,
        auth: {
            type: string;
            username?: string;
            password?: string;
            token?: string;
        }
    ) => {
        console.log(`Cloning project: ${name} from ${url} to ${location}`);
        console.log(`Authentication type: ${auth.type}`);
        if (auth.type === 'basic') {
            console.log(`Using basic auth with username: ${auth.username}`);
        } else if (auth.type === 'token') {
            console.log('Using token authentication');
        }

        try {
            await window.electron.ipcRenderer.invoke('clone-repository', url);
        } catch (error) {}
    };
    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6 mb-10">
            <PageHeader title={t('welcome')}>
                <div className="flex justify-end space-x-3 ">
                    <ProjectWizard />

                    <CloneProjectModal handleCloneProject={handleCloneProject}>
                        <Button variant="outline">
                            <GitFork className="w-4 h-4 mr-2" />
                            Clone Project
                        </Button>
                    </CloneProjectModal>

                    <Button
                        variant="outline"
                        onClick={onHandleOpenProjectClick}
                    >
                        <FolderOpen className="w-4 h-4 mr-2" />
                        {t('openProject')}
                    </Button>
                </div>
            </PageHeader>

            <RecentsProjects />
        </div>
    );
};
export default IDEInitialScreen;
