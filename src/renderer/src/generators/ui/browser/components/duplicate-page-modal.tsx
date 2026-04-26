import {
    IGRPButtonPrimitive,
    IGRPDialogContentPrimitive,
    IGRPDialogDescriptionPrimitive,
    IGRPDialogFooterPrimitive,
    IGRPDialogPrimitive,
    IGRPDialogTitlePrimitive
} from '@igrp/igrp-framework-react-design-system'
import type { ComponentConfig, PageConfig } from '@igrp/igrp-studio-nextjs-engine/types'
import { ENV_TYPES, PATTERNS } from '@renderer/constants/appConstants'
import { TextInput } from '@renderer/generators/api/components/inputs-form'
import type { PageDefinition } from '@renderer/generators/ui/browser/page-manager'
import { useGit } from '@renderer/hooks/use-git'
import useToast from '@renderer/hooks/useToast'
import { getId } from '@renderer/utils'
import { useFormik } from 'formik'
import { camelCase } from 'lodash-es'
import type { FocusEvent } from 'react'
import { useTranslation } from 'react-i18next'
import * as Yup from 'yup'

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
    const originalContent = deepCopy(pageToDuplicate?.content || {})

    const initialValues = {
        // Copy any other properties that might exist
        ...originalContent,
        description: originalContent?.description ? `${originalContent.description} Copy` : '',
        name: originalContent?.pageName ? `${originalContent.pageName}Copy` : '',
        path: originalContent?.path ? `${originalContent.path}-copy` : '',
        pagePath: originalContent?.pagePath || '',
        pageName: originalContent?.pageName ? `${originalContent.pageName}Copy` : ''
    }

    const validationSchema = Yup.object({
        description: Yup.string().required(
            t('thisFieldRequired', {
                name: isPage ? t('pageTitle') : t('componentTitle')
            })
        ),
        name: Yup.string()
            .required(t('thisFieldRequired', { name: t('name') }))
            .matches(PATTERNS.NO_SPACE_AND_HYPHEN, t('msgInfoAccpet')),
        ...(isPage && {
            path: Yup.string()
                .required(t('thisFieldRequired', { name: t('path') }))
                .matches(
                    PATTERNS.VALID_SEGMENT_PATTERN,
                    'Invalid Next.js path format. Examples: /about, /[id], /[[...slug]]'
                )
        })
    })

    const formik = useFormik({
        enableReinitialize: true,
        initialValues,
        validationSchema,
        onSubmit: async (values, actions) => {
            try {
                const config = isPage
                    ? ({
                          // Include all other properties from original
                          ...originalContent,
                          type: 'page',
                          pageName: values.name,
                          path: values.path,
                          description: values.description,
                          id: getId()
                      } as PageConfig)
                    : ({
                          // Include all other properties from original
                          ...originalContent,
                          description: values.description,
                          name: values.name,
                          id: getId()
                      } as ComponentConfig)

                console.log(config)

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
                formik.resetForm()
            } catch (error) {
                showErrorToast(error)
            } finally {
                actions.setSubmitting(false)
            }
        }
    })

    const handleDescriptionBlur = async (e: FocusEvent<HTMLInputElement>): Promise<void> => {
        formik.handleBlur(e)

        if (formik.values.name) return
        const generatedName = `${camelCase(e.target.value)}`
        formik.setFieldValue('name', generatedName)

        if (isPage) {
            const generatedPath = `${e.target.value.toLowerCase().replace(/\s+/g, '-')}`
            formik.setFieldValue('path', generatedPath)
        }
    }

    const handleNameBlur = async (e: FocusEvent<HTMLInputElement>): Promise<void> => {
        formik.handleBlur(e)

        if (formik.values.path) return
        const generatedPath = `${e.target.value.toLowerCase().replace(/\s+/g, '-')}`
        formik.setFieldValue('path', generatedPath)
    }

    return (
        <IGRPDialogPrimitive open={isOpen} onOpenChange={onClose}>
            <IGRPDialogContentPrimitive>
                <IGRPDialogTitlePrimitive>
                    {t('duplicateItem', {
                        type: isPage ? 'page' : 'component',
                        name: pageToDuplicate?.description || pageToDuplicate?.pageName
                    })}
                </IGRPDialogTitlePrimitive>
                <IGRPDialogDescriptionPrimitive>
                    {t('duplicateItemDescription', {
                        type: isPage ? 'page' : 'component'
                    })}
                </IGRPDialogDescriptionPrimitive>
                <form
                    className="needs-validation space-y-4"
                    onSubmit={(e) => {
                        e.preventDefault()
                        formik.handleSubmit()
                    }}
                >
                    <div className="grid grid-cols-1 gap-4">
                        <TextInput
                            id="description"
                            label={isPage ? t('pageTitle') : t('componentTitle')}
                            onChange={formik.handleChange}
                            onBlur={handleDescriptionBlur}
                            value={formik.values.description || ''}
                            isTouched={!!formik.touched.description}
                            error={formik.errors.description as string}
                            placeholder={isPage ? 'Todo List (Copy)' : 'Todo Item (Copy)'}
                            isRequired
                        />
                        <TextInput
                            id="name"
                            label={t('name')}
                            onChange={formik.handleChange}
                            onBlur={isPage ? handleNameBlur : formik.handleBlur}
                            value={formik.values.name || ''}
                            isTouched={!!formik.touched.name}
                            error={formik.errors.name as string}
                            placeholder={isPage ? 'TodoListCopy' : 'TodoItemCopy'}
                            isRequired
                        />
                        {isPage && (
                            <TextInput
                                id="path"
                                label="Path"
                                placeholder="e.g. todo-list-copy"
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                value={formik.values.path || ''}
                                isTouched={!!formik.touched.path}
                                error={formik.errors.path as string}
                                isRequired
                            />
                        )}
                    </div>
                    <IGRPDialogFooterPrimitive className="flex justify-between">
                        <IGRPButtonPrimitive type="button" variant="ghost" onClick={onClose}>
                            {t('cancel')}
                        </IGRPButtonPrimitive>
                        <IGRPButtonPrimitive
                            type="submit"
                            disabled={formik.isSubmitting}
                            color="primary"
                        >
                            {formik.isSubmitting ? t('duplicating') : t('duplicate')}
                        </IGRPButtonPrimitive>
                    </IGRPDialogFooterPrimitive>
                </form>
            </IGRPDialogContentPrimitive>
        </IGRPDialogPrimitive>
    )
}
