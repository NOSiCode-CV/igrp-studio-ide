/**
 * IPC for the LLM router and Specification settings (LLM + embeddings keys).
 *
 * Streaming model: the renderer calls `chat-start` with a `requestId`. The
 * main process pumps chunks via `spec:llm:chat-chunk` events tagged with the
 * same id. `chat-cancel` triggers an AbortController so the adapter can stop.
 */
import { BrowserWindow, ipcMain } from 'electron'
import { EVENTS } from '../constants/events'
import { embeddingsService } from '../services/embeddings-service'
import { detectAllCLIs } from '../services/llm/cli-llm-service'
import { llmRouter } from '../services/llm/llm-router'
import type { LLMChatChunk, LLMMessage } from '../services/llm/types'
import {
    specSettingsService,
    type SpecPreferences,
    type SpecSecrets
} from '../services/spec-settings-service'

const activeRequests = new Map<string, AbortController>()

function emitChunk(webContents: Electron.WebContents, requestId: string, chunk: LLMChatChunk) {
    if (webContents.isDestroyed()) return
    webContents.send(EVENTS.SPEC_LLM.CHAT_CHUNK, { requestId, chunk })
}

ipcMain.handle(EVENTS.SPEC_LLM.STATUSES, async () => {
    return llmRouter.statuses()
})

ipcMain.handle(EVENTS.SPEC_LLM.DETECT_CLIS, async () => {
    return detectAllCLIs()
})

ipcMain.handle(EVENTS.SPEC_LLM.LIST_MODELS, async () => {
    return llmRouter.listAllModels()
})

ipcMain.handle(
    EVENTS.SPEC_LLM.CHAT_START,
    async (
        event,
        {
            requestId,
            providerId,
            messages,
            model,
            temperature,
            maxTokens,
            systemPrompt
        }: {
            requestId: string
            providerId: string
            messages: LLMMessage[]
            model: string
            temperature?: number
            maxTokens?: number
            systemPrompt?: string
        }
    ) => {
        const controller = new AbortController()
        activeRequests.set(requestId, controller)
        const sender = event.sender

        let sawDone = false
        try {
            const stream = llmRouter.chat(providerId, messages, {
                model,
                temperature,
                maxTokens,
                systemPrompt,
                signal: controller.signal
            })
            for await (const chunk of stream) {
                emitChunk(sender, requestId, chunk)
                if (chunk.type === 'done') {
                    sawDone = true
                    break
                }
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err)
            emitChunk(sender, requestId, { type: 'error', message })
        } finally {
            // Always close the stream on the renderer side so `streaming` flips
            // to false and the Retry button can appear after errors.
            if (!sawDone) emitChunk(sender, requestId, { type: 'done' })
            activeRequests.delete(requestId)
        }
        return { ok: true }
    }
)

ipcMain.handle(
    EVENTS.SPEC_LLM.CHAT_CANCEL,
    async (_event, { requestId }: { requestId: string }) => {
        const controller = activeRequests.get(requestId)
        if (controller) controller.abort()
        activeRequests.delete(requestId)
        return { ok: true }
    }
)

// ─── Settings (LLM + embeddings keys, preferences) ─────────────────────────

ipcMain.handle(EVENTS.SPEC_SETTINGS.GET_SECRETS_STATUS, async () => {
    return specSettingsService.getSecretsStatus()
})

ipcMain.handle(
    EVENTS.SPEC_SETTINGS.SET_SECRET,
    async (_event, { provider, value }: { provider: keyof SpecSecrets; value: string }) => {
        await specSettingsService.writeSecrets({ [provider]: value } as Partial<SpecSecrets>)
        // Embeddings + LLM caches must drop so the new key takes effect immediately.
        embeddingsService.invalidate()
        return specSettingsService.getSecretsStatus()
    }
)

ipcMain.handle(
    EVENTS.SPEC_SETTINGS.TEST_SECRET,
    async (
        _event,
        { provider }: { provider: keyof SpecSecrets }
    ): Promise<{
        ok: boolean
        error?: string
    }> => {
        try {
            if (provider === 'openrouter') {
                const adapter = llmRouter.get('openrouter')
                const ok = await adapter.isReady()
                if (!ok) return { ok: false, error: 'No API key configured.' }
                await adapter.listModels()
                return { ok: true }
            }
            if (provider === 'openai') {
                const adapter = await embeddingsService.getAdapter({ provider: 'openai' })
                await adapter.embed(['test'])
                return { ok: true }
            }
            return { ok: false, error: `Test not implemented for ${provider}` }
        } catch (err) {
            return { ok: false, error: err instanceof Error ? err.message : String(err) }
        }
    }
)

ipcMain.handle(EVENTS.SPEC_SETTINGS.GET_PREFERENCES, async () => {
    return specSettingsService.readPreferences()
})

ipcMain.handle(
    EVENTS.SPEC_SETTINGS.SET_PREFERENCES,
    async (_event, patch: Partial<SpecPreferences>) => {
        return specSettingsService.writePreferences(patch)
    }
)

// Mark BrowserWindow import as used in some lint configurations.
void BrowserWindow
