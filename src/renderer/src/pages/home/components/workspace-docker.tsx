'use client';

import { useEffect, useState } from 'react';
import { Button } from '@renderer/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@renderer/components/ui/card';
import { Save, Copy, RefreshCw } from 'lucide-react';
import { IWorkspace } from 'src/main/types';
import MonacoEditor from '@renderer/components/monaco-editor';
import { useDocker } from '@renderer/hooks/use-docker';

interface WorkspaceConfigProps {
    workspace: IWorkspace;
    services?: any[];
}

export function WorkspaceDocker({ workspace }: WorkspaceConfigProps) {
    const [copied, setCopied] = useState(false);

    const { fileContent: content, services, loadComposeFile } = useDocker();

    const handleCopyYaml = () => {
        if (!content) return;
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSaveService = (service: any) => {
        console.log('Service updated:', service);
        // In a real app, this would update the service in the workspace
    };

    useEffect(() => {
        loadComposeFile(workspace.path);
    }, [workspace]);

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="compact-card-header">
                    <CardTitle className="text-sm">
                        Docker Compose Configuration
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Manage your igrp-compose.yml file
                    </CardDescription>
                </CardHeader>
                <CardContent className="compact-card-content space-y-3">
                    <div className="border rounded-md overflow-hidden">
                        <div className="bg-muted/30 border-b py-1.5 flex items-center justify-between">
                            <div className="text-xs font-medium px-3">
                                igrp-compose.yml
                            </div>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                            >
                                <RefreshCw className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                        {content && (
                            <MonacoEditor
                                filePath={`${workspace.path}/igrp-compose.yaml`}
                                content={content}
                                height="35vh"
                            />
                        )}
                    </div>
                </CardContent>
                <CardFooter className="compact-card-footer flex justify-between">
                    <div className="text-xs text-muted-foreground">
                        {services.length} services enabled
                    </div>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            className="h-7"
                            variant="outline"
                            onClick={handleCopyYaml}
                        >
                            {copied ? (
                                <>
                                    <RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" />
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <Copy className="h-3.5 w-3.5 mr-1" />
                                    Copy
                                </>
                            )}
                        </Button>
                        <Button
                            size="sm"
                            className="h-7"
                            variant="outline"
                            onClick={() => handleSaveService(services[0])}
                        >
                            <Save className="h-3.5 w-3.5 mr-1" />
                            Save
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
