/**
 * Bridge between the Process Studio SDK (which calls `fetch()` directly in the
 * renderer) and the desktop's main-process IPC channel `window.api.fetchData`.
 *
 * Why: the renderer's CSP only allows `connect-src 'self' localhost`, and the
 * remote Process API will typically not send permissive CORS headers either.
 * The legacy `bpmn-service.ts` worked around both by routing every request
 * through main; we do the same here, but only for URLs targeting the active
 * BPMN host so unrelated `fetch()` calls keep their normal behaviour.
 *
 * Limitations: the existing IPC handler (`fetch-data` → `fetch-request.ts`)
 * pre-parses the body as JSON and collapses all non-2xx into `{ error }`. We
 * synthesise a `Response` with status 200 / 502 accordingly. Rich status codes
 * are out of scope until we add a dedicated raw IPC channel.
 */

let active: { prefix: string; original: typeof fetch } | null = null

function buildResponse(payload: { result?: unknown; error?: string }): Response {
    if (payload.error) {
        return new Response(JSON.stringify({ message: payload.error }), {
            status: 502,
            statusText: 'Bad Gateway',
            headers: { 'Content-Type': 'application/json' }
        })
    }
    const body = payload.result === undefined ? '' : JSON.stringify(payload.result)
    return new Response(body, {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' }
    })
}

function urlOf(input: RequestInfo | URL): string {
    if (typeof input === 'string') return input
    if (input instanceof URL) return input.toString()
    return input.url
}

function headersToRecord(headers: HeadersInit | undefined): Record<string, string> {
    if (!headers) return {}
    const out: Record<string, string> = {}
    new Headers(headers).forEach((value, key) => {
        out[key] = value
    })
    return out
}

/**
 * Replace `window.fetch` so requests targeting the BPMN API are routed via the
 * main-process IPC. Returns a cleanup function that restores the original.
 */
export function installBpmnFetchBridge(apiPrefix: string): () => void {
    if (active) {
        active.original && (window.fetch = active.original)
        active = null
    }
    const original = window.fetch.bind(window)
    const prefix = apiPrefix.replace(/\/$/, '')

    const interceptor: typeof fetch = async (input, init) => {
        const url = urlOf(input)
        if (!url.startsWith(prefix)) {
            return original(input as RequestInfo, init)
        }
        const fetchData = window.api?.fetchData
        if (!fetchData) {
            // Preload bridge missing — fall through; renderer CSP will block.
            return original(input as RequestInfo, init)
        }

        const requestInit: RequestInit = {
            method: init?.method ?? 'GET',
            headers: headersToRecord(init?.headers),
            body: init?.body as BodyInit | undefined
        }
        const result = await fetchData(url, requestInit)
        return buildResponse(result)
    }

    window.fetch = interceptor
    active = { prefix, original }
    return () => {
        if (window.fetch === interceptor) {
            window.fetch = original
        }
        if (active && active.prefix === prefix) {
            active = null
        }
    }
}
