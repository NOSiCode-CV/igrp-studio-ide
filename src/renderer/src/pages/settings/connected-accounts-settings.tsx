import {
    IGRPButtonPrimitive,
    IGRPInputPrimitive,
    IGRPLabelPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import useGithubAuth from '@renderer/hooks/use-git-auth';
import { Github, Gitlab, Plus, Trash2, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ReactNode, useEffect, useState } from 'react';
import useToast from '@renderer/hooks/useToast';
import { nanoid } from '@reduxjs/toolkit';
import { GitLabProvider } from '@renderer/redux/git/reducer';

// Componente para o formulário de configuração GitLab
function GitLabConfigForm({
    config,
    onSave,
    onCancel,
}: {
    config: GitLabProvider;
    onSave: (config: GitLabProvider) => void;
    onCancel: () => void;
}): React.ReactNode {
    const { t } = useTranslation();
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

    const handleSave = (): void => {
        onSave({ ...config, name, baseUrl, clientId, clientSecret });
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <IGRPLabelPrimitive>{t('custom_gitlab_name')}</IGRPLabelPrimitive>
                <IGRPInputPrimitive
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('custom_gitlab_name_placeholder')}
                    className="input"
                />
            </div>
            <div className="space-y-2">
                <IGRPLabelPrimitive>{t('gitlab_base_url')}</IGRPLabelPrimitive>
                <IGRPInputPrimitive
                    type="text"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://gitlab.example.com"
                    className="input"
                />
            </div>
            <div className="space-y-2">
                <IGRPLabelPrimitive>{t('client_id')}</IGRPLabelPrimitive>
                <IGRPInputPrimitive
                    type="text"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="input"
                />
            </div>
            <div className="space-y-2">
                <IGRPLabelPrimitive>{t('client_secret')}</IGRPLabelPrimitive>
                <IGRPInputPrimitive
                    type="password"
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    className="input"
                />
            </div>
            <div className="flex space-x-2">
                <IGRPButtonPrimitive onClick={handleSave}>
                    {t('save_configuration')}
                </IGRPButtonPrimitive>
                <IGRPButtonPrimitive variant="outline" onClick={onCancel}>
                    {t('cancel')}
                </IGRPButtonPrimitive>
            </div>
        </div>
    );
}

interface AccountProps {
    name: string;
    icon: ReactNode;
    connected: boolean;
    isActive: boolean;
    action?: () => void;
    onActivate?: () => void;
    onDelete?: () => void;
    onEdit?: () => void;
    isDefault?: boolean;
    isConfigured?: boolean;
}

function Account({
    name,
    icon,
    connected,
    isActive,
    action,
    onActivate,
    onDelete,
    onEdit,
    isDefault,
    isConfigured,
}: AccountProps): React.ReactNode {
    const { t } = useTranslation();

    const handleClick = (): void => {
        if (action) action();
    };

    return (
        <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
                {icon}
                <div>
                    <span className="font-medium">{t(name)}</span>
                    {isDefault && (
                        <span className="ml-2 text-xs text-muted-foreground">
                            ({t('default')})
                        </span>
                    )}
                    {isActive && (
                        <span className="ml-2 text-xs text-green-600 font-medium">
                            ({t('active')})
                        </span>
                    )}
                    {isDefault && !isConfigured && (
                        <span className="ml-2 text-xs text-orange-600 font-medium">
                            ({t('needs_configuration')})
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center space-x-2">
                {!isActive && connected && (
                    <IGRPButtonPrimitive
                        variant="outline"
                        size="sm"
                        onClick={onActivate}
                    >
                        {t('activate')}
                    </IGRPButtonPrimitive>
                )}

                {!isDefault && onEdit && (
                    <IGRPButtonPrimitive
                        variant="outline"
                        size="sm"
                        onClick={onEdit}
                    >
                        <Settings size={16} />
                    </IGRPButtonPrimitive>
                )}

                {!isDefault && onDelete && (
                    <IGRPButtonPrimitive
                        variant="outline"
                        size="sm"
                        onClick={onDelete}
                    >
                        <Trash2 size={16} />
                    </IGRPButtonPrimitive>
                )}

                <IGRPButtonPrimitive
                    variant={connected ? 'outline' : 'default'}
                    onClick={handleClick}
                    disabled={isDefault && !isConfigured}
                >
                    {connected ? t('disconnect') : t('connect')}
                </IGRPButtonPrimitive>
            </div>
        </div>
    );
}

export function ConnectedAccountsSettings(): React.ReactNode {
    const { t } = useTranslation();
    const {
        getGitlabConfig,
        gitLabProviders,
        activeProviderId,
        activeProvider,
        loginGithub,
        loginGitLab,
        logoutGithub,
        logoutGitLab,
        saveGitlabConfig,
        setActiveProvider,
        handleRemoveGitLabProvider,
    } = useGithubAuth();

    const { showSuccessToast, showErrorToast } = useToast();

    const [isGitLabConfigVisible, setIsGitLabConfigVisible] = useState(false);
    const [editingProvider, setEditingProvider] =
        useState<GitLabProvider | null>(null);

    const handleGitLabConfigSave = async (config: GitLabProvider): Promise<void> => {
        const response = await saveGitlabConfig(config);
        if (response.success) {
            showSuccessToast(t('configSaved'));
            setIsGitLabConfigVisible(false);
            setEditingProvider(null);
        } else {
            showErrorToast(t('configSaveError'));
        }
    };

    const handleActivateProvider = (providerId: string): void => {
        setActiveProvider(providerId);
        showSuccessToast(t('providerActivated'));
    };

    const handleDeleteProvider = async (providerId: string) => {
        const response = await handleRemoveGitLabProvider(providerId);
        if (response.success) {
            showSuccessToast(t('providerDeleted'));
        } else {
            showErrorToast(t('providerDeleteError'));
        }
    };

    const handleEditProvider = (provider: GitLabProvider): void => {
        setEditingProvider(provider);
        setIsGitLabConfigVisible(true);
    };

    const isGithubConnected =
        activeProviderId === 'github' && !!activeProvider?.user;
    /*  const isGitLabConnected =
        activeProviderId !== 'github' && !!activeProvider?.user;
 */
    useEffect(() => {
        getGitlabConfig();
    }, []);

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
                {/* GitHub Account */}
                <Account
                    name="github"
                    icon={<Github size={20} />}
                    connected={isGithubConnected}
                    isActive={activeProviderId === 'github'}
                    action={isGithubConnected ? logoutGithub : loginGithub}
                    onActivate={() => handleActivateProvider('github')}
                />

                {/* GitLab Providers */}
                {gitLabProviders.map((provider) => (
                    <Account
                        key={provider.id}
                        name={provider.name}
                        icon={<Gitlab size={20} />}
                        connected={
                            activeProviderId === provider.id && !!provider.user
                        }
                        isActive={activeProviderId === provider.id}
                        isDefault={provider.isDefault}
                        isConfigured={provider.isConfigured}
                        action={
                            activeProviderId === provider.id && provider.user
                                ? () => logoutGitLab(provider.id)
                                : () => loginGitLab(provider.id)
                        }
                        onActivate={() => handleActivateProvider(provider.id)}
                        onEdit={() => handleEditProvider(provider)}
                        onDelete={() => handleDeleteProvider(provider.id)}
                    />
                ))}

                {/* GitLab Configuration Form */}
                {isGitLabConfigVisible && (
                    <div className="mt-4 p-4 border rounded bg-gray-50">
                        <h3 className="text-md font-medium mb-4">
                            {editingProvider
                                ? t('edit_gitlab_config')
                                : t('add_gitlab_config')}
                        </h3>
                        <GitLabConfigForm
                            config={
                                editingProvider || {
                                    id: nanoid(),
                                    name: '',
                                    baseUrl: '',
                                    clientId: '',
                                    clientSecret: '',
                                    active: false,
                                    isDefault: false,
                                }
                            }
                            onSave={handleGitLabConfigSave}
                            onCancel={() => {
                                setIsGitLabConfigVisible(false);
                                setEditingProvider(null);
                            }}
                        />
                    </div>
                )}

                {/* Add GitLab Button */}
                <div className="pt-2">
                    <IGRPButtonPrimitive
                        variant="outline"
                        onClick={() => {
                            setEditingProvider(null);
                            setIsGitLabConfigVisible(!isGitLabConfigVisible);
                        }}
                    >
                        <Plus size={16} className="mr-2" />
                        {t('add_gitlab')}
                    </IGRPButtonPrimitive>
                </div>
            </div>
        </div>
    );
}
