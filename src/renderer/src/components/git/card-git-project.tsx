import { Repository } from 'src/main/types';
import { IGRPButtonPrimitive, IGRPCardPrimitive } from '@igrp/igrp-framework-react-design-system';
import { GitFork } from 'lucide-react';
import useToast from '../../hooks/useToast';
import { useTranslation } from 'react-i18next';
import { useWorkspace } from '@renderer/hooks/use-workspace';

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
    const { showErrorToast } = useToast();
    const { t } = useTranslation();
    const {
        actions: { saveOrOpenProject },
    } = useWorkspace();

    const isCloned = clonedRepos.includes(repo.id);
    const projectPath = projectPaths[repo.id];

    const handleOpen = async () => {
        if (!projectPath) {
            showErrorToast(t('projectPathNotFound'));
            return;
        }

        try {
            const { folderExists, config } =
                await window.electron.ipcRenderer.invoke(
                    'check-project-config',
                    projectPath
                );

            if (!folderExists || !config) {
                throw new Error(t('invalidProjectStructure'));
            }

            const projectData = {
                ...config,
                path: projectPath,
            };

            saveOrOpenProject(projectData);
        } catch (error) {
            showErrorToast(t('failedOpenProjectStructure'));
            console.error(t('failedOpenProject'), error);
        }
    };

    return (
        <IGRPCardPrimitive
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
                    <IGRPButtonPrimitive
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(repo.html_url)}
                    >
                        {t('view')}
                    </IGRPButtonPrimitive>
                    {isCloned ? (
                        <IGRPButtonPrimitive
                            size="sm"
                            variant="outline"
                            onClick={handleOpen}
                        >
                            {t('open')}
                        </IGRPButtonPrimitive>
                    ) : (
                        <IGRPButtonPrimitive
                            size="sm"
                            variant="outline"
                            onClick={() => handleClone(repo)}
                            disabled={isCloning}
                        >
                            <GitFork className="w-4 h-4 mr-2" />
                            {isCloning ? t('cloning') : t('clone')}
                        </IGRPButtonPrimitive>
                    )}
                </div>
            </div>
        </IGRPCardPrimitive>
    );
}
