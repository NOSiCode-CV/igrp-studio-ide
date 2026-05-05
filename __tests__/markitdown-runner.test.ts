import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { convertFileToMarkdown } from '../src/main/helpers/markitdown/runner'

type ErrorResult = { ok: false; error: string; code?: string }

function expectError(result: Awaited<ReturnType<typeof convertFileToMarkdown>>): ErrorResult {
    if (result.ok) throw new Error('Expected error result, got success')
    return result as ErrorResult
}

describe('markitdown/runner — pre-spawn validation', () => {
    let tmpDir: string

    beforeAll(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'markitdown-test-'))
    })

    afterAll(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true })
    })

    it('returns not-found when the file does not exist', async () => {
        const result = await convertFileToMarkdown(path.join(tmpDir, 'does-not-exist.pdf'))
        expect(expectError(result).code).toBe('not-found')
    })

    it('returns not-found when the path points to a directory', async () => {
        const subdir = path.join(tmpDir, 'subdir')
        fs.mkdirSync(subdir)
        const result = await convertFileToMarkdown(subdir)
        expect(expectError(result).code).toBe('not-found')
    })

    it('returns unsupported for disallowed extensions', async () => {
        const exePath = path.join(tmpDir, 'payload.exe')
        fs.writeFileSync(exePath, 'not really an exe')
        const result = await convertFileToMarkdown(exePath)
        expect(expectError(result).code).toBe('unsupported')
    })

    it('returns too-large when the file exceeds the size limit', async () => {
        const bigPath = path.join(tmpDir, 'big.txt')
        const fd = fs.openSync(bigPath, 'w')
        fs.ftruncateSync(fd, 101 * 1024 * 1024)
        fs.closeSync(fd)

        const result = await convertFileToMarkdown(bigPath)
        expect(expectError(result).code).toBe('too-large')
    })
})
