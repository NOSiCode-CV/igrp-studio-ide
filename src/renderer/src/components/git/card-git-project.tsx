import { Repository } from 'src/main/types';
import { Button } from '../ui/button';
import { GitFork } from 'lucide-react';
import { Card } from '../ui/card';
import { useNavigate } from 'react-router-dom';
import useToast from '../useToast';
import { navigateToNextPage } from '@renderer/redux/thunks';
import { useTranslation } from 'react-i18next';

type CardGitProjectProps = {
    repo: Repository;
    handleClone: (repo: Repository) => void;
    clonedRepos: number[];
    projectPaths: Record<number, string>;
    isCloning: boolean;
};

export function CardGitProject({
    repo,
    handleClone,
    clonedRepos,
    projectPaths,
    isCloning,
}: CardGitProjectProps) {
    const navigate = useNavigate();
    const { showErrorToast } = useToast();
    const { t } = useTranslation();
    
    const isCloned = clonedRepos.includes(repo.id);
    const projectPath = projectPaths[repo.id];

    const handleOpen = async () => {
        if (!projectPath) {
            showErrorToast(t('projectPathNotFound'));
            return;
        }

        try {
            const { folderExists, config } = await window.electron.ipcRenderer.invoke(
                'check-project-config',
                projectPath
            );

            if (!folderExists || !config) {
                throw new Error(t('invalidProjectStructure'));
            }

            const projectData = {
                name: config.name,
                path: projectPath,
                framework: config.framework,
                config: config.config
            };

            navigateToNextPage(navigate, projectData);
        } catch (error) {
            showErrorToast(t('failedOpenProjectStructure'));
            console.error(t('failedOpenProject'), error);
        }
    };

    return (
        <Card
            key={repo.id}
            className="border rounded-lg p-4 hover:shadow-lg transition"
        >
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg">{repo.name}</h3>
                {repo.private && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {t('private')}
                    </span>
                )}
            </div>
            <p className="text-gray-600 text-sm mb-4">
                {repo.description || t('noDescription')}
            </p>
            <div className="flex justify-end space-x-2">
                <div className="mt-4 flex justify-between gap-2 items-center">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(repo.html_url)}
                    >
                        {t('view')}
                    </Button>
                    {isCloned ? (
                        <Button size="sm" variant="outline" onClick={handleOpen}>
                            {t('open')}
                        </Button>
                    ) : (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleClone(repo)}
                        disabled={isCloning}
                    >
                        <GitFork className="w-4 h-4 mr-2" />
                        {isCloning ? t('cloning') : t('clone')}
                    </Button>
                    )}
                </div>
            </div>
        </Card>
    );
}