import {
    IGRPButtonPrimitive,
    IGRPCardContentPrimitive,
    IGRPCardHeaderPrimitive,
    IGRPCardPrimitive,
    IGRPCardTitlePrimitive,
    IGRPCombobox,
    IGRPDialogContentPrimitive,
    IGRPDialogDescriptionPrimitive,
    IGRPDialogFooterPrimitive,
    IGRPDialogPrimitive,
    IGRPDialogTitlePrimitive,
    IGRPLabelPrimitive,
    IGRPSeparator
} from '@igrp/igrp-framework-react-design-system'
import type { Arguments, ComponentConfig } from '@igrp/igrp-studio-nextjs-engine/types'
import IconBrowser from '@renderer/components/icon/icon-browser'
import { ENV_TYPES, PATTERNS } from '@renderer/constants/appConstants'
import { TextInput } from '@renderer/generators/api/components/inputs-form'
import type { PageDefinition } from '@renderer/generators/ui/browser/page-manager'
import { FunctionArguments } from '@renderer/generators/ui/components/sidebar/custom-code/functions-settings'
import { RETURN_TYPE_OPTIONS } from '@renderer/generators/ui/utils/contants'
import { useGit } from '@renderer/hooks/use-git'
import useToast from '@renderer/hooks/useToast'
import { errorMessage, useZodForm } from '@renderer/lib/form'
import { camelCase, getId } from '@renderer/utils'
import { type FocusEvent, type JSX, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

const initialValues: ComponentConfig = {
    type: 'component',
    scope: 'app',
    pagePath: undefined,
    pageName: undefined,
    description: '',
    icon: undefined,
    name: '',
    id: '',
    args: []
}

interface CreateComponentModalProps {
    isOpen: boolean
    basePath: string
    pageOptions: any[]
    currentComponent?: PageDefinition
    /**
     * When provided, the modal forces the new component to be scoped to
     * this page (scope='page', pageName/pagePath pre-filled and locked).
     * The page combobox is hidden so the user cannot accidentally retarget.
     */
    lockedPage?: { pageName: string; path: string; description?: string }
    onClose: () => void
    onConfirm: () => void
}

export function CreateComponentModal({
    isOpen,
    basePath,
    onClose,
    onConfirm,
    pageOptions,
    currentComponent,
    lockedPage
}: CreateComponentModalProps): JSX.Element {
    const { t } = useTranslation()
    const { createGitCommit } = useGit()
    const { showErrorToast, showSuccessToast } = useToast()

    const [arguments_, setArguments] = useState<Arguments[]>([])
    const [formInitialValues, setFormInitialValues] = useState<ComponentConfig>(initialValues)

    // Only description + name are validated; the rest of ComponentConfig
    // (scope, pagePath, args, icon, …) passes through.
    const schema = useMemo(
        () =>
            z
                .object({
                    description: z
                        .string()
                        .min(1, t('thisFieldRequired', { name: t('componentTitle') })),
                    name: z
                        .string()
                        .min(1, t('thisFieldRequired', { name: t('name') }))
                        .regex(PATTERNS.NO_SPACE_AND_HYPHEN, t('msgInfoAccpet'))
                })
                .passthrough() as unknown as z.ZodType<ComponentConfig, unknown>,
        [t]
    )

    const form = useZodForm<ComponentConfig>({
        schema,
        defaultValues: formInitialValues
    })
    const { register, setValue, watch, reset, handleSubmit, formState, getValues } = form
    const { errors, touchedFields, isSubmitting } = formState

    useEffect(() => {
        const loadCurrentData = async () => {
            if (currentComponent?.path) {
                try {
                    const currentData = await window.api.getJsonContent(currentComponent.path)
                    setFormInitialValues({ ...initialValues, ...currentData })
                } catch (error) {
                    console.warn('Failed to load current component data:', error)
                    setFormInitialValues({ ...initialValues, ...currentComponent.content })
                }
            } else if (currentComponent?.content) {
                setFormInitialValues({ ...initialValues, ...currentComponent.content })
            } else if (lockedPage) {
                // Scoped-component flow: pre-fill the page binding so the
                // user only has to provide the component name & icon.
                setFormInitialValues({
                    ...initialValues,
                    scope: 'page',
                    pageName: lockedPage.pageName,
                    pagePath: lockedPage.path
                })
            } else {
                setFormInitialValues(initialValues)
            }
        }

        loadCurrentData()
    }, [currentComponent, isOpen, lockedPage])

    useEffect(() => {
        reset(formInitialValues)
    }, [formInitialValues, reset])

    // Mirror `formik.resetForm()` on close so reopening the dialog starts
    // clean instead of carrying the last submission state.
    useEffect(() => {
        if (!isOpen) reset(initialValues)
    }, [isOpen, reset])

    const handleConfirm = async (pageConfig: ComponentConfig): Promise<void> => {
        try {
            const { error } = await window.engine.createPage(
                { ...pageConfig, id: getId() },
                ENV_TYPES.NEXTJS,
                basePath
            )

            if (error) {
                showErrorToast(error)
                return
            }

            showSuccessToast(`Component ${pageConfig.name} has been successfully added.`)
            createGitCommit(basePath, t('addComponent', { name: pageConfig.name }))
            onConfirm?.()

            reset(initialValues)
        } catch (error) {
            console.log(error)
            showErrorToast(error)
        }
    }

    const onSubmit = handleSubmit(async (values) => {
        await handleConfirm(values)
    })

    const descriptionField = register('description', {
        onBlur: (e: FocusEvent<HTMLInputElement>) => {
            if (watch('name')) return
            const generatedName = camelCase(e.target.value)
            setValue('name', generatedName, { shouldValidate: true, shouldTouch: true })
        }
    })

    const nameField = register('name')

    // Sync the function-arguments side panel into the form values.
    useEffect(() => {
        setValue('args' as never, arguments_ as never)
    }, [arguments_, setValue])

    // Watching the whole form here keeps the generated signature preview in
    // sync with any field change — equivalent of reading `formik.values`.
    const values = watch()
    const args = (values as any).args as Arguments[] | undefined

    return (
        <IGRPDialogPrimitive open={isOpen} onOpenChange={onClose}>
            <IGRPDialogContentPrimitive className="w-full sm:max-w-[800px] lg:max-w-[60vw] max-w-[70vw]">
                <IGRPDialogTitlePrimitive>{t('createNewComponent')}</IGRPDialogTitlePrimitive>
                <IGRPDialogDescriptionPrimitive>
                    {t('comonDialogtDescription', { name: 'Component' })}
                </IGRPDialogDescriptionPrimitive>
                <form className="needs-validation" onSubmit={onSubmit}>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col space-y-3">
                            <TextInput
                                id="description"
                                label={t('componentTitle')}
                                {...descriptionField}
                                isTouched={!!touchedFields.description}
                                error={errorMessage(errors.description as never)}
                                placeholder="Todo Item"
                                isRequired
                            />
                            <TextInput
                                id="name"
                                label={t('componentName')}
                                className="col-span-3"
                                {...nameField}
                                isTouched={!!touchedFields.name}
                                error={errorMessage(errors.name as never)}
                                placeholder="TodoItem"
                            />
                            <div className="grid grid-cols-1 items-center gap-3">
                                <IGRPLabelPrimitive htmlFor="Associar">
                                    {t('pages')}
                                </IGRPLabelPrimitive>
                                {lockedPage ? (
                                    <p className="text-sm text-muted-foreground border rounded px-3 py-2 bg-muted/40">
                                        {t('scoped_to_page', {
                                            page: lockedPage.description || lockedPage.pageName
                                        })}
                                    </p>
                                ) : (
                                    <IGRPCombobox
                                        name="pagePath"
                                        className="col-span-3"
                                        value={values.pagePath || ''}
                                        options={pageOptions}
                                        placeholder="Select page"
                                        helperText={t('componentAssociation')}
                                        onChange={(selectedValue) => {
                                            const selected = pageOptions.find(
                                                (opt) => opt.value === selectedValue
                                            )

                                            // Push all three derived fields at once to avoid the
                                            // double-render Formik used to bridge with `setValues`.
                                            reset({
                                                ...getValues(),
                                                pagePath: selected?.path || undefined,
                                                pageName: selected?.value || undefined,
                                                scope: selectedValue ? 'page' : 'app'
                                            })
                                        }}
                                    />
                                )}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <IconBrowser
                                    onSelectedIcon={(icon) => {
                                        setValue('icon', icon, { shouldDirty: true })
                                    }}
                                    selectedIcon={values.icon || ''}
                                />
                            </div>

                            <IGRPCardPrimitive>
                                <IGRPCardHeaderPrimitive>
                                    <IGRPCardTitlePrimitive>
                                        Generated Component Signature
                                    </IGRPCardTitlePrimitive>
                                </IGRPCardHeaderPrimitive>
                                <IGRPCardContentPrimitive>
                                    <pre className="p-4 rounded-lg text-sm overflow-x-auto">
                                        <code>
                                            {`export default function  myComponent(`}
                                            {(args || [])
                                                .map((arg, index) => {
                                                    let paramStr = arg.name || `param${index + 1}`

                                                    if (arg.isOptional) paramStr += '?'

                                                    paramStr += ': '

                                                    if (arg.isFunction) {
                                                        const params =
                                                            arg?.functionParameters &&
                                                            arg.functionParameters
                                                                .map(
                                                                    (p) =>
                                                                        `${p.name}${p.isOptional ? '?' : ''}: ${p.type}`
                                                                )
                                                                .join(', ')
                                                        paramStr += `(${params}) => ${arg.type}`
                                                    } else {
                                                        paramStr += arg.type
                                                    }

                                                    if (arg.isList) paramStr += '[]'

                                                    return paramStr
                                                })
                                                .join(', ')}
                                            {`) {
  // Component implementation
}`}
                                        </code>
                                    </pre>
                                </IGRPCardContentPrimitive>
                            </IGRPCardPrimitive>
                        </div>
                        <div className="col-span-1 py-4">
                            <div className="flex flex-row space-x-3 w-full h-full">
                                <IGRPSeparator orientation="vertical" />
                                <div className="w-full flex-1">
                                    <FunctionArguments
                                        value={args || []}
                                        onChange={setArguments}
                                        returnTypeOptions={RETURN_TYPE_OPTIONS}
                                    />
                                </div>
                            </div>
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
