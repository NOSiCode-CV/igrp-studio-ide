import { Button } from '@renderer/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle
} from '@renderer/components/ui/dialog'
import type { ComponentConfig, PageConfig } from '@igrp/igrp-studio-nextjs-engine/types'
import { ENV_TYPES, PATTERNS } from '@renderer/constants/appConstants'
import { TextInput } from '@renderer/generators/api/components/inputs-form'
import type { PageDefinition } from '@renderer/generators/ui/browser/page-manager'
import { useGit } from '@renderer/hooks/use-git'
import useToast from '@renderer/hooks/useToast'
import { camelCase, getId } from '@renderer/utils'
import { errorMessage, useZodForm } from '@renderer/lib/form'
import { type FocusEvent, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

interface DuplicatePageModalProps {
    isOpen: boolean
    basePath: string
    pageToDuplicate?: PageDefinition
    onClose: () => void
    onConfirm: () => void
}

// Deep copy function to ensure all properties are copied
const deepCopy = (obj: any): any => {
    if (obj === null || typeof obj !== 'object') return obj
    if (obj instanceof Date) return new Date(obj.getTime())
    if (obj instanceof Array) return obj.map((item) => deepCopy(item))
    if (typeof obj === 'object') {
        const copiedObj: any = {}
        for (const key in obj) {
            if (Object.hasOwn(obj, key)) {
                copiedObj[key] = deepCopy(obj[key])
            }
        }
        return copiedObj
    }
    return obj
}

interface DuplicateFormValues {
    description: string
    name: string
    path: string
    pageName: string
    pagePath: string
    // Any other properties carried over from the original component config.
    [key: string]: unknown
}

export function DuplicatePageModal({
    isOpen,
    basePath,
    onClose,
    onConfirm,
    pageToDuplicate
}: DuplicatePageModalProps): React.JSX.Element {
    const { t } = useTranslation()
    const { createGitCommit } = useGit()
    const { showErrorToast, showSuccessToast } = useToast()

    const isPage = pageToDuplicate?.isPage

    // Create a deep copy of the original content
    const originalContent = useMemo(
        () => deepCopy(pageToDuplicate?.content || {}),
        [pageToDuplicate]
    )

    const defaultValues = useMemo<DuplicateFormValues>(
        () => ({
            ...originalContent,
            description: originalContent?.description ? `${originalContent.description} Copy` : '',
            name: originalContent?.pageName ? `${originalContent.pageName}Copy` : '',
            path: originalContent?.path ? `${originalContent.path}-copy` : '',
            pagePath: originalContent?.pagePath || '',
            pageName: originalContent?.pageName ? `${originalContent.pageName}Copy` : ''
        }),
        [originalContent]
    )

    // Schema is rebuilt when the page/component flag flips so the localized
    // messages and the conditional `path` rule stay in sync.
    const schema = useMemo(() => {
        const base = z.object({
            description: z.string().min(
                1,
                t('thisFieldRequired', {
                    name: isPage ? t('pageTitle') : t('componentTitle')
                })
            ),
            name: z
                .string()
                .min(1, t('thisFieldRequired', { name: t('name') }))
                .regex(PATTERNS.NO_SPACE_AND_HYPHEN, t('msgInfoAccpet')),
            path: isPage
                ? z
                      .string()
                      .min(1, t('thisFieldRequired', { name: t('path') }))
                      .regex(
                          PATTERNS.VALID_SEGMENT_PATTERN,
                          'Invalid Next.js path format. Examples: /about, /[id], /[[...slug]]'
                      )
                : z.string().optional().default('')
        })
        // Accept any other passthrough fields from the original content.
        return base.passthrough() as unknown as z.ZodType<DuplicateFormValues, unknown>
    }, [isPage, t])

    const form = useZodForm<DuplicateFormValues>({
        schema,
        defaultValues
    })

    const { register, setValue, watch, reset, handleSubmit, formState } = form
    const { errors, touchedFields, isSubmitting } = formState

    // Reinitialise the form whenever the modal is reopened on a different
    // page/component, mirroring Formik's `enableReinitialize: true`.
    useEffect(() => {
        if (isOpen) reset(defaultValues)
    }, [isOpen, defaultValues, reset])

    const descriptionField = register('description', {
        onBlur: async (e: FocusEvent<HTMLInputElement>) => {
            if (watch('name')) return
            const generatedName = camelCase(e.target.value)
            setValue('name', generatedName, { shouldValidate: true, shouldTouch: true })

            if (isPage) {
                const generatedPath = e.target.value.toLowerCase().replace(/\s+/g, '-')
                setValue('path', generatedPath, { shouldValidate: true, shouldTouch: true })
            }
        }
    })

    const nameField = register('name', {
        onBlur: async (e: FocusEvent<HTMLInputElement>) => {
            if (!isPage) return
            if (watch('path')) return
            const generatedPath = e.target.value.toLowerCase().replace(/\s+/g, '-')
            setValue('path', generatedPath, { shouldValidate: true, shouldTouch: true })
        }
    })

    const pathField = register('path')

    const onSubmit = handleSubmit(async (values) => {
        try {
            const config = isPage
                ? ({
                      ...originalContent,
                      type: 'page',
                      pageName: values.name,
                      path: values.path,
                      description: values.description,
                      id: getId()
                  } as PageConfig)
                : ({
                      ...originalContent,
                      description: values.description,
                      name: values.name,
                      id: getId()
                  } as ComponentConfig)

            const { error } = await window.engine.createPage(config, ENV_TYPES.NEXTJS, basePath)

            if (error) {
                showErrorToast(error)
                return
            }

            showSuccessToast(
                `${isPage ? 'Page' : 'Component'} ${values.name} has been successfully duplicated.`
            )

            createGitCommit(basePath, 'Added Form Validation and page duplicate')

            onConfirm()
            reset(defaultValues)
        } catch (error) {
            showErrorToast(error)
        }
    })

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogTitle>
                    {t('duplicateItem', {
                        type: isPage ? 'page' : 'component',
                        name: pageToDuplicate?.description || pageToDuplicate?.pageName
                    })}
                </DialogTitle>
                <DialogDescription>
                    {t('duplicateItemDescription', {
                        type: isPage ? 'page' : 'component'
                    })}
                </DialogDescription>
                <form className="needs-validation space-y-4" onSubmit={onSubmit}>
                    <div className="grid grid-cols-1 gap-4">
                        <TextInput
                            id="description"
                            label={isPage ? t('pageTitle') : t('componentTitle')}
                            {...descriptionField}
                            isTouched={!!touchedFields.description}
                            error={errorMessage(errors.description as never)}
                            placeholder={isPage ? 'Todo List (Copy)' : 'Todo Item (Copy)'}
                            isRequired
                        />
                        <TextInput
                            id="name"
                            label={t('name')}
                            {...nameField}
                            isTouched={!!touchedFields.name}
                            error={errorMessage(errors.name as never)}
                            placeholder={isPage ? 'TodoListCopy' : 'TodoItemCopy'}
                            isRequired
                        />
                        {isPage && (
                            <TextInput
                                id="path"
                                label="Path"
                                placeholder="e.g. todo-list-copy"
                                {...pathField}
                                isTouched={!!touchedFields.path}
                                error={errorMessage(errors.path as never)}
                                isRequired
                            />
                        )}
                    </div>
                    <DialogFooter className="flex justify-between">
                        <Button type="button" variant="ghost" onClick={onClose}>
                            {t('cancel')}
                        </Button>
                        <Button type="submit" disabled={isSubmitting} color="primary">
                            {isSubmitting ? t('duplicating') : t('duplicate')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
