import {
    IGRPButtonPrimitive,
    IGRPDialogContentPrimitive,
    IGRPDialogDescriptionPrimitive,
    IGRPDialogFooterPrimitive,
    IGRPDialogPrimitive,
    IGRPDialogTitlePrimitive
} from '@igrp/igrp-framework-react-design-system'
import type { PageConfig } from '@igrp/igrp-studio-nextjs-engine/types'
import { ENV_TYPES, PATTERNS } from '@renderer/constants/appConstants'
import { CheckboxInput, TextInput } from '@renderer/generators/api/components/inputs-form'
import { getDynamicSegments } from '@renderer/generators/ui/components/settings/properties/route-parser'
import { useGit } from '@renderer/hooks/use-git'
import useToast from '@renderer/hooks/useToast'
import { Controller, errorMessage, useZodForm } from '@renderer/lib/form'
import { camelCase, getId } from '@renderer/utils'
import { type FocusEvent, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import type { PageDefinition } from '../page-manager'

const initialValues: PageConfig = {
    type: 'page',
    pageName: '',
    path: '',
    description: undefined,
    forceDynamic: false,
    id: '',
    types: [],
    states: [],
    functions: [],
    parentName: undefined,
    args: [],
    useClient: true
} as any

interface CreatePageModalProps {
    isOpen: boolean
    basePath: string
    isSubPage?: boolean
    currentComponent?: PageDefinition
    onClose: () => void
    onConfirm: (createdPage?: PageDefinition) => void
}

export function CreatePageModal({
    isOpen,
    basePath,
    onClose,
    onConfirm,
    isSubPage,
    currentComponent
}: CreatePageModalProps): React.JSX.Element {
    const { t } = useTranslation()
    const { createGitCommit } = useGit()
    const { showErrorToast, showSuccessToast } = useToast()

    const [formInitialValues, setFormInitialValues] = useState<PageConfig>(initialValues)

    // Schema validates the three text fields; the other PageConfig props
    // (forceDynamic, useClient, args, types, …) pass through untouched.
    const schema = useMemo(
        () =>
            z
                .object({
                    description: z
                        .string()
                        .min(1, t('thisFieldRequired', { name: t('pageTitle') })),
                    pageName: z
                        .string()
                        .min(1, t('thisFieldRequired', { name: t('pageName') }))
                        .regex(PATTERNS.NO_SPACE_AND_HYPHEN, t('msgInfoAccpet')),
                    path: z
                        .string()
                        .min(1, t('thisFieldRequired', { name: t('path') }))
                        .regex(
                            PATTERNS.VALID_SEGMENT_PATTERN,
                            'Invalid Next.js path format. Examples: /about, /[id], /[[...slug]]'
                        )
                })
                .passthrough() as unknown as z.ZodType<PageConfig, unknown>,
        [t]
    )

    const form = useZodForm<PageConfig>({
        schema,
        defaultValues: formInitialValues
    })
    const { register, setValue, watch, reset, control, handleSubmit, formState } = form
    const { errors, touchedFields, isSubmitting } = formState

    // Refresh defaultValues when the source page/component changes.
    useEffect(() => {
        const loadCurrentData = async (): Promise<void> => {
            // For sub-page creation, don't pre-fill the form with parent data
            if (isSubPage) {
                setFormInitialValues(initialValues)
                return
            }

            // For regular page creation, load parent data if available
            if (currentComponent?.path) {
                try {
                    const currentData = await window.api.getJsonContent(currentComponent.path)
                    setFormInitialValues({ ...initialValues, ...currentData })
                } catch (error) {
                    console.warn('Failed to load current data:', error)
                    // Fallback to currentComponent.content if API call fails
                    setFormInitialValues({ ...initialValues, ...currentComponent.content })
                }
            } else if (currentComponent?.content) {
                setFormInitialValues({ ...initialValues, ...currentComponent.content })
            } else {
                setFormInitialValues(initialValues)
            }
        }

        // Only load data when modal is open
        if (isOpen) {
            loadCurrentData()
        }
    }, [currentComponent, isOpen, isSubPage])

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setFormInitialValues(initialValues)
        }
    }, [isOpen])

    // Push fresh defaults into RHF whenever the source changes
    // (`enableReinitialize: true` equivalent).
    useEffect(() => {
        reset(formInitialValues)
    }, [formInitialValues, reset])

    const handleConfirm = async (pageConfig: PageConfig): Promise<void> => {
        try {
            // Auto-generate args based on path
            const dynamicSegments = getDynamicSegments(pageConfig.path)
            if (dynamicSegments.length > 0) {
                const generatedArgs = dynamicSegments.map((segment) => ({
                    id: getId(),
                    type: 'string', // Default type for dynamic segments
                    name: segment.name,
                    isList: false,
                    isOptional: segment.type === 'optional-catch-all',
                    isInterface: false,
                    isFunction: false,
                    isState: false
                }))

                ;(pageConfig as unknown as PageConfig).args = generatedArgs
            }

            const { error } = await window.engine.createPage(
                { ...pageConfig },
                ENV_TYPES.NEXTJS,
                basePath
            )

            if (error) {
                showErrorToast(error)
                return
            }

            showSuccessToast(`Page ${pageConfig.pageName} has been successfully added.`)
            createGitCommit(basePath, `Add page ${pageConfig.pageName}`)

            const createdPage: PageDefinition = {
                id: pageConfig.id,
                type: pageConfig.type as 'page' | 'component',
                name: pageConfig.pageName,
                description: pageConfig.description || '',
                path: pageConfig.path,
                pagePath: pageConfig.path,
                status: 'active',
                created: new Date().toISOString(),
                pageName: pageConfig.pageName,
                isPage: pageConfig.type === 'page',
                content: pageConfig as any
            }

            onConfirm?.(createdPage)
            reset(initialValues)
        } catch (error) {
            showErrorToast(error)
        }
    }

    const onSubmit = handleSubmit(async (values) => {
        const newValues = isSubPage
            ? {
                  ...values,
                  path: `${currentComponent?.content?.path}/${values.path}`,
                  parentName: currentComponent?.content?.pageName
              }
            : values

        newValues.id = newValues.id || getId()
        await handleConfirm(newValues)
    })

    const descriptionField = register('description', {
        onBlur: (e: FocusEvent<HTMLInputElement>) => {
            if (watch('pageName')) return
            const generatedName = camelCase(e.target.value)
            setValue('pageName', generatedName, { shouldValidate: true, shouldTouch: true })
        }
    })

    const pageNameField = register('pageName', {
        onBlur: () => {
            if (watch('path')) return
            const generatedPath = watch('pageName').toLowerCase().replace(/\s+/g, '-')
            setValue('path', generatedPath, { shouldValidate: true, shouldTouch: true })
        }
    })

    const pathField = register('path')

    // Auto-generate args when path changes — kept on the renderer side so the
    // dynamic-segment chips can preview before submit.
    const watchedPath = watch('path')
    useEffect(() => {
        if (!watchedPath) return
        const dynamicSegments = getDynamicSegments(watchedPath)
        const currentArgs = (form.getValues() as any).args ?? []

        if (dynamicSegments.length > 0) {
            const generatedArgs = dynamicSegments.map((segment) => ({
                id: getId(),
                type: 'string',
                name: segment.name,
                isList: false,
                isOptional: segment.type === 'optional-catch-all',
                isInterface: false,
                isFunction: false,
                isState: false
            }))

            const currentArgNames = currentArgs.map((a: any) => a.name)
            const newArgNames = generatedArgs.map((a) => a.name)
            if (JSON.stringify(currentArgNames.sort()) !== JSON.stringify(newArgNames.sort())) {
                setValue('args' as never, generatedArgs as never)
            }
        } else if (currentArgs.length > 0) {
            setValue('args' as never, [] as never)
        }
    }, [watchedPath, setValue, form])

    const args = (watch() as any).args as Array<{ name: string; type: string; isOptional: boolean }> | undefined

    return (
        <IGRPDialogPrimitive open={isOpen} onOpenChange={onClose}>
            <IGRPDialogContentPrimitive>
                <IGRPDialogTitlePrimitive>
                    {isSubPage
                        ? t('createSubNewPage')
                        : formInitialValues.id
                          ? `Edit ${formInitialValues.pageName}`
                          : t('createNewPage')}
                </IGRPDialogTitlePrimitive>
                <IGRPDialogDescriptionPrimitive>
                    {t('comonDialogtDescription', { name: 'Page' })}
                </IGRPDialogDescriptionPrimitive>
                <form className="needs-validation space-y-4" onSubmit={onSubmit}>
                    <div className="grid grid-cols-1 gap-4">
                        <TextInput
                            id="description"
                            label={t('pageTitle')}
                            {...descriptionField}
                            isTouched={!!touchedFields.description}
                            error={errorMessage(errors.description as never)}
                            placeholder="Todo List"
                            isRequired
                        />
                        <TextInput
                            id="pageName"
                            label={t('pageName')}
                            {...pageNameField}
                            isTouched={!!touchedFields.pageName}
                            error={errorMessage(errors.pageName as never)}
                            placeholder="TodoList"
                            isRequired
                        />
                        <TextInput
                            id="path"
                            label="Path"
                            placeholder="e.g. docs/[[...slug]] or /(auth)/todo-list"
                            {...pathField}
                            isTouched={!!touchedFields.path}
                            error={errorMessage(errors.path as never)}
                            isRequired
                        />

                        {/* Show generated dynamic args */}
                        {args && args.length > 0 && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                    Dynamic Arguments (Auto-generated)
                                </label>
                                <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg">
                                    {args.map((arg, index) => (
                                        <div
                                            key={index}
                                            className="px-2 py-1 bg-primary/10 text-primary text-xs rounded border"
                                        >
                                            {arg.name} ({arg.type}){' '}
                                            {arg.isOptional ? '(optional)' : ''}
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    These arguments will be automatically generated based on the
                                    dynamic segments in your path.
                                </p>
                            </div>
                        )}

                        <div className="flex justify-start gap-2">
                            <Controller
                                control={control}
                                name={'forceDynamic' as never}
                                render={({ field }) => (
                                    <CheckboxInput
                                        id="forceDynamic"
                                        label={t('forceDynamic')}
                                        value={!!field.value}
                                        onChange={field.onChange}
                                    />
                                )}
                            />

                            <Controller
                                control={control}
                                name={'useClient' as never}
                                render={({ field }) => (
                                    <CheckboxInput
                                        id="useClient"
                                        label={t('useClient')}
                                        value={!!field.value}
                                        onChange={field.onChange}
                                        info={t('useClientInfo')}
                                    />
                                )}
                            />
                        </div>
                    </div>
                    <IGRPDialogFooterPrimitive className="flex justify-between">
                        <IGRPButtonPrimitive type="button" variant="ghost" onClick={onClose}>
                            {t('cancel')}
                        </IGRPButtonPrimitive>
                        <IGRPButtonPrimitive
                            type="submit"
                            disabled={isSubmitting}
                            color="primary"
                        >
                            {isSubmitting ? t('saving') : t('save')}
                        </IGRPButtonPrimitive>
                    </IGRPDialogFooterPrimitive>
                </form>
            </IGRPDialogContentPrimitive>
        </IGRPDialogPrimitive>
    )
}
