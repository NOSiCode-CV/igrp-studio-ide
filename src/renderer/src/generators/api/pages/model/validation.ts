import { PATTERNS } from '@renderer/constants/appConstants'
import { z } from 'zod'

export function useModelValidation({ t }: { t: any }) {
    return z
        .object({
            name: z
                .string()
                .min(1, 'Name is required')
                .regex(PATTERNS.NAME_VALIDATION_PATTERN, t('msgInfoAccpetName'))
                .max(30, t('maxLengthExceeded', { max: 30 })),
            tableName: z.string().min(1, 'Table name is required'),
            attributes: z
                .array(
                    z
                        .object({
                            name: z.string().min(1, 'Name is required'),
                            type: z.string().min(1, 'Type is required')
                        })
                        .passthrough()
                )
                .default([]),
            indexes: z.array(z.object({}).passthrough()).default([]),
            // A duplicate `name` here silently produces two `[Index(...,
            // IsUnique = true, Name = "<same>")]` (.NET) / equivalent
            // constraint attributes downstream — the engine has no dedup
            // guard of its own, so this is the only gate. Empty names are
            // dropped separately at submit time (`getValuesToSubmit`); this
            // only flags a name that collides with another NON-EMPTY name in
            // the same array. Mirrors the "already exists" duplicate-name
            // check already used for GraphQL operation names
            // (`pages/graphql/validation.ts`).
            uniqueConstraints: z
                .array(
                    z
                        .object({
                            name: z.string().optional(),
                            columns: z.array(z.string()).optional()
                        })
                        .passthrough()
                )
                .default([])
                .superRefine((items, ctx) => {
                    const counts = new Map<string, number>()
                    for (const item of items) {
                        const name = (item?.name ?? '').trim()
                        if (!name) continue
                        counts.set(name, (counts.get(name) ?? 0) + 1)
                    }
                    items.forEach((item, index) => {
                        const name = (item?.name ?? '').trim()
                        if (name && (counts.get(name) ?? 0) > 1) {
                            ctx.addIssue({
                                code: z.ZodIssueCode.custom,
                                message: 'A unique constraint with this name already exists',
                                path: [index, 'name']
                            })
                        }
                    })
                }),
            contraint: z
                .object({
                    compoundUnique: z.array(z.object({}).passthrough()).default([])
                })
                .passthrough()
                .optional()
        })
        .passthrough()
}
