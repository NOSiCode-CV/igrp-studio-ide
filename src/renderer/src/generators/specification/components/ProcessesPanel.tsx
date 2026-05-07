import type { RootState } from '@renderer/redux'
import { Workflow } from 'lucide-react'
import { type JSX, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { ProcessEditor } from '../../../features/bpmn/components/ProcessEditor/ProcessEditor'
import type { ProcessChatAddendum } from '../../../features/bpmn/components/ProcessEditor/ProcessEditor'
import { ProcessList } from '../../../features/bpmn/components/ProcessList'
import { useProcessesSelection } from '../../../features/bpmn/components/ProcessesSelection'

interface ProcessesPanelProps {
    basePath?: string
    currentItem?: any
    variant?: 'list' | 'content'
}

const ListVariant = (): JSX.Element => <ProcessList variant="panel" />

interface ContentVariantProps {
    basePath?: string
}

const ContentVariant = ({ basePath }: ContentVariantProps): JSX.Element => {
    const { processId, setProcessId } = useProcessesSelection()
    const kbItems = useSelector((s: RootState) => s.specKB.items)
    const docs = useSelector((s: RootState) => s.specDocs.nodes)

    /**
     * Spec-aware chat context — the AIAssistant's `contextProvider` calls
     * `chatAddendum.build` per turn, so we ground the LLM in:
     *   - the list of KB items in this spec (for orientation)
     *   - the document tree summary (so the assistant knows what specs exist)
     *   - actual KB chunks via RAG when "Use KB" is enabled and the user typed
     *     a query — fetched from LanceDB scoped to this `basePath`.
     */
    const chatAddendum = useMemo<ProcessChatAddendum | undefined>(() => {
        if (!basePath) return undefined
        return {
            supportsKB: kbItems.length > 0,
            build: async ({ userMessage, useKB }) => {
                const sections: string[] = []

                if (kbItems.length > 0) {
                    const names = kbItems.map((k) => `- ${k.name}`).join('\n')
                    sections.push(`## Spec Knowledge Base items (${kbItems.length})\n${names}`)
                }

                if (docs.length > 0) {
                    const docNames = docs
                        .filter((d) => d.type === 'file')
                        .slice(0, 30)
                        .map((d) => `- ${d.name}`)
                        .join('\n')
                    if (docNames) {
                        sections.push(`## Spec documents\n${docNames}`)
                    }
                }

                let labelSuffix = ''
                if (useKB && kbItems.length > 0 && userMessage.trim()) {
                    try {
                        const hits = await window.specKB.search(basePath, userMessage, 6, {
                            kbItemIds: kbItems.map((k) => k.id)
                        })
                        if (hits.length > 0) {
                            const lookup = new Map(kbItems.map((k) => [k.id, k.name]))
                            const formatted = hits
                                .map((h, idx) => {
                                    const ownerId = h.metadata?.kbItemId as string | undefined
                                    const ownerName = ownerId
                                        ? (lookup.get(ownerId) ?? ownerId)
                                        : 'Unknown'
                                    return `### Chunk ${idx + 1} · score ${h.score.toFixed(3)} · from "${ownerName}"\n\n${h.text}`
                                })
                                .join('\n\n---\n\n')
                            sections.push(
                                `## Knowledge Base context (top ${hits.length} chunks, retrieved from spec KB)\n\n${formatted}`
                            )
                            labelSuffix = ` · ${hits.length} KB chunks`
                        } else {
                            sections.push(
                                '## Knowledge Base context\n_Search ran but found no chunks above relevance threshold._'
                            )
                        }
                    } catch (err) {
                        sections.push(
                            `## Knowledge Base context\n_Search failed: ${err instanceof Error ? err.message : String(err)}_`
                        )
                    }
                } else if (kbItems.length > 0) {
                    labelSuffix = ` · ${kbItems.length} KB available`
                }

                return { text: sections.join('\n\n'), labelSuffix }
            }
        }
    }, [basePath, kbItems, docs])

    if (!processId) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
                <Workflow className="h-10 w-10" />
                <p className="text-sm">Select a process from the list to start editing.</p>
            </div>
        )
    }

    return (
        <ProcessEditor
            processId={processId}
            onClose={() => setProcessId(undefined)}
            chatAddendum={chatAddendum}
        />
    )
}

const ProcessesPanel = ({ basePath, variant = 'content' }: ProcessesPanelProps): JSX.Element => {
    return variant === 'list' ? <ListVariant /> : <ContentVariant basePath={basePath} />
}

export default ProcessesPanel
