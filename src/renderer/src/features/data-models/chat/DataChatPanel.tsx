import {
    AIAssistant,
    type AIAssistantContext,
    type AIAssistantContextInput
} from '@renderer/generators/specification/components/shared/AIAssistant'
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import type { Entity } from '../types/entity'
import { buildDataSystemPrompt } from './buildSystemPrompt'

interface DataChatPanelProps {
    basePath: string
    /**
     * The active document (when one is selected in the Documents tab).
     * The host owns this; we only consume it for prompt building.
     */
    activeDoc?: { name: string; content: string } | null
    /** Linked KB item ids to drive the "Use KB" RAG flow. */
    activeKbRefs?: string[]
    className?: string
}

/**
 * Mounts the shared `<AIAssistant />` in `mode='data'`. Builds the system
 * prompt from the project's entities (always) + active doc (when any) +
 * KB chunks (when "Use KB" is on).
 */
export function DataChatPanel({
    basePath,
    activeDoc,
    activeKbRefs,
    className
}: DataChatPanelProps): React.ReactNode {
    const dispatch = useDispatch()

    const contextProvider = useCallback(
        async ({ userMessage, useKB }: AIAssistantContextInput): Promise<AIAssistantContext> => {
            const summaries = await window.specData.list(basePath)
            const fulls = await Promise.all(
                summaries.map((s) => window.specData.get(basePath, s.id))
            )
            const entities = fulls.filter(Boolean) as Entity[]

            let kbHits: { id: string; text: string }[] | undefined
            if (useKB && userMessage.trim()) {
                try {
                    const hits = await window.specKB.search(
                        basePath,
                        userMessage,
                        6,
                        activeKbRefs && activeKbRefs.length > 0
                            ? { kbItemIds: activeKbRefs }
                            : undefined
                    )
                    kbHits = hits.map((h) => ({ id: h.id, text: h.text }))
                } catch {
                    // RAG miss — proceed without KB context.
                }
            }

            return {
                systemPrompt: buildDataSystemPrompt({
                    entities,
                    activeDoc,
                    kbHits
                })
            }
        },
        [basePath, activeDoc, activeKbRefs]
    )

    return (
        <AIAssistant
            mode="data"
            title="Data Assistant"
            placeholder="Describe the entities or relations to add…"
            submitLabel="Plan"
            supportsKB
            chatBackend={{
                kind: 'data',
                basePath,
                onTurnEvent: (action) =>
                    dispatch(action as { type: string; payload?: unknown })
            }}
            contextProvider={contextProvider}
            className={className}
        />
    )
}
