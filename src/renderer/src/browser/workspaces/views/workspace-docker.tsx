'use client'

import { Button } from '@renderer/components/ui/button'
import {
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
import useToast from '@renderer/hooks/useToast'
import { AnimatePresence, motion } from 'motion/react'
import { Check, Copy, FileText, Loader2, Plus, RefreshCw, Save } from 'lucide-react'
import { createPortal } from 'react-dom'
import { type JSX, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { IWorkspace, OptionalStacksStatus } from 'src/main/types'

interface WorkspaceConfigProps {
    workspace: IWorkspace
    onStacksChanged?: () => Promise<void> | void
}

type ComposeTabId = 'main' | 'monitoring' | 'process'
type OptionalStackId = 'monitoring' | 'process'

interface ComposeTabConfig {
    id: ComposeTabId
    label: string
    fileName: string
    readOnly: boolean
}

const resolveComposeFilePath = (workspacePath: string, tabId: ComposeTabId): string => {
    if (tabId === 'monitoring') {
        return `${workspacePath}/monitoring/igrp-monitoring-compose.yaml`
    }
    if (tabId === 'process') {
        return `${workspacePath}/process/igrp-process-compose.yaml`
    }
    return `${workspacePath}/igrp-compose.yaml`
}

const resolveComposeFileCandidates = (workspacePath: string, tabId: ComposeTabId): string[] => {
    if (tabId === 'monitoring') {
        return [
            `${workspacePath}/monitoring/igrp-monitoring-compose.yaml`,
            `${workspacePath}/compose-monitoring.yaml`
        ]
    }
    if (tabId === 'process') {
        return [
            `${workspacePath}/process/igrp-process-compose.yaml`,
            `${workspacePath}/compose-process.yaml`
        ]
    }
    return [`${workspacePath}/igrp-compose.yaml`]
}

export function WorkspaceDocker({ workspace, onStacksChanged }: WorkspaceConfigProps): JSX.Element {
    const [copied, setCopied] = useState(false)
    const [activeComposeTab, setActiveComposeTab] = useState<ComposeTabId>('main')
    const [composeContent, setComposeContent] = useState('')
    const [activeComposeFilePath, setActiveComposeFilePath] = useState(
        resolveComposeFilePath(workspace.path, 'main')
    )
    const [isEditorLoading, setIsEditorLoading] = useState(false)
    const [installingStack, setInstallingStack] = useState<OptionalStackId | null>(null)
    const [optionalStacksStatus, setOptionalStacksStatus] = useState<OptionalStacksStatus>({
        monitoringInstalled: false,
        processInstalled: false
    })
    const [addStackMenuOpen, setAddStackMenuOpen] = useState(false)
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })

    const addStackButtonRef = useRef<HTMLButtonElement | null>(null)
    const addStackMenuRef = useRef<HTMLDivElement | null>(null)

    const { services } = useDocker({ workspace })

    const {
        actions: { saveCustomWorkspaceComposeFile, installOptionalStacks, getOptionalStacksStatus }
    } = useWorkspace()
    const { showErrorToast } = useToast()

    const { t } = useTranslation()

    const composeTabs = useMemo<ComposeTabConfig[]>(() => {
        const tabs: ComposeTabConfig[] = [
            {
                id: 'main',
                label: 'Main Compose',
                fileName: 'igrp-compose.yaml',
                readOnly: false
            }
        ]

        if (optionalStacksStatus.monitoringInstalled) {
            tabs.push({
                id: 'monitoring',
                label: 'Monitoring',
                fileName: 'igrp-monitoring-compose.yaml',
                readOnly: true
            })
        }

        if (optionalStacksStatus.processInstalled) {
            tabs.push({
                id: 'process',
                label: 'Process',
                fileName: 'igrp-process-compose.yaml',
                readOnly: true
            })
        }

        return tabs
    }, [optionalStacksStatus])

    const activeTabConfig = useMemo(() => {
        return composeTabs.find((tab) => tab.id === activeComposeTab) ?? composeTabs[0]
    }, [activeComposeTab, composeTabs])

    const isReadOnly = activeTabConfig?.readOnly ?? true

    const loadOptionalStacksStatus = useCallback(async (): Promise<void> => {
        const status = await getOptionalStacksStatus()
        setOptionalStacksStatus(status)
    }, [getOptionalStacksStatus])

    const loadComposeTabContent = useCallback(
        async (tabId: ComposeTabId): Promise<void> => {
            setIsEditorLoading(true)
            try {
                const candidates = resolveComposeFileCandidates(workspace.path, tabId)

                for (const filePath of candidates) {
                    try {
                        const raw = await window.api.getFileContent(filePath)
                        if (typeof raw === 'string') {
                            setComposeContent(raw)
                            setActiveComposeFilePath(filePath)
                            return
                        }
                    } catch {
                        // Try the next legacy/alternative file path.
                    }
                }

                setComposeContent('')
                setActiveComposeFilePath(candidates[0])
            } catch {
                setComposeContent('')
                setActiveComposeFilePath(resolveComposeFilePath(workspace.path, tabId))
            } finally {
                setIsEditorLoading(false)
            }
        },
        [workspace.path]
    )

    const handleCopyYaml = (): void => {
        if (!composeContent) return
        navigator.clipboard.writeText(composeContent)
        setCopied(true)
        setTimeout(() => setCopied(false), 1800)
    }

    const handleSaveService = (): void => {
        if (!isReadOnly && composeContent) {
            saveCustomWorkspaceComposeFile(composeContent)
        }
    }

    const handleInstallOptionalStack = async (stack: OptionalStackId): Promise<void> => {
        setInstallingStack(stack)
        try {
            const response = (await installOptionalStacks({
                installMonitoringStack: stack === 'monitoring',
                installProcessStack: stack === 'process'
            })) as { error?: string; errors?: string[] }

            const status = await getOptionalStacksStatus()
            setOptionalStacksStatus(status)
            const installedNow =
                stack === 'monitoring' ? status.monitoringInstalled : status.processInstalled

            if (installedNow) {
                setActiveComposeTab(stack)
                if (onStacksChanged) {
                    await onStacksChanged()
                }
            } else {
                const responseError = typeof response?.error === 'string' ? response.error : ''
                const responseErrors = Array.isArray(response?.errors) ? response.errors : []
                const errorMessage =
                    responseError || responseErrors.join('\n') || `Failed to install ${stack} stack`
                showErrorToast(errorMessage)
            }
        } finally {
            setInstallingStack(null)
            setAddStackMenuOpen(false)
        }
    }

    const needsMonitoringTemplateUpgrade = useCallback(async (): Promise<boolean> => {
        try {
            const composePath = `${workspace.path}/monitoring/igrp-monitoring-compose.yaml`
            const raw = await window.api.getFileContent(composePath)
            if (typeof raw !== 'string' || !raw.trim()) return true
            const content = raw.toLowerCase()
            const requiredMarkers = [
                'otel-collector',
                'prometheus',
                'cadvisor',
                'loki',
                'tempo',
                'grafana'
            ]
            return !requiredMarkers.every((marker) => content.includes(marker))
        } catch {
            return true
        }
    }, [workspace.path])

    const handleSelectOptionalStack = async (stack: OptionalStackId): Promise<void> => {
        const alreadyInstalled =
            stack === 'monitoring'
                ? optionalStacksStatus.monitoringInstalled
                : optionalStacksStatus.processInstalled

        if (alreadyInstalled) {
            if (stack === 'monitoring') {
                const shouldUpgrade = await needsMonitoringTemplateUpgrade()
                if (shouldUpgrade) {
                    await handleInstallOptionalStack('monitoring')
                    return
                }
            }
            setActiveComposeTab(stack)
            setAddStackMenuOpen(false)
            if (onStacksChanged) {
                void onStacksChanged()
            }
            return
        }

        await handleInstallOptionalStack(stack)
    }

    const openAddStackMenu = (): void => {
        const anchor = addStackButtonRef.current
        if (!anchor) return
        const rect = anchor.getBoundingClientRect()
        setMenuPosition({
            top: rect.bottom + 8,
            left: rect.right - 192
        })
        setAddStackMenuOpen(true)
    }

    useEffect(() => {
        void loadOptionalStacksStatus()
    }, [loadOptionalStacksStatus, workspace.path])

    useEffect(() => {
        if (!composeTabs.some((tab) => tab.id === activeComposeTab)) {
            setActiveComposeTab('main')
        }
    }, [activeComposeTab, composeTabs])

    useEffect(() => {
        void loadComposeTabContent(activeComposeTab)
    }, [activeComposeTab, loadComposeTabContent])

    useEffect(() => {
        const onMouseDown = (event: MouseEvent): void => {
            if (!addStackMenuOpen) return
            const target = event.target as Node
            if (
                addStackMenuRef.current &&
                !addStackMenuRef.current.contains(target) &&
                addStackButtonRef.current &&
                !addStackButtonRef.current.contains(target)
            ) {
                setAddStackMenuOpen(false)
            }
        }

        document.addEventListener('mousedown', onMouseDown)
        return () => document.removeEventListener('mousedown', onMouseDown)
    }, [addStackMenuOpen])

    return (
        <div className="space-y-4">
            <IGRPCard className="rounded-xl border border-slate-200 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <IGRPCardHeader className="compact-card-header gap-2">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <IGRPCardTitle className="text-sm">{t('dockerComposeConfiguration')}</IGRPCardTitle>
                            <IGRPCardDescription className="text-[11px] text-slate-500 dark:text-slate-400">
                                {t('manageComposeFile')}
                            </IGRPCardDescription>
                        </div>
                    </div>

                    <div className="relative mt-2 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700">
                        {composeTabs.map((tab) => {
                            const active = activeTabConfig?.id === tab.id
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveComposeTab(tab.id)}
                                    className={`relative flex items-center gap-1.5 pb-2 pr-2 text-[11px] font-medium transition-colors ${
                                        active
                                            ? 'text-teal-600 dark:text-teal-400'
                                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                    }`}
                                >
                                    <FileText className="h-3.5 w-3.5" />
                                    <span>{tab.fileName}</span>
                                    {active ? (
                                        <motion.span
                                            layoutId="compose-active-underline"
                                            className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-teal-500"
                                            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                                        />
                                    ) : null}
                                </button>
                            )
                        })}
                        <button
                            ref={addStackButtonRef}
                            type="button"
                            onClick={openAddStackMenu}
                            disabled={installingStack !== null}
                            className={`relative ml-2 flex items-center gap-1.5 pb-2 text-[11px] font-medium transition-colors ${
                                addStackMenuOpen
                                    ? 'text-teal-600 dark:text-teal-400'
                                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                            }`}
                        >
                            {installingStack ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Plus className="h-3.5 w-3.5" />
                            )}
                            <span>Add Stack</span>
                        </button>
                    </div>
                </IGRPCardHeader>

                <IGRPCardContent className="compact-card-content space-y-3">
                    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800/60">
                            <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                                <span>{activeTabConfig?.fileName}</span>
                                {isReadOnly ? (
                                    <span className="rounded-sm border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                                        Read-only
                                    </span>
                                ) : null}
                            </div>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 rounded-sm p-0 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                                onClick={() => void loadComposeTabContent(activeComposeTab)}
                            >
                                <RefreshCw className="h-3.5 w-3.5" />
                            </Button>
                        </div>

                        <div className="docker-compose-editor">
                            {isEditorLoading ? (
                                <div className="flex h-[50vh] items-center justify-center text-[11px] text-slate-500 dark:text-slate-400">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Loading compose file...
                                </div>
                            ) : (
                                <MonacoEditor
                                    filePath={activeComposeFilePath}
                                    content={composeContent}
                                    height="50vh"
                                    onChange={setComposeContent}
                                    options={{
                                        readOnly: isReadOnly,
                                        lineNumbers: 'on',
                                        lineNumbersMinChars: 3,
                                        fontSize: 11,
                                        lineHeight: 16,
                                        fontFamily:
                                            "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </IGRPCardContent>

                <IGRPCardFooter className="compact-card-footer flex items-center justify-between border-t border-slate-200 pt-3 dark:border-slate-700">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {services.filter((s) => s.status === 'running').length} {t('servicesEnabled')}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            className="h-7 rounded-lg border-slate-200 px-2.5 text-[11px] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                            variant="outline"
                            onClick={() => void loadComposeTabContent(activeComposeTab)}
                        >
                            <RefreshCw className="mr-1 h-3.5 w-3.5" />
                            Refresh
                        </Button>
                        <Button
                            size="sm"
                            className="h-7 rounded-lg border-slate-200 px-2.5 text-[11px] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                            variant="outline"
                            onClick={handleCopyYaml}
                        >
                            {copied ? (
                                <>
                                    <Check className="mr-1 h-3.5 w-3.5 text-emerald-600" />
                                    {t('copied')}
                                </>
                            ) : (
                                <>
                                    <Copy className="mr-1 h-3.5 w-3.5" />
                                    {t('copy')}
                                </>
                            )}
                        </Button>
                        <Button
                            size="sm"
                            className="h-7 rounded-lg bg-teal-600 px-2.5 text-[11px] text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
                            onClick={handleSaveService}
                            disabled={isReadOnly || !composeContent}
                        >
                            <Save className="mr-1 h-3.5 w-3.5" />
                            {t('save')}
                        </Button>
                    </div>
                </IGRPCardFooter>
            </IGRPCard>

            {typeof document !== 'undefined'
                ? createPortal(
                      <AnimatePresence>
                          {addStackMenuOpen ? (
                              <motion.div
                                  ref={addStackMenuRef}
                                  initial={{ opacity: 0, y: -4, scale: 0.98 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                                  transition={{ duration: 0.14 }}
                                  style={{ top: menuPosition.top, left: menuPosition.left }}
                                  className="fixed z-50 w-48 rounded-lg border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900"
                              >
                                  <button
                                      type="button"
                                      className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[11px] text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                                      onClick={() => void handleSelectOptionalStack('monitoring')}
                                  >
                                      <span>Monitoring Stack</span>
                                      {installingStack === 'monitoring' ? (
                                          <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                                      ) : optionalStacksStatus.monitoringInstalled ? (
                                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                                      ) : null}
                                  </button>
                                  <button
                                      type="button"
                                      className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[11px] text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                                      onClick={() => void handleSelectOptionalStack('process')}
                                  >
                                      <span>Process Stack</span>
                                      {installingStack === 'process' ? (
                                          <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                                      ) : optionalStacksStatus.processInstalled ? (
                                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                                      ) : null}
                                  </button>
                              </motion.div>
                          ) : null}
                      </AnimatePresence>,
                      document.body
                  )
                : null}
        </div>
    )
}
