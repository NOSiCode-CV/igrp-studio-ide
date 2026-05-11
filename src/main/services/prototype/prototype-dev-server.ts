/**
 * Manages the Next.js dev server lifecycle for each Specification project.
 *
 * One process per project (keyed by basePath). Lazy by design: nothing starts
 * until the renderer requests `start`. Stdout/stderr is line-buffered and
 * streamed to the renderer as `dev-log` events, then made queryable via a
 * ring buffer so a freshly-mounted Logs tab can replay the recent history.
 *
 * Auto-recover policy: if the process exits unexpectedly (non-zero & we did
 * not request stop), retry up to 2 times with exponential backoff. Beyond
 * that the renderer must trigger a manual restart.
 */
import { spawn, type ChildProcess } from 'node:child_process'
import fs from 'node:fs'
import { join } from 'node:path'
import { BrowserWindow } from 'electron'
import { EVENTS } from '../../constants/events'
import { prototypePortPool } from './prototype-port-pool'

export type DevLogLevel = 'info' | 'warn' | 'error'

export interface DevLogEntry {
    timestamp: number
    level: DevLogLevel
    line: string
}

export interface DevServerStatus {
    running: boolean
    port: number | null
    url: string | null
    pid: number | null
    startedAt: number | null
    /** True while `npm install` is running for the prototype's first boot. */
    installing: boolean
}

interface ManagedServer {
    proc: ChildProcess
    port: number
    startedAt: number
    log: DevLogEntry[]
    requestedStop: boolean
    crashCount: number
}

const LOG_BUFFER_SIZE = 500
const MAX_AUTO_RESTART = 2
const PROTOTYPE_SUBDIR = 'prototype'

class PrototypeDevServerService {
    private readonly servers = new Map<string, ManagedServer>()
    private readonly installing = new Set<string>()

    status(basePath: string): DevServerStatus {
        const isInstalling = this.installing.has(basePath)
        const server = this.servers.get(basePath)
        if (!server) {
            return {
                running: false,
                port: null,
                url: null,
                pid: null,
                startedAt: null,
                installing: isInstalling
            }
        }
        return {
            running: !server.proc.killed && server.proc.exitCode === null,
            port: server.port,
            url: `http://localhost:${server.port}`,
            pid: server.proc.pid ?? null,
            startedAt: server.startedAt,
            installing: isInstalling
        }
    }

    /** Returns the buffered log entries (most recent first). */
    getLogBuffer(basePath: string, limit = LOG_BUFFER_SIZE): DevLogEntry[] {
        const server = this.servers.get(basePath)
        if (!server) return []
        return server.log.slice(-limit)
    }

    async start(basePath: string): Promise<DevServerStatus> {
        if (this.servers.has(basePath)) {
            const status = this.status(basePath)
            if (status.running) return status
            // Stale entry — clean up and start fresh.
            this.servers.delete(basePath)
        }

        const cwd = join(basePath, PROTOTYPE_SUBDIR)
        if (!fs.existsSync(cwd)) {
            throw new Error(`Prototype folder not found at ${cwd}`)
        }
        if (!fs.existsSync(join(cwd, 'package.json'))) {
            throw new Error(`${cwd} has no package.json — the prototype scaffold is incomplete.`)
        }

        // Auto-install dependencies on first run. The Next.js scaffold writes
        // package.json but doesn't run `npm install`, so the very first dev
        // server boot would fail with "next: command not found". We install
        // lazily and stream progress to the Logs tab so the user sees what's
        // happening.
        if (!fs.existsSync(join(cwd, 'node_modules'))) {
            this.installing.add(basePath)
            broadcast(EVENTS.SPEC_PROTOTYPE.DEV_STATUS, {
                basePath,
                status: this.status(basePath)
            })
            try {
                await this.installDependencies(basePath, cwd)
            } finally {
                this.installing.delete(basePath)
                broadcast(EVENTS.SPEC_PROTOTYPE.DEV_STATUS, {
                    basePath,
                    status: this.status(basePath)
                })
            }
        }

        const port = await prototypePortPool.acquire(basePath)
        const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'

        const proc = spawn(npm, ['run', 'dev', '--', '--port', String(port)], {
            cwd,
            env: {
                ...process.env,
                PORT: String(port),
                BROWSER: 'none',
                FORCE_COLOR: '0'
            },
            shell: false
        })

        const server: ManagedServer = {
            proc,
            port,
            startedAt: Date.now(),
            log: [],
            requestedStop: false,
            crashCount: 0
        }
        this.servers.set(basePath, server)

        const append = (level: DevLogLevel) => (chunk: Buffer | string) => {
            const text = chunk.toString()
            text.split(/\r?\n/).forEach((rawLine) => {
                const line = rawLine.trimEnd()
                if (!line) return
                const entry: DevLogEntry = { timestamp: Date.now(), level, line }
                server.log.push(entry)
                if (server.log.length > LOG_BUFFER_SIZE) server.log.shift()
                broadcast(EVENTS.SPEC_PROTOTYPE.DEV_LOG, { basePath, entry })
            })
        }
        proc.stdout?.on('data', append('info'))
        proc.stderr?.on('data', append('warn'))

        proc.on('error', (err) => {
            const entry: DevLogEntry = {
                timestamp: Date.now(),
                level: 'error',
                line: `[spawn] ${err.message}`
            }
            server.log.push(entry)
            broadcast(EVENTS.SPEC_PROTOTYPE.DEV_LOG, { basePath, entry })
        })

        proc.on('exit', (code, signal) => {
            const reason = signal ? `signal ${signal}` : `exit ${code}`
            const level: DevLogLevel = code === 0 || server.requestedStop ? 'info' : 'error'
            const entry: DevLogEntry = {
                timestamp: Date.now(),
                level,
                line: `[dev-server] stopped (${reason})`
            }
            server.log.push(entry)
            broadcast(EVENTS.SPEC_PROTOTYPE.DEV_LOG, { basePath, entry })

            const shouldRestart =
                !server.requestedStop && code !== 0 && server.crashCount < MAX_AUTO_RESTART
            this.servers.delete(basePath)
            broadcast(EVENTS.SPEC_PROTOTYPE.DEV_STATUS, {
                basePath,
                status: this.status(basePath)
            })

            if (shouldRestart) {
                const backoff = 1500 * (server.crashCount + 1)
                setTimeout(() => {
                    this.start(basePath)
                        .then((next) => {
                            const restarted = this.servers.get(basePath)
                            if (restarted) restarted.crashCount = server.crashCount + 1
                            broadcast(EVENTS.SPEC_PROTOTYPE.DEV_LOG, {
                                basePath,
                                entry: {
                                    timestamp: Date.now(),
                                    level: 'info',
                                    line: `[dev-server] auto-restart (#${server.crashCount + 1}) → ${next.url}`
                                }
                            })
                        })
                        .catch(() => {
                            // Failure already broadcast through the new start's spawn handler.
                        })
                }, backoff)
            } else {
                prototypePortPool.release(basePath)
            }
        })

        broadcast(EVENTS.SPEC_PROTOTYPE.DEV_STATUS, {
            basePath,
            status: this.status(basePath)
        })
        return this.status(basePath)
    }

    async stop(basePath: string): Promise<DevServerStatus> {
        const server = this.servers.get(basePath)
        if (!server) return this.status(basePath)
        server.requestedStop = true
        server.proc.kill('SIGTERM')
        // Force-kill if it doesn't exit within a reasonable window.
        setTimeout(() => {
            if (this.servers.get(basePath) === server && !server.proc.killed) {
                server.proc.kill('SIGKILL')
            }
        }, 5_000)
        return this.status(basePath)
    }

    /** Used on app quit — best-effort kill of every running dev server. */
    async stopAll(): Promise<void> {
        const stops: Promise<unknown>[] = []
        for (const [basePath] of this.servers) {
            stops.push(this.stop(basePath).catch(() => undefined))
        }
        await Promise.all(stops)
    }

    /**
     * Runs `npm install` inside the prototype folder and streams progress to
     * the Logs tab. Resolves when install finishes (success), rejects with a
     * descriptive error on failure so the caller can surface it.
     */
    private installDependencies(basePath: string, cwd: string): Promise<void> {
        const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
        const banner = (line: string, level: DevLogLevel = 'info'): void => {
            const entry: DevLogEntry = { timestamp: Date.now(), level, line }
            broadcast(EVENTS.SPEC_PROTOTYPE.DEV_LOG, { basePath, entry })
        }

        banner('[install] node_modules missing — running `npm install` (first run only)…')

        // Ensure the prototype has access to the IGRP private registry so
        // `@igrp/*` packages resolve. AI-generated `package.json` files often
        // pin internal scoped packages (e.g. `@igrp/framework-next`) that npm
        // can't find on the public registry. Without a local `.npmrc` the
        // install fails with `ENOTARGET`. We write a minimal one (registry
        // URL only — no auth tokens) so the prototype is self-contained even
        // when later exported and installed outside the Studio.
        try {
            const npmrcPath = join(cwd, '.npmrc')
            if (!fs.existsSync(npmrcPath)) {
                fs.writeFileSync(
                    npmrcPath,
                    '@igrp:registry=https://sonatype.nosi.cv/repository/igrp/\n',
                    'utf-8'
                )
                banner('[install] wrote .npmrc with @igrp registry')
            }
        } catch (err) {
            banner(
                `[install] failed to write .npmrc: ${err instanceof Error ? err.message : String(err)}`,
                'warn'
            )
        }

        // `--legacy-peer-deps` is intentional: AI-generated `package.json`
        // files routinely ship slightly mismatched peer ranges (a hookform
        // resolver wanting `^7.55` while the project pins `^7.71`, etc.) that
        // would block `npm 7+` strict ERESOLVE even though the install would
        // work fine. The prototype is throwaway scaffolding — we trade strict
        // peer correctness for a reliable first boot. Real apps export and
        // run their own `npm install` later.
        return new Promise((resolve, reject) => {
            const proc = spawn(
                npm,
                [
                    'install',
                    '--no-audit',
                    '--no-fund',
                    '--prefer-offline',
                    '--legacy-peer-deps'
                ],
                {
                    cwd,
                    env: { ...process.env, FORCE_COLOR: '0', npm_config_progress: 'false' },
                    shell: false
                }
            )

            const consume = (level: DevLogLevel) => (chunk: Buffer) => {
                chunk
                    .toString()
                    .split(/\r?\n/)
                    .map((l) => l.trimEnd())
                    .filter(Boolean)
                    .forEach((line) => banner(line, level))
            }
            proc.stdout?.on('data', consume('info'))
            proc.stderr?.on('data', consume('warn'))
            proc.on('error', (err) => {
                banner(`[install] spawn failed: ${err.message}`, 'error')
                reject(err)
            })
            proc.on('exit', (code) => {
                if (code === 0) {
                    banner('[install] dependencies installed ✓')
                    resolve()
                } else {
                    const message = `npm install exited with code ${code}`
                    banner(`[install] ${message}`, 'error')
                    reject(new Error(message))
                }
            })
        })
    }
}

function broadcast(channel: string, payload: unknown): void {
    for (const win of BrowserWindow.getAllWindows()) {
        if (!win.isDestroyed()) win.webContents.send(channel, payload)
    }
}

export const prototypeDevServer = new PrototypeDevServerService()
