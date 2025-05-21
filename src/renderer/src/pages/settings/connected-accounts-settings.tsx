import { Button } from '@renderer/components/ui/button';
import useGithubAuth from '@renderer/hooks/use-git-auth';
import { Github, Gitlab } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Input } from '@renderer/components/ui/input';
import { Label } from '@renderer/components/ui/label';

// Componente para o formulário de configuração GitLab
function GitLabConfigForm({ onSave }: { onSave: (config: any) => void }) {
    const [baseUrl, setBaseUrl] = useState(
        import.meta.env.VITE_GITLAB_BASE_URL
    );
    const [clientId, setClientId] = useState(
        import.meta.env.VITE_GITLAB_CLIENT_ID
    );
    const [clientSecret, setClientSecret] = useState(
        import.meta.env.VITE_GITLAB_CLIENT_SECRET
    );

    const handleSave = () => {
        onSave({ baseUrl, clientId, clientSecret });
    };

    return (
        <div className="space-y-4">
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
    icon: React.ReactNode;
    connected: boolean;
    action?: () => void;
    onGitLabConfigSave?: (config: any) => void; // Função para salvar a configuração
}

function Account({
    name,
    icon,
    connected,
    action,
    onGitLabConfigSave,
}: AccountProps) {
    const { t } = useTranslation();
    const [isGitLabConfigVisible, setIsGitLabConfigVisible] = useState(false); // Controla a visibilidade do formulário de configuração GitLab

    const handleClick = () => {
        if (action) action();
    };

    const handleGitLabConfigClick = () => {
        setIsGitLabConfigVisible(!isGitLabConfigVisible); // Alterna a visibilidade do formulário
    };

    return (
        <>
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    {icon}
                    <span>{t(name)}</span>
                </div>

                <div className="space-x-2">
                    {/* Exibir o botão para configuração GitLab somente se estiver conectado */}
                    {name === 'gitlab' && connected && (
                        <Button
                            variant="outline"
                            onClick={handleGitLabConfigClick} // Alterna a visibilidade do formulário de configuração GitLab
                        >
                            {t('configure')}
                        </Button>
                    )}
                    <Button
                        variant={connected ? 'outline' : 'default'}
                        onClick={handleClick}
                    >
                        {connected ? t('disconnect') : t('connect')}
                    </Button>
                </div>
            </div>
            {/* Formulário de configuração GitLab */}
            {isGitLabConfigVisible && (
                <div className="mt-4 p-4 border rounded bg-gray-100">
                    <GitLabConfigForm
                        onSave={(config) => onGitLabConfigSave?.(config)}
                    />
                </div>
            )}
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
        setGitlabConfig,
    } = useGithubAuth();

    const handleGitLabConfigSave = (config: any) => {
        // Salva as configurações do GitLab (por exemplo, em electron-store)
        setGitlabConfig(config);
    };

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
                    name="gitlab"
                    icon={<Gitlab size={20} />}
                    connected={userGitLab}
                    action={userGitLab ? logoutGitLab : loginGitLab}
                    onGitLabConfigSave={handleGitLabConfigSave} // Função para salvar as configurações do GitLab
                />
            </div>
        </div>
    );
}
