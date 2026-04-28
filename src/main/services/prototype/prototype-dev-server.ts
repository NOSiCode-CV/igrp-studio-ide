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

    status(basePath: string): DevServerStatus {
        const server = this.servers.get(basePath)
        if (!server) {
            return { running: false, port: null, url: null, pid: null, startedAt: null }
        }
        return {
            running: !server.proc.killed && server.proc.exitCode === null,
            port: server.port,
            url: `http://localhost:${server.port}`,
            pid: server.proc.pid ?? null,
            startedAt: server.startedAt
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
            throw new Error(
                `${cwd} has no package.json — the prototype scaffold is incomplete.`
            )
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
                !server.requestedStop &&
                code !== 0 &&
                server.crashCount < MAX_AUTO_RESTART
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
}

function broadcast(channel: string, payload: unknown): void {
    for (const win of BrowserWindow.getAllWindows()) {
        if (!win.isDestroyed()) win.webContents.send(channel, payload)
    }
}

export const prototypeDevServer = new PrototypeDevServerService()
