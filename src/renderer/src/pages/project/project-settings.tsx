import { Button } from '@renderer/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@renderer/components/ui/card';
import { ProjectData } from 'src/main/types';
import { projectIcons } from '@renderer/constants/appConstants';
import { ContainerScrollArea } from '@renderer/generators/api/components/ContainerScrollArea';
import { useTranslation } from 'react-i18next';
import { cn } from '@renderer/lib/utils';

interface PageProps {
    basePath?: string;
    project?: ProjectData;
    className?: string;
    hasTitle?: boolean;
}

interface SettingsRowProps {
    label: string;
    value: React.ReactNode;
    description?: React.ReactNode;
    onEdit?: () => void;
}

function SettingsRow({ label, value, description, onEdit }: SettingsRowProps) {
    const { t } = useTranslation();

    return (
        <div className="flex items-start justify-between py-4">
            <div className="space-x-6 flex flex-1 items-center">
                <p className="text-sm font-medium leading-none">{t(label)}</p>
                <div className="flex items-center gap-2 text-muted-foreground">
                    {value}
                </div>
                {description && (
                    <p className="text-sm text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            {onEdit && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onEdit}
                    className="hidden"
                >
                    {t('edit')}
                </Button>
            )}
        </div>
    );
}

export default function ProjectSettings({
    project,
    className,
    hasTitle = true,
}: PageProps) {
    const { t } = useTranslation();

    if (!project) return null;
    const { name, framework, config } = project;
    return (
        <ContainerScrollArea>
            <div
                className={cn(
                    'w-full max-w-3xl mx-auto space-y-8 p-6 mb-10',
                    className
                )}
            >
                {hasTitle && (
                    <h1 className="text-3xl font-semibold">
                        {t('basic_settings')}
                    </h1>
                )}

                <Card className="border-border/50">
                    <CardHeader>
                        <CardTitle>{t('general_info')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-0 divide-y divide-border/50">
                        <SettingsRow
                            label="project_name"
                            value={name}
                            onEdit={() =>
                                console.log(
                                    t('edit', { context: 'project_name' })
                                )
                            }
                        />
                        <SettingsRow
                            label="icon"
                            value={
                                <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                                    <img
                                        src={projectIcons[framework]}
                                        alt={`${project.framework} logo`}
                                        width={16}
                                        height={16}
                                        className="h-68 w-8"
                                    />
                                </div>
                            }
                            onEdit={() =>
                                console.log(t('edit', { context: 'icon' }))
                            }
                        />
                        <SettingsRow
                            label="framework"
                            value={framework}
                            onEdit={() =>
                                console.log(t('edit', { context: 'framework' }))
                            }
                        />
                        {Object.keys(config).map((key) => {
                            return (
                                <SettingsRow
                                    key={key}
                                    label={key}
                                    value={config[key]} // Access the value using the key
                                    onEdit={() =>
                                        console.log(t('edit', { context: key }))
                                    }
                                />
                            );
                        })}
                    </CardContent>
                </Card>
            </div>
        </ContainerScrollArea>
    );
}
