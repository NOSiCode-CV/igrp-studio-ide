import { entitiesToDdl } from '../src/main/services/data/entities-to-ddl'
import type { Entity } from '../src/main/services/spec-data-service'

const NOW = '2026-01-01T00:00:00.000Z'

function makeFixture(): Entity[] {
    return [
        {
            id: 'cust-uuid',
            name: 'Customer',
            fields: [
                {
                    id: 'f1',
                    name: 'id',
                    type: 'int',
                    primaryKey: true,
                    nullable: false
                },
                {
                    id: 'f2',
                    name: 'email',
                    type: 'string',
                    nullable: false,
                    unique: true,
                    indexed: true
                },
                {
                    id: 'f3',
                    name: 'isActive',
                    type: 'boolean',
                    defaultValue: true
                }
            ],
            relations: [],
            source: { kind: 'manual' },
            createdAt: NOW,
            updatedAt: NOW
        },
        {
            id: 'order-uuid',
            name: 'Order',
            fields: [
                {
                    id: 'f4',
                    name: 'id',
                    type: 'int',
                    primaryKey: true,
                    nullable: false
                },
                {
                    id: 'f5',
                    name: 'customerId',
                    type: 'reference',
                    nullable: false,
                    referenceEntityId: 'cust-uuid'
                },
                {
                    id: 'f6',
                    name: 'status',
                    type: 'enum',
                    enumValues: ['pending', 'paid', 'shipped']
                },
                {
                    id: 'f7',
                    name: 'total',
                    type: 'decimal',
                    nullable: false
                }
            ],
            relations: [],
            source: { kind: 'manual' },
            createdAt: NOW,
            updatedAt: NOW
        }
    ]
}

describe('entitiesToDdl', () => {
    describe('postgresql', () => {
        it('emits CREATE TABLE with quoted identifiers and FK', () => {
            const sql = entitiesToDdl(makeFixture(), 'postgresql')
            expect(sql).toContain('CREATE TABLE "customer"')
            expect(sql).toContain('CREATE TABLE "order"')
            expect(sql).toContain('"id" INTEGER NOT NULL')
            expect(sql).toContain('"email" TEXT NOT NULL UNIQUE')
            expect(sql).toContain('DEFAULT TRUE')
            expect(sql).toContain('PRIMARY KEY ("id")')
            // FK
            expect(sql).toContain(
                'ALTER TABLE "order" ADD CONSTRAINT "fk_order_customer_id" FOREIGN KEY ("customer_id") REFERENCES "customer"("id");'
            )
            // Index on email (unique + indexed)
            expect(sql).toContain('CREATE INDEX "idx_customer_email" ON "customer" ("email");')
            // Enum CHECK constraint
            expect(sql).toMatch(/TEXT CHECK \("status" IN \('pending', 'paid', 'shipped'\)\)/)
        })
    })

    describe('mysql', () => {
        it('emits CREATE TABLE with backtick identifiers and ENUM(...)', () => {
            const sql = entitiesToDdl(makeFixture(), 'mysql')
            expect(sql).toContain('CREATE TABLE `customer`')
            expect(sql).toContain('`email` VARCHAR(255) NOT NULL UNIQUE')
            expect(sql).toContain('DEFAULT 1') // boolean true on mysql
            expect(sql).toContain("ENUM('pending', 'paid', 'shipped')")
            // FK
            expect(sql).toContain(
                'ALTER TABLE `order` ADD CONSTRAINT `fk_order_customer_id` FOREIGN KEY (`customer_id`) REFERENCES `customer`(`id`);'
            )
        })
    })

    it('emits a header with the dialect and empty body for empty input', () => {
        const sql = entitiesToDdl([], 'postgresql')
        expect(sql).toContain('dialect=postgresql')
        expect(sql).not.toContain('CREATE TABLE')
    })

    it('respects advancedType override', () => {
        const sql = entitiesToDdl(
            [
                {
                    id: 'x',
                    name: 'X',
                    fields: [
                        {
                            id: 'f',
                            name: 'data',
                            type: 'string',
                            advancedType: 'BYTEA'
                        }
                    ],
                    relations: [],
                    source: { kind: 'manual' },
                    createdAt: NOW,
                    updatedAt: NOW
                }
            ],
            'postgresql'
        )
        expect(sql).toContain('"data" BYTEA')
    })
})
