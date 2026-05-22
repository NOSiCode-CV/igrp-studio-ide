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
import { PATTERNS } from '@renderer/constants/appConstants'
import { useFramework } from '@renderer/hooks/use-framework'
import useToast from '@renderer/hooks/useToast'
import { setChangeStatus as onSetChangeStatus } from '@renderer/redux/thunks'
import { useFormik } from 'formik'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import * as Yup from 'yup'
import { SelectInput, TextInput } from '../../components/inputs-form'

interface CreateEndpointDialogProps {
    basePath: string
    controller: any
    isOpen: boolean
    modules: Array<any>
    mode?: 'self' | 'formik'
    onClose: () => void
    onConfirm?: (values: any) => void
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
    const framework = useFramework()

    const dispatch: any = useDispatch()

    const { showErrorToast, showSuccessToast } = useToast()

    const validationSchema = Yup.object({
        name: Yup.string()
            .required(t('thisFieldRequired', { name: t('endpointName') }))
            .matches(PATTERNS.NO_SPACE_AND_HYPHEN, t('msgInfoAccept'))
            .max(20, t('maxLengthExceeded', { max: 20 })),
        module: Yup.string().required(t('thisFieldRequired', { name: t('module') })),
        description: Yup.string()
            .required(t('thisFieldRequired', { name: t('description') }))
            .max(100, t('maxLengthExceeded', { max: 100 }))
    })

    const formik = useFormik({
        initialValues: {
            type: 'controller',
            name: '',
            path: 'api',
            actions: [],
            module: '',
            description: ''
        },
        validationSchema,
        onSubmit: (values, actions) => {
            const cValues: any = { ...values, type: 'controller' }

            if (mode === 'self') {
                handleCreateEndpoint(cValues, actions)
            } else if (mode === 'formik' && onConfirm) {
                onConfirm(cValues)
                actions.setSubmitting(false)
                formik.resetForm()
                onClose()
            }
        }
    })

    const handleCreateEndpoint = async (values: ControllerConfig, actions: any) => {
        try {
            const { error } = await window.engine.createController(
                values,
                framework,
                basePath
            )
            if (error) {
                showErrorToast(error)
                actions.setSubmitting(false)
                return
            }
            dispatch(onSetChangeStatus(true))
            showSuccessToast(t('endpointCreatedSuccess', { name: values.name }))
            actions.setSubmitting(false)
            formik.resetForm()
            onClose()
        } catch (error) {
            showErrorToast(error)
            actions.setSubmitting(false)
        }
    }

    useEffect(() => {
        const { name, path, module, description } = controller
        formik.setFieldValue('name', name)
        formik.setFieldValue('path', path)
        formik.setFieldValue('module', module)
        formik.setFieldValue('description', description)
    }, [controller])

    return (
        <IGRPDialogPrimitive open={isOpen} onOpenChange={onClose}>
            <IGRPDialogContentPrimitive>
                <IGRPDialogHeaderPrimitive>
                    <IGRPDialogTitlePrimitive>{t('createNewEndpoint')}</IGRPDialogTitlePrimitive>
                    <IGRPDialogDescriptionPrimitive>
                        {t('endpointDescription')}
                    </IGRPDialogDescriptionPrimitive>
                </IGRPDialogHeaderPrimitive>
                <form onSubmit={formik.handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-1 items-center gap-4">
                            <div className="col-span-12 flex flex-col gap-3">
                                <TextInput
                                    id="name"
                                    label={t('endpointName')}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    value={formik.values.name}
                                    error={formik.errors.name}
                                    isTouched={formik.touched.name}
                                    isRequired
                                />
                            </div>
                            <div className="col-span-12 gap-3 flex-col flex">
                                <TextInput
                                    id="path"
                                    label={t('basePath')}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    value={formik.values.path}
                                    error={formik.errors.path}
                                    isTouched={formik.touched.path}
                                />
                            </div>
                            <div className="col-span-12 flex flex-col gap-3">
                                <SelectInput
                                    id={'module'}
                                    label={t('moduleName')}
                                    options={modules}
                                    value={formik.values.module}
                                    error={formik.errors.module}
                                    isTouched={formik.touched.module}
                                    onChange={(value) => {
                                        formik.setFieldValue('module', value)
                                    }}
                                    onBlur={(value) => formik.setFieldValue('module', value)}
                                    isRequired
                                />
                            </div>
                            <div className="col-span-12 gap-3 flex-col flex">
                                <TextInput
                                    id="description"
                                    label={t('description')}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    value={formik.values.description}
                                    error={formik.errors.description}
                                    isTouched={formik.touched.description}
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
