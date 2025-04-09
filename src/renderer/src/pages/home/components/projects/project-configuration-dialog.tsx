'use client';

import { useState, useEffect } from 'react';
import { Button } from '@renderer/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@renderer/components/ui/dialog';
import { Input } from '@renderer/components/ui/input';
import { Label } from '@renderer/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@renderer/components/ui/select';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@renderer/components/ui/tabs';
import { Badge } from '@renderer/components/ui/badge';
import { Switch } from '@renderer/components/ui/switch';
import { ScrollArea } from '@renderer/components/ui/scroll-area';
import { Checkbox } from '@renderer/components/ui/checkbox';
import { Database, Server, Globe, GitBranch, X, Edit } from 'lucide-react';
import { ProjectData } from 'src/main/types';
import { ProjectIcon } from '@renderer/components/shared-ui';
import { ProjectConfigForm } from '@renderer/pages/project';

// Project templates
const projectTemplates = [
    {
        id: 'next-app',
        name: 'Next.js Application',
        type: 'frontend',
        language: 'TypeScript',
        framework: 'Next.js',
        description: 'Full-stack React framework with server-side rendering',
        repositoryUrl: 'https://github.com/vercel/next.js',
        buildCommand: 'npm run build',
        startCommand: 'npm run dev',
        envVars: [
            { name: 'NEXT_PUBLIC_API_URL', value: 'http://localhost:3000/api' },
        ],
    },
    {
        id: 'express-api',
        name: 'Express API',
        type: 'backend',
        language: 'JavaScript',
        framework: 'Express.js',
        description: 'RESTful API server using Express.js',
        repositoryUrl: 'https://github.com/expressjs/express',
        buildCommand: 'npm run build',
        startCommand: 'npm run start',
        envVars: [
            { name: 'PORT', value: '3001' },
            { name: 'NODE_ENV', value: 'development' },
        ],
    },
    {
        id: 'react-app',
        name: 'React Application',
        type: 'frontend',
        language: 'TypeScript',
        framework: 'React',
        description: 'Single-page application using React',
        repositoryUrl: 'https://github.com/facebook/react',
        buildCommand: 'npm run build',
        startCommand: 'npm run start',
        envVars: [
            { name: 'REACT_APP_API_URL', value: 'http://localhost:3001' },
        ],
    },
    {
        id: 'django-app',
        name: 'Django Application',
        type: 'backend',
        language: 'Python',
        framework: 'Django',
        description: 'Web application using Django framework',
        repositoryUrl: 'https://github.com/django/django',
        buildCommand: 'python manage.py collectstatic',
        startCommand: 'python manage.py runserver',
        envVars: [
            { name: 'DJANGO_SETTINGS_MODULE', value: 'myproject.settings' },
            { name: 'DEBUG', value: 'True' },
        ],
    },
    {
        id: 'flutter-app',
        name: 'Flutter Mobile App',
        type: 'mobile',
        language: 'Dart',
        framework: 'Flutter',
        description: 'Cross-platform mobile application using Flutter',
        repositoryUrl: 'https://github.com/flutter/flutter',
        buildCommand: 'flutter build',
        startCommand: 'flutter run',
        envVars: [],
    },
];

interface ProjectConfigurationDialogProps {
    project?: ProjectData;
    projects?: ProjectData[];
    services?: any[];
    onSave: (project: ProjectData) => void;
    isNew?: boolean;
}

export function ProjectConfigurationDialog({
    project,
    projects = [],
    services = [],
    onSave,
    isNew = true,
}: ProjectConfigurationDialogProps) {
    const [activeTab, setActiveTab] = useState('basic');
    const [status, setStatus] = useState<'active' | 'inactive' | 'archived'>(
        'active'
    );
    const [template, setTemplate] = useState('');
    const [repositoryUrl, setRepositoryUrl] = useState('');
    const [buildCommand, setBuildCommand] = useState('');
    const [startCommand, setStartCommand] = useState('');
    const [envVars, setEnvVars] = useState<{ name: string; value: string }[]>(
        []
    );
    const [newEnvName, setNewEnvName] = useState('');
    const [newEnvValue, setNewEnvValue] = useState('');
    const [dependsOn, setDependsOn] = useState<string[]>([]);
    const [connectedServices, setConnectedServices] = useState<string[]>([]);
    const [isPublic, setIsPublic] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [open, onOpenChange] = useState<boolean>();

    // Reset form when dialog opens/closes or project changes
    useEffect(() => {
        if (open && project) {
            setStatus(project.status || 'active');
            setTemplate(project.template || '');
            setRepositoryUrl(project.repositoryUrl || '');
            setBuildCommand(project.buildCommand || '');
            setStartCommand(project.startCommand || '');
            setEnvVars(project.envVars || []);
            setDependsOn(project.dependsOn || []);
            setConnectedServices(project.connectedServices || []);
            setIsPublic(project.isPublic || false);
        }
    }, [open, project]);

    // Apply template
    const applyTemplate = (templateId: string) => {
        const selectedTemplate = projectTemplates.find(
            (t) => t.id === templateId
        );
        if (selectedTemplate) {
            setType(selectedTemplate.type);
            setLanguage(selectedTemplate.language);
            setFramework(selectedTemplate.framework);
            setDescription(selectedTemplate.description);
            setRepositoryUrl(selectedTemplate.repositoryUrl);
            setBuildCommand(selectedTemplate.buildCommand);
            setStartCommand(selectedTemplate.startCommand);
            setEnvVars([...selectedTemplate.envVars]);
            setTemplate(templateId);
        }
    };

    // Add environment variable
    const addEnvironment = () => {
        if (newEnvName) {
            setEnvVars([...envVars, { name: newEnvName, value: newEnvValue }]);
            setNewEnvName('');
            setNewEnvValue('');
        }
    };

    // Remove environment variable
    const removeEnvironment = (index: number) => {
        setEnvVars(envVars.filter((_, i) => i !== index));
    };

    // Toggle project dependency
    const toggleProjectDependency = (projectId: string) => {
        if (dependsOn.includes(projectId)) {
            setDependsOn(dependsOn.filter((id) => id !== projectId));
        } else {
            setDependsOn([...dependsOn, projectId]);
        }
    };

    // Toggle service connection
    const toggleServiceConnection = (serviceId: string) => {
        if (connectedServices.includes(serviceId)) {
            setConnectedServices(
                connectedServices.filter((id) => id !== serviceId)
            );
        } else {
            setConnectedServices([...connectedServices, serviceId]);
        }
    };

    // Get service icon
    const getServiceIcon = (serviceType: string) => {
        switch (serviceType) {
            case 'database':
                return <Database className="h-4 w-4" />;
            case 'web':
                return <Globe className="h-4 w-4" />;
            default:
                return <Server className="h-4 w-4" />;
        }
    };

    // Get service color
    const getServiceColor = (serviceType: string) => {
        switch (serviceType) {
            case 'database':
                return 'bg-amber-500';
            case 'web':
                return 'bg-blue-500';
            case 'cache':
                return 'bg-purple-500';
            default:
                return 'bg-green-500';
        }
    };

    // Handle save
    const handleSave = () => {
        setIsSubmitting(true);

        // Create project object
        const projectData: ProjectData = {
            id: project?.id || `p-${Date.now()}`,
            status,
            // Additional fields
            template,
            repositoryUrl,
            buildCommand,
            startCommand,
            envVars,
            dependsOn,
            connectedServices,
            isPublic,
        };

        // Simulate API call
        setTimeout(() => {
            onSave(projectData);
            setIsSubmitting(false);
            onOpenChange(false);
        }, 500);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Edit className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent
                className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <DialogHeader>
                    <DialogTitle>
                        {isNew ? 'Create New Project' : 'Edit Project'}
                    </DialogTitle>
                    <DialogDescription>
                        {isNew
                            ? 'Configure a new project for your workspace.'
                            : 'Modify the configuration for this project.'}
                    </DialogDescription>
                </DialogHeader>

                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="flex-1 overflow-hidden flex flex-col"
                >
                    <TabsList className="grid grid-cols-4 mb-4">
                        <TabsTrigger value="basic" className="text-xs">
                            Basic
                        </TabsTrigger>
                        <TabsTrigger value="build" className="text-xs">
                            Build & Deploy
                        </TabsTrigger>
                        <TabsTrigger value="dependencies" className="text-xs">
                            Dependencies
                        </TabsTrigger>
                        <TabsTrigger value="advanced" className="text-xs">
                            Advanced
                        </TabsTrigger>
                    </TabsList>

                    <ScrollArea className="flex-1 pr-4">
                        <div className="pb-4">
                            <TabsContent
                                value="basic"
                                className="mt-0 space-y-4 px-1"
                            >
                                {isNew && (
                                    <div className="space-y-2">
                                        <Label>Template (Optional)</Label>
                                        <Select
                                            value={template}
                                            onValueChange={applyTemplate}
                                        >
                                            <SelectTrigger className="h-8">
                                                <SelectValue placeholder="Select a template or configure manually" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="custom">
                                                    Custom Configuration
                                                </SelectItem>
                                                {projectTemplates.map(
                                                    (template) => (
                                                        <SelectItem
                                                            key={template.id}
                                                            value={template.id}
                                                        >
                                                            {template.name}
                                                        </SelectItem>
                                                    )
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground">
                                            Select a template to pre-fill
                                            configuration or configure manually.
                                        </p>
                                    </div>
                                )}

                                {project && (
                                    <ProjectConfigForm
                                        type={project.framework}
                                        data={project.config}
                                        errors={{}}
                                        onChange={(config) =>
                                            console.log(config)
                                        }
                                    />
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select
                                        value={status}
                                        onValueChange={(value) =>
                                            setStatus(
                                                value as
                                                    | 'active'
                                                    | 'inactive'
                                                    | 'archived'
                                            )
                                        }
                                    >
                                        <SelectTrigger className="h-8">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">
                                                Active
                                            </SelectItem>
                                            <SelectItem value="inactive">
                                                Inactive
                                            </SelectItem>
                                            <SelectItem value="archived">
                                                Archived
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </TabsContent>

                            <TabsContent
                                value="build"
                                className="mt-0 space-y-4"
                            >
                                <div className="space-y-2">
                                    <Label htmlFor="repositoryUrl">
                                        Repository URL
                                    </Label>
                                    <Input
                                        id="repositoryUrl"
                                        value={repositoryUrl}
                                        onChange={(e) =>
                                            setRepositoryUrl(e.target.value)
                                        }
                                        placeholder="e.g., https://github.com/username/repo"
                                        className="h-8"
                                    />
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <GitBranch className="h-3.5 w-3.5" />
                                        <span>
                                            Git repository URL for this project
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="buildCommand">
                                        Build Command
                                    </Label>
                                    <Input
                                        id="buildCommand"
                                        value={buildCommand}
                                        onChange={(e) =>
                                            setBuildCommand(e.target.value)
                                        }
                                        placeholder="e.g., npm run build"
                                        className="h-8"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="startCommand">
                                        Start Command
                                    </Label>
                                    <Input
                                        id="startCommand"
                                        value={startCommand}
                                        onChange={(e) =>
                                            setStartCommand(e.target.value)
                                        }
                                        placeholder="e.g., npm run start"
                                        className="h-8"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label>Environment Variables</Label>
                                        <Badge
                                            variant="outline"
                                            className="text-xs"
                                        >
                                            {envVars.length}{' '}
                                            {envVars.length === 1
                                                ? 'variable'
                                                : 'variables'}
                                        </Badge>
                                    </div>

                                    <div className="border rounded-md p-3 space-y-2">
                                        {envVars.length > 0 ? (
                                            <div className="space-y-2">
                                                {envVars.map((env, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <div className="flex-1 grid grid-cols-2 gap-2 text-xs">
                                                            <div className="font-mono bg-muted/50 p-1 rounded truncate">
                                                                {env.name}
                                                            </div>
                                                            <div className="font-mono bg-muted/50 p-1 rounded truncate">
                                                                {env.value}
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6"
                                                            onClick={() =>
                                                                removeEnvironment(
                                                                    index
                                                                )
                                                            }
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-muted-foreground text-center py-2">
                                                No environment variables
                                                configured
                                            </p>
                                        )}

                                        <div className="grid grid-cols-2 gap-2">
                                            <Input
                                                value={newEnvName}
                                                onChange={(e) =>
                                                    setNewEnvName(
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Variable name"
                                                className="h-8"
                                            />
                                            <div className="flex gap-2">
                                                <Input
                                                    value={newEnvValue}
                                                    onChange={(e) =>
                                                        setNewEnvValue(
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Value"
                                                    className="h-8 flex-1"
                                                />
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    className="h-8"
                                                    onClick={addEnvironment}
                                                    disabled={!newEnvName}
                                                >
                                                    Add
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent
                                value="dependencies"
                                className="mt-0 space-y-4"
                            >
                                <div className="space-y-2">
                                    <Label>Project Dependencies</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Select projects that this project
                                        depends on.
                                    </p>

                                    <div className="border rounded-md p-3 space-y-2">
                                        {projects.length > 0 ? (
                                            <div className="space-y-2">
                                                {projects
                                                    .filter(
                                                        (p) =>
                                                            p.id !== project?.id
                                                    )
                                                    .map((p) => (
                                                        <div
                                                            key={p.id}
                                                            className="flex items-center space-x-2"
                                                        >
                                                            <Checkbox
                                                                id={`depends-${p.id}`}
                                                                checked={dependsOn.includes(
                                                                    p.id
                                                                )}
                                                                onCheckedChange={() =>
                                                                    toggleProjectDependency(
                                                                        p.id
                                                                    )
                                                                }
                                                            />
                                                            <div className="flex items-center gap-2">
                                                                <ProjectIcon
                                                                    project={p}
                                                                />
                                                                <Label
                                                                    htmlFor={`depends-${p.id}`}
                                                                    className="text-sm font-normal cursor-pointer"
                                                                >
                                                                    {p.name}
                                                                </Label>
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-muted-foreground text-center py-2">
                                                No other projects available
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Connected Services</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Select services that this project
                                        connects to.
                                    </p>

                                    <div className="border rounded-md p-3 space-y-2">
                                        {services.length > 0 ? (
                                            <div className="space-y-2">
                                                {services.map((s) => (
                                                    <div
                                                        key={s.id}
                                                        className="flex items-center space-x-2"
                                                    >
                                                        <Checkbox
                                                            id={`service-${s.id}`}
                                                            checked={connectedServices.includes(
                                                                s.id
                                                            )}
                                                            onCheckedChange={() =>
                                                                toggleServiceConnection(
                                                                    s.id
                                                                )
                                                            }
                                                        />
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className={`rounded-sm p-1 text-white ${getServiceColor(s.type)}`}
                                                            >
                                                                {getServiceIcon(
                                                                    s.type
                                                                )}
                                                            </div>
                                                            <Label
                                                                htmlFor={`service-${s.id}`}
                                                                className="text-sm font-normal cursor-pointer"
                                                            >
                                                                {s.name}
                                                            </Label>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-muted-foreground text-center py-2">
                                                No services available
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent
                                value="advanced"
                                className="mt-0 space-y-4"
                            >
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="public-project"
                                            checked={isPublic}
                                            onCheckedChange={setIsPublic}
                                        />
                                        <Label htmlFor="public-project">
                                            Public project
                                        </Label>
                                    </div>
                                    <p className="text-xs text-muted-foreground pl-6">
                                        Make this project visible to everyone in
                                        your organization.
                                    </p>
                                </div>

                                <div className="border rounded-md p-3 space-y-2">
                                    <h3 className="text-sm font-medium">
                                        Project ID
                                    </h3>
                                    <div className="bg-muted/50 p-1.5 rounded text-xs font-mono">
                                        {project?.id ||
                                            'Will be generated automatically'}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        This is the unique identifier for your
                                        project.
                                    </p>
                                </div>

                                <div className="border rounded-md p-3 space-y-2">
                                    <h3 className="text-sm font-medium">
                                        Last Updated
                                    </h3>
                                    <div className="bg-muted/50 p-1.5 rounded text-xs">
                                        {project?.updatedAt
                                            ? new Date(
                                                  project.updatedAt
                                              ).toLocaleString()
                                            : 'Not yet saved'}
                                    </div>
                                </div>
                            </TabsContent>
                        </div>
                    </ScrollArea>
                </Tabs>

                <DialogFooter className="pt-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={
                            isSubmitting
                        }
                    >
                        {isSubmitting
                            ? 'Saving...'
                            : isNew
                              ? 'Create Project'
                              : 'Save Project'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
