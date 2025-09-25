import { useEffect, useState } from 'react';
import {
    IGRPButtonPrimitive,
    IGRPDialogContentPrimitive,
    IGRPDialogDescriptionPrimitive,
    IGRPDialogHeaderPrimitive,
    IGRPDialogPrimitive,
    IGRPDialogTitlePrimitive,
    IGRPTabsContentPrimitive,
    IGRPTabsListPrimitive,
    IGRPTabsPrimitive,
    IGRPTabsTriggerPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import {
    IGRPInputText,
    IGRPInputPassword,
} from '@igrp/igrp-framework-react-design-system';
import { IGRPLabel } from '@igrp/igrp-framework-react-design-system';
import { GitFork, Key, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { RepositoryList } from './repository-list';
import { IWorkspace } from 'src/main/types';
import useToast from '@renderer/hooks/useToast';
import { useWorkspace } from '@renderer/hooks/use-workspace';
import { getUUID } from '@renderer/utils';

interface CloneProjectModalProps {
    workspace: IWorkspace;
    open: boolean;
    setOpen: (open: boolean) => void;
}

export function CloneProjectModal({
    workspace,
    open,
    setOpen,
}: CloneProjectModalProps) {
    const { t } = useTranslation();
    const [projectUrl, setProjectUrl] = useState('');
    const [authType, setAuthType] = useState('none');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [token, setToken] = useState('');
    const [isCloning, setIsCloning] = useState(false);

    const { showErrorToast, showSuccessToast } = useToast();

    const {
        actions: { saveOrOpenProject },
    } = useWorkspace();

    /* const onClone = () => {
          const auth = {
             type: authType,
             ...(authType === 'basic' && { username, password }),
             ...(authType === 'token' && { token }),
         }; 
        handleCloneProject(projectUrl);

    }; */

    const resetForm = () => {
        setProjectUrl('');
        setAuthType('none');
        setUsername('');
        setPassword('');
        setToken('');
        setIsCloning(false);
    };

    const handleCloneProject = async (): Promise<void> => {
        // Validate required fields
        if (!projectUrl.trim()) {
            showErrorToast(t('repositoryUrlRequired'));
            return;
        }

        // Validate authentication fields based on type
        if (authType === 'basic' && (!username.trim() || !password.trim())) {
            showErrorToast(t('usernameAndPasswordRequired'));
            return;
        }

        if (authType === 'token' && !token.trim()) {
            showErrorToast(t('tokenRequired'));
            return;
        }

        const extractProjectPath = (projectUrl: string): string => {
            const match = projectUrl.match(/\/([^\/]+)\.git$/);
            return match ? match[1] : '';
        };

        const projectPath = `/projects/${extractProjectPath(projectUrl)}`;

        // Prepare authentication data
        const auth = {
            type: authType,
            ...(authType === 'basic' && { username, password }),
            ...(authType === 'token' && { token }),
        };

        setIsCloning(true);
        try {
            await window.electron.ipcRenderer.invoke(
                'clone-repository',
                projectUrl,
                `${workspace.path}${projectPath}`,
                auth
            );
        } catch (error) {
            console.error(t('errorCloningRepository'), error);
            showErrorToast(error);
        } finally {
            setIsCloning(false);
        }
    };

    useEffect(() => {
        window.electron.ipcRenderer.on(
            'clone-progress',
            async (_event: any, data: any) => {
                if (data.status === 'success') {
                    resetForm();

                    showSuccessToast(
                        t('repositoryClonedSuccessfully', { path: data.path })
                    );
                    try {
                        const { project, path } = data;
                        const { config, type } = project;

                        await saveOrOpenProject({
                            project: {
                                workspaceId: workspace.id,
                                name: config.name,
                                framework: config.type,
                                id: config.id || getUUID(),
                                type,
                                path,
                                config,
                            },
                            onSuccess: async () => {},
                        });
                    } catch (error) {
                        showErrorToast(t('failedOpenProjectAfterCloning'));
                        console.error(t('errorOpeningProject'), error);
                    }
                } else if (data.status === 'error') {
                    showErrorToast(
                        t('failedCloneRepository', { message: data.message })
                    );
                }
            }
        );

        return () => {
            window.electron.ipcRenderer.removeAllListeners('clone-progress');
            window.electron.ipcRenderer.removeAllListeners(
                'request-project-name'
            );
        };
    }, []);

    return (
        <IGRPDialogPrimitive open={open} onOpenChange={setOpen}>
            <IGRPDialogContentPrimitive className="sm:max-w-[700px] lg:max-w-[650px] max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                <IGRPDialogHeaderPrimitive className="">
                    <IGRPDialogTitlePrimitive className="">
                        {t('cloneProject')}
                    </IGRPDialogTitlePrimitive>
                    <IGRPDialogDescriptionPrimitive />
                </IGRPDialogHeaderPrimitive>
                <div className="flex-1 overflow-hidden flex flex-col">
                    <IGRPTabsPrimitive
                        defaultValue="url"
                        className="w-full flex-1 flex flex-col"
                    >
                        <IGRPTabsListPrimitive className="grid w-full grid-cols-2">
                            <IGRPTabsTriggerPrimitive value="url">
                                {t('repositoryUrl')}
                            </IGRPTabsTriggerPrimitive>
                            <IGRPTabsTriggerPrimitive value="search">
                                {t('searchRepositories')}
                            </IGRPTabsTriggerPrimitive>
                        </IGRPTabsListPrimitive>

                        <IGRPTabsContentPrimitive
                            value="url"
                            className="space-y-4 flex-1 overflow-auto"
                        >
                            <div className="grid gap-6 py-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 grid gap-2">
                                        <IGRPLabel
                                            htmlFor="project-url"
                                            className="text-muted-foreground"
                                        >
                                            {t('repositoryUrl')}
                                        </IGRPLabel>
                                        <IGRPInputText
                                            id="project-url"
                                            placeholder={t(
                                                'repositoryUrlPlaceholder'
                                            )}
                                            value={projectUrl}
                                            onChange={(e) =>
                                                setProjectUrl(e.target.value)
                                            }
                                            className="bg-background text-foreground placeholder-muted-foreground"
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <IGRPLabel className="text-muted-foreground">
                                        {t('authentication')}
                                    </IGRPLabel>
                                    <IGRPTabsPrimitive
                                        value={authType}
                                        onValueChange={setAuthType}
                                    >
                                        <IGRPTabsListPrimitive className="grid w-full grid-cols-3">
                                            <IGRPTabsTriggerPrimitive value="none">
                                                {t('none')}
                                            </IGRPTabsTriggerPrimitive>
                                            <IGRPTabsTriggerPrimitive value="basic">
                                                {t('basic')}
                                            </IGRPTabsTriggerPrimitive>
                                            <IGRPTabsTriggerPrimitive value="token">
                                                {t('token')}
                                            </IGRPTabsTriggerPrimitive>
                                        </IGRPTabsListPrimitive>

                                        <IGRPTabsContentPrimitive
                                            value="none"
                                            className="mt-4"
                                        >
                                            {/* No authentication content */}
                                        </IGRPTabsContentPrimitive>

                                        <IGRPTabsContentPrimitive
                                            value="basic"
                                            className="mt-4"
                                        >
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <IGRPLabel
                                                        htmlFor="username"
                                                        className="text-muted-foreground"
                                                    >
                                                        {t('username')}
                                                    </IGRPLabel>
                                                    <div className="relative">
                                                        <User className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                                        <IGRPInputText
                                                            id="username"
                                                            placeholder={t(
                                                                'usernamePlaceholder'
                                                            )}
                                                            value={username}
                                                            onChange={(e) =>
                                                                setUsername(
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            className="pl-8 bg-background text-foreground placeholder-muted-foreground"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid gap-2">
                                                    <IGRPLabel
                                                        htmlFor="password"
                                                        className="text-muted-foreground"
                                                    >
                                                        {t('password')}
                                                    </IGRPLabel>
                                                    <div className="relative">
                                                        <Key className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                                        <IGRPInputPassword
                                                            id="password"
                                                            name="password"
                                                            placeholder={t(
                                                                'passwordPlaceholder'
                                                            )}
                                                            value={password}
                                                            onChange={(value) =>
                                                                setPassword(
                                                                    value
                                                                )
                                                            }
                                                            className="pl-8 bg-background text-foreground placeholder-muted-foreground"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </IGRPTabsContentPrimitive>

                                        <IGRPTabsContentPrimitive
                                            value="token"
                                            className="mt-4"
                                        >
                                            <div className="grid gap-2">
                                                <IGRPLabel
                                                    htmlFor="token"
                                                    className="text-muted-foreground"
                                                >
                                                    {t('token')}
                                                </IGRPLabel>
                                                <div className="relative">
                                                    <Key className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <IGRPInputPassword
                                                        id="token"
                                                        name="token"
                                                        placeholder={t(
                                                            'tokenPlaceholder'
                                                        )}
                                                        value={token}
                                                        onChange={(value) =>
                                                            setToken(value)
                                                        }
                                                        className="pl-8 bg-background text-foreground placeholder-muted-foreground"
                                                    />
                                                </div>
                                            </div>
                                        </IGRPTabsContentPrimitive>
                                    </IGRPTabsPrimitive>
                                </div>
                            </div>
                            <IGRPButtonPrimitive
                                onClick={handleCloneProject}
                                className="w-full"
                                disabled={isCloning}
                            >
                                <GitFork className="w-4 h-4 mr-2" />
                                {isCloning
                                    ? t('cloningProject')
                                    : t('cloneProject')}
                            </IGRPButtonPrimitive>
                        </IGRPTabsContentPrimitive>

                        <IGRPTabsContentPrimitive value="search">
                            <RepositoryList />
                        </IGRPTabsContentPrimitive>
                    </IGRPTabsPrimitive>
                </div>
            </IGRPDialogContentPrimitive>
        </IGRPDialogPrimitive>
    );
}
