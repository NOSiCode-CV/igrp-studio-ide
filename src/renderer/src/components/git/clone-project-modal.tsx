import { useState } from 'react';
import { Button } from '@renderer/components/ui/button';
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

interface CloneProjectModalProps {
    handleCloneProject: (
        url: string,
        auth: {
            type: string;
            username?: string;
            password?: string;
            token?: string;
        }
    ) => void;
    open: boolean;
    setOpen: (open: boolean) => void;
}

export function CloneProjectModal({
    handleCloneProject,
    open,
    setOpen,
}: CloneProjectModalProps) {
    const { t } = useTranslation();
    const [projectUrl, setProjectUrl] = useState('');
    const [authType, setAuthType] = useState('none');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [token, setToken] = useState('');

    const onClone = () => {
        const auth = {
            type: authType,
            ...(authType === 'basic' && { username, password }),
            ...(authType === 'token' && { token }),
        };
        handleCloneProject(projectUrl, auth);

        setOpen(false);
        resetForm();
    };

    const resetForm = () => {
        setProjectUrl('');
        setAuthType('none');
        setUsername('');
        setPassword('');
        setToken('');
    };

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
                                Repository URL
                            </TabsTrigger>
                            <TabsTrigger
                                value="search"
                                className="flex items-center gap-2"
                            >
                                <GitFork className="h-4 w-4" />
                                Search Repositories
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
                            <Button onClick={onClone} className="w-full">
                                <GitFork className="w-4 h-4 mr-2" />
                                {t('cloneProject')}
                            </Button>
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
