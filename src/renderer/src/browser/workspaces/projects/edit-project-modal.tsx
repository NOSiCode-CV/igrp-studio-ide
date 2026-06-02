'use client'

import { ProjectIcon } from '@renderer/components/shared-ui'
import { PATTERNS } from '@renderer/constants/appConstants'
import { useWorkspace } from '@renderer/hooks/use-workspace'
import { errorMessage, useZodForm } from '@renderer/lib/form'
import { FolderKanban, Palette, Plus, SquarePen, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import type React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
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
    const colorInputRef = useRef<HTMLInputElement>(null)

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
            name: project?.name || '',
            config: {
                description: project?.config?.description || '',
                ...project?.config
            },
            themeColor: project?.themeColor || '#000000',
            icon: project?.icon || ''
        }),
        [project]
    )

    const form = useZodForm<EditProjectFormValues>({ schema, defaultValues })
    const { register, watch, setValue, reset, handleSubmit, formState } = form
    const { errors, touchedFields, isValid } = formState

    useEffect(() => {
        reset(defaultValues)
    }, [defaultValues, reset])

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
            const fileExtension = file.name.split('.').pop() || 'png'
            const fileName = `project-icon-${timestamp}.${fileExtension}`
            setValue('icon', `icons/${fileName}`, { shouldDirty: true })
        } catch (error) {
            console.error('Error handling icon upload:', error)
        }
    }

    const nameRegister = register('name')

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

    const hexColor = values.themeColor || '#000000'
    const luminance = parseInt(hexColor.replace('#', ''), 16) || 0
    const isLight = luminance > 0xffffff / 1.5
    const textColor = isLight ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,1)'
    const iconColor = isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.9)'

    if (!project) return null

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/25 backdrop-blur-[3px]"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: 10 }}
                        className="w-full max-w-[460px] bg-white rounded-[4px] border border-slate-100 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.12),0_4px_24px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col font-sans"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <form onSubmit={onSubmit} className="flex flex-col">
                            {/* Header */}
                            <div className="pl-3 pr-2 py-1.5 bg-[#fcfcfc] border-b border-slate-200 flex items-center justify-between select-none">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-teal-600 rounded scale-90 flex items-center justify-center">
                                        <SquarePen className="w-[10px] h-[10px] text-white stroke-[3]" />
                                    </div>
                                    <span className="text-[12px] font-medium text-slate-700 tracking-tight">
                                        Edit Project
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 group transition-colors"
                                >
                                    <X className="w-[14px] h-[14px]" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="px-5 py-4 overflow-y-auto max-h-[80vh]">
                                <div className="flex items-start gap-4">
                                    {/* Left column - Icon uploader */}
                                    <div className="flex flex-col items-center gap-1.5 shrink-0 pt-0.5 select-none">
                                        <button
                                            type="button"
                                            className="w-12 h-12 rounded border border-dashed border-slate-300 bg-slate-50 text-slate-300 shadow-sm active:scale-95 hover:border-teal-500 hover:bg-teal-50/20 group relative cursor-pointer transition-all flex items-center justify-center overflow-hidden"
                                            onClick={() => fileInputRef.current?.click()}
                                            aria-label="Upload project icon"
                                        >
                                            {values.icon ? (
                                                <ProjectIcon
                                                    project={{ ...project, icon: values.icon }}
                                                    workspacePath=""
                                                />
                                            ) : (
                                                <>
                                                    <FolderKanban className="w-5 h-5 opacity-40 group-hover:opacity-0 transition-opacity duration-300" />
                                                    <Plus className="w-4 h-4 text-teal-600 absolute scale-50 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300" />
                                                </>
                                            )}
                                        </button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleIconUpload}
                                            className="hidden"
                                        />
                                    </div>

                                    {/* Right column - Fields */}
                                    <div className="flex-1 flex flex-col space-y-2.5">
                                        {/* Field 1 - Name */}
                                        <div className="flex items-center gap-2">
                                            <label
                                                htmlFor="project-name-input"
                                                className="w-16 text-[11px] text-slate-600 text-right whitespace-nowrap"
                                            >
                                                Name <span className="text-rose-500">*</span>:
                                            </label>
                                            <div className="flex-1">
                                                <input
                                                    {...nameRegister}
                                                    ref={nameRefHandler}
                                                    id="project-name-input"
                                                    placeholder="Enter project name..."
                                                    className="w-full bg-white border border-slate-300 rounded-[2px] px-2 py-1 text-[11px] text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/10 shadow-[inset_0_1px_1px_rgba(0,0,0,0.03)]"
                                                />
                                                {touchedFields.name && nameError && (
                                                    <p className="text-[10px] text-rose-500 mt-1">
                                                        {nameError}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Field 2 - Theme color */}
                                        <div className="flex items-center gap-2">
                                            <label
                                                htmlFor="project-color-picker"
                                                className="w-16 text-[11px] text-slate-600 text-right whitespace-nowrap"
                                            >
                                                Theme:
                                            </label>
                                            <div className="flex-1 max-w-[180px]">
                                                {/* biome-ignore lint/a11y/useSemanticElements: this wrapper triggers a nested hidden <input type="color"> via ref; a real <button> would nest an interactive element */}
                                                <div
                                                    className="w-full h-[28px] rounded border border-slate-300 shadow-[inset_0_1px_1px_rgba(0,0,0,0.02)] flex items-center justify-between px-2.5 overflow-hidden group hover:ring-1 hover:ring-teal-500/20 hover:border-teal-500 cursor-pointer relative"
                                                    style={{ backgroundColor: hexColor }}
                                                    onClick={() => colorInputRef.current?.click()}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault()
                                                            colorInputRef.current?.click()
                                                        }
                                                    }}
                                                    role="button"
                                                    tabIndex={0}
                                                    aria-label="Pick theme color"
                                                >
                                                    <input
                                                        type="color"
                                                        ref={colorInputRef}
                                                        id="project-color-picker"
                                                        value={hexColor}
                                                        onChange={(e) =>
                                                            setValue('themeColor', e.target.value, {
                                                                shouldDirty: true
                                                            })
                                                        }
                                                        className="absolute opacity-0 w-0 h-0"
                                                    />
                                                    <span
                                                        className="text-[10px] font-mono font-semibold tracking-wide"
                                                        style={{ color: textColor }}
                                                    >
                                                        {hexColor.toUpperCase()}
                                                    </span>
                                                    <Palette
                                                        className="w-[14px] h-[14px] group-hover:rotate-12 transition-transform duration-300"
                                                        style={{ color: iconColor }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Field 3 - Description */}
                                        <div className="flex items-start gap-2">
                                            <label
                                                htmlFor="project-description"
                                                className="w-16 text-[11px] text-slate-600 text-right whitespace-nowrap pt-1"
                                            >
                                                Description:
                                            </label>
                                            <div className="flex-1">
                                                <textarea
                                                    id="project-description"
                                                    value={values.config.description}
                                                    onChange={(e) =>
                                                        setValue(
                                                            'config.description',
                                                            e.target.value,
                                                            {
                                                                shouldValidate: true,
                                                                shouldDirty: true,
                                                                shouldTouch: true
                                                            }
                                                        )
                                                    }
                                                    rows={3}
                                                    placeholder="Describe this project..."
                                                    className="w-full bg-white border border-slate-300 rounded-[2px] px-2 py-1.5 text-[11px] text-slate-700 leading-relaxed resize-none focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/10 shadow-[inset_0_1px_1px_rgba(0,0,0,0.03)]"
                                                />
                                                {descriptionError && (
                                                    <p className="text-[10px] text-rose-500 mt-1">
                                                        {descriptionError}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-3 py-2 bg-[#f8f9fb] border-t border-slate-200 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={isSubmitting}
                                    className="px-4 py-1 text-[11px] font-bold text-slate-600 bg-white border border-slate-200 rounded-[2px] hover:bg-slate-50 min-w-[70px] transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !isValid}
                                    className="px-4 py-1 text-[11px] font-bold text-white bg-teal-600 border border-teal-700 rounded-[2px] shadow-sm hover:bg-teal-700 min-w-[100px] transition-colors disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )

    if (typeof document === 'undefined') return null

    return createPortal(modalContent, document.body)
}
