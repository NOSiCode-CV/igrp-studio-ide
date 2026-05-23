/**
 * Markdown chunker for the Specification Knowledge Base.
 *
 * Strategy: paragraph-aware. Splits the document on blank lines, then greedily
 * accumulates paragraphs into chunks until the target size is reached. When a
 * single paragraph exceeds the target, falls back to sentence/word splits.
 *
 * Chunk ids are deterministic (sha1 of `kbItemId|chunkIndex|content`) so that
 * re-chunking the same content produces stable ids — essential for idempotent
 * upserts into LanceDB.
 */
import { createHash } from 'node:crypto'

export interface Chunk {
    id: string
    kbItemId: string
    index: number
    text: string
    metadata: {
        kbItemId: string
        chunkIndex: number
        charStart: number
        charEnd: number
        /** Heading hierarchy for the chunk, oldest first (e.g. ["# Overview", "## Goals"]). */
        headings?: string[]
    }
}

export interface ChunkerOptions {
    /** Target chunk size in characters. Default 1000. */
    targetSize?: number
    /** Hard upper bound. Chunks larger than this are split mid-sentence. Default 1500. */
    maxSize?: number
    /** Overlap (characters) carried into the next chunk. Default 150. */
    overlap?: number
    /** Min size — chunks below this are merged with the next. Default 200. */
    minSize?: number
}

const DEFAULT_OPTS: Required<ChunkerOptions> = {
    targetSize: 1000,
    maxSize: 1500,
    overlap: 150,
    minSize: 200
}

export function chunkMarkdown(
    kbItemId: string,
    markdown: string,
    options: ChunkerOptions = {}
): Chunk[] {
    const opts = { ...DEFAULT_OPTS, ...options }
    if (!markdown.trim()) return []

    const blocks = splitByBlankLines(markdown)
    const headingStack: string[] = []
    const rawChunks: Array<{
        text: string
        charStart: number
        charEnd: number
        headings: string[]
    }> = []

    let buffer = ''
    let bufferStart = 0
    let cursor = 0

    const flush = () => {
        const text = buffer.trim()
        if (text.length === 0) {
            buffer = ''
            return
        }
        rawChunks.push({
            text,
            charStart: bufferStart,
            charEnd: bufferStart + buffer.length,
            headings: [...headingStack]
        })
        buffer = ''
    }

    for (const block of blocks) {
        const blockStart = cursor
        cursor += block.raw.length + block.gap

        if (block.heading) {
            // Update heading stack to current depth.
            const depth = block.heading.depth
            headingStack.length = depth - 1
            headingStack[depth - 1] = block.heading.text
        }

        const candidate = buffer ? `${buffer}\n\n${block.raw}` : block.raw

        if (candidate.length <= opts.targetSize) {
            if (!buffer) bufferStart = blockStart
            buffer = candidate
            continue
        }

        // Buffer would overflow: flush what we have, then handle this block.
        flush()
        bufferStart = blockStart

        if (block.raw.length <= opts.maxSize) {
            buffer = block.raw
        } else {
            // Block itself is huge — split mid-block by sentence.
            for (const piece of splitOversized(block.raw, opts.maxSize)) {
                rawChunks.push({
                    text: piece,
                    charStart: bufferStart,
                    charEnd: bufferStart + piece.length,
                    headings: [...headingStack]
                })
                bufferStart += piece.length
            }
            buffer = ''
        }
    }

    flush()

    // Merge tiny trailing chunks.
    const merged: typeof rawChunks = []
    for (const chunk of rawChunks) {
        const last = merged[merged.length - 1]
        if (
            last &&
            last.text.length < opts.minSize &&
            last.text.length + chunk.text.length <= opts.maxSize
        ) {
            last.text = `${last.text}\n\n${chunk.text}`
            last.charEnd = chunk.charEnd
        } else {
            merged.push({ ...chunk })
        }
    }

    // Add overlap from previous chunk's tail.
    const withOverlap = merged.map((chunk, idx) => {
        if (idx === 0 || opts.overlap === 0) return chunk
        const prev = merged[idx - 1]
        const tail = prev.text.slice(-opts.overlap)
        return {
            ...chunk,
            text: `${tail}\n\n${chunk.text}`
        }
    })

    return withOverlap.map((chunk, index) => ({
        id: chunkId(kbItemId, index, chunk.text),
        kbItemId,
        index,
        text: chunk.text,
        metadata: {
            kbItemId,
            chunkIndex: index,
            charStart: chunk.charStart,
            charEnd: chunk.charEnd,
            headings: chunk.headings.length > 0 ? chunk.headings : undefined
        }
    }))
}

interface Block {
    raw: string
    /** Number of newline chars consumed between this block and the next (used to advance the cursor). */
    gap: number
    heading?: { depth: number; text: string }
}

function splitByBlankLines(markdown: string): Block[] {
    const lines = markdown.split('\n')
    const blocks: Block[] = []
    let current: string[] = []
    let blanks = 0

    const pushCurrent = (gap: number) => {
        if (current.length === 0) return
        const raw = current.join('\n')
        const headingMatch = /^(#{1,6})\s+(.+)$/.exec(current[0] ?? '')
        const heading = headingMatch
            ? { depth: headingMatch[1].length, text: headingMatch[2].trim() }
            : undefined
        blocks.push({ raw, gap, heading })
        current = []
    }

    for (const line of lines) {
        if (line.trim() === '') {
            if (current.length > 0) {
                pushCurrent(blanks + 1)
                blanks = 1
            } else {
                blanks += 1
            }
        } else {
            current.push(line)
        }
    }
    pushCurrent(0)
    return blocks
}

function splitOversized(text: string, maxSize: number): string[] {
    // Split on sentence boundaries first; fall back to fixed windows.
    const sentences = text.split(/(?<=[.!?])\s+/)
    const out: string[] = []
    let buf = ''
    for (const sentence of sentences) {
        if (sentence.length > maxSize) {
            if (buf) {
                out.push(buf)
                buf = ''
            }
            for (let i = 0; i < sentence.length; i += maxSize) {
                out.push(sentence.slice(i, i + maxSize))
            }
            continue
        }
        const candidate = buf ? `${buf} ${sentence}` : sentence
        if (candidate.length > maxSize) {
            if (buf) out.push(buf)
            buf = sentence
        } else {
            buf = candidate
        }
    }
    if (buf) out.push(buf)
    return out
}

function chunkId(kbItemId: string, index: number, text: string): string {
    return createHash('sha1').update(`${kbItemId}|${index}|${text}`).digest('hex')
}
