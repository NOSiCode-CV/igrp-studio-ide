'use client';

import { useEffect, useState } from 'react';
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
import {
    IGRPCard,
    IGRPCardContent,
    IGRPCardDescription,
    IGRPCardFooter,
    IGRPCardHeader,
    IGRPCardTitle,
} from '@igrp/igrp-framework-react-design-system';
import { Save, Copy, RefreshCw } from 'lucide-react';
import { IWorkspace } from 'src/main/types';
import MonacoEditor from '@renderer/components/monaco-editor';
import { useDocker } from '@renderer/hooks/use-docker';
import { useWorkspace } from '@renderer/hooks/use-workspace';
import { useTranslation } from 'react-i18next';

interface WorkspaceConfigProps {
    workspace: IWorkspace;
}

export function WorkspaceDocker({ workspace }: WorkspaceConfigProps) {
    const [copied, setCopied] = useState(false);

    const { fileContent, services, loadComposeFile } = useDocker({ workspace });
    const [content, setContent] = useState(fileContent);

    const {
        actions: { saveCustomWorkspaceComposeFile },
    } = useWorkspace();

    const { t } = useTranslation();

    const handleCopyYaml = () => {
        if (!content) return;
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSaveService = () => {
        saveCustomWorkspaceComposeFile(content);
    };

    useEffect(() => {
        setContent(fileContent);
    }, [fileContent]);

    useEffect(() => {
        loadComposeFile(workspace.path);
    }, [workspace]);

    return (
        <div className="space-y-4">
            <IGRPCard>
                <IGRPCardHeader className="compact-card-header">
                    <IGRPCardTitle className="text-sm">
                        {t('dockerComposeConfiguration')}
                    </IGRPCardTitle>
                    <IGRPCardDescription className="text-xs">
                        {t('manageComposeFile')}
                    </IGRPCardDescription>
                </IGRPCardHeader>
                <IGRPCardContent className="compact-card-content space-y-3">
                    <div className="border rounded-md overflow-hidden">
                        <div className="bg-muted/30 border-b py-1.5 flex items-center justify-between">
                            <div className="text-xs font-medium px-3">
                                {t('igrpComposeYml')}
                            </div>
                            <IGRPButtonPrimitive
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() => loadComposeFile(workspace.path)}
                            >
                                <RefreshCw className="h-3.5 w-3.5" />
                            </IGRPButtonPrimitive>
                        </div>
                        {content && (
                            <MonacoEditor
                                filePath={`${workspace.path}/igrp-compose.yaml`}
                                content={content}
                                height="50vh"
                                onChange={setContent}
                            />
                        )}
                    </div>
                </IGRPCardContent>
                <IGRPCardFooter className="compact-card-footer flex justify-between">
                    <div className="text-xs text-muted-foreground">
                        {services.filter((s) => s.status === 'running').length}{' '}
                        {t('servicesEnabled')}
                    </div>
                    <div className="flex gap-2">
                        <IGRPButtonPrimitive
                            size="sm"
                            className="h-7"
                            variant="outline"
                            onClick={handleCopyYaml}
                        >
                            {copied ? (
                                <>
                                    <RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" />
                                    {t('copied')}
                                </>
                            ) : (
                                <>
                                    <Copy className="h-3.5 w-3.5 mr-1" />
                                    {t('copy')}
                                </>
                            )}
                        </IGRPButtonPrimitive>
                        <IGRPButtonPrimitive
                            size="sm"
                            className="h-7"
                            variant="outline"
                            onClick={() => handleSaveService()}
                        >
                            <Save className="h-3.5 w-3.5 mr-1" />
                            {t('save')}
                        </IGRPButtonPrimitive>
                    </div>
                </IGRPCardFooter>
            </IGRPCard>
        </div>
    );
}
