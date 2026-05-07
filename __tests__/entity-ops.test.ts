import { EntityOpsParseError, parseEntityOps } from '../src/main/services/data/entity-ops'

describe('parseEntityOps', () => {
    it('accepts a fenced ```json block', () => {
        const raw = `Here you go:
\`\`\`json
{ "summary": "add Order", "ops": [{ "op": "entity-create", "name": "Order" }] }
\`\`\``
        const out = parseEntityOps(raw)
        expect(out.summary).toBe('add Order')
        expect(out.ops).toHaveLength(1)
        expect(out.ops[0]).toMatchObject({ op: 'entity-create', name: 'Order' })
    })

    it('accepts a generic ``` block', () => {
        const raw = '```\n{"summary":"x","ops":[]}\n```'
        expect(parseEntityOps(raw).summary).toBe('x')
    })

    it('falls back to balanced-brace scan when no fence is present', () => {
        const raw =
            'Sure! { "summary": "rename", "ops": [{ "op": "entity-update", "id": "abc", "patch": { "name": "Renamed" } }] } and that\'s it.'
        const out = parseEntityOps(raw)
        expect(out.ops[0]).toMatchObject({ op: 'entity-update', id: 'abc' })
    })

    it('rejects payloads without summary', () => {
        expect(() => parseEntityOps('{"ops":[]}')).toThrow(EntityOpsParseError)
    })

    it('rejects ops with an unknown op kind', () => {
        const raw = '{"summary":"x","ops":[{"op":"entity-rename","id":"a"}]}'
        expect(() => parseEntityOps(raw)).toThrow(EntityOpsParseError)
    })

    it('rejects fields with non-canonical types', () => {
        const raw =
            '{"summary":"x","ops":[{"op":"entity-create","name":"T","fields":[{"name":"f","type":"blob"}]}]}'
        expect(() => parseEntityOps(raw)).toThrow(EntityOpsParseError)
    })

    it('accepts each canonical field type', () => {
        const types = [
            'string',
            'int',
            'decimal',
            'boolean',
            'date',
            'datetime',
            'json',
            'enum',
            'reference'
        ]
        for (const type of types) {
            const raw = `{"summary":"x","ops":[{"op":"entity-create","name":"T","fields":[{"name":"f","type":"${type}"}]}]}`
            expect(() => parseEntityOps(raw)).not.toThrow()
        }
    })

    it('relation-add validates the kind enum', () => {
        const ok = parseEntityOps(
            '{"summary":"x","ops":[{"op":"relation-add","from":"A.id","to":"B.id","kind":"many-to-one"}]}'
        )
        expect(ok.ops[0]).toMatchObject({ op: 'relation-add' })

        expect(() =>
            parseEntityOps(
                '{"summary":"x","ops":[{"op":"relation-add","from":"A","to":"B","kind":"weird"}]}'
            )
        ).toThrow(EntityOpsParseError)
    })

    it('skips fence content when JSON is invalid and falls through to next candidate', () => {
        const raw = `\`\`\`json
not actually json
\`\`\`

\`\`\`json
{ "summary": "y", "ops": [] }
\`\`\``
        expect(parseEntityOps(raw).summary).toBe('y')
    })

    it('throws a specific error when no JSON candidates are valid', () => {
        expect(() => parseEntityOps('just prose, no json')).toThrow(EntityOpsParseError)
    })
})
