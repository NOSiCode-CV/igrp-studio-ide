'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    IGRPButtonPrimitive,
    IGRPInputPrimitive,
    IGRPTextAreaPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { IGRPLabelPrimitive } from '@igrp/igrp-framework-react-design-system';
import {
    IGRPSelectPrimitive,
    IGRPSelectContentPrimitive,
    IGRPSelectItemPrimitive,
    IGRPSelectTriggerPrimitive,
    IGRPSelectValuePrimitive,
} from '@igrp/igrp-framework-react-design-system';
import {
    IGRPTabsPrimitive,
    IGRPTabsContentPrimitive,
    IGRPTabsListPrimitive,
    IGRPTabsTriggerPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { Loader2, RefreshCw, Copy } from 'lucide-react';
import { useAppLogic } from '@renderer/hooks/use-app-logic';
import useToast from '@renderer/hooks/useToast';
import useCore from '@renderer/hooks/use-core';

interface AppLogicNode {
    type: string;
    resourceId: string;
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    params: any[];
    inputBody: object;
}

interface AppLogicApplication {
    id: number;
    applogicId: string;
    name: string;
    tag: string;
    nodes: AppLogicNode[];
}

interface ProcessedApplication {
    tag: string;
    name: string;
    description: string;
    endpoints: ProcessedEndpoint[];
    totalEndpoints: number;
}

interface ProcessedEndpoint {
    resourceId: string;
    name: string;
    path: string;
    method: string;
    description: string;
    params: any[];
    inputBody: object;

    applicationTag: string;
}

interface AppLogicAction {
    environmentId?: string;
    applicationTag?: string;
    endpointId?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    parameters?: Record<string, any>;
    headers?: Record<string, string>;
    body?: any;
}

interface AppLogicActionProps {
    currentAction: any;
    setCurrentAction: (action: any) => void;
}

export function AppLogicAction({
    currentAction,
    setCurrentAction,
}: AppLogicActionProps) {
    const { environments, isInitialized } = useAppLogic();
    const { fetchData } = useCore();
    const { showErrorToast, showSuccessToast } = useToast();

    const [selectedEnvironmentId, setSelectedEnvironmentId] = useState(
        currentAction.applogic?.environmentId || ''
    );
    const [selectedApplicationTag, setSelectedApplicationTag] = useState(
        currentAction.applogic?.applicationTag || ''
    );
    const [selectedEndpointId, setSelectedEndpointId] = useState(
        currentAction.applogic?.endpointId || ''
    );
    const [requestBody, setRequestBody] = useState(
        currentAction.applogic?.body
            ? JSON.stringify(currentAction.applogic.body, null, 2)
            : ''
    );
    const [customHeaders, setCustomHeaders] = useState<Record<string, string>>(
        currentAction.applogic?.headers || {}
    );
    /*  const [rawApplications, setRawApplications] = useState<
        AppLogicApplication[]
    >([]); */
    const [processedApplications, setProcessedApplications] = useState<
        ProcessedApplication[]
    >([]);
    const [loadingEndpoints, setLoadingEndpoints] = useState(false);
    const [activeTab, setActiveTab] = useState('config');

    const selectedEnvironment = useMemo(
        () => environments.find((env) => env.id === selectedEnvironmentId),
        [environments, selectedEnvironmentId]
    );
    const selectedApplication = useMemo(
        () =>
            processedApplications.find(
                (app) => app.tag === selectedApplicationTag
            ),
        [processedApplications, selectedApplicationTag]
    );
    const selectedEndpoint = useMemo(
        () =>
            selectedApplication?.endpoints.find(
                (endpoint) => endpoint.resourceId === selectedEndpointId
            ),
        [selectedApplication, selectedEndpointId]
    );

    const isValid = () =>
        selectedEnvironmentId && selectedApplicationTag && selectedEndpointId;

    const fetchEnvironmentApplications = async (environmentId: string) => {
        const environment = environments.find(
            (env) => env.id === environmentId
        );
        if (!environment) return;

        setLoadingEndpoints(true);
        try {
            const { result, error } = await fetchData(environment.url, {
                method: 'GET',
                headers: {
                    'API-KEY': environment.apiKey,
                    'Content-Type': 'application/json',
                },
            });

            if (error || !result) {
                throw new Error(`HTTP ${result.status}: ${result.statusText}`);
            }

            const applications: AppLogicApplication[] = await result;
            /*             setRawApplications(applications);
             */
            const processed = processApplicationsByTag(applications);
            setProcessedApplications(processed);

            showSuccessToast(
                `Loaded ${processed.length} applications with ${applications.length} total services`
            );
        } catch (error) {
            console.error('Error fetching environment applications:', error);
            showErrorToast(
                `Failed to fetch applications: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        } finally {
            setLoadingEndpoints(false);
        }
    };

    const processApplicationsByTag = (
        applications: AppLogicApplication[]
    ): ProcessedApplication[] => {
        const groupedByTag: Record<string, AppLogicApplication[]> = {};

        applications.forEach((app) => {
            if (!groupedByTag[app.tag]) {
                groupedByTag[app.tag] = [];
            }
            groupedByTag[app.tag].push(app);
        });

        return Object.entries(groupedByTag).map(([tag, apps]) => {
            const allEndpoints: ProcessedEndpoint[] = [];

            apps.forEach((app) => {
                app.nodes.forEach((node) => {
                    const resourceIdSuffix = `${Math.random().toString(36).substring(2, 8)}`;

                    allEndpoints.push({
                        resourceId: `${node.resourceId}_${resourceIdSuffix}`,
                        name: `${node.method} /${node.path}`,
                        path: node.path,
                        method: node.method,
                        description: `${app.name} - ${node.resourceId}`,
                        params: node.params,
                        inputBody: node.inputBody,
                        applicationTag: tag,
                    });
                });
            });

            return {
                tag,
                name: tag.charAt(0).toUpperCase() + tag.slice(1),
                description: `${allEndpoints.length} endpoint(s)`,
                endpoints: allEndpoints,
                totalEndpoints: allEndpoints.length,
            };
        });
    };

    const handleEnvironmentSelect = (environmentId: string) => {
        setSelectedEnvironmentId(environmentId);
        setSelectedApplicationTag('');
        setSelectedEndpointId('');
        /*         setRawApplications([]);
         */ setProcessedApplications([]);

        setCurrentAction({
            ...currentAction,
            applogic: {
                ...currentAction.applogic,
                environmentId,
                applicationTag: '',
                endpointId: '',
            },
        });

        fetchEnvironmentApplications(environmentId);
    };

    const handleApplicationSelect = (applicationTag: string) => {
        setSelectedApplicationTag(applicationTag);
        setSelectedEndpointId('');

        setCurrentAction({
            ...currentAction,
            applogic: {
                ...currentAction.applogic,
                applicationTag,
                endpointId: '',
            },
        });
    };

    const handleEndpointSelect = (endpointId: string) => {
        setSelectedEndpointId(endpointId);

        const endpoint = getSelectedEndpoint();
        if (endpoint) {
            setCurrentAction({
                ...currentAction,
                applogic: {
                    ...currentAction.applogic,
                    endpointId: endpointId,
                    method: endpoint.method as any,
                },
            });
        }
    };

    const handleHeadersChange = (headers: Record<string, string>) => {
        setCustomHeaders(headers);
        setCurrentAction({
            ...currentAction,
            applogic: {
                ...currentAction.applogic,
                headers,
            },
        });
    };

    const handleBodyChange = (body: string) => {
        setRequestBody(body);
        try {
            const parsedBody = body.trim() ? JSON.parse(body) : undefined;
            setCurrentAction({
                ...currentAction,
                applogic: {
                    ...currentAction.applogic,
                    body: parsedBody,
                },
            });
        } catch (error) {
            setCurrentAction({
                ...currentAction,
                applogic: {
                    ...currentAction.applogic,
                    body: body,
                },
            });
        }
    };

    /*  const getSelectedEnvironment = (): AppLogicEnvironment | undefined => {
        return environments.find((env) => env.id === selectedEnvironmentId);
    }; */

    const getSelectedApplication = (): ProcessedApplication | undefined => {
        return processedApplications.find(
            (app) => app.tag === selectedApplicationTag
        );
    };

    const getSelectedEndpoint = (): ProcessedEndpoint | undefined => {
        const application = getSelectedApplication();
        return application?.endpoints.find(
            (endpoint) => endpoint.resourceId === selectedEndpointId
        );
    };

    useEffect(() => {
        if (environments.length > 0 && !selectedEnvironmentId) {
            const firstEnvironment = environments[0];
            handleEnvironmentSelect(firstEnvironment.id);
        }
    }, [environments, selectedEnvironmentId]);

    const getBaseUrl = (url: string) => {
        try {
            const u = new URL(url);
            return `${u.protocol}//${u.host}`;
        } catch (err) {
            console.error('URL inválida:', err);
            return '';
        }
    };

    useEffect(() => {
        if (currentAction.applogic) {
            currentAction.applogic.isValid = isValid();
        }
    }, [selectedEnvironmentId, selectedApplicationTag, selectedEndpointId]);

    if (!isInitialized) {
        return (
            <div className="text-center py-8">
                <p className="text-muted-foreground">
                    App Logic not initialized
                </p>
            </div>
        );
    }
    const generateCurlCommand = (): string => {
        if (!selectedEnvironment || !selectedEndpoint) return '';

        const url = `${getBaseUrl(selectedEnvironment.url)}/applogic${selectedEndpoint.path}`;
        const method = selectedEndpoint.method;
        const body = selectedEndpoint.inputBody;
        const headers = {
            'Content-Type': 'application/json',
            accept: 'application/json',
            'API-KEY': selectedEnvironment.apiKey,
            ...customHeaders,
        };

        let curlCommand = `curl -X ${method} \\\n  "${url}"`;

        Object.entries(headers).forEach(([key, value]) => {
            if (key && value) {
                curlCommand += ` \\\n  -H "${key}: ${value}"`;
            }
        });

        if (
            (method === 'POST' || method === 'PUT' || method === 'PATCH') &&
            body
        ) {
            try {
                // Tentar fazer parse do JSON para validar e formatar
                const formattedBody = JSON.stringify(body);
                curlCommand += ` \\\n  -d '${formattedBody}'`;
            } catch (error) {
                // Se não for JSON válido, usar como string mesmo assim
                curlCommand += ` \\\n  -d '{}'`;
            }
        }

        return curlCommand;
    };

    return (
        <div className="space-y-4">
            <IGRPTabsPrimitive
                defaultValue="config"
                className="w-full"
                onValueChange={setActiveTab}
                value={activeTab}
            >
                <IGRPTabsListPrimitive className="grid w-full grid-cols-3">
                    <IGRPTabsTriggerPrimitive value="config">
                        Configuration
                    </IGRPTabsTriggerPrimitive>
                    <IGRPTabsTriggerPrimitive value="headers">
                        Headers
                    </IGRPTabsTriggerPrimitive>
                    <IGRPTabsTriggerPrimitive value="preview">
                        Preview
                    </IGRPTabsTriggerPrimitive>
                </IGRPTabsListPrimitive>

                <IGRPTabsContentPrimitive value="config" className="space-y-4">
                    <div className="space-y-2">
                        <IGRPLabelPrimitive>Environment</IGRPLabelPrimitive>
                        <IGRPSelectPrimitive
                            value={selectedEnvironmentId}
                            onValueChange={handleEnvironmentSelect}
                        >
                            <IGRPSelectTriggerPrimitive>
                                <IGRPSelectValuePrimitive placeholder="Select an environment" />
                            </IGRPSelectTriggerPrimitive>
                            <IGRPSelectContentPrimitive>
                                {environments.map((environment) => (
                                    <IGRPSelectItemPrimitive
                                        key={environment.id}
                                        value={environment.id}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div
                                                className={`w-2 h-2 rounded-full ${
                                                    environment.status ===
                                                    'connected'
                                                        ? 'bg-green-500'
                                                        : environment.status ===
                                                            'error'
                                                          ? 'bg-red-500'
                                                          : 'bg-gray-500'
                                                }`}
                                            />
                                            {environment.name}
                                        </div>
                                    </IGRPSelectItemPrimitive>
                                ))}
                            </IGRPSelectContentPrimitive>
                        </IGRPSelectPrimitive>
                    </div>

                    {selectedEnvironment && (
                        <div className="space-y-2">
                            <IGRPLabelPrimitive>Base URL</IGRPLabelPrimitive>
                            <IGRPInputPrimitive
                                value={selectedEnvironment.url}
                                disabled
                                className="bg-gray-50 text-gray-500"
                            />
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
                                    <IGRPLabelPrimitive>
                                        Application (Tag)
                                    </IGRPLabelPrimitive>
                                    <IGRPButtonPrimitive
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            fetchEnvironmentApplications(
                                                selectedEnvironmentId
                                            )
                                        }
                                        disabled={loadingEndpoints}
                                    >
                                        <RefreshCw
                                            className={`h-3 w-3 ${loadingEndpoints ? 'animate-spin' : ''}`}
                                        />
                                    </IGRPButtonPrimitive>
                                </div>
                                <IGRPSelectPrimitive
                                    value={selectedApplicationTag}
                                    onValueChange={handleApplicationSelect}
                                >
                                    <IGRPSelectTriggerPrimitive className="w-full truncate">
                                        <IGRPSelectValuePrimitive placeholder="Select application" />
                                    </IGRPSelectTriggerPrimitive>
                                    <IGRPSelectContentPrimitive>
                                        {processedApplications.map((app) => (
                                            <IGRPSelectItemPrimitive
                                                key={app.tag}
                                                value={app.tag}
                                            >
                                                <div>
                                                    <div className="font-medium">
                                                        {app.name}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {app.description}
                                                    </div>
                                                </div>
                                            </IGRPSelectItemPrimitive>
                                        ))}
                                    </IGRPSelectContentPrimitive>
                                </IGRPSelectPrimitive>
                            </div>

                            {selectedApplication && (
                                <div className="space-y-2">
                                    <IGRPLabelPrimitive>
                                        Endpoint
                                    </IGRPLabelPrimitive>
                                    <IGRPSelectPrimitive
                                        value={selectedEndpointId}
                                        onValueChange={handleEndpointSelect}
                                    >
                                        <IGRPSelectTriggerPrimitive
                                            className="w-full truncate"
                                            disabled
                                        >
                                            <IGRPSelectValuePrimitive placeholder="Select endpoint" />
                                        </IGRPSelectTriggerPrimitive>
                                        <IGRPSelectContentPrimitive>
                                            {selectedApplication.endpoints.map(
                                                (endpoint) => (
                                                    <IGRPSelectItemPrimitive
                                                        key={
                                                            endpoint.resourceId
                                                        }
                                                        value={
                                                            endpoint.resourceId
                                                        }
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className={`px-2 py-1 text-xs rounded font-medium ${
                                                                    endpoint.method ===
                                                                    'GET'
                                                                        ? 'bg-green-100 text-green-800'
                                                                        : endpoint.method ===
                                                                            'POST'
                                                                          ? 'bg-blue-100 text-blue-800'
                                                                          : endpoint.method ===
                                                                              'PUT'
                                                                            ? 'bg-yellow-100 text-yellow-800'
                                                                            : endpoint.method ===
                                                                                'DELETE'
                                                                              ? 'bg-red-100 text-red-800'
                                                                              : 'bg-gray-100 text-gray-800'
                                                                }`}
                                                            >
                                                                {
                                                                    endpoint.method
                                                                }
                                                            </span>
                                                            <span className="font-mono text-sm">
                                                                {endpoint.path}
                                                            </span>
                                                        </div>
                                                    </IGRPSelectItemPrimitive>
                                                )
                                            )}
                                        </IGRPSelectContentPrimitive>
                                    </IGRPSelectPrimitive>
                                </div>
                            )}
                        </>
                    )}

                    {selectedEndpoint &&
                        (selectedEndpoint.method === 'POST' ||
                            selectedEndpoint.method === 'PUT' ||
                            selectedEndpoint.method === 'PATCH') && (
                            <div className="space-y-2">
                                <IGRPLabelPrimitive>
                                    Request Body (JSON)
                                </IGRPLabelPrimitive>
                                <IGRPTextAreaPrimitive
                                    className="w-full h-32 p-2 border rounded-md font-mono text-sm"
                                    placeholder='{"key": "value"}'
                                    value={JSON.stringify(
                                        selectedEndpoint.inputBody,
                                        null,
                                        2
                                    )}
                                    onChange={(e) =>
                                        handleBodyChange(e.target.value)
                                    }
                                />
                            </div>
                        )}
                </IGRPTabsContentPrimitive>

                <IGRPTabsContentPrimitive value="headers" className="space-y-4">
                    <div className="space-y-2">
                        <IGRPLabelPrimitive>Custom Headers</IGRPLabelPrimitive>
                        <div className="space-y-2">
                            {Object.entries(customHeaders).map(
                                ([key, value], index) => (
                                    <div key={index} className="flex gap-2">
                                        <IGRPInputPrimitive
                                            placeholder="Header name"
                                            value={key}
                                            onChange={(e) => {
                                                const newHeaders = {
                                                    ...customHeaders,
                                                };
                                                delete newHeaders[key];
                                                newHeaders[e.target.value] =
                                                    value;
                                                handleHeadersChange(newHeaders);
                                            }}
                                        />
                                        <IGRPInputPrimitive
                                            placeholder="Header value"
                                            value={value}
                                            onChange={(e) => {
                                                handleHeadersChange({
                                                    ...customHeaders,
                                                    [key]: e.target.value,
                                                });
                                            }}
                                        />
                                        <IGRPButtonPrimitive
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                const newHeaders = {
                                                    ...customHeaders,
                                                };
                                                delete newHeaders[key];
                                                handleHeadersChange(newHeaders);
                                            }}
                                        >
                                            Remove
                                        </IGRPButtonPrimitive>
                                    </div>
                                )
                            )}
                            <IGRPButtonPrimitive
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    handleHeadersChange({
                                        ...customHeaders,
                                        '': '',
                                    });
                                }}
                            >
                                Add Header
                            </IGRPButtonPrimitive>
                        </div>
                    </div>
                </IGRPTabsContentPrimitive>

                <IGRPTabsContentPrimitive value="preview" className="space-y-4">
                    {selectedEnvironment && selectedEndpoint ? (
                        <div className="space-y-4">
                            <div className="border rounded-md overflow-hidden">
                                <div className="bg-gray-100 p-3 border-b">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`px-2 py-1 text-xs rounded font-medium ${
                                                    selectedEndpoint.method ===
                                                    'GET'
                                                        ? 'bg-green-100 text-green-800'
                                                        : selectedEndpoint.method ===
                                                            'POST'
                                                          ? 'bg-blue-100 text-blue-800'
                                                          : selectedEndpoint.method ===
                                                              'PUT'
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : selectedEndpoint.method ===
                                                                'DELETE'
                                                              ? 'bg-red-100 text-red-800'
                                                              : 'bg-gray-100 text-gray-800'
                                                }`}
                                            >
                                                {selectedEndpoint.method}
                                            </span>
                                            <span className="text-sm font-medium">
                                                {getBaseUrl(
                                                    selectedEnvironment.url
                                                )}
                                                /applogic
                                                {selectedEndpoint.path}
                                            </span>
                                        </div>
                                        <IGRPButtonPrimitive
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                const curlCommand =
                                                    generateCurlCommand();
                                                navigator.clipboard.writeText(
                                                    curlCommand
                                                );
                                                showSuccessToast(
                                                    'cURL command copied to clipboard!'
                                                );
                                            }}
                                            className="flex items-center gap-1"
                                        >
                                            <Copy className="h-3 w-3" />
                                            Copy cURL
                                        </IGRPButtonPrimitive>
                                    </div>
                                </div>

                                <div className="p-4">
                                    <div className="space-y-3">
                                        <div>
                                            <IGRPLabelPrimitive className="text-sm font-medium">
                                                Headers
                                            </IGRPLabelPrimitive>
                                            <pre className="bg-gray-50 p-3 rounded-md text-xs mt-1">
                                                {JSON.stringify(
                                                    {
                                                        'Content-Type':
                                                            'application/json',
                                                        accept: 'application/json',
                                                        'X-API-Key': '...',
                                                        ...customHeaders,
                                                    },
                                                    null,
                                                    2
                                                )}
                                            </pre>
                                        </div>

                                        {selectedEndpoint.inputBody && (
                                            <div>
                                                <IGRPLabelPrimitive className="text-sm font-medium">
                                                    Request body
                                                </IGRPLabelPrimitive>
                                                <pre className="bg-gray-50 p-3 rounded-md text-xs mt-1">
                                                    {JSON.stringify(
                                                        selectedEndpoint.inputBody,
                                                        null,
                                                        2
                                                    )}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {requestBody &&
                                (selectedEndpoint.method === 'POST' ||
                                    selectedEndpoint.method === 'PUT' ||
                                    selectedEndpoint.method === 'PATCH') && (
                                    <div className="border rounded-md overflow-hidden">
                                        <div className="p-4">
                                            <div className="space-y-3">
                                                <div>
                                                    <IGRPLabelPrimitive className="text-sm font-medium">
                                                        Request Body
                                                    </IGRPLabelPrimitive>
                                                    <pre className="bg-gray-50 p-3 rounded-md text-xs mt-1">
                                                        {requestBody}
                                                    </pre>
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
                                                <IGRPLabelPrimitive className="text-sm font-medium">
                                                    Response Body
                                                </IGRPLabelPrimitive>
                                                <pre className="bg-gray-50 p-3 rounded-md text-xs mt-1">
                                                    {requestBody}
                                                </pre>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="border rounded-md overflow-hidden">
                                    <div className="p-4">
                                        <div className="space-y-3">
                                            <div>
                                                <IGRPLabelPrimitive className="text-sm font-medium">
                                                    Response Body
                                                </IGRPLabelPrimitive>
                                                <pre className="bg-gray-50 p-3 rounded-md text-xs mt-1">
                                                    {JSON.stringify(
                                                        {},
                                                        null,
                                                        2
                                                    )}
                                                </pre>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {/* cURL Command Preview */}
                            <div>
                                <div className="flex items-center justify-between">
                                    <IGRPLabelPrimitive className="text-sm font-medium">
                                        cURL Command
                                    </IGRPLabelPrimitive>
                                </div>
                                <pre className="bg-gray-900 text-green-400 p-3 rounded-md text-xs mt-1 overflow-x-auto relative group">
                                    {generateCurlCommand()}
                                    <IGRPButtonPrimitive
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => {
                                            const curlCommand =
                                                generateCurlCommand();
                                            navigator.clipboard.writeText(
                                                curlCommand
                                            );
                                            showSuccessToast(
                                                'cURL command copied to clipboard!'
                                            );
                                        }}
                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0"
                                    >
                                        <Copy className="h-3.5 w-3.5" />
                                    </IGRPButtonPrimitive>
                                </pre>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <p>
                                Select environment, application and endpoint to
                                see the preview
                            </p>
                        </div>
                    )}
                </IGRPTabsContentPrimitive>
            </IGRPTabsPrimitive>
        </div>
    );
}
