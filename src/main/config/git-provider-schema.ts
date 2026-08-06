import { z } from 'zod'
import { GIT_PROVIDER_TYPES } from './git-providers'

const KNOWN_TYPES = GIT_PROVIDER_TYPES.map((p) => p.type) as [string, ...string[]]

/**
 * Validation contract for a persisted GitProviderConfig. Mirrored on
 * both sides of the IPC boundary so save calls reject malformed input
 * before reaching the encrypted store.
 */
export const GitProviderConfigSchema = z.object({
    id: z.string().min(1, 'id is required'),
    type: z.enum(KNOWN_TYPES, {
        message: `type must be one of: ${KNOWN_TYPES.join(', ')}`
    }),
    name: z.string().min(1, 'name is required').max(80),
    baseUrl: z
        .string()
        .min(1, 'baseUrl is required')
        .refine(
            (v) => {
                try {
                    const url = new URL(v)
                    return url.protocol === 'http:' || url.protocol === 'https:'
                } catch {
                    return false
                }
            },
            { message: 'baseUrl must be a valid http(s) URL' }
        ),
    clientId: z.string().min(1, 'clientId is required'),
    clientSecret: z.string().min(1, 'clientSecret is required'),
    active: z.boolean(),
    isDefault: z.boolean().optional()
})

export type ParsedGitProviderConfig = z.infer<typeof GitProviderConfigSchema>

export interface ValidationError {
    field: string
    message: string
}

export interface ValidationResult {
    success: boolean
    errors?: ValidationError[]
}

/**
 * Returns either { success: true } or { success: false, errors: [...] }.
 * Useful at the IPC handler boundary where throwing breaks the JSON
 * round-trip; callers can surface the errors back to the form.
 */
export function validateProviderConfig(input: unknown): ValidationResult {
    const result = GitProviderConfigSchema.safeParse(input)
    if (result.success) return { success: true }
    return {
        success: false,
        errors: result.error.issues.map((issue) => ({
            field: issue.path.join('.') || '(root)',
            message: issue.message
        }))
    }
}
