import { useTranslation } from 'react-i18next';
import { Button } from '@renderer/components/ui/button';
import { FolderOpen, GitFork } from 'lucide-react';
import { IGRPPageHeader } from '@igrp/igrp-framework-react-design-system';
import useToast from '@renderer/components/useToast';
import { IOpenProject } from 'src/main/types';
import { ProjectWizard } from '@renderer/pages/project';
import { CloneProjectModal } from '@renderer/components/git/clone-project-modal';
import { useWorkspace } from '@renderer/hooks/use-workspace';

const WelcomeHeader = () => {
    const { t } = useTranslation();
    const { showErrorToast } = useToast();
    const {
        actions: { saveOrOpenProject },
    } = useWorkspace();

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

        saveOrOpenProject(config);
    };

    const handleCloneProject = async (url: string): Promise<void> => {
        try {
            await window.electron.ipcRenderer.invoke('clone-repository', url);
        } catch (error) {
            console.error('Error cloning repository:', error);
            showErrorToast(t('cloneProjectError'));
        }
    };

    return (
        <IGRPPageHeader title={t('welcome')} variant={'h3'}>
            <div className="flex justify-end space-x-3">
                <ProjectWizard />

                <CloneProjectModal handleCloneProject={handleCloneProject}>
                    <Button variant="outline">
                        <GitFork className="w-4 h-4 mr-2" />
                        {t('cloneProject')}
                    </Button>
                </CloneProjectModal>

                <Button variant="outline" onClick={onHandleOpenProjectClick}>
                    <FolderOpen className="w-4 h-4 mr-2" />
                    {t('openProject')}
                </Button>
            </div>
        </IGRPPageHeader>
    );
};

export default WelcomeHeader;
