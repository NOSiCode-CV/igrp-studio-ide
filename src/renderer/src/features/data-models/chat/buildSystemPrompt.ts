import type { Entity } from '../types/entity'

interface BuildPromptInput {
    entities: Entity[]
    /** Optional active document content (when a doc is selected in Documents). */
    activeDoc?: { name: string; content: string } | null
    /** RAG hits when "Use KB" is on. */
    kbHits?: { id: string; text: string }[]
}

/**
 * Renderer-side context builder for the Data Models AI Assistant.
 *
 * The main-process generator service (`spec-data-generator-service`) attaches
 * its own output-contract preamble; what we add here is project-scoped
 * context the model needs in order to produce sensible entity-ops.
 */
export function buildDataSystemPrompt({ entities, activeDoc, kbHits }: BuildPromptInput): string {
    const sections: string[] = []

    sections.push(
        '## Current entities\n\n' +
            (entities.length === 0
                ? '_(empty — nothing has been authored yet; use entity-create to bootstrap)_'
                : entities
                      .map((e) => {
                          const fieldList = e.fields.map((f) => `${f.name}: ${f.type}`).join(', ')
                          const relSummary = e.relations.length
                              ? ` · relations: ${e.relations.length}`
                              : ''
                          return `- **${e.name}** (id: \`${e.id}\`)${relSummary}\n  fields: ${fieldList || '(none)'}`
                      })
                      .join('\n'))
    )

    if (activeDoc && activeDoc.content.trim()) {
        sections.push(`## Active document — ${activeDoc.name}\n\n${activeDoc.content.trim()}`)
    }

    if (kbHits && kbHits.length > 0) {
        sections.push(
            `## Knowledge base excerpts (top ${kbHits.length})\n\n` +
                kbHits.map((h, i) => `### Excerpt ${i + 1}\n\n${h.text}`).join('\n\n')
        )
    }

    return sections.join('\n\n')
}
