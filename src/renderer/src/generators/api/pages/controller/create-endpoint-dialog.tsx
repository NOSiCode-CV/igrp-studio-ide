import {
    IGRPButtonPrimitive,
    IGRPDialogContentPrimitive,
    IGRPDialogDescriptionPrimitive,
    IGRPDialogFooterPrimitive,
    IGRPDialogHeaderPrimitive,
    IGRPDialogPrimitive,
    IGRPDialogTitlePrimitive
} from '@igrp/igrp-framework-react-design-system'
import type { ControllerConfig } from '@igrp/igrp-studio-springboot-engine/types'
import { ENV_TYPES, PATTERNS } from '@renderer/constants/appConstants'
import useToast from '@renderer/hooks/useToast'
import { Controller, errorMessage, useZodForm } from '@renderer/lib/form'
import { setChangeStatus as onSetChangeStatus } from '@renderer/redux/thunks'
import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { z } from 'zod'
import { SelectInput, TextInput } from '../../components/inputs-form'

interface EndpointFormValues {
    type: 'controller'
    name: string
    path: string
    actions: unknown[]
    module: string
    description: string
}

interface CreateEndpointDialogProps {
    basePath: string
    controller: any
    isOpen: boolean
    modules: Array<any>
    mode?: 'self' | 'formik'
    onClose: () => void
    onConfirm?: (values: any) => void
}

const initialValues: EndpointFormValues = {
    type: 'controller',
    name: '',
    path: 'api',
    actions: [],
    module: '',
    description: ''
}

export function CreateEndpointDialog({
    controller,
    basePath,
    isOpen,
    modules,
    mode = 'self',
    onConfirm,
    onClose
}: CreateEndpointDialogProps) {
    const { t } = useTranslation()
    const dispatch: any = useDispatch()
    const { showErrorToast, showSuccessToast } = useToast()

    const schema = useMemo(
        () =>
            z
                .object({
                    name: z
                        .string()
                        .min(1, t('thisFieldRequired', { name: t('endpointName') }))
                        .regex(PATTERNS.NO_SPACE_AND_HYPHEN, t('msgInfoAccept'))
                        .max(20, t('maxLengthExceeded', { max: 20 })),
                    module: z.string().min(1, t('thisFieldRequired', { name: t('module') })),
                    description: z
                        .string()
                        .min(1, t('thisFieldRequired', { name: t('description') }))
                        .max(100, t('maxLengthExceeded', { max: 100 }))
                })
                .passthrough() as unknown as z.ZodType<EndpointFormValues, unknown>,
        [t]
    )

    const form = useZodForm<EndpointFormValues>({ schema, defaultValues: initialValues })
    const { register, handleSubmit, setValue, reset, formState, control } = form
    const { errors, touchedFields } = formState

    // Sync external `controller` prop into the form whenever it changes
    // (replaces the Formik `setFieldValue` chain in a useEffect).
    useEffect(() => {
        if (!controller) return
        const { name, path, module, description } = controller
        setValue('name', name ?? '')
        setValue('path', path ?? 'api')
        setValue('module', module ?? '')
        setValue('description', description ?? '')
    }, [controller, setValue])

    const handleCreateEndpoint = async (values: ControllerConfig) => {
        try {
            const { error } = await window.engine.createController(
                values,
                ENV_TYPES.SPRING,
                basePath
            )
            if (error) {
                showErrorToast(error)
                return
            }
            dispatch(onSetChangeStatus(true))
            showSuccessToast(t('endpointCreatedSuccess', { name: values.name }))
            reset(initialValues)
            onClose()
        } catch (error) {
            showErrorToast(error)
        }
    }

    const onSubmit = handleSubmit(async (values) => {
        // The original code spreads the form values into a `ControllerConfig`
        // and lets the engine fill in `basePath` etc., so we keep the same
        // loose cast (the runtime contract is unchanged).
        const cValues = { ...values, type: 'controller' as const } as unknown as ControllerConfig

        if (mode === 'self') {
            await handleCreateEndpoint(cValues)
        } else if (mode === 'formik' && onConfirm) {
            onConfirm(cValues)
            reset(initialValues)
            onClose()
        }
    })

    return (
        <IGRPDialogPrimitive open={isOpen} onOpenChange={onClose}>
            <IGRPDialogContentPrimitive>
                <IGRPDialogHeaderPrimitive>
                    <IGRPDialogTitlePrimitive>{t('createNewEndpoint')}</IGRPDialogTitlePrimitive>
                    <IGRPDialogDescriptionPrimitive>
                        {t('endpointDescription')}
                    </IGRPDialogDescriptionPrimitive>
                </IGRPDialogHeaderPrimitive>
                <form onSubmit={onSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-1 items-center gap-4">
                            <div className="col-span-12 flex flex-col gap-3">
                                <TextInput
                                    id="name"
                                    label={t('endpointName')}
                                    {...register('name')}
                                    error={errorMessage(errors.name as never)}
                                    isTouched={!!touchedFields.name}
                                    isRequired
                                />
                            </div>
                            <div className="col-span-12 gap-3 flex-col flex">
                                <TextInput
                                    id="path"
                                    label={t('basePath')}
                                    {...register('path')}
                                    error={errorMessage(errors.path as never)}
                                    isTouched={!!touchedFields.path}
                                />
                            </div>
                            <div className="col-span-12 flex flex-col gap-3">
                                <Controller
                                    control={control}
                                    name="module"
                                    render={({ field }) => (
                                        <SelectInput
                                            id="module"
                                            label={t('moduleName')}
                                            options={modules}
                                            value={field.value}
                                            error={errorMessage(errors.module as never)}
                                            isTouched={!!touchedFields.module}
                                            onChange={(v) => field.onChange(v)}
                                            onBlur={() => field.onBlur()}
                                            isRequired
                                        />
                                    )}
                                />
                            </div>
                            <div className="col-span-12 gap-3 flex-col flex">
                                <TextInput
                                    id="description"
                                    label={t('description')}
                                    {...register('description')}
                                    error={errorMessage(errors.description as never)}
                                    isTouched={!!touchedFields.description}
                                    isRequired
                                />
                            </div>
                        </div>
                    </div>
                    <IGRPDialogFooterPrimitive>
                        <IGRPButtonPrimitive type="submit">{t('save')}</IGRPButtonPrimitive>
                    </IGRPDialogFooterPrimitive>
                </form>
            </IGRPDialogContentPrimitive>
        </IGRPDialogPrimitive>
    )
}
