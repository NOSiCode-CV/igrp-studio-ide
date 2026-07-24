/**
 * Detects and updates the globally installed `@igrp/cli`.
 *
 * Electron apps launched from Finder/Dock inherit a minimal PATH, so probes
 * fall back to the user's login shell and common npm/nvm install locations
 * (same approach as `cli-llm-service`).
 */
import { exec, spawn } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { getShellEnv } from '../helpers/ideDetection'

const execAsync = promisify(exec)

export const IGRP_CLI_PACKAGE = '@igrp/cli'
export const IGRP_CLI_REGISTRY = 'https://sonatype.nosi.cv/repository/npm-group/'

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

function probeViaLoginShell(name: string): Promise<string | null> {
    if (process.platform === 'win32') return Promise.resolve(null)
    const shell = process.env.SHELL || '/bin/zsh'
    return new Promise((resolve) => {
        const proc = spawn(shell, ['-lic', `command -v ${name} 2>/dev/null`], {})
        let stdout = ''
        proc.stdout.on('data', (d) => (stdout += d.toString()))
        proc.on('error', () => resolve(null))
        proc.on('close', () => {
            const resolved = stdout.trim().split('\n').pop()?.trim()
            resolve(resolved && existsSync(resolved) ? resolved : null)
        })
    })
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
    const env = getShellEnv()
    const probe =
        process.platform === 'win32' ? `where ${name}` : `command -v ${name}`
    try {
        const { stdout } = await execAsync(probe, { env })
        const first = stdout.trim().split(/\r?\n/)[0]?.trim()
        if (first && (process.platform === 'win32' || existsSync(first))) {
            return first
        }
    } catch {
        // not on PATH
    }

    const shellPath = await probeViaLoginShell(name)
    if (shellPath) return shellPath

    for (const candidate of listKnownBinPaths(name)) {
        if (existsSync(candidate)) return candidate
    }
    return null
}

function runVersion(binary: string): Promise<string | null> {
    return new Promise((resolve) => {
        const proc = spawn(binary, ['--version'], {
            shell: process.platform === 'win32',
            env: getShellEnv()
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
            const line = (stdout || stderr).trim().split('\n')[0]?.trim() || ''
            const match = /(\d+\.\d+\.\d+)/.exec(line)
            resolve(match?.[1] ?? (line || null))
        })
    })
}

async function fetchLatestVersion(): Promise<{ version: string | null; error?: string }> {
    const npmBin = (await resolveBinary('npm')) || 'npm'
    const command = `"${npmBin}" view ${IGRP_CLI_PACKAGE} version --registry=${IGRP_CLI_REGISTRY}`
    try {
        const { stdout } = await execAsync(command, {
            env: getShellEnv(),
            timeout: 30_000
        })
        const version = stdout.trim().split(/\r?\n/).pop()?.trim() || null
        return { version }
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

    return { installed, latest, hasUpdate, missing }
}

export async function installIgrpCli(): Promise<IgrpCliInstallResult> {
    const npmBin = (await resolveBinary('npm')) || 'npm'
    const command = `"${npmBin}" install -g ${IGRP_CLI_PACKAGE} --registry=${IGRP_CLI_REGISTRY}`

    try {
        const result = await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
            exec(command, { env: getShellEnv(), timeout: 10 * 60 * 1000 }, (error, stdout, stderr) => {
                if (error) {
                    reject(
                        new Error(
                            stderr?.trim() ||
                                stdout?.trim() ||
                                error.message ||
                                `Failed to install ${IGRP_CLI_PACKAGE}`
                        )
                    )
                    return
                }
                resolve({ stdout, stderr })
            })
        })

        return {
            success: true,
            output: [result.stdout, result.stderr].filter(Boolean).join('\n').trim()
        }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : `Failed to install ${IGRP_CLI_PACKAGE}`
        }
    }
}
