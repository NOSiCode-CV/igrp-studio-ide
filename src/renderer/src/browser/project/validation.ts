import { ENV_TYPES, PATTERNS } from '@renderer/constants/appConstants'
import { z } from 'zod'

/**
 * Builds the Zod schema for the project wizard. The validation surface
 * depends on which step the wizard is on — step 3 is the only step that
 * validates the per-framework `config` sub-form. We therefore rebuild the
 * schema whenever `step` changes (the caller already memoises this).
 *
 * Conditional rules previously expressed with `Yup.string().when('$framework')`
 * are encoded with `superRefine` so the message and the field path stay
 * exactly as the original Yup version produced them.
 */
export function useProjectValidation({ t, step }: { t: any; step: number }) {
    const baseSchema = z
        .object({
            name: z
                .string()
                .min(1, t('fieldRequired', { name: t('projectName') }))
                .regex(PATTERNS.SPECIAL_CHARACTERS_PROJECT_NAME, t('msgSpecialCharactersRegex'))
                .max(100, t('maxLengthExceeded', { max: 100 })),
            type: z.enum(['frontend', 'backend', 'specification'] as const, {
                error: () => ({ message: t('fieldRequired', { name: t('projectType') }) })
            }),
            framework: z.string().min(1, t('fieldRequired', { name: t('framework') })),
            path: z.string().min(1, t('fieldRequired', { name: t('projectDirectory') })),
            config: z.any().optional()
        })
        .passthrough()

    // Only validate the framework-specific config on step 3, mirroring the
    // original `Yup.lazy(() => step === 3 ? ... : ...)` switch.
    if (step !== 3) return baseSchema

    return baseSchema.superRefine((values, ctx) => {
        const framework = values.framework
        const cfg = (values.config ?? {}) as Record<string, string | undefined>

        const setError = (path: string, message: string) => {
            ctx.addIssue({ code: 'custom', path: ['config', path], message })
        }

        // `config.name` rule depends on the chosen framework family.
        const validateNameField = (regex: RegExp, max: number): void => {
            const v = cfg.name
            if (!v) {
                setError('name', t('thisFieldRequired', { name: t('name') }))
                return
            }
            if (!regex.test(v)) setError('name', t('msgInfoAccpet'))
            if (v.length > max) setError('name', t('maxLengthExceeded', { max }))
        }

        if (framework === ENV_TYPES.SPRING || framework === ENV_TYPES.DOTNET) {
            validateNameField(PATTERNS.NO_SPACE_AND_HYPHEN, 50)
        } else if (framework === ENV_TYPES.NEXTJS) {
            validateNameField(PATTERNS.NAME_APP_VALIDATION, 100)
        }

        if (framework === ENV_TYPES.SPRING) {
            // Spring-specific extra rules: group, artifact, database.
            if (!cfg.group) {
                setError('group', t('thisFieldRequired', { name: t('group') }))
            } else {
                if (!PATTERNS.NO_SPACE_AND_HYPHEN.test(cfg.group)) {
                    setError('group', t('msgInfoAccpet'))
                }
                if (cfg.group.length > 100) {
                    setError('group', t('maxLengthExceeded', { max: 100 }))
                }
            }

            if (!cfg.artifact) {
                setError('artifact', t('thisFieldRequired', { name: t('artifact') }))
            } else {
                if (!PATTERNS.NO_SPACE_BUT_ALLOW_HYPHEN.test(cfg.artifact)) {
                    setError('artifact', t('msgNoSpacesAllowed'))
                }
                if (cfg.artifact.length > 50) {
                    setError('artifact', t('maxLengthExceeded', { max: 50 }))
                }
            }

            if (!cfg.database) {
                setError('database', t('thisFieldRequired', { name: t('database') }))
            }
        }
    })
}
