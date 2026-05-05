/**
 * Drives a Data Models AI Assistant turn: streams the LLM, parses the
 * entity-ops payload, applies the changes via `specDataService`, then emits
 * per-op result chunks to the renderer.
 *
 * Mirrors `prototype-generator-service` exactly — same chunk shapes, same
 * cancellation contract via AbortController.
 */
import { llmRouter } from '../llm/llm-router'
import type { LLMMessage } from '../llm/types'
import { specDataService } from '../spec-data-service'
import {
    applyEntityOps,
    parseEntityOps,
    type AppliedEntityOp,
    type EntityOp
} from './entity-ops'

export type DataChunk =
    | { type: 'delta'; content: string }
    | { type: 'op-applied'; op: AppliedEntityOp }
    | { type: 'op-failed'; op: EntityOp; error: string }
    | { type: 'summary'; summary: string }
    | { type: 'parse-error'; message: string; raw: string }
    | { type: 'error'; message: string; code?: string }
    | { type: 'done' }

export interface DataGenerateInput {
    basePath: string
    /** User message describing the change. */
    userMessage: string
    /** Renderer-built spec context (active doc + linked KB summary, …). */
    specContext?: string
    providerId: string
    model: string
    signal?: AbortSignal
}

class SpecDataGeneratorService {
    async *generate(input: DataGenerateInput): AsyncIterable<DataChunk> {
        const { basePath, userMessage, signal } = input

        const summaries = await specDataService.list(basePath)
        const entitiesSnapshot = await Promise.all(
            summaries.map((s) => specDataService.get(basePath, s.id))
        )
        const systemPrompt = buildSystemPrompt({
            specContext: input.specContext,
            entities: entitiesSnapshot.filter(Boolean) as NonNullable<
                typeof entitiesSnapshot[number]
            >[]
        })

        const messages: LLMMessage[] = [{ role: 'user', content: userMessage }]

        let buffer = ''
        try {
            const stream = llmRouter.chat(input.providerId, messages, {
                model: input.model,
                systemPrompt,
                signal
            })
            for await (const chunk of stream) {
                if (chunk.type === 'delta') {
                    buffer += chunk.content
                    yield { type: 'delta', content: chunk.content }
                } else if (chunk.type === 'error') {
                    yield { type: 'error', message: chunk.message, code: chunk.code }
                } else if (chunk.type === 'done') {
                    break
                }
            }
        } catch (err) {
            yield { type: 'error', message: err instanceof Error ? err.message : String(err) }
            yield { type: 'done' }
            return
        }

        if (!buffer.trim()) {
            yield { type: 'done' }
            return
        }

        let payload
        try {
            payload = parseEntityOps(buffer)
        } catch (err) {
            yield {
                type: 'parse-error',
                message: err instanceof Error ? err.message : String(err),
                raw: buffer
            }
            yield { type: 'done' }
            return
        }

        const result = await applyEntityOps(basePath, payload)
        for (const op of result.applied) yield { type: 'op-applied', op }
        for (const f of result.failed) yield { type: 'op-failed', op: f.op, error: f.error }
        yield { type: 'summary', summary: result.summary }
        yield { type: 'done' }
    }
}

export const specDataGeneratorService = new SpecDataGeneratorService()

// ─── prompt helpers ──────────────────────────────────────────────────────

interface PromptInput {
    specContext?: string
    entities: { id: string; name: string; fields: { name: string; type: string }[]; relations: { kind: string; toEntityId: string }[] }[]
}

function buildSystemPrompt({ specContext, entities }: PromptInput): string {
    const sections: string[] = []
    sections.push(
        [
            'You are the Data Modeller of an IGRP Studio "Specification" project. You evolve a canonical entity model used by the Documents and Prototype builders.',
            '',
            'Output contract — MANDATORY:',
            '- Reply with **one fenced JSON block** that follows this exact schema:',
            '  ```json',
            '  {',
            '    "summary": "<short description of the change>",',
            '    "ops": [',
            '      { "op": "entity-create", "name": "<PascalCase>", "fields": [{ "name": "...", "type": "string|int|decimal|boolean|date|datetime|json|enum|reference", "primaryKey": true, "nullable": false, "referenceEntityId": "<uuid>" }] },',
            '      { "op": "entity-update", "id": "<uuid>", "patch": { "name": "...", "fields": [...] } },',
            '      { "op": "entity-delete", "id": "<uuid>", "cascade": false },',
            '      { "op": "relation-add", "from": "EntityName.fieldName", "to": "EntityName.fieldName", "kind": "one-to-one|one-to-many|many-to-one|many-to-many" },',
            '      { "op": "relation-remove", "id": "<relationId>" }',
            '    ]',
            '  }',
            '  ```',
            '- For ops that target existing entities (entity-update / entity-delete / relation-remove), use the **id** from "Current entities" below.',
            '- For relation-add, use **EntityName.fieldName** strings; the studio resolves them to ids.',
            '- Field types are restricted to: string, int, decimal, boolean, date, datetime, json, enum, reference.',
            '- For analytical questions (no schema change), reply in prose without a JSON block — the studio detects this and skips apply.',
            '- No prose around the JSON block when emitting ops. The studio parses your reply directly.'
        ].join('\n')
    )

    if (specContext && specContext.trim()) {
        sections.push(`## Specification context\n\n${specContext.trim()}`)
    }

    sections.push(
        '## Current entities\n\n' +
            (entities.length === 0
                ? '_(empty — nothing has been authored yet)_'
                : entities
                      .map((e) => {
                          const fieldList = e.fields
                              .map((f) => `${f.name}: ${f.type}`)
                              .join(', ')
                          const relSummary = e.relations.length
                              ? ` · relations: ${e.relations.length}`
                              : ''
                          return `- **${e.name}** (id: \`${e.id}\`)${relSummary}\n  fields: ${fieldList || '(none)'}`
                      })
                      .join('\n'))
    )

    return sections.join('\n\n')
}
