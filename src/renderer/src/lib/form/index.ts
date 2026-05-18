/**
 * Shared helpers for forms built with React Hook Form + Zod.
 *
 * Why this module exists:
 *   - Standardises how the renderer wires RHF (`mode`, default resolver,
 *     reset/reinitialise pattern) so each feature stops re-inventing it.
 *   - Bridges the gap between RHF's structured `FieldError` objects and the
 *     existing shared inputs in `generators/api/components/inputs-form.tsx`,
 *     which expect a plain `error?: string`.
 *
 * Conventions for migrations from Formik:
 *   - `useFormik({ initialValues, validationSchema, onSubmit, enableReinitialize })`
 *     becomes `useZodForm({ defaultValues, schema })` + an effect calling
 *     `form.reset(newValues)` when the source changes.
 *   - `formik.errors.name` becomes `errorMessage(form.formState.errors.name)`.
 *   - `formik.touched.name` becomes `form.formState.touchedFields.name`.
 *   - `formik.handleSubmit` becomes `form.handleSubmit(onSubmit)`.
 *   - `formik.setFieldValue('x', y)` becomes
 *     `form.setValue('x', y, { shouldValidate: true })`.
 */
import { zodResolver } from '@hookform/resolvers/zod'
import {
    type DefaultValues,
    type FieldError,
    type FieldValues,
    type Mode,
    type Resolver,
    type UseFormProps,
    type UseFormReturn,
    useForm
} from 'react-hook-form'
import type { z } from 'zod'

/**
 * Schemas accepted by `useZodForm`: any Zod object-shaped schema whose
 * inferred output looks like a `FieldValues` record. Constraining to
 * `z.ZodType` with an object output keeps `@hookform/resolvers/zod`
 * happy without forcing call-sites to cast their schemas.
 */
export type ObjectSchema<T extends FieldValues> = z.ZodType<T, unknown>

/**
 * Wrapper around `useForm` that wires the Zod resolver and our default
 * validation mode. Equivalent of `useFormik({ initialValues, validationSchema })`.
 *
 * The schema's inferred type is used as the form's value type, mirroring
 * Yup's behaviour where the schema and the form values track each other.
 */
export function useZodForm<TValues extends FieldValues>(opts: {
    schema: ObjectSchema<TValues>
    defaultValues: DefaultValues<TValues>
    /** Defaults to `'onBlur'` so it matches Formik's default touch+validate cycle. */
    mode?: Mode
    /** Pass-through for any other `useForm` option you need. */
    rhf?: Omit<UseFormProps<TValues>, 'defaultValues' | 'resolver' | 'mode'>
}): UseFormReturn<TValues> {
    // Cast through `any` once at the boundary because @hookform/resolvers
    // 5.x is typed against zod's v3 generics while we use zod 4. Zod 4
    // keeps the runtime contract — only the static type shape differs —
    // so this stays a typecheck-only escape hatch.
    // biome-ignore lint/suspicious/noExplicitAny: see above
    const resolver = zodResolver(opts.schema as any) as Resolver<TValues>
    return useForm<TValues>({
        defaultValues: opts.defaultValues,
        resolver,
        mode: opts.mode ?? 'onBlur',
        ...(opts.rhf ?? {})
    })
}

/**
 * Pull the human-readable message out of an RHF field error so it can be
 * fed directly into our existing `TextInput`/`SelectInput`/etc. components
 * (they expect `error?: string`).
 *
 * Works on leaf errors AND on object errors raised by nested arrays where
 * RHF surfaces the whole object under the parent path.
 */
export function errorMessage(error: FieldError | undefined): string | undefined {
    if (!error) return undefined
    if (typeof error.message === 'string') return error.message
    return undefined
}

/**
 * Convenience: tell whether the field has been touched. Lets call-sites
 * keep the "show error after blur" pattern they used with Formik.
 */
export function isTouched<TValues extends FieldValues>(
    form: UseFormReturn<TValues>,
    name: keyof TValues & string
): boolean {
    // Casting to unknown avoids the deep generic gymnastics RHF would
    // otherwise require for nested paths; the field names we pass here
    // are always top-level keys of the form values.
    const touched = form.formState.touchedFields as Record<string, unknown>
    return Boolean(touched[name])
}

/**
 * Re-export the common types so feature modules can import everything from
 * `@renderer/lib/form` instead of mixing `react-hook-form` imports.
 */
export type { FieldError, FieldErrors, FieldValues, UseFormReturn } from 'react-hook-form'
export { Controller, FormProvider, useFormContext, useWatch } from 'react-hook-form'
