import { useEffect, useState } from 'react';
import { AlertTriangle, Download, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@renderer/components/ui/button';
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from '@renderer/components/ui/alert';
import { cn } from '@renderer/lib/utils';

interface VersionAlertProps {
    projectVersion?: string;
    className?: string;
    onDismiss?: () => void;
    showDismiss?: boolean;
}

export function VersionAlert({
    projectVersion = '0.0.1-alpha.2',
    className,
    onDismiss,
    showDismiss = true,
}: VersionAlertProps) {
    const { t } = useTranslation();
    const [appVersion, setAppVersion] = useState<string>('');
    const [isOutdated, setIsOutdated] = useState(false);

    useEffect(() => {
        const fetchAppVersion = async () => {
            try {
                if (window.electron) {
                    const version = await (window.electron as any).getAppVersion();
                    setAppVersion(version);
                }
            } catch (error) {
                console.error('Error fetching app version:', error);
            }
        };

        fetchAppVersion();
    }, []);

    useEffect(() => {
        if (appVersion && projectVersion) {
            // Simple version comparison - you might want to use a more robust version comparison library
            const compareVersions = (v1: string, v2: string): number => {
                const normalize = (v: string) =>
                    v
                        .replace(/^[^\d]*/, '')
                        .split('.')
                        .map(Number);
                const n1 = normalize(v1);
                const n2 = normalize(v2);

                for (let i = 0; i < Math.max(n1.length, n2.length); i++) {
                    const num1 = n1[i] || 0;
                    const num2 = n2[i] || 0;
                    if (num1 > num2) return 1;
                    if (num1 < num2) return -1;
                }
                return 0;
            };

            const comparison = compareVersions(projectVersion, appVersion);
            setIsOutdated(comparison < 0);
        }
    }, [appVersion, projectVersion]);

    if (!isOutdated || !projectVersion) {
        return null;
    }

    return (
        <Alert
            className={cn(
                'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20',
                className
            )}
        >
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <div className="flex-1">
                <AlertTitle className="text-amber-800 dark:text-amber-200">
                    {t('versionOutdated')}
                </AlertTitle>
                <AlertDescription className="text-amber-700 dark:text-amber-300">
                    {t('versionOutdatedDescription', {
                        projectVersion,
                        appVersion,
                    })}
                </AlertDescription>
            </div>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-600 dark:text-amber-300 dark:hover:bg-amber-900/30"
                    onClick={() => {
                        if (window.electron) {
                            (window.electron as any).checkForUpdates();
                        }
                    }}
                >
                    <Download className="h-3.5 w-3.5 mr-1" />
                    {t('checkForUpdates')}
                </Button>
                {showDismiss && onDismiss && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-amber-600 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/30"
                        onClick={onDismiss}
                    >
                        <X className="h-3.5 w-3.5" />
                    </Button>
                )}
            </div>
        </Alert>
    );
}
