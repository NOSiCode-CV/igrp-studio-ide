import { Button } from '@renderer/components/ui/button';
import { Github, Gitlab } from 'lucide-react';

interface AccountProps {
    name: string;
    icon: React.ReactNode;
    connected: boolean;
}

function Account({ name, icon, connected }: AccountProps) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
                {icon}
                <span>{name}</span>
            </div>
            <Button variant={connected ? 'outline' : 'default'}>
                {connected ? 'Disconnect' : 'Connect'}
            </Button>
        </div>
    );
}

export function ConnectedAccountsSettings() {
    return (
        <div>
            <div className="pb-4">
                <h2 className="text-lg font-semibold">Connected Accounts</h2>
                <p className="text-sm text-muted-foreground">
                    Manage your connected accounts and services
                </p>
            </div>
            <div className="space-y-4">
                <Account
                    name="GitHub"
                    icon={<Github size={20} />}
                    connected={true}
                />
                <Account
                    name="GitLab"
                    icon={<Gitlab size={20} />}
                    connected={false}
                />
            </div>
        </div>
    );
}
