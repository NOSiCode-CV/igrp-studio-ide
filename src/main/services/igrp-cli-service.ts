/**
 * Detects and updates the globally installed `@igrp/cli`.
 *
 * Electron apps launched from Finder/Dock inherit a minimal PATH (no nvm),
 * so probes and installs run through the user's login shell whenever possible
 * — same approach as `cli-llm-service`.
 *
 * This is the single install implementation used by:
 *   - onboarding (`window.api.installIGRPCLI`)
 *   - CLI update notification (same IPC, optional version pin)
 */
import { spawn } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, delimiter, join } from 'node:path'
import {
    buildIgrpCliInstallCommand,
    IGRP_CLI_PACKAGE,
    IGRP_CLI_REGISTRY
} from '@shared/igrp-cli'
import { getShellEnv } from '../helpers/ideDetection'

export { IGRP_CLI_PACKAGE, IGRP_CLI_REGISTRY, buildIgrpCliInstallCommand } from '@shared/igrp-cli'

export interface IgrpCliCheckResult {
    installed: string | null
    latest: string | null
    hasUpdate: boolean
    missing: boolean
    error?: string
}

export interface IgrpCliInstallResult {
    success: boolean
    output?: string
    error?: string
}

function isNewerVersion(latest: string, installed: string): boolean {
    const parse = (v: string): [number, number, number] | null => {
        const m = /^(\d+)\.(\d+)\.(\d+)/.exec(v.trim())
        if (!m) return null
        return [Number(m[1]), Number(m[2]), Number(m[3])]
    }
    const a = parse(latest)
    const b = parse(installed)
    if (!a || !b) return false
    for (let i = 0; i < 3; i++) {
        if (a[i] > b[i]) return true
        if (a[i] < b[i]) return false
    }
    return false
}

function extractSemver(text: string): string | null {
    const match = /(\d+\.\d+\.\d+)/.exec(text.trim())
    return match?.[1] ?? null
}

/**
 * Runs a command in the user's login shell so nvm/fnm/asdf PATH entries load.
 * On Windows, falls back to `cmd /c` with the augmented Electron PATH.
 */
function runLoginShell(
    command: string,
    timeoutMs = 30_000
): Promise<{ code: number; stdout: string; stderr: string }> {
    return new Promise((resolve) => {
        const isWin = process.platform === 'win32'
        const shell = isWin ? process.env.ComSpec || 'cmd.exe' : process.env.SHELL || '/bin/zsh'
        const args = isWin ? ['/d', '/s', '/c', command] : ['-lic', command]
        const proc = spawn(shell, args, {
            env: getShellEnv(),
            windowsHide: true
        })
        let stdout = ''
        let stderr = ''
        const timer = setTimeout(() => {
            proc.kill()
            resolve({ code: 1, stdout, stderr: stderr || `Timed out after ${timeoutMs}ms` })
        }, timeoutMs)
        proc.stdout.on('data', (d) => (stdout += d.toString()))
        proc.stderr.on('data', (d) => (stderr += d.toString()))
        proc.on('error', (err) => {
            clearTimeout(timer)
            resolve({ code: 1, stdout, stderr: err.message })
        })
        proc.on('close', (code) => {
            clearTimeout(timer)
            resolve({ code: code ?? 1, stdout, stderr })
        })
    })
}

function envWithBinFirst(binaryPath: string): NodeJS.ProcessEnv {
    const env = getShellEnv()
    const binDir = dirname(binaryPath)
    const parts = (env.PATH || '').split(delimiter).filter(Boolean)
    return {
        ...env,
        PATH: [binDir, ...parts.filter((p) => p !== binDir)].join(delimiter)
    }
}

function listKnownBinPaths(name: string): string[] {
    const home = homedir()
    const candidates = [
        join(home, '.npm-global', 'bin', name),
        join(home, '.local', 'bin', name),
        '/opt/homebrew/bin/' + name,
        '/usr/local/bin/' + name,
        '/usr/bin/' + name
    ]
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

async function resolveBinary(name: string): Promise<string | null> {
    // Prefer login-shell resolution — this is what the user has on PATH.
    const probe =
        process.platform === 'win32'
            ? `where ${name}`
            : `command -v ${name} 2>/dev/null`
    const viaShell = await runLoginShell(probe, 8_000)
    if (viaShell.code === 0) {
        const resolved = viaShell.stdout.trim().split(/\r?\n/)[0]?.trim()
        if (resolved && (process.platform === 'win32' || existsSync(resolved))) {
            return resolved
        }
    }

    for (const candidate of listKnownBinPaths(name)) {
        if (existsSync(candidate)) return candidate
    }
    return null
}

function runVersion(binary: string): Promise<string | null> {
    return new Promise((resolve) => {
        const proc = spawn(binary, ['--version'], {
            shell: process.platform === 'win32',
            env: envWithBinFirst(binary)
        })
        let stdout = ''
        let stderr = ''
        proc.stdout.on('data', (d) => (stdout += d.toString()))
        proc.stderr.on('data', (d) => (stderr += d.toString()))
        proc.on('error', () => resolve(null))
        proc.on('close', (code) => {
            if (code !== 0) {
                resolve(null)
                return
            }
            resolve(extractSemver(stdout || stderr))
        })
    })
}

/**
 * Resolves the newest published version across dist-tags (`latest`, `next`, …).
 */
async function fetchLatestVersion(): Promise<{ version: string | null; error?: string }> {
    const command = `npm view ${IGRP_CLI_PACKAGE} dist-tags --json --registry=${IGRP_CLI_REGISTRY}`
    const result = await runLoginShell(command, 30_000)
    if (result.code !== 0) {
        return {
            version: null,
            error: result.stderr.trim() || result.stdout.trim() || `npm view exited ${result.code}`
        }
    }
    try {
        // npm may print warnings before JSON — find the object.
        const raw = result.stdout.trim()
        const jsonStart = raw.indexOf('{')
        const jsonEnd = raw.lastIndexOf('}')
        if (jsonStart < 0 || jsonEnd < jsonStart) {
            return { version: null, error: `Unexpected npm view output: ${raw.slice(0, 200)}` }
        }
        const tags = JSON.parse(raw.slice(jsonStart, jsonEnd + 1)) as Record<string, string>
        let best: string | null = null
        for (const version of Object.values(tags)) {
            if (!version) continue
            if (!best || isNewerVersion(version, best)) {
                best = version
            }
        }
        return { version: best }
    } catch (err) {
        return {
            version: null,
            error: err instanceof Error ? err.message : String(err)
        }
    }
}

export async function checkIgrpCli(): Promise<IgrpCliCheckResult> {
    const igrpBin = await resolveBinary('igrp')
    const installed = igrpBin ? await runVersion(igrpBin) : null
    const missing = !installed

    const latestResult = await fetchLatestVersion()
    if (latestResult.error && !latestResult.version) {
        console.warn('[igrp-cli] update check failed:', latestResult.error)
        return {
            installed,
            latest: null,
            hasUpdate: false,
            missing,
            error: latestResult.error
        }
    }

    const latest = latestResult.version
    const hasUpdate = !!installed && !!latest && isNewerVersion(latest, installed)
    console.log('[igrp-cli] check', { installed, latest, hasUpdate, missing, bin: igrpBin })

    return { installed, latest, hasUpdate, missing }
}

export async function installIgrpCli(version?: string): Promise<IgrpCliInstallResult> {
    // Same command string as onboarding copy-to-clipboard / skill error hints.
    const command = buildIgrpCliInstallCommand(version)
    console.log('[igrp-cli] install:', command)

    const result = await runLoginShell(command, 10 * 60 * 1000)
    const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim()

    if (result.code !== 0) {
        console.warn('[igrp-cli] install failed:', output)
        return {
            success: false,
            error: output || `npm install exited ${result.code}`
        }
    }

    // Verify the binary on PATH actually moved to the requested version.
    const igrpBin = await resolveBinary('igrp')
    const installed = igrpBin ? await runVersion(igrpBin) : null
    console.log('[igrp-cli] install verify', { installed, expected: version, bin: igrpBin })

    if (version && installed && installed !== version && isNewerVersion(version, installed)) {
        return {
            success: false,
            error: `Install finished but igrp is still ${installed} (expected ${version}). PATH: ${igrpBin ?? 'not found'}`,
            output
        }
    }

    return { success: true, output }
}
