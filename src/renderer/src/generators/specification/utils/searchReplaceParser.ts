/**
 * Parser + applier for Aider-style SEARCH/REPLACE edit blocks.
 *
 * The Documents AIAssistant teaches the LLM to emit edits like:
 *
 *     <<<<<<< SEARCH
 *     <exact text from the doc>
 *     =======
 *     <new text>
 *     >>>>>>> REPLACE
 *
 * Multiple blocks per reply are allowed and applied in order. Each block
 * matches against the document *before any edits in the same turn*; we apply
 * sequentially against a working copy so a later block can match content
 * introduced by an earlier one only if the LLM emitted the post-edit form,
 * which it shouldn't per the contract.
 *
 * Conventions:
 *  - Empty SEARCH + non-empty REPLACE → append at end of doc.
 *  - Non-empty SEARCH + empty REPLACE → delete the matched span.
 *  - Non-empty SEARCH + non-empty REPLACE → in-place substitution.
 *
 * Robustness: literal match first, then a whitespace-normalised fallback
 * so trivial spacing differences don't kill the edit. Ambiguous matches
 * (>1 occurrence under literal match) fail with `multiple-matches` so the
 * LLM is forced to quote unique context.
 */

export interface SREdit {
    search: string
    replace: string
}

export type SROp =
    | { kind: 'append'; ok: true }
    | { kind: 'delete'; ok: true }
    | { kind: 'replace'; ok: true }
    | { kind: 'fuzzy-replace'; ok: true }
    | {
          kind: 'failed'
          ok: false
          reason: 'no-match' | 'multiple-matches' | 'empty-edit'
          search: string
      }

export interface SRApplyResult {
    result: string
    ops: SROp[]
}

/**
 * Pulls every well-formed SEARCH/REPLACE block out of an LLM reply. Tolerant
 * of leading/trailing whitespace on the marker lines (e.g. ">>>>>>>  REPLACE")
 * and of an optional `markdown` code-fence wrapper around the whole thing
 * (some models can't help themselves).
 */
export function parseSearchReplaceBlocks(text: string): SREdit[] {
    if (!text) return []
    // Strip an outer ```...``` wrapper if the model wrapped its blocks.
    const unwrapped = stripOuterFence(text)
    const re =
        /<{5,}\s*SEARCH\s*\n([\s\S]*?)\n?={5,}\s*\n([\s\S]*?)\n?>{5,}\s*REPLACE/g
    const out: SREdit[] = []
    let match: RegExpExecArray | null
    // eslint-disable-next-line no-cond-assign
    while ((match = re.exec(unwrapped)) !== null) {
        out.push({ search: match[1] ?? '', replace: match[2] ?? '' })
    }
    return out
}

function stripOuterFence(text: string): string {
    const t = text.trim()
    const fenceMatch = /^```[A-Za-z0-9_+-]*\n([\s\S]*?)\n?```$/.exec(t)
    return fenceMatch ? fenceMatch[1] : text
}

/**
 * Apply a list of edits to a document. Each edit is attempted independently;
 * failures are recorded but don't abort the run, so the user can still apply
 * partial progress.
 */
export function applyEdits(original: string, edits: SREdit[]): SRApplyResult {
    let working = original
    const ops: SROp[] = []

    for (const edit of edits) {
        const search = edit.search ?? ''
        const replace = edit.replace ?? ''

        if (!search && !replace) {
            ops.push({
                kind: 'failed',
                ok: false,
                reason: 'empty-edit',
                search
            })
            continue
        }

        if (!search) {
            // Append at end. Add a separating blank line if the doc has content.
            working = working.trim().length === 0
                ? replace
                : `${working.replace(/\s+$/, '')}\n\n${replace}`
            ops.push({ kind: 'append', ok: true })
            continue
        }

        // Literal match.
        const literalCount = countOccurrences(working, search)
        if (literalCount === 1) {
            working = working.replace(search, replace)
            ops.push(
                replace
                    ? { kind: 'replace', ok: true }
                    : { kind: 'delete', ok: true }
            )
            continue
        }
        if (literalCount > 1) {
            ops.push({
                kind: 'failed',
                ok: false,
                reason: 'multiple-matches',
                search
            })
            continue
        }

        // Whitespace-normalised fallback.
        const fuzzy = findFuzzy(working, search)
        if (fuzzy) {
            working =
                working.slice(0, fuzzy.start) +
                replace +
                working.slice(fuzzy.end)
            ops.push({ kind: 'fuzzy-replace', ok: true })
            continue
        }

        ops.push({ kind: 'failed', ok: false, reason: 'no-match', search })
    }

    return { result: working, ops }
}

function countOccurrences(haystack: string, needle: string): number {
    if (!needle) return 0
    let count = 0
    let from = 0
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const i = haystack.indexOf(needle, from)
        if (i < 0) return count
        count++
        from = i + needle.length
    }
}

/**
 * Locate `needle` in `haystack` ignoring runs of whitespace. Returns the span
 * `[start, end)` in the original haystack of the matched region, or null.
 * Only used as a forgiving fallback for the literal-exact match path; we
 * collapse any internal whitespace in both sides to a single space and walk
 * a window that has the same collapsed length.
 *
 * Note: linear-time enough for documents up to ~1 MB; if we ever blow past
 * that we should switch to a proper diff-match-patch.
 */
function findFuzzy(
    haystack: string,
    needle: string
): { start: number; end: number } | null {
    const norm = (s: string) => s.replace(/\s+/g, ' ').trim()
    const target = norm(needle)
    if (!target) return null

    // Slide a substring across the haystack and compare normalised forms.
    // We jump in word boundaries to keep this cheap.
    const tokens: Array<{ start: number; end: number }> = []
    const tokenRe = /\S+/g
    let m: RegExpExecArray | null
    // eslint-disable-next-line no-cond-assign
    while ((m = tokenRe.exec(haystack)) !== null) {
        tokens.push({ start: m.index, end: m.index + m[0].length })
    }

    for (let i = 0; i < tokens.length; i++) {
        for (let j = i; j < tokens.length; j++) {
            const span = haystack.slice(tokens[i].start, tokens[j].end)
            const normSpan = norm(span)
            if (normSpan.length > target.length * 1.5) break
            if (normSpan === target) {
                return { start: tokens[i].start, end: tokens[j].end }
            }
        }
    }
    return null
}

/**
 * Compact summary string for a list of ops, for chat-bubble display.
 * Examples: "3 edições aplicadas", "2 aplicadas · 1 falha".
 */
export function summariseOps(ops: SROp[]): string {
    let ok = 0
    let failed = 0
    for (const op of ops) {
        if (op.ok) ok++
        else failed++
    }
    if (ok && failed) return `${ok} aplicadas · ${failed} falha${failed === 1 ? '' : 's'}`
    if (ok) return `${ok} ediç${ok === 1 ? 'ão' : 'ões'} aplicada${ok === 1 ? '' : 's'}`
    return `${failed} falha${failed === 1 ? '' : 's'}`
}
