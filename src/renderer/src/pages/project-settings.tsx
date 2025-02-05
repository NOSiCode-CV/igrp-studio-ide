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

interface PageProps {
    basePath?: string;
    project?: ProjectData;
}

interface SettingsRowProps {
    label: string;
    value: React.ReactNode;
    description?: React.ReactNode;
    onEdit?: () => void;
}

function formatKey(key) {
    return key
        .replace(/([A-Z])/g, ' $1') // Insert a space before uppercase letters
        .replace(/^./, (str) => str.toUpperCase()); // Capitalize the first letter
}

function SettingsRow({ label, value, description, onEdit }: SettingsRowProps) {
    return (
        <div className="flex items-start justify-between py-4">
            <div className="space-x-6 flex flex-1 items-center">
                <p className="text-sm font-medium leading-none">
                    {formatKey(label)}
                </p>
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
                <Button variant="outline" size="sm" onClick={onEdit}>
                    Edit
                </Button>
            )}
        </div>
    );
}

export default function ProjectSettings({ project }: PageProps) {
    if (!project) return;
    const { name, framework, config } = project;
    return (
        <ContainerScrollArea>
            <div className="w-full max-w-3xl mx-auto space-y-8 p-6">
                <div>
                    <h1 className="text-3xl font-semibold">Basic Settings</h1>
                </div>

                <Card className="border-border/50">
                    <CardHeader>
                        <CardTitle>General Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-0 divide-y divide-border/50">
                        <SettingsRow
                            label="Project Name"
                            value={name}
                            onEdit={() => console.log('Edit project name')}
                        />
                        <SettingsRow
                            label="Icon"
                            value={
                                <div className="h-12 w-12 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-500">
                                    <img
                                        src={projectIcons[framework]}
                                        alt={`${project.framework} logo`}
                                        width={16}
                                        height={16}
                                        className="h-68 w-8"
                                    />
                                </div>
                            }
                            onEdit={() => console.log('Edit icon')}
                        />
                        <SettingsRow
                            label="Framework"
                            value={framework}
                            onEdit={() => console.log('Edit project name')}
                        />
                        {Object.keys(config).map((key) => {
                            return (
                                <SettingsRow
                                    key={key}
                                    label={key}
                                    value={config[key]} // Access the value using the key
                                    onEdit={() => console.log(`Edit ${key}`)}
                                />
                            );
                        })}
                    </CardContent>
                </Card>
            </div>
        </ContainerScrollArea>
    );
}
