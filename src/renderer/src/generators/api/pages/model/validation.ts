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
            contraint: z
                .object({
                    compoundUnique: z.array(z.object({}).passthrough()).default([])
                })
                .passthrough()
                .optional()
        })
        .passthrough()
}
