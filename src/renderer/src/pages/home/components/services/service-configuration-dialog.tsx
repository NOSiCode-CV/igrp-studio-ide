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
import { Textarea } from '@renderer/components/ui/textarea';
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
import { Trash2, X, PlusCircle } from 'lucide-react';
import { ScrollArea } from '@renderer/components/ui/scroll-area';
import { Checkbox } from '@renderer/components/ui/checkbox';
import { useTranslation } from 'react-i18next';
import { useWorkspace } from '@renderer/hooks/use-workspace';
import { IGRPCombobox } from '@igrp/igrp-framework-react-design-system';
import { getServiceIcon, networkTypes, serviceTypes } from '.';
import { extractDefaults } from '@renderer/utils/helpers';
import {
    Port,
    Volume,
    WorkspaceService,
} from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';

interface ServiceConfigurationDialogProps {
    service?: any;
    services?: any[];
    isNew?: boolean;
    children?: React.ReactNode;
}

export function ServiceConfigurationDialog({
    service,
    services = [],
    isNew = true,
    children,
}: ServiceConfigurationDialogProps) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('basic');
    const [name, setName] = useState('');
    const [image, setImage] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<string>('');
    const [ports, setPorts] = useState<string[]>([]);
    const [newPort, setNewPort] = useState('');
    const [environments, setEnvironments] = useState<
        { name: string; value: string }[]
    >([]);
    const [newEnvName, setNewEnvName] = useState('');
    const [newEnvValue, setNewEnvValue] = useState('');
    const [volumes, setVolumes] = useState<string[]>([]);
    const [newVolume, setNewVolume] = useState('');
    const [template, setTemplate] = useState<any>('');
    const [dependsOn, setDependsOn] = useState<string[]>([]);
    const [networkType, setNetworkType] = useState('bridge');
    const [customNetwork, setCustomNetwork] = useState('');
    const [useCustomNetwork, setUseCustomNetwork] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [open, setOpen] = useState(false);
    const [serviceTemplates, setServiceTemplates] = useState<any[]>([]);

    const {
        workspace,
        actions: { getTemplatesService, createOrUpdateService },
    } = useWorkspace();

    useEffect(() => {
        const fetchTemplates = async () => {
            const { result } = await getTemplatesService();

            const convertedTemplates =
                result.services?.map((service) => {
                    const { properties, name, label } = service;

                    const serviveData: any = extractDefaults(properties);
                    // Convert ports array to the string format "internal:external"
                    const ports =
                        serviveData.ports.map(
                            (port) => `${port.external}:${port.internal}`
                        ) || [];

                    // Convert environments array to {name, value} format
                    const environments =
                        serviveData?.environments?.map((env) => ({
                            name: env.key,
                            value: env.value,
                        })) || [];

                    // Convert volumes array to "source:target" format
                    const volumes =
                        serviveData.volumes?.map(
                            (vol) => `${vol.name}:${vol.path}`
                        ) || [];

                    // Convert dependsOn to depends_on array
                    const dependsOn =
                        serviveData.dependsOn?.map((dep) => dep.service) || [];

                    // Convert labels array
                    const type =
                        serviveData.labels?.find((l) => l.key === 'type')
                            ?.value || '';

                    // Build the template object
                    return {
                        ...serviveData,
                        id: name,
                        label: label || name,
                        name: serviveData.container_name || name,
                        image: serviveData.image,
                        type,
                        ports,
                        environments,
                        volumes,
                        dependsOn,
                        customNetwork: `${workspace.slug}-network`,
                    };
                }) || [];

            setServiceTemplates(convertedTemplates);
        };

        fetchTemplates();
    }, []);

    useEffect(() => {
        if (open && service) {
            const network = service.networks && service.networks[0];

            const selectedTemplate = serviceTemplates.find(
                (t) => t.name === service.name
            );

            setTemplate(selectedTemplate);

            // Edit mode
            setName(service.name || '');
            setDescription(service.description || '');
            setImage(service.image || '');
            setType(service.type || '');
            setPorts(service.ports || []);
            setEnvironments(service.environment || []);
            setVolumes(service.volumes || []);
            setDependsOn(service.dependsOn || []);
            setNetworkType(service.networkType || 'bridge');
            setCustomNetwork(network);
            setUseCustomNetwork(!!network);
        } else if (open) {
            // New mode
            setName('');
            setDescription('');
            setImage('');
            setType('');
            setPorts([]);
            setEnvironments([]);
            setVolumes([]);
            setDependsOn([]);
            setNetworkType('bridge');
            setCustomNetwork('');
            setUseCustomNetwork(false);
        }
    }, [open, service]);

    // Apply template
    const applyTemplate = (templateId: string) => {
        const selectedTemplate = serviceTemplates.find(
            (t) => t.id === templateId
        );
        if (selectedTemplate) {
            setName(selectedTemplate.name);
            setImage(selectedTemplate.image);
            setType(selectedTemplate.type);
            setPorts([...selectedTemplate.ports]);
            setEnvironments([...selectedTemplate.environments]);
            setVolumes([...selectedTemplate.volumes]);
            setDependsOn([...selectedTemplate.dependsOn]);
            setNetworkType(selectedTemplate.networkType);
            setCustomNetwork(selectedTemplate.customNetwork);
            setUseCustomNetwork(!!selectedTemplate.customNetwork);
            setTemplate(selectedTemplate);
        }
    };

    // Add port
    const addPort = () => {
        if (newPort && !ports.includes(newPort)) {
            setPorts([...ports, newPort]);
            setNewPort('');
        }
    };

    // Remove port
    const removePort = (port: string) => {
        setPorts(ports.filter((p) => p !== port));
    };

    // Add environment variable
    const addEnvironment = () => {
        if (newEnvName) {
            setEnvironments([
                ...environments,
                { name: newEnvName, value: newEnvValue },
            ]);
            setNewEnvName('');
            setNewEnvValue('');
        }
    };

    // Remove environment variable
    const removeEnvironment = (index: number) => {
        setEnvironments(environments.filter((_, i) => i !== index));
    };

    // Add volume
    const addVolume = () => {
        if (newVolume && !volumes.includes(newVolume)) {
            setVolumes([...volumes, newVolume]);
            setNewVolume('');
        }
    };

    // Remove volume
    const removeVolume = (volume: string) => {
        setVolumes(volumes.filter((v) => v !== volume));
    };

    // Toggle dependency
    const toggleDependency = (serviceId: string) => {
        if (dependsOn.includes(serviceId)) {
            setDependsOn(dependsOn.filter((id) => id !== serviceId));
        } else {
            setDependsOn([...dependsOn, serviceId]);
        }
    };

    // Handle save
    const handleSave = () => {
        setIsSubmitting(true);

        const {
            depends_on,
            id,
            label,
            type,
            status,
            name,
            networkType,
            customNetwork,
            ...rest
        } = template;

        const _ports: Port[] = ports.map((portStr) => {
            const [external, internal] = portStr.split(':').map(Number);
            return { external, internal };
        });

        const _volumes: Volume[] = volumes.map((volumesStr) => {
            const vols = volumesStr.split(':');
            return { name: vols[0], path: vols[1], driver: 'none' };
        });

        // Create service object
        const serviceData: WorkspaceService = {
            id: service?.id || '',
            name: template.id,
            properties: {
                ...rest,
                container_name: name,
                image,
                ports: _ports,
                environments,
                volumes: _volumes,
                dependsOn,
                networks: [
                    { network: useCustomNetwork ? customNetwork : '' },
                ].filter((item) => item.network),
                labels: Object.entries({ type, description }).reduce(
                    (acc, [key, value]) => [
                        ...acc.filter((label) => label.key !== key),
                        ...(value ? [{ key, value }] : []),
                    ],
                    [...template.labels]
                ),
            },
        };

        // Simulate API call
        setTimeout(() => {
            onSave(serviceData);
            setIsSubmitting(false);
            setOpen(false);
        }, 500);
    };

    const onSave = (data: any) => {
        createOrUpdateService(data);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children ? (
                    children
                ) : (
                    <Button
                        variant="outline"
                        className="bg-igrp text-primary-foreground"
                    >
                        <PlusCircle className="w-4 h-4" />
                        {t('newService')}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>
                        {isNew ? 'Add New Service' : 'Edit Service'}
                    </DialogTitle>
                    <DialogDescription>
                        {isNew
                            ? 'Configure a new Docker service for your workspace.'
                            : 'Modify the configuration for this Docker service.'}
                    </DialogDescription>
                </DialogHeader>

                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="flex-1 overflow-hidden flex flex-col"
                >
                    <TabsList className="grid grid-cols-4 mb-4 w-full">
                        <TabsTrigger value="basic" className="text-xs">
                            Basic
                        </TabsTrigger>
                        <TabsTrigger value="config" className="text-xs">
                            Configuration
                        </TabsTrigger>
                        <TabsTrigger value="dependencies" className="text-xs">
                            Dependencies
                        </TabsTrigger>
                        <TabsTrigger value="network" className="text-xs">
                            Network
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
                                        <IGRPCombobox
                                            value={template}
                                            onChange={(tmpl) =>
                                                applyTemplate(tmpl as any)
                                            }
                                            options={serviceTemplates.map(
                                                (template) => {
                                                    return {
                                                        label: template.label,
                                                        value: template.id,
                                                    };
                                                }
                                            )}
                                            placeholder="Select a template"
                                            className="w-1/2"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Select a template to pre-fill
                                            configuration or configure manually.
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="name">Service Name</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) =>
                                            setName(e.target.value)
                                        }
                                        placeholder="e.g., postgres-db"
                                        className="h-8"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">
                                        Description
                                    </Label>
                                    <Textarea
                                        id="description"
                                        value={description}
                                        onChange={(e) =>
                                            setDescription(e.target.value)
                                        }
                                        placeholder="Describe this service..."
                                        className="h-20 resize-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="image">
                                            Docker Image
                                        </Label>
                                        <Input
                                            id="image"
                                            value={image}
                                            onChange={(e) =>
                                                setImage(e.target.value)
                                            }
                                            placeholder="e.g., postgres:14"
                                            className="h-8"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="type">
                                            Service Type
                                        </Label>
                                        <IGRPCombobox
                                            value={type}
                                            onChange={(type) =>
                                                setType(type as string)
                                            }
                                            options={serviceTypes}
                                            placeholder="Select a type"
                                        />
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent
                                value="config"
                                className="mt-0 space-y-4"
                            >
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label>Ports</Label>
                                        <Badge
                                            variant="outline"
                                            className="text-xs"
                                        >
                                            {ports.length}{' '}
                                            {ports.length === 1
                                                ? 'port'
                                                : 'ports'}
                                        </Badge>
                                    </div>

                                    <div className="border rounded-md p-3 space-y-2">
                                        {ports.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {ports.map((port, index) => (
                                                    <Badge
                                                        key={index}
                                                        variant="secondary"
                                                        className="px-2 py-1 flex items-center gap-1"
                                                    >
                                                        <span className="font-mono">
                                                            {port}
                                                        </span>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-4 w-4 p-0 ml-1"
                                                            onClick={() =>
                                                                removePort(port)
                                                            }
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </Badge>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-muted-foreground text-center py-2">
                                                No ports configured
                                            </p>
                                        )}

                                        <div className="flex gap-2">
                                            <Input
                                                value={newPort}
                                                onChange={(e) =>
                                                    setNewPort(e.target.value)
                                                }
                                                placeholder="e.g., 5432:5432"
                                                className="h-8 flex-1"
                                            />
                                            <Button
                                                type="button"
                                                size="sm"
                                                className="h-8"
                                                onClick={addPort}
                                                disabled={!newPort}
                                            >
                                                Add
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Format: HOST_PORT:CONTAINER_PORT
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label>Environment Variables</Label>
                                        <Badge
                                            variant="outline"
                                            className="text-xs"
                                        >
                                            {environments.length}{' '}
                                            {environments.length === 1
                                                ? 'variable'
                                                : 'variables'}
                                        </Badge>
                                    </div>

                                    <div className="border rounded-md p-3 space-y-2">
                                        {environments.length > 0 ? (
                                            <div className="space-y-2">
                                                {environments.map(
                                                    (env, index) => (
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
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    )
                                                )}
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

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label>Volumes</Label>
                                        <Badge
                                            variant="outline"
                                            className="text-xs"
                                        >
                                            {volumes.length}{' '}
                                            {volumes.length === 1
                                                ? 'volume'
                                                : 'volumes'}
                                        </Badge>
                                    </div>

                                    <div className="border rounded-md p-3 space-y-2">
                                        {volumes.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {volumes.map(
                                                    (volume, index) => (
                                                        <Badge
                                                            key={index}
                                                            variant="secondary"
                                                            className="px-2 py-1 flex items-center gap-1"
                                                        >
                                                            <span className="font-mono text-xs truncate max-w-[200px]">
                                                                {volume}
                                                            </span>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-4 w-4 p-0 ml-1"
                                                                onClick={() =>
                                                                    removeVolume(
                                                                        volume
                                                                    )
                                                                }
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </Button>
                                                        </Badge>
                                                    )
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-muted-foreground text-center py-2">
                                                No volumes configured
                                            </p>
                                        )}

                                        <div className="flex gap-2">
                                            <Input
                                                value={newVolume}
                                                onChange={(e) =>
                                                    setNewVolume(e.target.value)
                                                }
                                                placeholder="e.g., data:/var/lib/data"
                                                className="h-8 flex-1"
                                            />
                                            <Button
                                                type="button"
                                                size="sm"
                                                className="h-8"
                                                onClick={addVolume}
                                                disabled={!newVolume}
                                            >
                                                Add
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Format: VOLUME_NAME:CONTAINER_PATH
                                            or ./local/path:/container/path
                                        </p>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent
                                value="dependencies"
                                className="mt-0 space-y-4"
                            >
                                <div className="space-y-2">
                                    <Label>Depends On</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Select services that must be started
                                        before this service.
                                    </p>

                                    <div className="border rounded-md p-3 space-y-2">
                                        {services.length > 0 ? (
                                            <div className="space-y-2">
                                                {services
                                                    .filter(
                                                        (s) =>
                                                            s.id !== service?.id
                                                    )
                                                    .map((s) => (
                                                        <div
                                                            key={s.id}
                                                            className="flex items-center space-x-2"
                                                        >
                                                            <Checkbox
                                                                id={`depends-${s.id}`}
                                                                checked={dependsOn.includes(
                                                                    s.id
                                                                )}
                                                                onCheckedChange={() =>
                                                                    toggleDependency(
                                                                        s.id
                                                                    )
                                                                }
                                                            />
                                                            <div className="flex items-center gap-2">
                                                                <div
                                                                    className={`rounded-sm p-1 text-white ${
                                                                        s.type ===
                                                                        'database'
                                                                            ? 'bg-amber-500'
                                                                            : s.type ===
                                                                                'web'
                                                                              ? 'bg-blue-500'
                                                                              : s.type ===
                                                                                  'cache'
                                                                                ? 'bg-purple-500'
                                                                                : 'bg-green-500'
                                                                    }`}
                                                                >
                                                                    {getServiceIcon(
                                                                        s.type
                                                                    )}
                                                                </div>
                                                                <Label
                                                                    htmlFor={`depends-${s.id}`}
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
                                                No other services available
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent
                                value="network"
                                className="mt-0 space-y-4"
                            >
                                <div className="space-y-2">
                                    <Label>Network Type</Label>
                                    <Select
                                        value={networkType}
                                        onValueChange={setNetworkType}
                                    >
                                        <SelectTrigger className="h-8">
                                            <SelectValue placeholder="Select network type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {networkTypes.map((network) => (
                                                <SelectItem
                                                    key={network.id}
                                                    value={network.id}
                                                >
                                                    {network.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        The type of Docker network to use for
                                        this service.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="custom-network"
                                            checked={useCustomNetwork}
                                            onCheckedChange={
                                                setUseCustomNetwork
                                            }
                                        />
                                        <Label htmlFor="custom-network">
                                            Use custom network
                                        </Label>
                                    </div>

                                    {useCustomNetwork && (
                                        <div className="pl-6 space-y-2">
                                            <Label htmlFor="network-name">
                                                Network Name
                                            </Label>
                                            <Input
                                                id="network-name"
                                                value={customNetwork}
                                                onChange={(e) =>
                                                    setCustomNetwork(
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="e.g., app_network"
                                                className="h-8"
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Custom network name for
                                                connecting related services.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        </div>
                    </ScrollArea>
                </Tabs>

                <DialogFooter className="pt-2">
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSubmitting || !name || !image}
                    >
                        {isSubmitting ? 'Saving...' : 'Save Service'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
