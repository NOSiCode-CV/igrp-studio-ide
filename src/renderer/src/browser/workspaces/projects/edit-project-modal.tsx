'use client'

import {
    IGRPButtonPrimitive,
    IGRPDialogContentPrimitive,
    IGRPDialogDescriptionPrimitive,
    IGRPDialogFooterPrimitive,
    IGRPDialogHeaderPrimitive,
    IGRPDialogPrimitive,
    IGRPDialogTitlePrimitive,
    IGRPInputPrimitive,
    IGRPLabelPrimitive,
    IGRPTextAreaPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { LabelRequired } from '@renderer/components/label-required'
import { ProjectIcon } from '@renderer/components/shared-ui'
import { PATTERNS } from '@renderer/constants/appConstants'
import { useWorkspace } from '@renderer/hooks/use-workspace'
import { errorMessage, useZodForm } from '@renderer/lib/form'
import { Upload, X } from 'lucide-react'
import type React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ProjectData } from 'src/main/types'
import { z } from 'zod'

interface EditProjectFormValues {
    name: string
    config: { description: string } & Record<string, unknown>
    themeColor: string
    icon: string
}

interface EditProjectModalProps {
    project: ProjectData
    isOpen: boolean
    onClose: () => void
    onSuccess?: () => void
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({
    project,
    isOpen,
    onClose,
    onSuccess
}) => {
    const { t } = useTranslation()
    const {
        actions: { updateProject }
    } = useWorkspace()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const nameInputRef = useRef<HTMLInputElement>(null)

    const schema = useMemo(
        () =>
            z
                .object({
                    name: z
                        .string()
                        .min(1, t('fieldRequired', { name: t('projectName') }))
                        .regex(
                            PATTERNS.SPECIAL_CHARACTERS_PROJECT_NAME,
                            t('msgSpecialCharactersRegex')
                        )
                        .max(100, t('maxLengthExceeded', { max: 100 })),
                    config: z
                        .object({
                            description: z
                                .string()
                                .max(500, t('maxLengthExceeded', { max: 500 }))
                                .default('')
                        })
                        .passthrough()
                })
                .passthrough() as unknown as z.ZodType<EditProjectFormValues, unknown>,
        [t]
    )

    const defaultValues = useMemo<EditProjectFormValues>(
        () => ({
            name: project.name || '',
            config: {
                description: project.config?.description || '',
                ...project.config
            },
            themeColor: project.themeColor || '#000000',
            icon: project.icon || ''
        }),
        [project]
    )

    const form = useZodForm<EditProjectFormValues>({ schema, defaultValues })
    const { register, watch, setValue, reset, handleSubmit, formState } = form
    const { errors, touchedFields, isValid } = formState

    // Sync external `project` changes (enableReinitialize equivalent).
    useEffect(() => {
        reset(defaultValues)
    }, [defaultValues, reset])

    // Read current values for fields that aren't bound through `register`
    // (the colour input and the description textarea use setValue manually).
    const values = watch()
    const nameError = errorMessage(errors.name as never)
    const descriptionError = errorMessage(
        (errors.config as { description?: { message?: string } } | undefined)?.description as never
    )

    const onSubmit = handleSubmit(async (formValues) => {
        setIsSubmitting(true)
        try {
            const updatedProject = {
                ...project,
                name: formValues.name,
                config: {
                    ...project.config,
                    description: formValues.config.description
                },
                themeColor: formValues.themeColor,
                icon: formValues.icon
            }

            await updateProject(project.id, updatedProject)
            onSuccess?.()
            onClose()
        } catch (error) {
            console.error('Error updating project:', error)
        } finally {
            setIsSubmitting(false)
        }
    })

    const handleIconUpload = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
        const file = event.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            alert(t('invalidFileType'))
            return
        }

        if (file.size > 2 * 1024 * 1024) {
            alert(t('fileTooLarge'))
            return
        }

        try {
            const timestamp = Date.now()
            const fileExtension = file.name.split('.').pop()
            const fileName = `project-icon-${timestamp}.${fileExtension}`
            setValue('icon', `icons/${fileName}`, { shouldDirty: true })
        } catch (error) {
            console.error('Error handling icon upload:', error)
        }
    }

    const handleRemoveIcon = (): void => {
        setValue('icon', '', { shouldDirty: true })
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const nameRegister = register('name')

    // Forward RHF's ref alongside our local ref for autofocus.
    const nameRefHandler = (el: HTMLInputElement | null): void => {
        nameRegister.ref(el)
        nameInputRef.current = el
    }

    useEffect(() => {
        if (isOpen && values.name) {
            nameInputRef.current?.focus()
            nameInputRef.current?.select()
        }
    }, [values.name, isOpen])

    return (
        <IGRPDialogPrimitive open={isOpen} onOpenChange={onClose}>
            <IGRPDialogContentPrimitive className="overflow-hidden max-h-[80svh] sm:max-w-[700px] lg:max-w-[800px] max-w-4xl">
                <IGRPDialogHeaderPrimitive>
                    <IGRPDialogTitlePrimitive>{t('editProject')}</IGRPDialogTitlePrimitive>
                    <IGRPDialogDescriptionPrimitive>
                        {t('editProjectDescription')}
                    </IGRPDialogDescriptionPrimitive>
                </IGRPDialogHeaderPrimitive>

                <form onSubmit={onSubmit} className="space-y-6">
                    <div className="space-y-4">
                        {/* Project Icon */}
                        <div className="space-y-2">
                            <IGRPLabelPrimitive>{t('projectIcon')}</IGRPLabelPrimitive>
                            <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                                    {values.icon ? (
                                        <ProjectIcon
                                            project={{ ...project, icon: values.icon }}
                                            workspacePath=""
                                        />
                                    ) : (
                                        <div className="text-gray-400 text-xs text-center">
                                            {t('noIcon')}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 space-y-2">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleIconUpload}
                                        className="hidden"
                                    />
                                    <IGRPButtonPrimitive
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full"
                                    >
                                        <Upload className="w-4 h-4 mr-2" />
                                        {t('uploadIcon')}
                                    </IGRPButtonPrimitive>
                                    {values.icon && (
                                        <IGRPButtonPrimitive
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleRemoveIcon}
                                            className="w-full"
                                        >
                                            <X className="w-4 h-4 mr-2" />
                                            {t('removeIcon')}
                                        </IGRPButtonPrimitive>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Project Name */}
                        <div className="space-y-2">
                            <LabelRequired>{t('projectName')}</LabelRequired>
                            <IGRPInputPrimitive
                                {...nameRegister}
                                ref={nameRefHandler}
                                id="project-name"
                                placeholder={t('enterProjectName')}
                                maxLength={100}
                            />
                            {touchedFields.name && nameError && (
                                <p className="text-xs text-destructive">{nameError}</p>
                            )}
                        </div>

                        {/* Project Description */}
                        <div className="space-y-2">
                            <IGRPLabelPrimitive htmlFor="description">
                                {t('description')}
                            </IGRPLabelPrimitive>
                            <IGRPTextAreaPrimitive
                                id="description"
                                value={values.config.description}
                                onChange={(e) =>
                                    setValue('config.description', e.target.value, {
                                        shouldValidate: true,
                                        shouldDirty: true,
                                        shouldTouch: true
                                    })
                                }
                                placeholder={t('projectDescription')}
                                maxLength={500}
                                rows={3}
                            />
                            {descriptionError && (
                                <p className="text-xs text-destructive">{descriptionError}</p>
                            )}
                        </div>

                        {/* Theme Color */}
                        <div className="space-y-2">
                            <IGRPLabelPrimitive htmlFor="themeColor">
                                {t('themeColor')}
                            </IGRPLabelPrimitive>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="color"
                                    id="themeColor"
                                    value={values.themeColor}
                                    onChange={(e) =>
                                        setValue('themeColor', e.target.value, {
                                            shouldDirty: true
                                        })
                                    }
                                    className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                                />
                                <IGRPInputPrimitive
                                    value={values.themeColor}
                                    onChange={(e) =>
                                        setValue('themeColor', e.target.value, {
                                            shouldDirty: true
                                        })
                                    }
                                    placeholder="#000000"
                                    className="flex-1"
                                />
                            </div>
                        </div>
                    </div>

                    <IGRPDialogFooterPrimitive>
                        <IGRPButtonPrimitive
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            {t('cancel')}
                        </IGRPButtonPrimitive>
                        <IGRPButtonPrimitive type="submit" disabled={isSubmitting || !isValid}>
                            {isSubmitting ? t('saving') : t('saveChanges')}
                        </IGRPButtonPrimitive>
                    </IGRPDialogFooterPrimitive>
                </form>
            </IGRPDialogContentPrimitive>
        </IGRPDialogPrimitive>
    )
}
