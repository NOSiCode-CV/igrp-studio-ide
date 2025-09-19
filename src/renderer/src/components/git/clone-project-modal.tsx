import { useEffect, useState } from 'react';
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
import { Input } from '@renderer/components/ui/input';
import { Label } from '@renderer/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@renderer/components/ui/dialog';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@renderer/components/ui/tabs';
import { GitFork, Key, Link, User } from 'lucide-react';
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

    const { actions: { saveOrOpenProject } } = useWorkspace()

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
                            onSuccess: async () => {
                            }
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
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[700px] lg:max-w-[650px] max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-2xl font-bold">
                        {t('cloneProject')}
                    </DialogTitle>
                    <DialogDescription />
                </DialogHeader>
                <div className="flex-1 overflow-hidden flex flex-col p-6 pt-2">
                    <Tabs
                        defaultValue="url"
                        className="w-full flex-1 flex flex-col"
                    >
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger
                                value="url"
                                className="flex items-center gap-2"
                            >
                                <Link className="h-4 w-4" />
                                {t('repositoryUrl')}
                            </TabsTrigger>
                            <TabsTrigger
                                value="search"
                                className="flex items-center gap-2"
                            >
                                <GitFork className="h-4 w-4" />
                                {t('searchRepositories')}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent
                            value="url"
                            className="space-y-4 flex-1 overflow-auto"
                        >
                            <div className="grid gap-6 py-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 grid gap-2">
                                        <Label
                                            htmlFor="project-url"
                                            className="text-muted-foreground"
                                        >
                                            {t('repositoryUrl')}
                                        </Label>
                                        <Input
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
                                    <Label className="text-muted-foreground">
                                        {t('authentication')}
                                    </Label>
                                    <Tabs
                                        value={authType}
                                        onValueChange={setAuthType}
                                    >
                                        <TabsList className="grid w-full grid-cols-3">
                                            <TabsTrigger value="none">
                                                {t('none')}
                                            </TabsTrigger>
                                            <TabsTrigger value="basic">
                                                {t('basic')}
                                            </TabsTrigger>
                                            <TabsTrigger value="token">
                                                {t('token')}
                                            </TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="basic">
                                            <div className="grid grid-cols-2 gap-4 mt-4">
                                                <div className="grid gap-2">
                                                    <Label
                                                        htmlFor="username"
                                                        className="text-muted-foreground"
                                                    >
                                                        {t('username')}
                                                    </Label>
                                                    <div className="relative">
                                                        <User className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                                        <Input
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
                                                    <Label
                                                        htmlFor="password"
                                                        className="text-muted-foreground"
                                                    >
                                                        {t('password')}
                                                    </Label>
                                                    <div className="relative">
                                                        <Key className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                                        <Input
                                                            id="password"
                                                            type="password"
                                                            placeholder={t(
                                                                'passwordPlaceholder'
                                                            )}
                                                            value={password}
                                                            onChange={(e) =>
                                                                setPassword(
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            className="pl-8 bg-background text-foreground placeholder-muted-foreground"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </TabsContent>
                                        <TabsContent value="token">
                                            <div className="grid gap-2 mt-4">
                                                <Label
                                                    htmlFor="token"
                                                    className="text-muted-foreground"
                                                >
                                                    {t('accessToken')}
                                                </Label>
                                                <div className="relative">
                                                    <Key className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        id="token"
                                                        type="password"
                                                        placeholder={t(
                                                            'tokenPlaceholder'
                                                        )}
                                                        value={token}
                                                        onChange={(e) =>
                                                            setToken(
                                                                e.target.value
                                                            )
                                                        }
                                                        className="pl-8 bg-background text-foreground placeholder-muted-foreground"
                                                    />
                                                </div>
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                </div>
                            </div>
                            <IGRPButtonPrimitive 
                                onClick={handleCloneProject} 
                                className="w-full"
                                disabled={isCloning}
                            >
                                <GitFork className="w-4 h-4 mr-2" />
                                {isCloning ? t('cloningProject') : t('cloneProject')}
                            </IGRPButtonPrimitive>
                        </TabsContent>
                        <TabsContent
                            value="search"
                            className="flex-1 overflow-hidden"
                        >
                            <RepositoryList />
                        </TabsContent>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
}
