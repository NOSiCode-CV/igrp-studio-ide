/**
 * Local CLI LLM adapter — wraps `claude` and `ollama` binaries.
 *
 * Uses `child_process.spawn` (not node-pty) because we don't need a TTY for
 * non-interactive invocations. Output is line-buffered and re-emitted as
 * `delta` chunks so the renderer gets streaming.
 *
 * The factory function builds an adapter per CLI id; the LLMRouter registers
 * all detected CLIs at boot.
 */
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { specSettingsService } from '../spec-settings-service'
import {
    LLMNotConfiguredError,
    type LLMAdapter,
    type LLMChatChunk,
    type LLMChatOptions,
    type LLMMessage,
    type LLMModel
} from './types'

export type SupportedCLI = 'claude' | 'ollama'

interface CLIBinaryStatus {
    found: boolean
    path?: string
    version?: string
    error?: string
}

const BIN_DEFAULTS: Record<SupportedCLI, { bin: string; versionFlag: string }> = {
    claude: { bin: 'claude', versionFlag: '--version' },
    ollama: { bin: 'ollama', versionFlag: '--version' }
}

/**
 * Tries to spawn `<binary> --version` and resolves the binary status.
 * `binary` may be a bare command (resolved via PATH) or an absolute path.
 */
function probeBinary(id: SupportedCLI, binary: string): Promise<CLIBinaryStatus> {
    return new Promise((resolve) => {
        const proc = spawn(binary, [BIN_DEFAULTS[id].versionFlag], {
            shell: process.platform === 'win32'
        })
        let stdout = ''
        let stderr = ''
        proc.stdout.on('data', (d) => (stdout += d.toString()))
        proc.stderr.on('data', (d) => (stderr += d.toString()))
        proc.on('error', (err) => resolve({ found: false, error: err.message }))
        proc.on('close', (code) => {
            if (code === 0) {
                resolve({
                    found: true,
                    path: binary,
                    version: (stdout || stderr).trim().split('\n')[0]
                })
            } else {
                resolve({ found: false, error: stderr.trim() || `exit ${code}` })
            }
        })
    })
}

/**
 * Asks the user's login shell where the binary is. This catches PATH entries
 * defined in `.zshrc` / `.bashrc` (e.g. nvm-managed npm globals) that the
 * Electron process inherits empty when launched from the macOS Finder.
 */
function probeViaLoginShell(name: string): Promise<string | null> {
    if (process.platform === 'win32') return Promise.resolve(null)
    const shell = process.env.SHELL || '/bin/zsh'
    return new Promise((resolve) => {
        // -l = login (loads .zprofile), -i = interactive (loads .zshrc).
        // command -v is the POSIX-portable alternative to `which`.
        const proc = spawn(shell, ['-lic', `command -v ${name} 2>/dev/null`], {})
        let stdout = ''
        proc.stdout.on('data', (d) => (stdout += d.toString()))
        proc.on('error', () => resolve(null))
        proc.on('close', () => {
            const path = stdout.trim().split('\n').pop()?.trim()
            resolve(path && existsSync(path) ? path : null)
        })
    })
}

/**
 * Returns common install locations for a CLI — useful when the Electron
 * process boots without the user's shell PATH.
 */
function listKnownPaths(name: SupportedCLI): string[] {
    const home = homedir()
    const candidates = [
        join(home, '.claude', 'local', name),
        join(home, '.local', 'bin', name),
        join(home, '.npm-global', 'bin', name),
        '/opt/homebrew/bin/' + name,
        '/usr/local/bin/' + name,
        '/usr/bin/' + name
    ]
    // nvm: ~/.nvm/versions/node/<version>/bin/<name>
    const nvmVersionsDir = join(home, '.nvm', 'versions', 'node')
    try {
        if (existsSync(nvmVersionsDir)) {
            const versions = readdirSync(nvmVersionsDir).sort().reverse()
            for (const version of versions) {
                candidates.push(join(nvmVersionsDir, version, 'bin', name))
            }
        }
    } catch {
        // ignore filesystem hiccups
    }
    return candidates
}

/**
 * Resolves a CLI in this order:
 *   1. explicit override path saved in Settings
 *   2. bare command via the Electron process PATH
 *   3. user's login shell (zsh -lic)
 *   4. well-known install locations (nvm, ~/.claude/local, /opt/homebrew, …)
 */
async function detectCLI(id: SupportedCLI): Promise<CLIBinaryStatus> {
    const errors: string[] = []
    const overrides = specSettingsService.readPreferences().cliPaths ?? {}
    const override = overrides[id]

    if (override) {
        const status = await probeBinary(id, override)
        if (status.found) return status
        errors.push(`override (${override}): ${status.error}`)
    }

    // Try the bare name on the Electron process PATH.
    const direct = await probeBinary(id, BIN_DEFAULTS[id].bin)
    if (direct.found) return direct
    errors.push(`PATH lookup: ${direct.error}`)

    // Login-shell PATH (nvm, fnm, asdf, custom .zshrc).
    const shellPath = await probeViaLoginShell(BIN_DEFAULTS[id].bin)
    if (shellPath) {
        const status = await probeBinary(id, shellPath)
        if (status.found) return status
        errors.push(`login shell (${shellPath}): ${status.error}`)
    }

    // Probe known install locations.
    for (const candidate of listKnownPaths(id)) {
        if (!existsSync(candidate)) continue
        const status = await probeBinary(id, candidate)
        if (status.found) return status
        errors.push(`${candidate}: ${status.error}`)
    }

    return {
        found: false,
        error: errors[0] ?? 'binary not found in PATH or known locations'
    }
}

interface CLIAdapterOptions {
    id: SupportedCLI
    /** Models that should be exposed via listModels. For ollama we'll override at runtime. */
    staticModels?: LLMModel[]
}

class CLILLMAdapter implements LLMAdapter {
    readonly id: string
    readonly label: string
    private readonly cliId: SupportedCLI
    private statusCache: { ts: number; status: CLIBinaryStatus } | null = null

    constructor(private readonly opts: CLIAdapterOptions) {
        this.cliId = opts.id
        this.id = `cli:${opts.id}`
        this.label = opts.id === 'claude' ? 'Claude Code (CLI)' : 'Ollama (CLI)'
    }

    private async getStatus(force = false): Promise<CLIBinaryStatus> {
        if (!force && this.statusCache && Date.now() - this.statusCache.ts < 30_000) {
            return this.statusCache.status
        }
        const status = await detectCLI(this.cliId)
        this.statusCache = { ts: Date.now(), status }
        return status
    }

    async isReady(): Promise<boolean> {
        const status = await this.getStatus()
        return status.found
    }

    supportsVision(): boolean {
        return this.cliId === 'claude'
    }

    async listModels(): Promise<LLMModel[]> {
        const status = await this.getStatus()
        if (!status.found) return []
        if (this.cliId === 'ollama') {
            return this.listOllamaModels(status.path ?? 'ollama')
        }
        return (
            this.opts.staticModels ?? [
                {
                    id: 'claude-code',
                    label: 'Claude Code',
                    provider: this.id,
                    description: status.path
                }
            ]
        )
    }

    private listOllamaModels(bin: string): Promise<LLMModel[]> {
        return new Promise((resolve) => {
            const proc = spawn(bin, ['list'], {
                shell: process.platform === 'win32'
            })
            let stdout = ''
            proc.stdout.on('data', (d) => (stdout += d.toString()))
            proc.on('error', () => resolve([]))
            proc.on('close', () => {
                // ollama list output: "NAME    ID   SIZE   MODIFIED\nllama3.1 ..."
                const lines = stdout.trim().split('\n').slice(1)
                const models: LLMModel[] = lines
                    .map((line) => line.trim().split(/\s+/)[0])
                    .filter(Boolean)
                    .map((name) => ({ id: name, label: name, provider: this.id }))
                resolve(models)
            })
        })
    }

    async *chat(
        messages: LLMMessage[],
        opts: LLMChatOptions
    ): AsyncIterable<LLMChatChunk> {
        const status = await this.getStatus()
        if (!status.found) {
            throw new LLMNotConfiguredError(this.id)
        }

        const prompt = formatPrompt(messages, opts.systemPrompt)
        const proc = this.cliId === 'claude'
            ? this.spawnClaude(status.path ?? 'claude', opts.model)
            : this.spawnOllama(status.path ?? 'ollama', opts.model)

        // Pipe the prompt via stdin so we don't blow argv.
        proc.stdin.write(prompt)
        proc.stdin.end()

        const onAbort = () => {
            try {
                proc.kill('SIGTERM')
            } catch {
                // ignore
            }
        }
        opts.signal?.addEventListener('abort', onAbort)

        try {
            yield* readProcessStream(proc)
        } finally {
            opts.signal?.removeEventListener('abort', onAbort)
        }
    }

    private spawnClaude(bin: string, _model: string): ChildProcessWithoutNullStreams {
        // Claude Code CLI: `claude -p "<prompt>"` reads from argv. To stream,
        // pass `--output-format stream-json` if available; otherwise we read
        // the regular stdout and emit it as a single delta. We avoid argv to
        // keep large prompts safe → use `claude -` to read prompt from stdin.
        return spawn(bin, ['-p', '--output-format', 'text'], {
            shell: process.platform === 'win32'
        })
    }

    private spawnOllama(bin: string, model: string): ChildProcessWithoutNullStreams {
        return spawn(bin, ['run', model], { shell: process.platform === 'win32' })
    }
}

function formatPrompt(messages: LLMMessage[], systemPrompt?: string): string {
    // Most CLIs accept a single text prompt. We render a transcript so the
    // model sees full context. System prompt goes first.
    const parts: string[] = []
    if (systemPrompt) parts.push(`[system]\n${systemPrompt}`)
    for (const m of messages) parts.push(`[${m.role}]\n${m.content}`)
    parts.push('[assistant]\n')
    return parts.join('\n\n')
}

async function* readProcessStream(
    proc: ChildProcessWithoutNullStreams
): AsyncIterable<LLMChatChunk> {
    const stderr: string[] = []
    proc.stderr.on('data', (d) => stderr.push(d.toString()))

    const queue: LLMChatChunk[] = []
    let done = false
    let resolveNext: (() => void) | null = null

    const push = (chunk: LLMChatChunk) => {
        queue.push(chunk)
        resolveNext?.()
        resolveNext = null
    }

    proc.stdout.on('data', (d) => push({ type: 'delta', content: d.toString() }))
    proc.on('error', (err) => {
        push({ type: 'error', message: err.message, code: 'CLI_SPAWN' })
        done = true
        resolveNext?.()
    })
    proc.on('close', (code) => {
        if (code !== 0 && stderr.length > 0) {
            push({
                type: 'error',
                message: stderr.join('').trim() || `Exit ${code}`,
                code: `CLI_EXIT_${code}`
            })
        }
        push({ type: 'done' })
        done = true
        resolveNext?.()
    })

    while (!done || queue.length > 0) {
        if (queue.length === 0) {
            await new Promise<void>((r) => {
                resolveNext = r
            })
            continue
        }
        const chunk = queue.shift() as LLMChatChunk
        yield chunk
        if (chunk.type === 'done') return
    }
}

export function createCLIAdapter(id: SupportedCLI): CLILLMAdapter {
    return new CLILLMAdapter({ id })
}

export const cliAdapters = {
    claude: createCLIAdapter('claude'),
    ollama: createCLIAdapter('ollama')
}

/** Re-runs detection for every supported CLI (force=true). */
export async function detectAllCLIs(): Promise<Record<SupportedCLI, CLIBinaryStatus>> {
    const out: Partial<Record<SupportedCLI, CLIBinaryStatus>> = {}
    for (const id of Object.keys(BIN_DEFAULTS) as SupportedCLI[]) {
        out[id] = await detectCLI(id)
    }
    return out as Record<SupportedCLI, CLIBinaryStatus>
}

export type { CLIBinaryStatus }
