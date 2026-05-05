/**
 * Allocates a free TCP port to each project's `next dev` instance.
 *
 * The Studio may have several Specification projects open across windows; we
 * keep one live dev server per project (keyed by basePath) so previews remain
 * stable. Ports are picked from the 3100–3199 range to avoid collisions with
 * Electron's own dev server (5173) and common defaults (3000, 8080).
 *
 * Detection uses Node's `net` module: bind to `0` and grab the assigned port —
 * standard "pick any free port" trick.
 */
import { createServer } from 'node:net'

const PORT_RANGE_START = 3100
const PORT_RANGE_END = 3199

class ProtoTypePortPool {
    private readonly assigned = new Map<string, number>()

    /** Returns the port assigned to a project, or null if none. */
    get(basePath: string): number | null {
        return this.assigned.get(basePath) ?? null
    }

    /**
     * Allocates a port for the project. Reuses the previously assigned port
     * when available so dev-server URLs are stable across restarts within the
     * same Studio session.
     */
    async acquire(basePath: string): Promise<number> {
        const existing = this.assigned.get(basePath)
        if (existing && (await isPortFree(existing))) {
            return existing
        }
        const port = await findFreePort()
        this.assigned.set(basePath, port)
        return port
    }

    /** Releases a project's port — call when the dev server is stopped. */
    release(basePath: string): void {
        this.assigned.delete(basePath)
    }

    /** Drops every binding (used on app shutdown). */
    clear(): void {
        this.assigned.clear()
    }
}

async function isPortFree(port: number): Promise<boolean> {
    return new Promise((resolve) => {
        const probe = createServer()
        probe.once('error', () => resolve(false))
        probe.once('listening', () => probe.close(() => resolve(true)))
        probe.listen(port, '127.0.0.1')
    })
}

async function findFreePort(): Promise<number> {
    for (let port = PORT_RANGE_START; port <= PORT_RANGE_END; port++) {
        if (await isPortFree(port)) return port
    }
    // Fallback: ask the OS for any free port if the curated range is full.
    return new Promise((resolve, reject) => {
        const server = createServer()
        server.once('error', reject)
        server.listen(0, '127.0.0.1', () => {
            const address = server.address()
            const port = typeof address === 'object' && address ? address.port : null
            server.close(() => (port ? resolve(port) : reject(new Error('No free port'))))
        })
    })
}

export const prototypePortPool = new ProtoTypePortPool()
