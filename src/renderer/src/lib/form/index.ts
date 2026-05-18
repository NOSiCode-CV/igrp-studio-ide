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
 * Adapt an RHF form so legacy helpers and sub-components written against
 * Formik (and typed against `{ values, setFieldValue }`) keep working. The
 * adapter watches the form to materialise `.values`, and routes
 * `.setFieldValue(name, value)` through `setValue(..., { shouldValidate, shouldDirty, shouldTouch })`.
 *
 * Use this anywhere phase 4.1 hasn't (yet) refactored a helper or
 * downstream component out of the Formik-shaped interface — typically
 * `api/helpers/index.ts` (addNewRow/removeRow/changeValue/handleChangeValueObject)
 * and `BindingFormList`.
 */
export function toRowFormAdapter<TValues extends FieldValues>(
    form: UseFormReturn<TValues>
): { values: TValues; setFieldValue: (field: string, value: unknown) => void } {
    return {
        values: form.watch() as TValues,
        setFieldValue: (field, value) => {
            form.setValue(field as never, value as never, {
                shouldValidate: true,
                shouldDirty: true,
                shouldTouch: true
            })
        }
    }
}

/**
 * Compatibility wrapper that exposes the legacy Formik-shaped surface on
 * top of a React Hook Form instance. Used during phase 4.1 of the cleanup
 * so the API hooks (useDto, useEnum, useResponse, useModel, useController,
 * useGraphQLOperation) can switch their internals to RHF without forcing
 * their consuming pages — which still read `formik.values`,
 * `formik.errors`, `formik.touched`, `formik.handleSubmit`, etc. — to
 * change at the same time.
 *
 * What we cover:
 *   - `values` / `touched` / `errors` / `isSubmitting` reads
 *   - `setFieldValue(field, value)` writes
 *   - `setValues(values)` (mapped to `reset`)
 *   - `resetForm(opts?)`
 *   - `handleSubmit` exposed as a React event handler
 *   - `handleChange` / `handleBlur` for raw `<input name="...">` bindings
 *   - `validateForm()` (mapped to `trigger()`)
 *
 * Errors are flattened from RHF's `{ field: { message } }` structure into
 * Formik's `{ field: string }` so the existing pages keep working.
 */
type AnyEvent = React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>

function flattenErrorsForFormik(errors: unknown): Record<string, unknown> {
    const out: Record<string, unknown> = {}
    if (!errors || typeof errors !== 'object') return out
    for (const [key, value] of Object.entries(errors as Record<string, unknown>)) {
        if (!value) continue
        if (typeof value === 'object' && 'message' in (value as Record<string, unknown>)) {
            const msg = (value as { message?: unknown }).message
            if (typeof msg === 'string') out[key] = msg
            else out[key] = flattenErrorsForFormik(value)
        } else if (Array.isArray(value)) {
            out[key] = value.map((item) => flattenErrorsForFormik(item))
        } else if (typeof value === 'object') {
            out[key] = flattenErrorsForFormik(value)
        }
    }
    return out
}

// Loosely typed Formik-shaped surface. Keeping `errors`, `touched` and
// `handleBlur` as `any` mirrors Formik's runtime behaviour (`errors.name`
// can be a string or a nested object; handleBlur accepts a DOM event OR a
// bare value) without forcing each caller to discriminate.
// biome-ignore lint/suspicious/noExplicitAny: see above
export type FormikCompatErrors = any
// biome-ignore lint/suspicious/noExplicitAny: see above
export type FormikCompatTouched = any
export interface FormikCompat<TValues> {
    values: TValues
    errors: FormikCompatErrors
    touched: FormikCompatTouched
    isSubmitting: boolean
    isValid: boolean
    setFieldValue: (field: string, value: unknown) => void
    setValues: (values: Partial<TValues>) => void
    resetForm: (opts?: { values?: Partial<TValues> }) => void
    handleChange: (e: AnyEvent) => void
    // biome-ignore lint/suspicious/noExplicitAny: see above
    handleBlur: any
    handleSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>
    validateForm: () => Promise<Record<string, unknown>>
    /**
     * Manually mark fields as touched. Mirrors Formik's `setTouched` —
     * accepts the touched shape that `buildGraphQLOperationTouched` (and
     * similar helpers) emit. We don't try to recurse into nested arrays
     * here; the compat is best-effort for the migration window.
     */
    setTouched: (touched: Record<string, unknown>, shouldValidate?: boolean) => Promise<void>
    /**
     * Inject errors from a custom validator (e.g. the GraphQL operation
     * validator) so they surface through `errors.*` exactly like the Yup
     * pipeline did.
     */
    setErrors: (errors: Record<string, unknown>) => void
}

export function useFormikCompat<TValues extends FieldValues>(
    form: UseFormReturn<TValues>,
    onSubmit: (values: TValues) => void | Promise<void>
): FormikCompat<TValues> {
    const values = form.watch() as TValues
    const errors = flattenErrorsForFormik(form.formState.errors)
    const touched = form.formState.touchedFields as Record<string, unknown>

    const submit = form.handleSubmit(async (vals) => {
        await onSubmit(vals as TValues)
    })

    return {
        values,
        errors,
        touched,
        isSubmitting: form.formState.isSubmitting,
        isValid: form.formState.isValid,
        setFieldValue: (field, value) => {
            form.setValue(field as never, value as never, {
                shouldValidate: true,
                shouldDirty: true,
                shouldTouch: true
            })
        },
        setValues: (vals) => {
            form.reset({ ...form.getValues(), ...(vals as object) } as TValues)
        },
        resetForm: (opts) => {
            form.reset((opts?.values ?? undefined) as TValues | undefined)
        },
        handleChange: (e) => {
            const target = e.target as HTMLInputElement
            const name = target.name
            if (!name) return
            const raw: unknown =
                target.type === 'checkbox'
                    ? (target as HTMLInputElement).checked
                    : target.type === 'number'
                      ? Number(target.value)
                      : target.value
            form.setValue(name as never, raw as never, {
                shouldValidate: true,
                shouldDirty: true,
                shouldTouch: true
            })
        },
        handleBlur: (e) => {
            const name = (e.target as HTMLInputElement).name
            if (!name) return
            form.trigger(name as never)
        },
        handleSubmit: submit,
        validateForm: async () => {
            await form.trigger()
            return flattenErrorsForFormik(form.formState.errors)
        },
        setTouched: async (touched, shouldValidate) => {
            // RHF lacks a direct "set touched" hook, so we mark every keyed
            // field as touched by re-setting its current value with the
            // `shouldTouch: true` flag. Best-effort for nested arrays.
            const visit = (prefix: string, node: unknown): void => {
                if (!node || typeof node !== 'object') return
                for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
                    const path = prefix ? `${prefix}.${k}` : k
                    if (v === true) {
                        const current = form.getValues(path as never)
                        form.setValue(path as never, current as never, {
                            shouldTouch: true,
                            shouldDirty: false
                        })
                    } else if (Array.isArray(v)) {
                        v.forEach((item, idx) => visit(`${path}.${idx}`, item))
                    } else if (typeof v === 'object') {
                        visit(path, v)
                    }
                }
            }
            visit('', touched)
            if (shouldValidate) await form.trigger()
        },
        setErrors: (errors) => {
            const visit = (prefix: string, node: unknown): void => {
                if (!node || typeof node !== 'object') return
                for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
                    const path = prefix ? `${prefix}.${k}` : k
                    if (typeof v === 'string') {
                        form.setError(path as never, { type: 'manual', message: v })
                    } else if (Array.isArray(v)) {
                        v.forEach((item, idx) => visit(`${path}.${idx}`, item))
                    } else if (typeof v === 'object') {
                        visit(path, v)
                    }
                }
            }
            visit('', errors)
        }
    }
}

/**
 * Re-export the common types so feature modules can import everything from
 * `@renderer/lib/form` instead of mixing `react-hook-form` imports.
 */
export type { FieldError, FieldErrors, FieldValues, UseFormReturn } from 'react-hook-form'
export { Controller, FormProvider, useFormContext, useWatch } from 'react-hook-form'
