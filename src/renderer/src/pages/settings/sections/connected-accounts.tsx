import {
    IGRPButtonPrimitive,
    IGRPInputPrimitive,
    IGRPLabelPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { nanoid } from '@reduxjs/toolkit'
import useGithubAuth from '@renderer/hooks/use-git-auth'
import useToast from '@renderer/hooks/useToast'
import type { GitLabProvider } from '@renderer/redux/git/reducer'
import { Github, Gitlab, Plus, Settings, Trash2 } from 'lucide-react'
import { type ReactNode, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

type ProviderType = 'github' | 'gitlab'

interface ProviderConfig {
    id: string
    type: ProviderType
    name: string
    baseUrl: string
    clientId: string
    clientSecret: string
    active: boolean
    isDefault?: boolean
}

interface ProviderConfigFormProps {
    config: ProviderConfig
    onSave: (config: ProviderConfig) => void
    onCancel: () => void
}

function ProviderConfigForm({ config, onSave, onCancel }: ProviderConfigFormProps): React.ReactNode {
    const { t } = useTranslation()
    const [name, setName] = useState(config.name)
    const [baseUrl, setBaseUrl] = useState(config.baseUrl)
    const [clientId, setClientId] = useState(config.clientId)
    const [clientSecret, setClientSecret] = useState(config.clientSecret)

    useEffect(() => {
        setName(config.name)
        setBaseUrl(config.baseUrl)
        setClientId(config.clientId)
        setClientSecret(config.clientSecret)
    }, [config])

    const isGitHub = config.type === 'github'

    const handleSave = (): void => {
        onSave({ ...config, name, baseUrl, clientId, clientSecret })
    }

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <IGRPLabelPrimitive>
                    {isGitHub ? t('custom_github_name') : t('custom_gitlab_name')}
                </IGRPLabelPrimitive>
                <IGRPInputPrimitive
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={
                        isGitHub
                            ? t('custom_github_name_placeholder')
                            : t('custom_gitlab_name_placeholder')
                    }
                    className="input"
                />
            </div>
            <div className="space-y-2">
                <IGRPLabelPrimitive>
                    {isGitHub ? t('github_base_url') : t('gitlab_base_url')}
                </IGRPLabelPrimitive>
                <IGRPInputPrimitive
                    type="text"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder={
                        isGitHub ? 'https://github.example.com' : 'https://gitlab.example.com'
                    }
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
    )
}

interface AccountProps {
    name: string
    icon: ReactNode
    connected: boolean
    isActive: boolean
    action?: () => void
    onActivate?: () => void
    onDelete?: () => void
    onEdit?: () => void
    isDefault?: boolean
    isConfigured?: boolean
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
    isConfigured
}: AccountProps): React.ReactNode {
    const { t } = useTranslation()

    const handleClick = (): void => {
        if (action) action()
    }

    return (
        <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
                {icon}
                <div>
                    <span className="font-medium">{t(name)}</span>
                    {isDefault && (
                        <span className="ml-2 text-xs text-muted-foreground">({t('default')})</span>
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
                    <IGRPButtonPrimitive variant="outline" size="sm" onClick={onActivate}>
                        {t('activate')}
                    </IGRPButtonPrimitive>
                )}

                {!isDefault && onEdit && (
                    <IGRPButtonPrimitive variant="outline" size="sm" onClick={onEdit}>
                        <Settings size={16} />
                    </IGRPButtonPrimitive>
                )}

                {!isDefault && onDelete && (
                    <IGRPButtonPrimitive variant="outline" size="sm" onClick={onDelete}>
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
    )
}

export function ConnectedAccountsSettings(): React.ReactNode {
    const { t } = useTranslation()
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
        handleRemoveGitLabProvider
    } = useGithubAuth()

    const { showSuccessToast, showErrorToast } = useToast()

    const [editingConfig, setEditingConfig] = useState<ProviderConfig | null>(null)
    const [formType, setFormType] = useState<ProviderType | null>(null)
    const [githubConfigs, setGithubConfigs] = useState<ProviderConfig[]>([])

    const loadGithubConfigs = async (): Promise<void> => {
        try {
            const configs = (await window.electron.ipcRenderer.invoke(
                'git-provider:list-configs',
                'github'
            )) as ProviderConfig[]
            setGithubConfigs(configs ?? [])
        } catch (error) {
            console.error('Failed to load GitHub provider configs:', error)
        }
    }

    useEffect(() => {
        getGitlabConfig()
        loadGithubConfigs()
    }, [])

    const handleSaveConfig = async (config: ProviderConfig): Promise<void> => {
        try {
            if (config.type === 'gitlab') {
                const response = await saveGitlabConfig(config as unknown as GitLabProvider)
                if (response.success) {
                    showSuccessToast(t('configSaved'))
                    closeForm()
                } else {
                    showErrorToast(t('configSaveError'))
                }
            } else {
                await window.electron.ipcRenderer.invoke('git-provider:save-config', config)
                showSuccessToast(t('configSaved'))
                await loadGithubConfigs()
                closeForm()
            }
        } catch (error) {
            console.error('Failed to save provider config:', error)
            showErrorToast(t('configSaveError'))
        }
    }

    const handleDeleteConfig = async (
        id: string,
        type: ProviderType
    ): Promise<void> => {
        try {
            if (type === 'gitlab') {
                const response = await handleRemoveGitLabProvider(id)
                if (response.success) {
                    showSuccessToast(t('providerDeleted'))
                } else {
                    showErrorToast(t('providerDeleteError'))
                }
            } else {
                await window.electron.ipcRenderer.invoke('git-provider:remove-config', id)
                showSuccessToast(t('providerDeleted'))
                await loadGithubConfigs()
            }
        } catch (error) {
            console.error('Failed to delete provider config:', error)
            showErrorToast(t('providerDeleteError'))
        }
    }

    const handleActivateProvider = (providerId: string): void => {
        setActiveProvider(providerId)
        showSuccessToast(t('providerActivated'))
    }

    const handleEditProvider = (
        provider: GitLabProvider | ProviderConfig,
        type: ProviderType
    ): void => {
        setEditingConfig({
            id: provider.id,
            type,
            name: provider.name,
            baseUrl: provider.baseUrl,
            clientId: provider.clientId,
            clientSecret: provider.clientSecret,
            active: !!provider.active,
            isDefault: provider.isDefault
        })
        setFormType(type)
    }

    const openAddForm = (type: ProviderType): void => {
        setEditingConfig(null)
        setFormType(formType === type ? null : type)
    }

    const closeForm = (): void => {
        setEditingConfig(null)
        setFormType(null)
    }

    const blankConfig = (type: ProviderType): ProviderConfig => ({
        id: nanoid(),
        type,
        name: '',
        baseUrl: '',
        clientId: '',
        clientSecret: '',
        active: false,
        isDefault: false
    })

    const isGithubConnected = activeProviderId === 'github' && !!activeProvider?.user

    return (
        <div>
            <div className="pb-4">
                <h2 className="text-lg font-semibold">{t('connected_accounts')}</h2>
                <p className="text-sm text-muted-foreground">
                    {t('connected_accounts_description')}
                </p>
            </div>

            <div className="space-y-4">
                {/* Default GitHub */}
                <Account
                    name="github"
                    icon={<Github size={20} />}
                    connected={isGithubConnected}
                    isActive={activeProviderId === 'github'}
                    action={isGithubConnected ? logoutGithub : loginGithub}
                    onActivate={() => handleActivateProvider('github')}
                />

                {/* Custom GitHub instances (e.g. GitHub Enterprise) */}
                {githubConfigs.map((provider) => (
                    <Account
                        key={provider.id}
                        name={provider.name}
                        icon={<Github size={20} />}
                        connected={activeProviderId === provider.id && !!activeProvider?.user}
                        isActive={activeProviderId === provider.id}
                        isDefault={false}
                        isConfigured={!!provider.clientId && !!provider.clientSecret}
                        action={() =>
                            window.electron.ipcRenderer.send('github-oauth', provider.id)
                        }
                        onEdit={() => handleEditProvider(provider, 'github')}
                        onDelete={() => handleDeleteConfig(provider.id, 'github')}
                    />
                ))}

                {/* GitLab Providers */}
                {gitLabProviders.map((provider) => (
                    <Account
                        key={provider.id}
                        name={provider.name}
                        icon={<Gitlab size={20} />}
                        connected={activeProviderId === provider.id && !!provider.user}
                        isActive={activeProviderId === provider.id}
                        isDefault={provider.isDefault}
                        isConfigured={provider.isConfigured}
                        action={
                            activeProviderId === provider.id && provider.user
                                ? () => logoutGitLab(provider.id)
                                : () => loginGitLab(provider.id)
                        }
                        onActivate={() => handleActivateProvider(provider.id)}
                        onEdit={() => handleEditProvider(provider, 'gitlab')}
                        onDelete={() => handleDeleteConfig(provider.id, 'gitlab')}
                    />
                ))}

                {/* Provider Configuration Form */}
                {formType && (
                    <div className="mt-4 p-4 border rounded bg-gray-50">
                        <h3 className="text-md font-medium mb-4">
                            {editingConfig
                                ? formType === 'github'
                                    ? t('edit_github_config')
                                    : t('edit_gitlab_config')
                                : formType === 'github'
                                  ? t('add_github_config')
                                  : t('add_gitlab_config')}
                        </h3>
                        <ProviderConfigForm
                            config={editingConfig ?? blankConfig(formType)}
                            onSave={handleSaveConfig}
                            onCancel={closeForm}
                        />
                    </div>
                )}

                {/* Add Provider Buttons */}
                <div className="pt-2 flex flex-wrap gap-2">
                    <IGRPButtonPrimitive variant="outline" onClick={() => openAddForm('github')}>
                        <Plus size={16} className="mr-2" />
                        {t('add_github')}
                    </IGRPButtonPrimitive>
                    <IGRPButtonPrimitive variant="outline" onClick={() => openAddForm('gitlab')}>
                        <Plus size={16} className="mr-2" />
                        {t('add_gitlab')}
                    </IGRPButtonPrimitive>
                </div>
            </div>
        </div>
    )
}
