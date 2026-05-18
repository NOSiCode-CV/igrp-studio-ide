import { PATTERNS } from '@renderer/constants/appConstants'
import { z } from 'zod'

export function useDtoValidation({ t }: { t: any }) {
    return z
        .object({
            name: z
                .string()
                .min(1, 'Name is required')
                .regex(PATTERNS.NAME_VALIDATION_PATTERN, t('msgInfoAccpetName'))
                .max(30, t('maxLengthExceeded', { max: 40 })),
            template: z.string().min(1, 'Template is required'),
            attributes: z
                .array(
                    z
                        .object({
                            name: z
                                .string()
                                .min(1, 'Field name is required')
                                .regex(
                                    PATTERNS.NAME_VALIDATION_PATTERN,
                                    t('msgInfoAccpetName')
                                )
                                .max(30, t('maxLengthExceeded', { max: 30 })),
                            type: z.string().min(1, 'Field type is required')
                        })
                        .passthrough()
                )
                .default([])
        })
        .passthrough()
}
