import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import {
    createHistoryStore,
    HISTORY_MAX_ENTRIES,
    type MarkItDownHistoryEntry
} from '../src/main/helpers/markitdown/history'

function makeEntry(overrides: Partial<MarkItDownHistoryEntry> = {}): MarkItDownHistoryEntry {
    return {
        id: overrides.id ?? Math.random().toString(36).slice(2),
        fileName: overrides.fileName ?? 'doc.pdf',
        filePath: overrides.filePath ?? '/tmp/doc.pdf',
        sizeBytes: overrides.sizeBytes ?? 1024,
        markdown: overrides.markdown ?? '# heading',
        convertedAt: overrides.convertedAt ?? Date.now(),
        durationMs: overrides.durationMs ?? 42
    }
}

describe('markitdown/history', () => {
    let tmpDir: string
    let storeFile: string

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'markitdown-hist-'))
        storeFile = path.join(tmpDir, 'history.json')
    })

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true })
    })

    it('returns an empty list when the file does not exist', async () => {
        const store = createHistoryStore(storeFile)
        const list = await store.read()
        expect(list).toEqual([])
    })

    it('persists and returns entries with newest first', async () => {
        const store = createHistoryStore(storeFile)
        const first = makeEntry({ id: '1', fileName: 'a.pdf', convertedAt: 100 })
        const second = makeEntry({ id: '2', fileName: 'b.pdf', convertedAt: 200 })

        await store.add(first)
        const after = await store.add(second)

        expect(after).toHaveLength(2)
        expect(after[0].id).toBe('2')
        expect(after[1].id).toBe('1')
    })

    it('deduplicates entries with the same id on add', async () => {
        const store = createHistoryStore(storeFile)
        await store.add(makeEntry({ id: 'dup', fileName: 'v1.pdf' }))
        const list = await store.add(makeEntry({ id: 'dup', fileName: 'v2.pdf' }))

        expect(list).toHaveLength(1)
        expect(list[0].fileName).toBe('v2.pdf')
    })

    it('trims older entries beyond the max limit', async () => {
        const store = createHistoryStore(storeFile, 3)
        await store.add(makeEntry({ id: '1' }))
        await store.add(makeEntry({ id: '2' }))
        await store.add(makeEntry({ id: '3' }))
        const list = await store.add(makeEntry({ id: '4' }))

        expect(list).toHaveLength(3)
        expect(list.map((e) => e.id)).toEqual(['4', '3', '2'])
    })

    it('default max is 50', () => {
        expect(HISTORY_MAX_ENTRIES).toBe(50)
    })

    it('removes an entry by id', async () => {
        const store = createHistoryStore(storeFile)
        await store.add(makeEntry({ id: '1' }))
        await store.add(makeEntry({ id: '2' }))
        const list = await store.remove('1')
        expect(list).toHaveLength(1)
        expect(list[0].id).toBe('2')
    })

    it('clear empties the store', async () => {
        const store = createHistoryStore(storeFile)
        await store.add(makeEntry())
        await store.clear()
        expect(await store.read()).toEqual([])
    })

    it('tolerates corrupt JSON on disk by returning an empty list', async () => {
        fs.writeFileSync(storeFile, '{{not json')
        const store = createHistoryStore(storeFile)
        expect(await store.read()).toEqual([])
    })

    it('filters out entries with missing required fields', async () => {
        fs.writeFileSync(
            storeFile,
            JSON.stringify([
                {
                    id: 'ok',
                    fileName: 'a',
                    filePath: 'x',
                    sizeBytes: 1,
                    markdown: 'x',
                    convertedAt: 1,
                    durationMs: 1
                },
                { id: 'bad-no-markdown' },
                'not-an-object'
            ])
        )
        const store = createHistoryStore(storeFile)
        const list = await store.read()
        expect(list).toHaveLength(1)
        expect(list[0].id).toBe('ok')
    })
})
