import { useEffect, useState } from 'react';
import { AlertTriangle, FileText, X, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@renderer/components/ui/button';
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from '@renderer/components/ui/alert';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@renderer/components/ui/dialog';
import { cn } from '@renderer/lib/utils';

interface ChangelogSection {
    title: string;
    items: string[];
}

interface ChangelogContent {
    title: string;
    version: string;
    date: string;
    sections: ChangelogSection[];
}

interface VersionAlertProps {
    projectVersion?: string;
    className?: string;
    onDismiss?: () => void;
    showDismiss?: boolean;
    changelogContent?: ChangelogContent;
}

export function VersionAlert({
    projectVersion = '0.0.1-alpha.2',
    className,
    onDismiss,
    showDismiss = true,
    changelogContent,
}: VersionAlertProps) {
    const { t } = useTranslation();
    const [appVersion, setAppVersion] = useState<string>('');
    const [isOutdated, setIsOutdated] = useState(false);
    const [showChangelog, setShowChangelog] = useState(false);

    // Default changelog content if none provided
    const defaultChangelogContent: ChangelogContent = {
        title: "What's New",
        version: appVersion || "Latest",
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        sections: [
            {
                title: "🚀 New Features",
                items: [
                    "Enhanced project structure and organization",
                    "Improved development experience",
                    "Better integration with external tools",
                    "Updated dependencies and frameworks"
                ]
            },
            {
                title: "🔧 Improvements",
                items: [
                    "Performance optimizations",
                    "Better error handling",
                    "Enhanced user interface",
                    "Improved documentation"
                ]
            }
        ]
    };

    const finalChangelogContent = changelogContent || defaultChangelogContent;

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
                <Dialog open={showChangelog} onOpenChange={setShowChangelog}>
                    <DialogTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-600 dark:text-amber-300 dark:hover:bg-amber-900/30"
                        >
                            <FileText className="h-3.5 w-3.5 mr-1" />
                            View Changelog
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                {finalChangelogContent.title}
                            </DialogTitle>
                            <DialogDescription>
                                Version {finalChangelogContent.version} • {finalChangelogContent.date}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6">
                            {finalChangelogContent.sections.map((section, index) => (
                                <div key={index} className="space-y-3">
                                    <h3 className="text-lg font-semibold text-foreground">
                                        {section.title}
                                    </h3>
                                    <ul className="space-y-2">
                                        {section.items.map((item, itemIndex) => (
                                            <li key={itemIndex} className="flex items-start gap-2 text-sm text-muted-foreground">
                                                <span className="text-foreground mt-0.5">•</span>
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button
                                variant="outline"
                                onClick={() => setShowChangelog(false)}
                            >
                                Close
                            </Button>
                            <Button
                                onClick={() => {
                                    const releaseUrl = `https://github.com/NOSiCode-CV/igrp-studio-ide/releases/tag/v0.0.59`;///${appVersion}
                                    window.open(releaseUrl, '_blank');
                                    setShowChangelog(false);
                                }}
                                className="flex items-center gap-2"
                            >
                                <ExternalLink className="h-4 w-4" />
                                View {appVersion} Release
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
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
