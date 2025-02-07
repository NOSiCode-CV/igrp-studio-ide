import { Button } from '@renderer/components/ui/button';
import { Github, Gitlab } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AccountProps {
    name: string;
    icon: React.ReactNode;
    connected: boolean;
}

function Account({ name, icon, connected }: AccountProps) {
    const { t } = useTranslation();

    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
                {icon}
                <span>{t(name)}</span>
            </div>
            <Button variant={connected ? 'outline' : 'default'}>
                {connected ? t('disconnect') : t('connect')}
            </Button>
        </div>
    );
}

export function ConnectedAccountsSettings() {
    const { t } = useTranslation();

    return (
        <div>
            <div className="pb-4">
                <h2 className="text-lg font-semibold">{t('connected_accounts')}</h2>
                <p className="text-sm text-muted-foreground">
                    {t('connected_accounts_description')}
                </p>
            </div>
            <div className="space-y-4">
                <Account
                    name="github"
                    icon={<Github size={20} />}
                    connected={true}
                />
                <Account
                    name="gitlab"
                    icon={<Gitlab size={20} />}
                    connected={false}
                />
            </div>
        </div>
    );
}
