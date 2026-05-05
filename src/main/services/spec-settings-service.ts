/**
 * Encrypted, app-wide settings storage for the Specification project type.
 *
 * Lives in `<userData>/spec-secrets.bin` (encrypted via Electron `safeStorage`)
 * for sensitive values, and `<userData>/spec-settings.json` (plain JSON) for
 * preferences that don't need encryption.
 *
 * Keep this module narrow — it's used by the LLMRouter, the embeddings
 * adapter and the future Settings UI handler.
 */
import fs from 'node:fs'
import { promises as fsp } from 'node:fs'
import { join } from 'node:path'
import { app, safeStorage } from 'electron'

export interface SpecSecrets {
    openrouter?: string
    openai?: string
    voyage?: string
}

export interface SpecPreferences {
    /** Default LLM (`<provider>:<model>`), e.g. `openrouter:anthropic/claude-sonnet-4.5`. */
    defaultLLM?: string
    /** Default embeddings provider/model. */
    defaultEmbeddings?: { provider: 'openai' | 'voyage' | 'stub'; model: string }
    /** Custom CLI paths that override PATH lookups. */
    cliPaths?: Record<string, string>
}

const SECRETS_FILE = 'spec-secrets.bin'
const PREFS_FILE = 'spec-settings.json'

function userDir(): string {
    return app.getPath('userData')
}

function secretsPath(): string {
    return join(userDir(), SECRETS_FILE)
}

function prefsPath(): string {
    return join(userDir(), PREFS_FILE)
}

export class SpecSettingsService {
    // ─── Secrets (encrypted) ─────────────────────────────────────────────

    readSecrets(): SpecSecrets {
        try {
            if (!fs.existsSync(secretsPath())) return {}
            if (!safeStorage.isEncryptionAvailable()) return {}
            const buf = fs.readFileSync(secretsPath())
            const json = safeStorage.decryptString(buf)
            return JSON.parse(json) as SpecSecrets
        } catch {
            return {}
        }
    }

    async writeSecrets(patch: Partial<SpecSecrets>): Promise<SpecSecrets> {
        const current = this.readSecrets()
        // Empty string means "remove key" — handy for Settings UI clear buttons.
        const next: SpecSecrets = { ...current }
        for (const [k, v] of Object.entries(patch)) {
            if (typeof v === 'string' && v.length === 0) {
                delete next[k as keyof SpecSecrets]
            } else if (typeof v === 'string') {
                next[k as keyof SpecSecrets] = v
            }
        }
        if (!safeStorage.isEncryptionAvailable()) {
            throw new Error('safeStorage encryption is not available on this platform.')
        }
        const encrypted = safeStorage.encryptString(JSON.stringify(next))
        await fsp.writeFile(secretsPath(), encrypted)
        return next
    }

    /** Returns the secret without leaking it to the renderer. Used internally by adapters. */
    getSecret(key: keyof SpecSecrets): string | undefined {
        // Env vars take precedence so contributors can override via shell.
        const envKey = key.toUpperCase() + '_API_KEY'
        const fromEnv = process.env[envKey] || process.env[key.toUpperCase()]
        if (fromEnv) return fromEnv
        const stored = this.readSecrets()[key]
        return stored && stored.length > 0 ? stored : undefined
    }

    /** Renderer-safe view: which providers have a key configured (no values). */
    getSecretsStatus(): Record<keyof SpecSecrets, boolean> {
        const stored = this.readSecrets()
        return {
            openrouter: !!this.getSecret('openrouter') || !!stored.openrouter,
            openai: !!this.getSecret('openai') || !!stored.openai,
            voyage: !!this.getSecret('voyage') || !!stored.voyage
        }
    }

    // ─── Preferences (plain JSON) ────────────────────────────────────────

    readPreferences(): SpecPreferences {
        try {
            if (!fs.existsSync(prefsPath())) return {}
            const raw = fs.readFileSync(prefsPath(), 'utf-8')
            return JSON.parse(raw) as SpecPreferences
        } catch {
            return {}
        }
    }

    async writePreferences(patch: Partial<SpecPreferences>): Promise<SpecPreferences> {
        const current = this.readPreferences()
        const next: SpecPreferences = { ...current, ...patch }
        await fsp.writeFile(prefsPath(), JSON.stringify(next, null, 2), 'utf-8')
        return next
    }
}

export const specSettingsService = new SpecSettingsService()
