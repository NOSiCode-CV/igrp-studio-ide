import { Button } from '@renderer/components/ui/button';
import useGithubAuth from '@renderer/hooks/use-git-auth';
import { Github, Gitlab, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ReactNode, useEffect, useState } from 'react';
import { Input } from '@renderer/components/ui/input';
import { Label } from '@renderer/components/ui/label';
import useToast from '@renderer/hooks/useToast';
import { nanoid } from '@reduxjs/toolkit';

interface GitProviderConfig {
    id: string;
    name: string;
    baseUrl: string;
    clientId: string;
    clientSecret: string;
    active: boolean;
    isDefault?: boolean;
}

const DEFAULT_PROVIDERS: GitProviderConfig[] = [
    /*  {
        id: 'gitlab_nosi',
        name: 'GitLab NOSi',
        baseUrl: import.meta.env.VITE_GITLAB_BASE_URL,
        clientId: import.meta.env.VITE_GITLAB_CLIENT_ID,
        clientSecret: import.meta.env.VITE_GITLAB_CLIENT_SECRET,
        active: false,
        isDefault: true,
    }, */
];

// Componente para o formulário de configuração GitLab
function GitLabConfigForm({
    config,
    onSave,
}: {
    config: GitProviderConfig;
    onSave: (config: GitProviderConfig) => void;
}) {
    const [name, setName] = useState(config.name);
    const [baseUrl, setBaseUrl] = useState(config.baseUrl);
    const [clientId, setClientId] = useState(config.clientId);
    const [clientSecret, setClientSecret] = useState(config.clientSecret);

    useEffect(() => {
        setName(config.name);
        setBaseUrl(config.baseUrl);
        setClientId(config.clientId);
        setClientSecret(config.clientSecret);
    }, [config]);

    const handleSave = () => {
        onSave({ ...config, name, baseUrl, clientId, clientSecret });
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Custom GitLab Name</Label>
                <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Custom GitLab Name"
                    className="input"
                />
            </div>
            <div className="space-y-2">
                <Label>GitLab Base URL</Label>
                <Input
                    type="text"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://gitlab.example.com"
                    className="input"
                />
            </div>
            <div className="space-y-2">
                <Label>Client ID</Label>
                <Input
                    type="text"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="input"
                />
            </div>
            <div className="space-y-2">
                <Label>Client Secret</Label>
                <Input
                    type="password"
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    className="input"
                />
            </div>
            <Button onClick={handleSave}>Save Configuration</Button>
        </div>
    );
}

interface AccountProps {
    name: string;
    icon: ReactNode;
    connected: boolean;
    action?: () => void;
}

function Account({ name, icon, connected, action }: AccountProps) {
    const { t } = useTranslation();

    const handleClick = () => {
        if (action) action();
    };

    return (
        <>
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    {icon}
                    <span>{t(name)}</span>
                </div>

                <div className="space-x-2">
                    <Button
                        variant={connected ? 'outline' : 'default'}
                        onClick={handleClick}
                    >
                        {connected ? t('disconnect') : t('connect')}
                    </Button>
                </div>
            </div>
        </>
    );
}

export function ConnectedAccountsSettings() {
    const { t } = useTranslation();
    const {
        loginGithub,
        loginGitLab,
        userGitHub,
        userGitLab,
        logoutGithub,
        logoutGitLab,
        saveGitlabConfig,
        getGitlabConfig,
    } = useGithubAuth();

    const { showSuccessToast } = useToast();

    const [isGitLabConfigVisible, setIsGitLabConfigVisible] = useState(false);

    const [providers, setProviders] = useState<GitProviderConfig[]>([
        ...DEFAULT_PROVIDERS,
    ]);

    const handleGitLabConfigSave = async (config: GitProviderConfig) => {
        const response = await saveGitlabConfig(config);
        console.log(response);
        showSuccessToast(t('configSaved'));
    };

    useEffect(() => {
        getGitlabConfig().then((config) => {
            setProviders(config || []);
            console.log(config);
        });
    }, [getGitlabConfig]);

    return (
        <div>
            <div className="pb-4">
                <h2 className="text-lg font-semibold">
                    {t('connected_accounts')}
                </h2>
                <p className="text-sm text-muted-foreground">
                    {t('connected_accounts_description')}
                </p>
            </div>
            <div className="space-y-4">
                <Account
                    name="github"
                    icon={<Github size={20} />}
                    connected={userGitHub}
                    action={userGitHub ? logoutGithub : loginGithub}
                />

                <Account
                    name={'GitLab NOSi'}
                    icon={<Gitlab size={20} />}
                    connected={userGitLab}
                    action={userGitLab ? logoutGitLab : loginGitLab}
                />

                {providers.map((provider, index) => (
                    <Account
                        key={index}
                        name={provider.name}
                        icon={<Gitlab size={20} />}
                        connected={userGitLab}
                        action={userGitLab ? logoutGitLab : loginGitLab}
                    />
                ))}

                {/* Formulário de configuração GitLab */}
                {isGitLabConfigVisible && (
                    <div className="mt-4 p-4 border rounded bg-gray-100">
                        <GitLabConfigForm
                            config={{
                                id: nanoid(),
                                name: '',
                                baseUrl: '',
                                clientId: '',
                                clientSecret: '',
                                active: false,
                                isDefault: false,
                            }}
                            onSave={(config) => handleGitLabConfigSave(config)}
                        />
                    </div>
                )}

                <div className="pt-2 hidden">
                    <Button
                        variant="outline"
                        onClick={() =>
                            setIsGitLabConfigVisible(!isGitLabConfigVisible)
                        }
                    >
                        <Plus /> Adicionar GitLab
                    </Button>
                </div>
            </div>
        </div>
    );
}
