import { Plus, Trash2, Edit2, Mouse, Loader2, RefreshCw} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@renderer/components/ui/dropdown-menu';
import { Button } from '@renderer/components/ui/button';
import MonacoEditor from '@renderer/components/monaco-editor';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@renderer/components/ui/dialog';
import { useEffect, useRef, useState } from 'react';
import { DialogDescription } from '@radix-ui/react-dialog';
import { Label } from '@renderer/components/ui/label';
import { IGRPCombobox } from '@igrp/igrp-framework-react-design-system';
import useCustomCode from '../../../../hooks/useCustomCode';
import { ImportComponent } from '../../../sidebar/custom-code/custom-code-imports';
import { Import } from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';
import { SidebarInset } from '@renderer/components/ui/sidebar';
import { FunctionSettingsSidebar } from '../../../sidebar/custom-code/functions-settings';
import { getId } from '@renderer/utils';
import { useComponents } from '@renderer/generators/ui/hooks/useComponents';
import useStudio from '@renderer/hooks/use-studio';
import DynamicKeyValueForm from '@renderer/components/domain-form';
import { ScrollArea } from '@renderer/components/ui/scroll-area';
import { PageSelectionConfig } from '../../properties';
import { Input } from '@renderer/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@renderer/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs';
import useCore from '@renderer/hooks/use-core';
import { toast } from 'sonner';
import { AppLogicEnvironment } from 'src/main/types';
import { useAppLogic } from '@renderer/hooks/use-app-logic';

type ActionType = 'function' | 'navigate' | 'formSubmit' | 'applogic';;

const actionTypeOptions = [
    { value: 'function', label: 'Function' },
    { value: 'navigate', label: 'Navigation' },
    { value: 'formSubmit', label: 'Form Submit' },
    { value: 'applogic', label: 'App Logic' },
];

interface NavigationAction {
    name: string;
    path: string;
    params?: Record<string, string>;
}

interface FormSubmitAction {
    formId: string;
    targetForm: string;
    validation?: boolean;
}
interface AppLogicAction {
  environmentId?: string
  applicationTag?: string
  endpointResourceId?: string
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
  parameters?: Record<string, any>
  headers?: Record<string, string>
  body?: any
}
export interface Action {
    type: ActionType;
    function?: {
        fnName?: string;
        fnCustomSet?: string;
        fnCustomCode?: {
            fnCode?: string;
            imports?: Import[];
        };
    };
    navigate?: NavigationAction;
    formSubmit?: FormSubmitAction;
    applogic?: AppLogicAction;
}

interface TriggerControlsProps {
    interactions: any;
    interactionsType: any;
    componentTag: string;
    onInteractionsChange: (interactions: Record<string, Action>) => void;
}

interface InteractionEditorProps {
    interaction: Action;
    interactionKey: string;
    open: boolean;
    setOpen: (open: boolean) => void;
    onInteractionsChange: (interactions: Record<string, Action>) => void;
    interactionsType: any;
    setLocalInteractions: (interactions: Record<string, Action>) => void;
    localInteractions: Record<string, Action>;
    componentTag: string;
}
interface AppLogicNode {
  type: string
  resourceId: string
  path: string
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
  params: any[]
  inputBody: object
}
interface AppLogicApplication {
  id: number
  applogicId: string
  name: string
  tag: string
  nodes: AppLogicNode[]
}
interface ProcessedApplication {
  tag: string
  name: string
  description: string
  endpoints: ProcessedEndpoint[]
  totalEndpoints: number
}

interface ProcessedEndpoint {
  resourceId: string
  name: string
  path: string
  method: string
  description: string
  params: any[]  
  inputBody: object
  applicationTag: string
}
export function TriggerControls({
    interactions,
    interactionsType,
    componentTag,
    onInteractionsChange,
}: TriggerControlsProps) {
    const [localInteractions, setLocalInteractions] = useState<
        Record<string, Action>
    >({});

    useEffect(() => {
        setLocalInteractions(interactions);
    }, [interactions]);

    const addInteraction = (int: string) => {
        const updated = {
            ...localInteractions,
            [int]: {
                type: 'function' as ActionType,
            } as Action,
        };

        onInteractionsChange(updated);
        setLocalInteractions(updated);
    };

    const removeInteraction = (key: string) => {
        const newInteractions = { ...localInteractions };
        delete newInteractions[key];
        setLocalInteractions(newInteractions);
        onInteractionsChange(newInteractions);
    };

    const AddDropdown = () => {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant={'secondary'} size={'sm'}>
                        <Plus size={10} />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="min-w-60">
                    {Object.keys(interactionsType).map((key, index) => {
                        const interaction = interactionsType[key];
                        return (
                            <DropdownMenuItem
                                key={index}
                                onClick={() => addInteraction(key)}
                            >
                                {interaction?.label || key}
                            </DropdownMenuItem>
                        );
                    })}
                </DropdownMenuContent>
            </DropdownMenu>
        );
    };

    const [open, setOpen] = useState(false);
    const [interaction, setInteraction] = useState<Action>();
    const [interactionKey, setInteractionKey] = useState<string>();

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium flex items-center gap-1">
                    <Mouse className="w-5 h-5" />
                    Trigger Element
                </h3>
                <div className="flex items-center gap-1">
                    <AddDropdown />
                </div>
            </div>

            <div className="space-y-1">
                {Object.entries(localInteractions).map(
                    ([key, interaction], index) => {
                        return (
                            <div
                                key={index}
                                className="group flex items-center gap-2 p-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-800 rounded transition-colors"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {interactionsType[key]?.label || key}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant={'ghost'}
                                        size={'icon'}
                                        onClick={() => {
                                            setOpen(true);
                                            setInteraction(interaction);
                                            setInteractionKey(key);
                                        }}
                                        className="w-6 h-6"
                                    >
                                        <Edit2 size={4} />
                                    </Button>
                                    <Button
                                        variant={'ghost'}
                                        size={'sm'}
                                        onClick={() => removeInteraction(key)}
                                    >
                                        <Trash2
                                            size={4}
                                            className="text-destructive"
                                        />
                                    </Button>
                                </div>
                            </div>
                        );
                    }
                )}
            </div>

            {open && interaction && interactionKey && (
                <InteractionEditor
                    open={open}
                    setOpen={setOpen}
                    interaction={interaction}
                    interactionKey={interactionKey}
                    onInteractionsChange={onInteractionsChange}
                    interactionsType={interactionsType}
                    setLocalInteractions={setLocalInteractions}
                    localInteractions={localInteractions}
                    componentTag={componentTag}
                />
            )}
        </div>
    );
}

const InteractionEditor = ({
    interaction,
    interactionKey,
    open,
    setOpen,
    onInteractionsChange,
    interactionsType,
    setLocalInteractions,
    localInteractions,
    componentTag,
}: InteractionEditorProps) => {
    const [actionType, setActionType] = useState<ActionType>(
        interaction.type || 'function'
    );
    const [currentAction, setCurrentAction] = useState<Action>(interaction);

    const { pageOptions: availablePages } = useStudio();
    const { getFormOptions } = useComponents();
    const availableForms = getFormOptions();
    const { functionOptions } = useCustomCode();

    // Refs e states para diferentes editores
    const fnCustomSetEditorRef = useRef<any>(null);
    const fnCustomCodeEditorRef = useRef<any>(null);

    const fnCustomSetRef = useRef<string>('');
    const fnCustomCodeRef = useRef<string>('');

    const [imports, setImports] = useState<Import[]>(
        currentAction?.function?.fnCustomCode?.imports || []
    );

    const interactions = interactionsType[interactionKey];

    const { properties } = interactions;

    const hasfnNameOption = properties?.function?.properties.fnName.visible;

    const hasfnCustomSetOption =
        properties?.function?.properties.fnCustomSet.visible;

    const hasfnCodeOption =
        properties?.function?.properties.fnCustomCode?.properties?.fnCode
            ?.visible;

    const hasImportOption =
        properties?.function?.properties.fnCustomCode.properties?.imports
            ?.visible;
    // App Logic integration
    const { environments, isInitialized } = useAppLogic()

    // App Logic specific states
    const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string>(
      currentAction.applogic?.environmentId || "",
    )
    const [selectedApplicationTag, setSelectedApplicationTag] = useState<string>(
      currentAction.applogic?.applicationTag || "",
    )
    const [selectedEndpointResourceId, setSelectedEndpointResourceId] = useState<string>(
      currentAction.applogic?.endpointResourceId || "",
    )
    const [activeTab, setActiveTab] = useState("config")
    const [rawApplications, setRawApplications] = useState<AppLogicApplication[]>([])
    const [processedApplications, setProcessedApplications] = useState<ProcessedApplication[]>([])
    const [loadingEndpoints, setLoadingEndpoints] = useState(false)
    const [customHeaders, setCustomHeaders] = useState<Record<string, string>>(currentAction.applogic?.headers || {})
    const [requestBody, setRequestBody] = useState<string>(
      currentAction.applogic?.body ? JSON.stringify(currentAction.applogic.body, null, 2) : "",
    )
    const { fetchData } = useCore();
// Fetch applications from environment
  const fetchEnvironmentApplications = async (environmentId: string) => {
    const environment = environments.find((env) => env.id === environmentId)
    if (!environment) return

    setLoadingEndpoints(true)
    try {
      console.log(environment.url)
      const { result, error } = await fetchData(environment.url, {
        method: "GET",
        headers: {
          "API-KEY": environment.apiKey,
          "Content-Type": "application/json",
        },
      })
      console.log(result)
      if (error || !result) {
        throw new Error(`HTTP ${result.status}: ${result.statusText}`)
      }

      const applications: AppLogicApplication[] = await result;
      setRawApplications(applications)

      const processed = processApplicationsByTag(applications)
      setProcessedApplications(processed)

      toast.success(`Loaded ${processed.length} applications with ${applications.length} total services`)
    } catch (error) {
      console.error("Error fetching environment applications:", error)
      toast.error(`Failed to fetch applications: ${error instanceof Error ? error.message : "Unknown error"}`)

      // Fallback para dados de demonstração
    } finally {
      setLoadingEndpoints(false)
    }
  }

  // Processar aplicações agrupando por tag
  const processApplicationsByTag = (applications: AppLogicApplication[]): ProcessedApplication[] => {
    const groupedByTag: Record<string, AppLogicApplication[]> = {}

    // Agrupar por tag
    applications.forEach((app) => {
      if (!groupedByTag[app.tag]) {
        groupedByTag[app.tag] = []
      }
      groupedByTag[app.tag].push(app)
    })

    // Converter para formato processado
    return Object.entries(groupedByTag).map(([tag, apps]) => {
      const allEndpoints: ProcessedEndpoint[] = []

      apps.forEach((app) => {
        app.nodes.forEach((node) => {
          const uniqueSuffix = `${Math.random().toString(36).substring(2, 8)}`;
          allEndpoints.push({
            resourceId: `${node.resourceId}_${uniqueSuffix}` ,
            name: `${node.method} ${node.path}`,
            path: node.path,
            method: node.method,
            description: `${app.name} - ${node.resourceId}`,
            params: node.params,
            inputBody: node.inputBody,
            applicationTag: tag,
          })
        })
      })
        console.log(allEndpoints)
      return {
        tag,
        name: tag.charAt(0).toUpperCase() + tag.slice(1),
        description: `${apps.length} service(s) with ${allEndpoints.length} endpoint(s)`,
        endpoints: allEndpoints,
        totalEndpoints: allEndpoints.length,
      }
    })
    
  }


  const handleEnvironmentSelect = (environmentId: string) => {
    setSelectedEnvironmentId(environmentId)
    setSelectedApplicationTag("")
    setSelectedEndpointResourceId("")
    setRawApplications([])
    setProcessedApplications([])

    setCurrentAction({
      ...currentAction,
      applogic: {
        ...currentAction.applogic,
        environmentId,
        applicationTag: "",
        endpointResourceId: "",
      },
    })

    // Fetch applications for this environment
    fetchEnvironmentApplications(environmentId)
  }

  const handleApplicationSelect = (applicationTag: string) => {
    setSelectedApplicationTag(applicationTag)
    setSelectedEndpointResourceId("")

    setCurrentAction({
      ...currentAction,
      applogic: {
        ...currentAction.applogic,
        applicationTag,
        endpointResourceId: "",
      },
    })
  }

  const handleEndpointSelect = (resourceId: string) => {
    setSelectedEndpointResourceId(resourceId)

    const endpoint = getSelectedEndpoint()
    if (endpoint) {
      setCurrentAction({
        ...currentAction,
        applogic: {
          ...currentAction.applogic,
          endpointResourceId: resourceId,
          method: endpoint.method as any,
        },
      })
    }
  }

  const handleHeadersChange = (headers: Record<string, string>) => {
    setCustomHeaders(headers)
    setCurrentAction({
      ...currentAction,
      applogic: {
        ...currentAction.applogic,
        headers,
      },
    })
  }

  const handleBodyChange = (body: string) => {
    setRequestBody(body)
    try {
      const parsedBody = body.trim() ? JSON.parse(body) : undefined
      setCurrentAction({
        ...currentAction,
        applogic: {
          ...currentAction.applogic,
          body: parsedBody,
        },
      })
    } catch (error) {
      setCurrentAction({
        ...currentAction,
        applogic: {
          ...currentAction.applogic,
          body: body,
        },
      })
    }
  }

  const getSelectedEnvironment = (): AppLogicEnvironment | undefined => {
    return environments.find((env) => env.id === selectedEnvironmentId)
  }

  const getSelectedApplication = (): ProcessedApplication | undefined => {
    return processedApplications.find((app) => app.tag === selectedApplicationTag)
  }

  const getSelectedEndpoint = (): ProcessedEndpoint | undefined => {
    const application = getSelectedApplication()
    return application?.endpoints.find((endpoint) => endpoint.resourceId === selectedEndpointResourceId)
  }

  const testEndpoint = async () => {
    const environment = getSelectedEnvironment()
    const endpoint = getSelectedEndpoint()

    if (!environment || !endpoint || !window.appLogicAPI) {
      toast.error("Please select environment and endpoint")
      return
    }

    try {
      const testUrl = `${environment.url}/${endpoint.path}`
      const result = await window.appLogicAPI.testEnvironment({
        ...environment,
        url: testUrl,
      })

      if (result.isValid) {
        toast.success(`Endpoint test successful (${result.responseTime}ms)`)
      } else {
        toast.error(`Endpoint test failed: ${result.error}`)
      }
    } catch (error) {
      toast.error("Failed to test endpoint")
    }
  }
    const saveInteraction = () => {
        const updated = {
            ...localInteractions,
            [interactionKey]: currentAction,
        };

        setLocalInteractions(updated);
        onInteractionsChange(updated);

        setOpen(false);
        fnCustomCodeRef.current = '';
        fnCustomSetRef.current = '';
    };

    const handleChangeFnName = (fnName: string) => {
        if (fnName) {
            const functionOption = functionOptions.find(
                (option) => option.value === fnName
            );
            if (functionOption?.metadata?.path) {
                const namespace = `import {${fnName}} from '${functionOption?.metadata?.path}'`;

                setImports?.((prev) => [
                    ...prev,
                    {
                        namespace,
                        id: getId(),
                    },
                ]);
            }
        }

        setCurrentAction({
            ...currentAction,
            function: {
                ...currentAction.function,
                fnName: fnName || undefined,
            },
        });
    };

    const handleChangeImport = (importObj: Import) => {
        setImports?.((prev) => [...prev, importObj]);
    };

    useEffect(() => {
        setCurrentAction({
            ...currentAction,
            function: {
                ...currentAction.function,
                fnCustomCode: {
                    ...currentAction.function?.fnCustomCode,
                    imports: imports,
                },
            },
        });
    }, [imports]);

    const renderActionConfig = () => {
        switch (actionType) {
            case 'function':
                return (
                    <div className="space-y-4">
                        {hasfnNameOption && (
                            <IGRPCombobox
                                label={'Function'}
                                placeholder="Select Function"
                                name="select-function"
                                value={currentAction.function?.fnName}
                                onChange={(value) =>
                                    handleChangeFnName(value as string)
                                }
                                options={functionOptions}
                            />
                        )}
                        {hasImportOption && (
                            <ImportComponent
                                initialImports={imports}
                                onChange={(imports) => {
                                    setImports(imports);
                                }}
                            />
                        )}
                        {hasfnCustomSetOption && (
                            <>
                                <div className="flex-1 border rounded">
                                    <Label className="block text-sm font-medium text-foreground mb-2 p-2 border-b">
                                        Inline Function
                                    </Label>
                                    <MonacoEditor
                                        content={
                                            currentAction.function
                                                ?.fnCustomSet || ''
                                        }
                                        filePath=""
                                        onChange={(newCode) =>
                                            setCurrentAction({
                                                ...currentAction,
                                                function: {
                                                    ...currentAction.function,
                                                    fnCustomSet: newCode,
                                                },
                                            })
                                        }
                                        height="5vh"
                                        language="typescript"
                                        ref={fnCustomSetEditorRef}
                                    />
                                </div>

                                {/* Helper Section */}
                                <div className="p-2 text-xs text-muted-foreground border-b bg-muted rounded-t">
                                    Write a custom inline function to execute
                                    when the component is clicked.
                                    <br />
                                    Accepted examples:
                                    <ul className="list-disc list-inside mt-1 space-y-1">
                                        <li>
                                            <code>showFilter</code>
                                        </li>
                                        <li>
                                            <code>(e) =&gt; showFilter(e)</code>
                                        </li>
                                        <li>
                                            <code>() =&gt; showFilter()</code>
                                        </li>
                                    </ul>
                                </div>
                            </>
                        )}

                        {hasfnCodeOption && (
                            <div className="flex-1 border rounded">
                                <Label className="block text-sm font-medium text-foreground mb-2 p-2 border-b">
                                    Custom Code
                                </Label>
                                <MonacoEditor
                                    content={
                                        currentAction.function?.fnCustomCode
                                            ?.fnCode || ''
                                    }
                                    filePath=""
                                    onChange={(newCode) =>
                                        setCurrentAction({
                                            ...currentAction,
                                            function: {
                                                ...currentAction.function,
                                                fnCustomCode: {
                                                    ...currentAction.function
                                                        ?.fnCustomCode,
                                                    fnCode: newCode,
                                                },
                                            },
                                        })
                                    }
                                    height="40vh"
                                    language="typescript"
                                    ref={fnCustomCodeEditorRef}
                                />
                            </div>
                        )}
                    </div>
                );

            case 'navigate':
                return (
                    <div className="space-y-4">
                        <IGRPCombobox
                            label="Target Page"
                            placeholder="Select page"
                            value={
                                currentAction.navigate?.name
                                    ? currentAction.navigate.name.replace(
                                          'goTo',
                                          ''
                                      )
                                    : ''
                            }
                            onChange={(id) => {
                                const page = availablePages.find(
                                    (p) => p.value === id
                                );
                                if (page) {
                                    setCurrentAction({
                                        ...currentAction,
                                        navigate: {
                                            path: page.metadata.path,
                                            name: `goTo${id}`,
                                        },
                                    });
                                }
                            }}
                            options={availablePages}
                        />

                        {/* TODO: Fix this */}
                        {/* <PageSelectionConfig
                            value={
                                currentAction.navigate?.name
                                    ? currentAction.navigate.name.replace(
                                          'goTo',
                                          ''
                                      )
                                    : ''
                            }
                            fieldPath="navigate.name"
                            key="navigate"
                            selectedPagePath={selectedPagePath}
                            onPageChange={(value) => {
                                const page = availablePages.find(
                                    (p) => p.value === value
                                );

                                setSelectedPagePath(value);
                                if (page) {
                                    setCurrentAction({
                                        ...currentAction,
                                        navigate: {
                                            path: page.metadata.path,
                                            name: `goTo${value}`,
                                        },
                                    });
                                }
                            }}
                            pageOptions={availablePages}
                        /> */}

                        <div className="space-y-2">
                            <Label>Navigation Parameters</Label>
                            <DynamicKeyValueForm
                                onAdd={(items) => {
                                    setCurrentAction({
                                        ...currentAction,
                                        navigate: {
                                            path:
                                                currentAction?.navigate?.path ||
                                                '',
                                            name:
                                                currentAction?.navigate?.name ||
                                                '',
                                            params: items.reduce(
                                                (acc, item) => {
                                                    acc[item.paramName] =
                                                        item.paramValue;
                                                    return acc;
                                                },
                                                {} as Record<string, string>
                                            ),
                                        },
                                    });
                                }}
                                fieldPairs={[
                                    { key: 'paramValue', label: 'Param Value' },
                                    { key: 'paramName', label: 'Param Name' },
                                ]}
                            />
                        </div>
                    </div>
                );

            case 'formSubmit':
                return (
                    <div className="space-y-4">
                        <IGRPCombobox
                            label="Target Form"
                            placeholder="Select form"
                            value={currentAction.formSubmit?.targetForm}
                            onChange={(form) => {
                                setCurrentAction({
                                    ...currentAction,
                                    formSubmit: {
                                        formId: '',
                                        targetForm: form as string,
                                    },
                                });
                            }}
                            options={availableForms}
                        />
                    </div>
                );
            case "applogic":
                const selectedEnvironment = getSelectedEnvironment()
                const selectedApplication = getSelectedApplication()
                const selectedEndpoint = getSelectedEndpoint()
                if (!isInitialized) {
                  return (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">App Logic not initialized</p>
                    </div>
                  )
                }
                return (
                    <div className="space-y-4">
                        <Tabs defaultValue="config" className="w-full" onValueChange={setActiveTab} value={activeTab}>
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="config">Configuration</TabsTrigger>
                            <TabsTrigger value="headers">Headers</TabsTrigger>
                            <TabsTrigger value="preview">Preview</TabsTrigger>
                        </TabsList>

                        <TabsContent value="config" className="space-y-4">
                            <div className="space-y-2">
                            <Label>Environment</Label>
                            <Select value={selectedEnvironmentId} onValueChange={handleEnvironmentSelect}>
                                <SelectTrigger>
                                <SelectValue placeholder="Select an environment" />
                                </SelectTrigger>
                                <SelectContent>
                                {environments.map((environment) => (
                                    <SelectItem key={environment.id} value={environment.id}>
                                    <div className="flex items-center gap-2">
                                        <div
                                        className={`w-2 h-2 rounded-full ${
                                            environment.status === "connected"
                                            ? "bg-green-500"
                                            : environment.status === "error"
                                                ? "bg-red-500"
                                                : "bg-gray-500"
                                        }`}
                                        />
                                        {environment.name}
                                    </div>
                                    </SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            </div>

                            {selectedEnvironment && (
                            <div className="space-y-2">
                                <Label>Base URL</Label>
                                <Input value={selectedEnvironment.url} disabled className="bg-gray-50 text-gray-500" />
                            </div>
                            )}

                            {loadingEndpoints && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading applications and endpoints...
                            </div>
                            )}

                            {processedApplications.length > 0 && (
                            <>
                                <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>Application</Label>
                                    <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => fetchEnvironmentApplications(selectedEnvironmentId)}
                                    disabled={loadingEndpoints}
                                    >
                                    <RefreshCw className={`h-3 w-3 ${loadingEndpoints ? "animate-spin" : ""}`} />
                                    </Button>
                                </div>
                                <Select value={selectedApplicationTag} onValueChange={handleApplicationSelect}>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Select application" />
                                    </SelectTrigger>
                                    <SelectContent>
                                    {processedApplications.map((app) => (
                                        <SelectItem key={app.tag} value={app.tag}>
                                        <div>
                                            <div className="font-medium">{app.name}</div>
                                            <div className="text-xs text-muted-foreground">{app.description}</div>
                                        </div>
                                        </SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                                </div>

                                {selectedApplication && (
                                <div className="space-y-2">
                                    <Label>Endpoint</Label>
                                    <Select value={selectedEndpointResourceId} onValueChange={handleEndpointSelect}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select endpoint" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {selectedApplication.endpoints.map((endpoint) => (
                                        <SelectItem key={endpoint.resourceId} value={endpoint.resourceId}>
                                            <div className="flex items-center gap-2">
                                            <span
                                                className={`px-2 py-1 text-xs rounded font-medium ${
                                                endpoint.method === "GET"
                                                    ? "bg-green-100 text-green-800"
                                                    : endpoint.method === "POST"
                                                    ? "bg-blue-100 text-blue-800"
                                                    : endpoint.method === "PUT"
                                                        ? "bg-yellow-100 text-yellow-800"
                                                        : endpoint.method === "DELETE"
                                                        ? "bg-red-100 text-red-800"
                                                        : "bg-gray-100 text-gray-800"
                                                }`}
                                            >
                                                {endpoint.method}
                                            </span>
                                            <span className="font-mono text-sm">{endpoint.path}</span>
                                            </div>
                                        </SelectItem>
                                        ))}
                                    </SelectContent>
                                    </Select>
                                </div>
                                )}                    
                            </>
                            )}

                            {selectedEndpoint &&
                            (selectedEndpoint.method === "POST" ||
                                selectedEndpoint.method === "PUT" ||
                                selectedEndpoint.method === "PATCH") && (
                                <div className="space-y-2">
                                <Label>Request Body (JSON)</Label>
                                <textarea
                                    className="w-full h-32 p-2 border rounded-md font-mono text-sm"
                                    placeholder='{"key": "value"}'
                                    value={JSON.stringify(selectedEndpoint.inputBody, null, 2)}
                                    onChange={(e) => handleBodyChange(e.target.value)}
                                />
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="headers" className="space-y-4">
                            <div className="space-y-2">
                            <Label>Custom Headers</Label>
                            <div className="space-y-2">
                                {Object.entries(customHeaders).map(([key, value], index) => (
                                <div key={index} className="flex gap-2">
                                    <Input
                                    placeholder="Header name"
                                    value={key}
                                    onChange={(e) => {
                                        const newHeaders = { ...customHeaders }
                                        delete newHeaders[key]
                                        newHeaders[e.target.value] = value
                                        handleHeadersChange(newHeaders)
                                    }}
                                    />
                                    <Input
                                    placeholder="Header value"
                                    value={value}
                                    onChange={(e) => {
                                        handleHeadersChange({
                                        ...customHeaders,
                                        [key]: e.target.value,
                                        })
                                    }}
                                    />
                                    <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        const newHeaders = { ...customHeaders }
                                        delete newHeaders[key]
                                        handleHeadersChange(newHeaders)
                                    }}
                                    >
                                    Remove
                                    </Button>
                                </div>
                                ))}
                                <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    handleHeadersChange({
                                    ...customHeaders,
                                    "": "",
                                    })
                                }}
                                >
                                Add Header
                                </Button>
                            </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="preview" className="space-y-4">
                            {selectedEnvironment && selectedEndpoint ? (
                            
                            <div className="space-y-4">
                                <div className="border rounded-md overflow-hidden">
                                <div className="bg-gray-100 p-3 border-b">
                                    <div className="flex items-center gap-2">
                                    <span
                                        className={`px-2 py-1 text-xs rounded font-medium ${
                                        selectedEndpoint.method === "GET"
                                            ? "bg-green-100 text-green-800"
                                            : selectedEndpoint.method === "POST"
                                            ? "bg-blue-100 text-blue-800"
                                            : selectedEndpoint.method === "PUT"
                                                ? "bg-yellow-100 text-yellow-800"
                                                : selectedEndpoint.method === "DELETE"
                                                ? "bg-red-100 text-red-800"
                                                : "bg-gray-100 text-gray-800"
                                        }`}
                                    >
                                        {selectedEndpoint.method}
                                    </span>
                                    <span className="text-sm font-medium">
                                        http://localhost:8085/api/v1/applogic{selectedEndpoint.path}
                                    </span>
                                    </div>                        
                                    
                                </div>
                                
                                <div className="p-4">
                                    <div className="space-y-3">
                                    <div>
                                        <Label className="text-sm font-medium">Headers</Label>
                                        <pre className="bg-gray-50 p-3 rounded-md text-xs mt-1">
                                        {JSON.stringify(
                                            {
                                            "Content-Type": "application/json",
                                            "X-API-Key": "...",
                                            ...customHeaders,
                                            },
                                            null,
                                            2,
                                        )}
                                        </pre>
                                    </div>

                                    {selectedEndpoint.inputBody  && (
                                        <div>
                                        <Label className="text-sm font-medium">Request body</Label>
                                        <pre className="bg-gray-50 p-3 rounded-md text-xs mt-1">
                                            {JSON.stringify(selectedEndpoint.inputBody, null, 2)}
                                        </pre>
                                        </div>
                                    )}
                                    </div>
                                </div>
                                </div>
                                {requestBody &&
                                        (selectedEndpoint.method === "POST" ||
                                        selectedEndpoint.method === "PUT" ||
                                        selectedEndpoint.method === "PATCH") && (
                                    <div className="border rounded-md overflow-hidden">                      
                                    <div className="p-4">
                                        <div className="space-y-3">                  
                                        <div>
                                            <Label className="text-sm font-medium">Request Body</Label>
                                            <pre className="bg-gray-50 p-3 rounded-md text-xs mt-1">{requestBody}</pre>
                                        </div>
                                        </div>
                                    </div>
                                    </div>
                                )}
                                {requestBody ? (
                                <div className="border rounded-md overflow-hidden">                      
                                    <div className="p-4">
                                    <div className="space-y-3">                  
                                        <div>
                                            <Label className="text-sm font-medium">Response Body</Label>
                                            <pre className="bg-gray-50 p-3 rounded-md text-xs mt-1">{requestBody}</pre>
                                        </div>
                                    </div>
                                    </div>
                                </div>
                                ):<div className="border rounded-md overflow-hidden">                      
                                    <div className="p-4">
                                    <div className="space-y-3">                  
                                        <div>
                                            <Label className="text-sm font-medium">Response Body</Label>
                                            <pre className="bg-gray-50 p-3 rounded-md text-xs mt-1">{JSON.stringify({}, null, 2)}</pre>
                                        </div>
                                    </div>
                                    </div>
                                </div>}
                            </div>
                            ) : (
                            <div className="text-center py-8 text-gray-500">
                                <p>Select environment, application and endpoint to see the preview</p>
                            </div>
                            )}
                        </TabsContent>
                        </Tabs>
                    </div>
        )
            default:
                return null;
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="p-0 flex overflow-hidden [--header-height:calc(--spacing(99))] [--header-height-three:calc(--spacing(75))] w-full sm:max-w-[800px] lg:max-w-[70vw] max-w-[90vw]">
                <SidebarInset className="space-y-4">
                    <DialogHeader className="p-4">
                        <div className="flex flex-1 justify-between">
                            <div className="space-y-2">
                                <DialogTitle>Edit Interaction</DialogTitle>
                                <DialogDescription>
                                    Configure what happens when this interaction
                                    is triggered
                                </DialogDescription>
                            </div>
                            <div>
                                <Button
                                    size={'sm'}
                                    onClick={() => saveInteraction()}
                                >
                                    Save changes
                                </Button>
                            </div>
                        </div>
                    </DialogHeader>
                    <ScrollArea className="h-[calc(100svh-var(--header-height))]">
                        <div className="space-y-4 p-4">
                            <IGRPCombobox
                                label="Action Type"
                                placeholder="Select action type"
                                name="action-type"
                                value={actionType}
                                onChange={(value) => {
                                    setCurrentAction({
                                        ...currentAction,
                                        type: value as ActionType,
                                    });
                                    setActionType(value as ActionType);
                                }}
                                options={actionTypeOptions}
                            />

                            {renderActionConfig()}
                        </div>
                    </ScrollArea>
                </SidebarInset>

                {/* Sidebar com configurações adicionais */}
                {actionType === 'function' && (
                    <FunctionSettingsSidebar
                        editorRef={
                            hasfnCodeOption
                                ? fnCustomCodeEditorRef
                                : fnCustomSetEditorRef
                        }
                        onInsertImport={(importObj) => {
                            handleChangeImport(importObj);
                        }}
                        componentTag={componentTag}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
};
