'use client';

import {
    GitFork,
    ExternalLink,
    FolderOpen,
    Calendar,
    Lock,
    AlertCircle,
} from 'lucide-react';
import { Button } from '@renderer/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@renderer/components/ui/tooltip';
import { Repository, RepositoryPlatform } from 'src/main/types';
import useToast from '@renderer/hooks/useToast';
import { PlatformIcon } from './platform-icon';
import { useTranslation } from 'react-i18next';
import { useWorkspace } from '@renderer/hooks/use-workspace';

type ListGitProjectProps = {
    repo: Repository;
    handleClone: (repo: Repository) => void;
    clonedRepos: number[];
    projectPaths: Record<number, string>;
    isCloning: boolean;
};

export function ListGitProject({
    repo,
    handleClone,
    clonedRepos,
    projectPaths,
    isCloning,
}: ListGitProjectProps) {
    const { showErrorToast } = useToast();

    const isCloned = clonedRepos.includes(repo.id);
    const projectPath = projectPaths[repo.id];

    const { t } = useTranslation();
    const {
        actions: { saveOrOpenProject },
    } = useWorkspace();

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
        <TooltipProvider>
            <div className="flex items-center justify-between py-3 px-4 border-b hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center gap-2">
                        <PlatformIcon
                            platform={repo.platform as RepositoryPlatform}
                            className="h-5 w-5 text-gray-500 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0 max-w-70">
                            <div className="flex items-center gap-2">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <h3 className="font-medium text-base truncate">
                                            {repo.full_name}
                                        </h3>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        {' '}
                                        {repo.full_name}
                                    </TooltipContent>
                                </Tooltip>
                                {repo.private && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span>
                                                <Lock className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Private repository</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                            </div>
                            <p className="text-sm text-gray-600 truncate">
                                {repo.description || (
                                    <span className="flex items-center gap-1 text-gray-400 italic">
                                        <AlertCircle className="h-3 w-3" /> No
                                        description provided
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                {repo.updated_at && (
                    <div className="flex items-center gap-1 text-sm text-gray-500 mr-4 flex-shrink-0">
                        <Calendar className="h-4 w-4" />
                        <span>
                            {new Date(repo.updated_at).toLocaleDateString()}
                        </span>
                    </div>
                )}

                <div className="flex items-center gap-2 flex-shrink-0">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => window.open(repo.html_url)}
                            >
                                <ExternalLink className="h-4 w-4" />
                                <span className="sr-only">View</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>View repository</p>
                        </TooltipContent>
                    </Tooltip>

                    {isCloned ? (
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={handleOpen}
                        >
                            <FolderOpen className="h-4 w-4 mr-2" />
                            Open
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleClone(repo)}
                            disabled={isCloning}
                        >
                            <GitFork className="h-4 w-4 mr-2" />
                            {isCloning ? 'Cloning...' : 'Clone'}
                        </Button>
                    )}
                </div>
            </div>
        </TooltipProvider>
    );
}
