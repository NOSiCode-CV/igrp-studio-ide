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
    DialogTrigger,
} from '@renderer/components/ui/dialog';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@renderer/components/ui/tabs';
import { GitFork, Key, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
    children: React.ReactNode;
}

export function CloneProjectModal({
    handleCloneProject,
    children,
}: CloneProjectModalProps) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
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
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-background text-foreground">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">
                        {t('cloneProject')}
                    </DialogTitle>
                    <DialogDescription />
                </DialogHeader>
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
                                placeholder={t('repositoryUrlPlaceholder')}
                                value={projectUrl}
                                onChange={(e) => setProjectUrl(e.target.value)}
                                className="bg-background text-foreground placeholder-muted-foreground"
                            />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label className="text-muted-foreground">
                            {t('authentication')}
                        </Label>
                        <Tabs value={authType} onValueChange={setAuthType}>
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="none">{t('none')}</TabsTrigger>
                                <TabsTrigger value="basic">{t('basic')}</TabsTrigger>
                                <TabsTrigger value="token">{t('token')}</TabsTrigger>
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
                                                placeholder={t('usernamePlaceholder')}
                                                value={username}
                                                onChange={(e) =>
                                                    setUsername(e.target.value)
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
                                                placeholder={t('passwordPlaceholder')}
                                                value={password}
                                                onChange={(e) =>
                                                    setPassword(e.target.value)
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
                                            placeholder={t('tokenPlaceholder')}
                                            value={token}
                                            onChange={(e) =>
                                                setToken(e.target.value)
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
            </DialogContent>
        </Dialog>
    );
}