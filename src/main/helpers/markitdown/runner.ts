import { spawn } from 'child_process'
import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import {
    MARKITDOWN_MAX_FILE_SIZE_BYTES,
    MARKITDOWN_SPAWN_TIMEOUT_MS,
    isSupportedExtension
} from './constants'

export type MarkItDownConvertResult =
    | { ok: true; markdown: string; durationMs: number }
    | { ok: false; error: string; code?: 'unsupported' | 'too-large' | 'not-found' | 'timeout' | 'spawn' | 'runtime' }

interface ExecutableSpec {
    command: string
    baseArgs: string[]
}

function resolveExecutable(): ExecutableSpec {
    if (app.isPackaged) {
        const platformDir =
            process.platform === 'darwin'
                ? 'mac'
                : process.platform === 'win32'
                  ? 'win'
                  : 'linux'
        const binaryName = process.platform === 'win32' ? 'markitdown.exe' : 'markitdown'
        const binary = path.join(process.resourcesPath, 'markitdown-bin', platformDir, binaryName)
        return { command: binary, baseArgs: [] }
    }

    const pythonCandidate = process.platform === 'win32' ? 'python' : 'python3'
    return { command: pythonCandidate, baseArgs: ['-m', 'markitdown'] }
}

export async function convertFileToMarkdown(filePath: string): Promise<MarkItDownConvertResult> {
    const absolutePath = path.resolve(filePath)

    if (!fs.existsSync(absolutePath)) {
        return { ok: false, error: `File not found: ${absolutePath}`, code: 'not-found' }
    }

    const stats = fs.statSync(absolutePath)
    if (!stats.isFile()) {
        return { ok: false, error: 'Selected path is not a file', code: 'not-found' }
    }

    if (stats.size > MARKITDOWN_MAX_FILE_SIZE_BYTES) {
        const mb = (stats.size / (1024 * 1024)).toFixed(1)
        return {
            ok: false,
            error: `File is too large (${mb} MB). Maximum allowed is 100 MB.`,
            code: 'too-large'
        }
    }

    const ext = path.extname(absolutePath).replace(/^\./, '').toLowerCase()
    if (!isSupportedExtension(ext)) {
        return {
            ok: false,
            error: `Unsupported file extension: .${ext}`,
            code: 'unsupported'
        }
    }

    const { command, baseArgs } = resolveExecutable()
    const args = [...baseArgs, absolutePath]

    return await new Promise<MarkItDownConvertResult>((resolve) => {
        const startedAt = Date.now()
        let resolved = false
        const stdoutChunks: Buffer[] = []
        const stderrChunks: Buffer[] = []

        let child
        try {
            child = spawn(command, args, {
                env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
                windowsHide: true
            })
        } catch (err) {
            resolve({
                ok: false,
                error: err instanceof Error ? err.message : 'Failed to spawn MarkItDown',
                code: 'spawn'
            })
            return
        }

        const timeout = setTimeout(() => {
            if (resolved) return
            resolved = true
            child.kill('SIGKILL')
            resolve({
                ok: false,
                error: 'Conversion timed out after 2 minutes.',
                code: 'timeout'
            })
        }, MARKITDOWN_SPAWN_TIMEOUT_MS)

        child.stdout.on('data', (chunk: Buffer) => stdoutChunks.push(chunk))
        child.stderr.on('data', (chunk: Buffer) => stderrChunks.push(chunk))

        child.on('error', (err) => {
            if (resolved) return
            resolved = true
            clearTimeout(timeout)
            resolve({
                ok: false,
                error: err.message || 'Failed to run MarkItDown',
                code: 'spawn'
            })
        })

        child.on('close', (exitCode) => {
            if (resolved) return
            resolved = true
            clearTimeout(timeout)

            if (exitCode === 0) {
                const markdown = Buffer.concat(stdoutChunks).toString('utf-8')
                resolve({ ok: true, markdown, durationMs: Date.now() - startedAt })
                return
            }

            const stderr = Buffer.concat(stderrChunks).toString('utf-8').trim()
            resolve({
                ok: false,
                error: stderr || `MarkItDown exited with code ${exitCode}`,
                code: 'runtime'
            })
        })
    })
}
