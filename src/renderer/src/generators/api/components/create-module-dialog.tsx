'use client'

import {
    IGRPButtonPrimitive,
    IGRPDialogContentPrimitive,
    IGRPDialogDescriptionPrimitive,
    IGRPDialogFooterPrimitive,
    IGRPDialogHeaderPrimitive,
    IGRPDialogPrimitive,
    IGRPDialogTitlePrimitive,
    IGRPDialogTriggerPrimitive,
    IGRPInputPrimitive,
    IGRPLabelPrimitive,
    IGRPTooltipContentPrimitive,
    IGRPTooltipPrimitive,
    IGRPTooltipProviderPrimitive,
    IGRPTooltipTriggerPrimitive
} from '@igrp/igrp-framework-react-design-system'
import type { ModuleConfig } from '@igrp/igrp-studio-springboot-engine/types'
import { ENV_TYPES, PATTERNS } from '@renderer/constants/appConstants'
import { useGit } from '@renderer/hooks/use-git'
import useToast from '@renderer/hooks/useToast'
import { errorMessage, useZodForm } from '@renderer/lib/form'
import { cn } from '@renderer/lib/utils'
import { setChangeStatus as onSetChangeStatus } from '@renderer/redux/thunks'
import { Plus } from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { z } from 'zod'

interface CreateModuleDialogProps {
    basePath: string
}

const initialValues: ModuleConfig = {
    type: 'module',
    name: ''
}

export function CreateModuleDialog({ basePath }: CreateModuleDialogProps) {
    const [isOpen, setIsOpen] = React.useState(false)

    const { t } = useTranslation()
    const { createGitCommit } = useGit()
    const dispatch: any = useDispatch()
    const { showErrorToast, showSuccessToast } = useToast()

    const schema = React.useMemo(
        () =>
            z
                .object({
                    name: z
                        .string()
                        .min(1, t('thisFieldRequired', { name: 'Name' }))
                        .regex(PATTERNS.NO_SPACE_AND_HYPHEN, t('msgInfoAccpet'))
                        .max(20, t('maxLengthExceeded', { max: 20 }))
                })
                .passthrough() as unknown as z.ZodType<ModuleConfig, unknown>,
        [t]
    )

    const form = useZodForm<ModuleConfig>({ schema, defaultValues: initialValues })
    const { register, handleSubmit, reset, formState, getValues } = form
    const { errors, touchedFields } = formState
    const nameError = errorMessage(errors.name as never)

    const onCreateModule = async (): Promise<void> => {
        try {
            const values = getValues()
            const { error } = await window.engine.createModule(values, ENV_TYPES.SPRING, basePath)

            if (error) {
                showErrorToast(error)
                return
            }

            reset(initialValues)
            createGitCommit(basePath, `${t('addModule')} ${values.name}`)
            dispatch(onSetChangeStatus(true))
            showSuccessToast(t('moduleAdded', { name: values.name }))
        } catch (error) {
            showErrorToast(error)
        }
    }

    const onSubmit = handleSubmit(async () => {
        await onCreateModule()
        reset(initialValues)
        setIsOpen(false)
    })

    return (
        <IGRPTooltipProviderPrimitive>
            <IGRPDialogPrimitive open={isOpen} onOpenChange={setIsOpen}>
                <IGRPTooltipPrimitive>
                    <IGRPTooltipTriggerPrimitive asChild>
                        <IGRPDialogTriggerPrimitive asChild>
                            <IGRPButtonPrimitive
                                size="icon"
                                className="ml-auto rounded-md shadow-md hover:shadow-lg transition-shadow duration-200"
                            >
                                <Plus className="h-4 w-4" />
                            </IGRPButtonPrimitive>
                        </IGRPDialogTriggerPrimitive>
                    </IGRPTooltipTriggerPrimitive>
                    <IGRPTooltipContentPrimitive>
                        <p>{t('createNewModule')}</p>
                    </IGRPTooltipContentPrimitive>
                </IGRPTooltipPrimitive>
                <IGRPDialogContentPrimitive className="max-w-[425px]">
                    <IGRPDialogHeaderPrimitive>
                        <IGRPDialogTitlePrimitive>{t('createNewModule')}</IGRPDialogTitlePrimitive>
                        <IGRPDialogDescriptionPrimitive>
                            {t('dialogDescription')}
                        </IGRPDialogDescriptionPrimitive>
                    </IGRPDialogHeaderPrimitive>
                    <form onSubmit={onSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <IGRPLabelPrimitive htmlFor="name" className="text-right">
                                    {t('moduleName')}
                                </IGRPLabelPrimitive>
                                <div className="col-span-3">
                                    <IGRPInputPrimitive
                                        id="name"
                                        {...register('name')}
                                        className={cn(
                                            touchedFields.name && nameError ? 'border-red-500' : ''
                                        )}
                                    />
                                    {nameError && (
                                        <p className="text-sm text-red-600">{nameError}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <IGRPDialogFooterPrimitive>
                            <IGRPButtonPrimitive type="submit">
                                {t('saveModule')}
                            </IGRPButtonPrimitive>
                        </IGRPDialogFooterPrimitive>
                    </form>
                </IGRPDialogContentPrimitive>
            </IGRPDialogPrimitive>
        </IGRPTooltipProviderPrimitive>
    )
}
