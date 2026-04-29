import {
    IGRPButtonPrimitive,
    IGRPSkeletonPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { AlertTriangle, BookOpen, MessageSquare, RotateCcw, X } from 'lucide-react'
import { type JSX, useCallback, useEffect, useMemo, useState } from 'react'
import {
    IGRPTabs,
    IGRPTabsContent,
    IGRPTabsList,
    IGRPTabsTrigger
} from '../../../../components/tabs'
import { AIAssistant } from '../../../../generators/specification/components/shared/AIAssistant'
import { useAutoSaveDiagram } from '../../hooks/useAutoSaveDiagram'
import { useProcessDefinition } from '../../hooks/useProcessDefinition'
import { useProjects } from '../../hooks/useProcessDefinitions'
import { DiagramTab } from './DiagramTab'
import { EditorHeader } from './EditorHeader'
import { ProcessDetails } from './ProcessDetails'
import { XmlTab } from './XmlTab'

export interface ProcessEditorProps {
    processId: string
    onClose?: () => void
}

type EditorTab = 'diagram' | 'xml'

const TabSkeleton = (): JSX.Element => (
    <div className="space-y-3 p-4">
        <IGRPSkeletonPrimitive className="h-4 w-1/3" />
        <IGRPSkeletonPrimitive className="h-[60vh] w-full" />
    </div>
)

interface ErrorStateProps {
    message: string
    onRetry: () => void
}

const ErrorState = ({ message, onRetry }: ErrorStateProps): JSX.Element => (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-sm">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="max-w-md text-center text-muted-foreground">{message}</p>
        <IGRPButtonPrimitive variant="outline" size="sm" onClick={onRetry}>
            <RotateCcw className="mr-1 h-4 w-4" />
            Retry
        </IGRPButtonPrimitive>
    </div>
)

export function ProcessEditor({ processId, onClose }: ProcessEditorProps): JSX.Element {
    const [tab, setTab] = useState<EditorTab>('diagram')
    const [sidePanel, setSidePanel] = useState<'closed' | 'delegates' | 'chat'>('closed')
    const helperOpen = sidePanel === 'delegates'
    const chatOpen = sidePanel === 'chat'
    const processQuery = useProcessDefinition(processId)
    const projectsQuery = useProjects()
    const autoSave = useAutoSaveDiagram(processId)

    const xml = processQuery.data?.bpmFileContent ?? ''
    const processKey = processQuery.data?.processKey ?? processId
    const processName = processQuery.data?.title ?? processKey

    const projectName = useMemo(() => {
        const projectId = processQuery.data?.projectId
        if (!projectId) return undefined
        return projectsQuery.data?.find((p) => p.projectId === projectId)?.name
    }, [processQuery.data?.projectId, projectsQuery.data])

    const handleChange = useCallback(
        (next: string): void => {
            autoSave.scheduleSave(next)
        },
        [autoSave]
    )

    // Cmd/Ctrl+S anywhere in the editor flushes the pending auto-save. Plan §M6.10.
    useEffect(() => {
        const onKey = (e: KeyboardEvent): void => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
                e.preventDefault()
                void autoSave.flush()
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [autoSave])

    const isLoading = processQuery.isLoading
    const loadError = processQuery.error

    return (
        <div className="flex h-full flex-col">
            <EditorHeader
                isSaving={autoSave.isSaving}
                isDirty={autoSave.isDirty}
                lastSavedAt={autoSave.lastSavedAt}
                onSave={() => void autoSave.flush()}
                onClose={onClose}
            />
            <ProcessDetails
                processName={isLoading ? 'Loading…' : processName}
                projectName={projectName}
            />
            <div className="flex flex-1 overflow-hidden">
            <IGRPTabs
                value={tab}
                onValueChange={(v) => setTab(v as EditorTab)}
                className="flex flex-1 flex-col overflow-hidden"
            >
                <div className="mx-4 mt-3 flex items-center justify-between gap-3">
                    <IGRPTabsList>
                        <IGRPTabsTrigger value="diagram">Diagram</IGRPTabsTrigger>
                        <IGRPTabsTrigger value="xml">XML</IGRPTabsTrigger>
                    </IGRPTabsList>
                    <div className="flex items-center gap-2">
                        {tab === 'diagram' && (
                            <IGRPButtonPrimitive
                                variant={helperOpen ? 'default' : 'outline'}
                                size="sm"
                                onClick={() =>
                                    setSidePanel((p) =>
                                        p === 'delegates' ? 'closed' : 'delegates'
                                    )
                                }
                            >
                                <BookOpen className="mr-1 h-4 w-4" />
                                Delegates reference
                            </IGRPButtonPrimitive>
                        )}
                        <IGRPButtonPrimitive
                            variant={chatOpen ? 'default' : 'outline'}
                            size="sm"
                            onClick={() =>
                                setSidePanel((p) => (p === 'chat' ? 'closed' : 'chat'))
                            }
                        >
                            <MessageSquare className="mr-1 h-4 w-4" />
                            Assistant
                        </IGRPButtonPrimitive>
                    </div>
                </div>
                <IGRPTabsContent value="diagram" className="flex-1 overflow-hidden p-0">
                    {loadError ? (
                        <ErrorState
                            message={loadError.message}
                            onRetry={() => processQuery.refetch()}
                        />
                    ) : isLoading ? (
                        <TabSkeleton />
                    ) : (
                        <DiagramTab
                            xml={xml}
                            processKey={processKey}
                            processName={processName}
                            onChange={handleChange}
                            helperOpen={helperOpen}
                            onHelperClose={() => setSidePanel('closed')}
                        />
                    )}
                </IGRPTabsContent>
                <IGRPTabsContent value="xml" className="flex-1 overflow-hidden p-4">
                    {loadError ? (
                        <ErrorState
                            message={loadError.message}
                            onRetry={() => processQuery.refetch()}
                        />
                    ) : isLoading ? (
                        <TabSkeleton />
                    ) : (
                        <XmlTab xml={xml} onChange={handleChange} />
                    )}
                </IGRPTabsContent>
            </IGRPTabs>
            {chatOpen && (
                <aside className="flex w-[360px] shrink-0 flex-col border-l bg-background">
                    <div className="flex items-center justify-between border-b px-3 py-2">
                        <h3 className="text-sm font-semibold">AI Assistant</h3>
                        <IGRPButtonPrimitive
                            variant="ghost"
                            size="sm"
                            onClick={() => setSidePanel('closed')}
                            aria-label="Close assistant"
                        >
                            <X className="h-4 w-4" />
                        </IGRPButtonPrimitive>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <AIAssistant
                            mode="process"
                            title=""
                            placeholder="Ask about this process…"
                            contextProvider={() => ({
                                systemPrompt: buildProcessSystemPrompt({
                                    processName,
                                    processKey,
                                    projectName,
                                    xml
                                })
                            })}
                            className="h-full"
                        />
                    </div>
                </aside>
            )}
            </div>
        </div>
    )
}

interface ProcessSystemPromptInput {
    processName: string
    processKey: string
    projectName?: string
    xml: string
}

function buildProcessSystemPrompt({
    processName,
    processKey,
    projectName,
    xml
}: ProcessSystemPromptInput): string {
    const header = [
        'You are an assistant helping the user understand and improve a BPMN 2.0 process diagram.',
        'The diagram is in Camunda dialect (the modeler view). When suggesting XML, return Camunda-flavoured BPMN.',
        '',
        `Process: ${processName} (key: ${processKey})`
    ]
    if (projectName) header.push(`Project: ${projectName}`)
    header.push('', 'Current BPMN XML:', '```xml', xml || '<!-- (empty) -->', '```')
    return header.join('\n')
}
