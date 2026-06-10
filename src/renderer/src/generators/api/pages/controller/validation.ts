import { PATTERNS } from '@renderer/constants/appConstants'
import { z } from 'zod'

/**
 * Validates a request param / path variable: either both `type` and `name`
 * are present, or both are blank. Mirrors the Yup `.test('type-or-name-required')`
 * rule that used to emit `{ message: { name: '...' } }` so the
 * BindingFormList downstream can highlight the correct sub-field.
 */
const conditionalValidation = z
    .object({
        type: z.string().nullable().optional(),
        name: z.string().nullable().optional()
    })
    .passthrough()
    .superRefine((value, ctx) => {
        const { type, name } = value || {}
        if (type && !name) {
            ctx.addIssue({
                code: 'custom',
                path: ['name'],
                message: 'Name is required when Type is provided'
            })
        }
        if (name && !type) {
            ctx.addIssue({
                code: 'custom',
                path: ['type'],
                message: 'Type is required if Name is present'
            })
        }
    })

export function useActionValidation({ t }: { t: any }) {
    return z
        .object({
            actionName: z
                .string()
                .min(1, 'Action Name is required')
                .regex(PATTERNS.NAME_VALIDATION_PATTERN, t('msgInfoAccpetName'))
                .max(50, t('maxLengthExceeded', { max: 50 })),
            method: z.string().min(1, 'Method is required')
        })
        .passthrough()
}

export function useControllerValidation({ t }: { t: any }) {
    const writeMethods = new Set(['POST', 'PUT', 'PATCH'])
    return z
        .object({
            actions: z
                .array(
                    z
                        .object({
                            actionName: z
                                .string()
                                .min(1, 'Action Name is required')
                                .regex(PATTERNS.NAME_VALIDATION_PATTERN, t('msgInfoAccpetName'))
                                .max(50, t('maxLengthExceeded', { max: 50 })),
                            method: z.string().min(1, 'Method is required'),
                            // `accepts` is required for write methods only.
                            accepts: z.string().nullable().optional(),
                            requestParams: z.array(conditionalValidation).optional(),
                            pathVariables: z.array(conditionalValidation).optional()
                        })
                        .passthrough()
                        .superRefine((action, ctx) => {
                            const method = Array.isArray(action.method)
                                ? action.method[0]
                                : action.method
                            if (writeMethods.has(method) && !action.accepts) {
                                ctx.addIssue({
                                    code: 'custom',
                                    path: ['accepts'],
                                    message: 'Accepts is required for POST, PUT, PATCH'
                                })
                            }
                        })
                )
                .default([])
        })
        .passthrough()
}
