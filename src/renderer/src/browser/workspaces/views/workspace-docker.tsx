'use client'

import {
    IGRPButtonPrimitive,
    IGRPCard,
    IGRPCardContent,
    IGRPCardDescription,
    IGRPCardFooter,
    IGRPCardHeader,
    IGRPCardTitle
} from '@igrp/igrp-framework-react-design-system'
import MonacoEditor from '@renderer/components/monaco-editor'
import { useDocker } from '@renderer/hooks/use-docker'
import { useWorkspace } from '@renderer/hooks/use-workspace'
import { CheckCircle2, Copy, RefreshCw, Save } from 'lucide-react'
import { type JSX, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { IWorkspace, OptionalStacksStatus } from 'src/main/types'

interface WorkspaceConfigProps {
    workspace: IWorkspace
}

export function WorkspaceDocker({ workspace }: WorkspaceConfigProps): JSX.Element {
    const [copied, setCopied] = useState(false)
    const [installingStack, setInstallingStack] = useState<'monitoring' | 'process' | null>(null)
    const [optionalStacksStatus, setOptionalStacksStatus] = useState<OptionalStacksStatus>({
        monitoringInstalled: false,
        processInstalled: false
    })

    const { fileContent, services, loadComposeFile } = useDocker({ workspace })
    const [content, setContent] = useState(fileContent)

    const {
        actions: { saveCustomWorkspaceComposeFile, installOptionalStacks, getOptionalStacksStatus }
    } = useWorkspace()

    const { t } = useTranslation()

    const handleCopyYaml = (): void => {
        if (!content) return
        navigator.clipboard.writeText(content)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleSaveService = (): void => {
        if (content) {
            saveCustomWorkspaceComposeFile(content)
        }
    }

    const loadOptionalStacksStatus = async (): Promise<void> => {
        const status = await getOptionalStacksStatus()
        setOptionalStacksStatus(status)
    }

    const handleInstallOptionalStack = async (stack: 'monitoring' | 'process'): Promise<void> => {
        setInstallingStack(stack)
        try {
            const response = await installOptionalStacks({
                installMonitoringStack: stack === 'monitoring',
                installProcessStack: stack === 'process'
            })
            if (!response?.error) {
                await loadOptionalStacksStatus()
            }
        } finally {
            setInstallingStack(null)
        }
    }

    useEffect(() => {
        setContent(fileContent)
    }, [fileContent])

    useEffect(() => {
        loadComposeFile(workspace.path)
        loadOptionalStacksStatus()
    }, [workspace])

    return (
        <div className="space-y-4">
            <IGRPCard>
                <IGRPCardHeader className="compact-card-header">
                    <IGRPCardTitle className="text-sm">Optional Stacks</IGRPCardTitle>
                    <IGRPCardDescription className="text-xs">
                        Install optional compose stacks inside this workspace.
                    </IGRPCardDescription>
                </IGRPCardHeader>
                <IGRPCardContent className="compact-card-content space-y-3">
                    <div className="flex items-center justify-between rounded-md border p-3">
                        <div>
                            <div className="text-sm font-medium">Monitoring Stack</div>
                            <div className="text-xs text-muted-foreground">
                                Installs <code>compose-monitoring.yaml</code> from demo template.
                            </div>
                        </div>
                        {optionalStacksStatus.monitoringInstalled ? (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                                <CheckCircle2 className="h-4 w-4" />
                                Installed
                            </span>
                        ) : (
                            <IGRPButtonPrimitive
                                size="sm"
                                variant="outline"
                                onClick={() => void handleInstallOptionalStack('monitoring')}
                                disabled={installingStack !== null}
                            >
                                {installingStack === 'monitoring' ? (
                                    <RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" />
                                ) : null}
                                Install
                            </IGRPButtonPrimitive>
                        )}
                    </div>

                    <div className="flex items-center justify-between rounded-md border p-3">
                        <div>
                            <div className="text-sm font-medium">Process Stack</div>
                            <div className="text-xs text-muted-foreground">
                                Installs <code>compose-process.yaml</code> from demo template.
                            </div>
                        </div>
                        {optionalStacksStatus.processInstalled ? (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                                <CheckCircle2 className="h-4 w-4" />
                                Installed
                            </span>
                        ) : (
                            <IGRPButtonPrimitive
                                size="sm"
                                variant="outline"
                                onClick={() => void handleInstallOptionalStack('process')}
                                disabled={installingStack !== null}
                            >
                                {installingStack === 'process' ? (
                                    <RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" />
                                ) : null}
                                Install
                            </IGRPButtonPrimitive>
                        )}
                    </div>
                </IGRPCardContent>
            </IGRPCard>

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
                            <div className="text-xs font-medium px-3">{t('igrpComposeYml')}</div>
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
    )
}
