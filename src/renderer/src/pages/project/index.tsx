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
    IGRPRadioGroupItemPrimitive,
    IGRPRadioGroupPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { FrameworkIcon } from '@renderer/components/framework-icon'
import { LabelRequired } from '@renderer/components/label-required'
import { useWorkspace } from '@renderer/hooks/use-workspace'
import { type FormikErrors, useFormik } from 'formik'
import {
    ArrowLeft,
    ArrowRight,
    FolderOpen,
    Loader2,
    Monitor,
    PlusCircle,
    Server,
    Upload
} from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import type { FrameworkType, ProjectData } from 'src/main/types'
import { DotNetConfig } from './components/configurations/dotnet-config'
import { NextConfig } from './components/configurations/next-config'
import { SpringConfig } from './components/configurations/spring-config'
import { StepButton } from './components/step-button'
import { backendFrameworks, frontendFrameworks, STEPS, THEME_COLORS } from './data'
import { useProjectValidation } from './validation'

interface ConfigComponentProps {
    data: any // Replace `any` with a specific type if possible (e.g., `ProjectData`)
    errors?: FormikErrors<ProjectData>
    onChange: (config: any) => void
}

type ConfigComponent = React.FC<ConfigComponentProps>

const componentsMap: Record<string, ConfigComponent> = {
    springboot: SpringConfig,
    nextjs: NextConfig,
    dotnet: DotNetConfig
}

export const ProjectConfigForm = ({
    type,
    data,
    errors,
    onChange
}: {
    type: string
} & ConfigComponentProps) => {
    const Component = componentsMap[type]
    return <Component data={data} errors={errors} onChange={onChange} />
}

export function ProjectWizard({ children }: { children?: React.ReactNode }) {
    const [open, setOpen] = React.useState(false)
    const [step, setStep] = React.useState(1)
    const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
    const [isCreatingProject, setIsCreatingProject] = React.useState(false)

    const { t } = useTranslation()

    const {
        workspace,
        actions: { saveOrOpenProject }
    } = useWorkspace()

    const initialValues: ProjectData = React.useMemo(
        () => ({
            id: '',
            name: '',
            type: undefined,
            framework: 'springboot',
            config: {},
            path: '',
            themeColor: '#000000',
            icon: '',
            workspaceId: workspace.id
        }),
        [workspace.id]
    )

    const validationSchema = useProjectValidation({ t, step })

    const formik = useFormik({
        enableReinitialize: true,
        initialValues,
        validationSchema,
        onSubmit: async (values, actions) => {
            setIsCreatingProject(true)
            try {
                await saveOrOpenProject({ project: { ...values } })
            } finally {
                actions.setSubmitting(false)
                setIsCreatingProject(false)
            }
        }
    })

    const inputRef = React.useRef<HTMLInputElement>(null)
    const iconUploadRef = React.useRef<HTMLInputElement>(null)
    const wasOpenRef = React.useRef(open)

    React.useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus()
            inputRef.current.select()
        }
    }, [])

    /**
     * Handles file upload for project icons.
     * Instead of storing base64 data in JSON (which can be very large for big files),
     * this function saves the file to disk and stores only the relative path.
     *
     * Benefits:
     * - Reduces JSON file size significantly
     * - Better performance for large files
     * - Easier to manage and backup
     * - Supports larger file sizes
     */
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        try {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please select a valid image file.')
                return
            }

            // Check file size (limit to 5MB for icons)
            const maxSize = 5 * 1024 * 1024 // 5MB
            if (file.size > maxSize) {
                alert('File size too large. Please select an image smaller than 5MB.')
                return
            }

            // Validate project name exists
            if (!formik.values.name || formik.values.name.trim() === '') {
                alert('Please enter a project name before uploading an icon.')
                return
            }

            // Create a unique filename
            const fileExtension = file.name.split('.').pop() || 'png'
            const fileName = `icon_${Date.now()}.${fileExtension}`

            // Save file to centralized icons directory
            const iconsPath = `${workspace.path}/icons`
            const filePath = `${iconsPath}/${fileName}`

            // Use electron API to save file
            const result = await window.api.saveProjectIcon({
                filePath,
                fileData: await file.arrayBuffer(),
                assetsPath: iconsPath
            })

            if (result.success) {
                // Store the relative path instead of base64
                const relativePath = `icons/${fileName}`
                formik.setFieldValue('icon', relativePath)
                // Preview will be updated by useEffect when icon changes
            } else {
                console.error('Failed to save icon file:', result.error)
                alert('Failed to save icon file. Please try again.')
            }
        } catch (error) {
            console.error('Error uploading file:', error)
            alert('Error uploading file. Please try again.')
        }
    }

    /**
     * Converts an icon path to a displayable URL.
     * Handles different path formats:
     * - Relative paths (icons/filename.ext) -> fetches file securely via IPC
     * - Legacy assets paths -> fetches file securely via IPC
     * - Base64 data URLs -> returns as is (for backward compatibility)
     */
    const getIconPreviewUrl = React.useCallback(
        async (iconPath: string): Promise<string | null> => {
            if (!iconPath) return null

            // If it's a base64 string (for backward compatibility), return as is
            if (iconPath.startsWith('data:')) {
                return iconPath
            }

            // If it's a relative path, fetch the file securely
            if (iconPath.startsWith('icons/') || iconPath.startsWith('assets/')) {
                try {
                    const result = await window.api.getIconFile(iconPath, workspace.path)
                    if (result.success) {
                        return result.data
                    } else {
                        console.warn('Failed to load icon file:', result.error)
                        return null
                    }
                } catch (error) {
                    console.error('Error loading icon file:', error)
                    return null
                }
            }

            return null
        },
        [workspace.path]
    )

    const isFrontend = formik.values.type === 'frontend'

    const frameworks = isFrontend ? frontendFrameworks : backendFrameworks

    const canNavigateToStep = (targetStep: number) => {
        if (targetStep === 1) return true
        if (targetStep === 2) return !!formik.values.name && !!formik.values.type
        if (targetStep === 3) return !!formik.values.framework
        if (targetStep === 4) {
            return !!formik.values.config
        }
        if (targetStep === STEPS.length) return !!formik.values.path.trim()
        return false
    }

    const handleStepClick = (targetStep: number) => {
        if (canNavigateToStep(targetStep)) {
            setStep(targetStep)
        }
    }

    const handleNext = async () => {
        const errors = await formik.validateForm()

        if (step === 1 && errors.name) return

        if (step === 3 && Object.keys(errors).length !== 0 && errors.config !== undefined) {
            return
        }
        if (step < STEPS.length && canNavigateToStep(step + 1)) {
            setStep(step + 1)
        }
    }

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1)
        }
    }

    const handleOpenDirectory = async () => {
        const result = await window.api.openDirectory(t('projectDirectory'))
        if (!result.canceled && result.basePath) {
            formik.setFieldValue('path', result.basePath)
        }
    }

    const handleChangeType = (value: string) => {
        if (formik.values.framework !== value) formik.setFieldValue('framework', '')
        formik.setFieldValue('type', value)
    }

    const handleChangeFramework = (value: string) => {
        if (formik.values.framework !== value) formik.setFieldValue('config', undefined)
        formik.setFieldValue('framework', value)
    }

    const SelectedComponent = formik.values?.framework
        ? componentsMap[formik.values?.framework]
        : null

    React.useEffect(() => {
        const wasOpen = wasOpenRef.current
        wasOpenRef.current = open

        // Reset only when the dialog transitions from open -> closed
        if (wasOpen && !open) {
            formik.resetForm({ values: initialValues })
            setStep(1)
        }
    }, [formik.resetForm, initialValues, open])

    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
                event.preventDefault()
                setOpen(true)
            }
        }

        document.addEventListener('keydown', handleKeyDown)

        return () => {
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [])

    React.useEffect(() => {
        const targetPath = `${workspace.path}/projects/${
            formik.values?.config?.name ?? formik.values.name
        }`

        if (formik.values.path !== targetPath) {
            formik.setFieldValue('path', targetPath, false)
        }
    }, [formik.setFieldValue, formik.values?.config?.name, formik.values.name, formik.values.path, workspace.path])

    // Update preview when icon changes
    React.useEffect(() => {
        const updatePreview = async () => {
            if (formik.values.icon) {
                const previewUrl = await getIconPreviewUrl(formik.values.icon)
                setPreviewUrl(previewUrl)
            } else {
                setPreviewUrl(null)
            }
        }

        updatePreview()
    }, [formik.values.icon, getIconPreviewUrl])

    const renderStep1 = () => (
        <div className="space-y-4">
            <div className="space-y-2">
                <LabelRequired>{t('projectName')}</LabelRequired>
                <IGRPInputPrimitive
                    id="name"
                    name="name"
                    placeholder={t('enterProjectName')}
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    ref={inputRef}
                    autoFocus
                    maxLength={50}
                    className="mt-2"
                />
                {formik.touched.name && formik.errors.name && (
                    <p className="text-xs text-destructive">{formik.errors.name}</p>
                )}
            </div>

            {/* Project Icon Upload with Preview */}
            <div className="space-y-2">
                <IGRPLabelPrimitive>{t('projectIcon')}</IGRPLabelPrimitive>
                <input
                    ref={iconUploadRef}
                    type="file"
                    id="icon-upload"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                />
                <label htmlFor="icon-upload" className="block">
                    <div className="border border-dashed rounded-lg p-8 text-center space-y-2 cursor-pointer hover:border-primary/50">
                        {previewUrl ? (
                            <div className="flex flex-col items-center gap-2">
                                <img
                                    src={previewUrl}
                                    alt="Project icon preview"
                                    className="w-16 h-16 rounded-full object-cover"
                                />
                                <span className="text-sm text-gray-600">
                                    {t('clickToChangeIcon')}
                                </span>
                            </div>
                        ) : (
                            <>
                                <Upload className="w-8 h-8 mx-auto text-gray-400" />
                                <div className="text-sm text-gray-600">
                                    {t('clickOrDragToUploadIcon')}
                                    <div className="text-xs text-gray-400">
                                        {t('recommendedSize')}
                                    </div>
                                </div>
                                <IGRPButtonPrimitive
                                    variant="outline"
                                    size="sm"
                                    type="button"
                                    onClick={() => iconUploadRef.current?.click()}
                                >
                                    {t('upload')}...
                                </IGRPButtonPrimitive>
                            </>
                        )}
                    </div>
                </label>
            </div>

            <div className="space-y-2">
                <IGRPLabelPrimitive>{t('projectType')}</IGRPLabelPrimitive>
                <IGRPRadioGroupPrimitive
                    name="type"
                    value={formik.values.type}
                    onValueChange={(value) => handleChangeType(value)}
                    className="grid grid-cols-2 gap-4 mt-2"
                >
                    <div
                        className={`border rounded-lg p-4 cursor-pointer hover:border-primary/50 ${
                            formik.values.type === 'frontend' ? 'border-primary' : ''
                        }`}
                    >
                        <IGRPRadioGroupItemPrimitive
                            value="frontend"
                            id="frontend"
                            className="sr-only"
                        />
                        <IGRPLabelPrimitive
                            htmlFor="frontend"
                            className="flex items-center gap-2 cursor-pointer"
                        >
                            <Monitor className="w-5 h-5" />
                            <div>
                                <div>{t('frontend')}</div>
                                <div className="text-sm text-gray-500">
                                    {t('frontendDescription')}
                                </div>
                            </div>
                        </IGRPLabelPrimitive>
                    </div>
                    <div
                        className={`border rounded-lg p-4 cursor-pointer hover:border-primary/50 ${
                            formik.values.type === 'backend' ? 'border-primary' : ''
                        }`}
                    >
                        <IGRPRadioGroupItemPrimitive
                            value="backend"
                            id="backend"
                            className="sr-only"
                        />
                        <IGRPLabelPrimitive
                            htmlFor="backend"
                            className="flex items-center gap-2 cursor-pointer"
                        >
                            <Server className="w-5 h-5" />
                            <div>
                                <div>{t('backend')}</div>
                                <div className="text-sm text-gray-500">
                                    {t('backendDescription')}
                                </div>
                            </div>
                        </IGRPLabelPrimitive>
                    </div>
                </IGRPRadioGroupPrimitive>
                {formik.touched.type && formik.errors.type && (
                    <p className="text-xs text-destructive">{formik.errors.type}</p>
                )}
            </div>
        </div>
    )

    const renderStep2 = () => (
        <div className="space-y-4">
            <IGRPLabelPrimitive>{t('selectFramework')}</IGRPLabelPrimitive>
            <IGRPRadioGroupPrimitive
                name="framework"
                value={formik.values.framework}
                onValueChange={(value) => handleChangeFramework(value)}
                className="grid gap-4 mt-2"
            >
                {frameworks.map((fw) => {
                    return (
                        <div
                            key={fw.id}
                            className={`border rounded-lg p-4 cursor-pointer hover:border-primary/50 ${
                                formik.values.framework === fw.id ? 'border-primary' : ''
                            } ${!fw.availableSupport ? 'pointer-events-none opacity-75' : ''}`}
                        >
                            <IGRPRadioGroupItemPrimitive
                                value={fw.id}
                                id={fw.id}
                                className="sr-only"
                                disabled={!fw.availableSupport}
                            />
                            <IGRPLabelPrimitive
                                htmlFor={fw.id}
                                className="flex items-center gap-4 cursor-pointer"
                            >
                                <FrameworkIcon
                                    framework={fw.id as FrameworkType}
                                    size={40}
                                    className="rounded-lg"
                                    alt={fw.name}
                                />
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">{fw.name}</span>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {fw.description}
                                    </div>
                                    {!fw.availableSupport && (
                                        <span className="ml-auto text-xs text-muted-foreground">
                                            {t('comingSoon')}
                                        </span>
                                    )}
                                </div>
                            </IGRPLabelPrimitive>
                        </div>
                    )
                })}
            </IGRPRadioGroupPrimitive>
            {formik.touched.framework && formik.errors.framework && (
                <p className="text-xs text-destructive">{formik.errors.framework}</p>
            )}
        </div>
    )

    const renderStep3 = (): React.ReactNode => (
        <div className="space-y-4">
            {SelectedComponent ? (
                <>
                    <IGRPLabelPrimitive>{t('frameworkConfiguration')}</IGRPLabelPrimitive>
                    <div className="mt-3">
                        <ProjectConfigForm
                            type={formik.values.framework}
                            data={formik.values.config}
                            errors={formik.errors}
                            onChange={(config) => formik.setFieldValue('config', config)}
                        />
                    </div>
                </>
            ) : (
                <div className="text-center text-muted-foreground pb-8">
                    {t('configurationComingSoon', {
                        framework: formik.values.framework
                    })}
                </div>
            )}
        </div>
    )

    const renderStep4 = (): React.ReactNode => (
        <div className="rounded-lg border p-4 space-y-6">
            <div className="space-y-4">
                <div className="space-y-2">
                    <IGRPLabelPrimitive htmlFor="name">{t('projectName')}</IGRPLabelPrimitive>
                    <IGRPInputPrimitive
                        id="name"
                        name="name"
                        value={formik.values.name}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                    />
                    {formik.touched.name && formik.errors.name && (
                        <p className="text-xs text-destructive">{formik.errors.name}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <IGRPLabelPrimitive htmlFor="path">{t('projectDirectory')}</IGRPLabelPrimitive>
                    <div className="flex gap-2">
                        <IGRPInputPrimitive
                            id="path"
                            name="path"
                            value={formik.values.path}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            placeholder={t('enterProjectDirectory')}
                            readOnly
                        />
                        <IGRPButtonPrimitive
                            variant="outline"
                            size="icon"
                            type="button"
                            onClick={(e) => {
                                e.preventDefault()
                                handleOpenDirectory()
                            }}
                            disabled
                        >
                            <FolderOpen className="h-4 w-4" />
                        </IGRPButtonPrimitive>
                    </div>
                    {formik.touched.path && formik.errors.path && (
                        <p className="text-xs text-destructive">{formik.errors.path}</p>
                    )}
                </div>

                {isFrontend && (
                    <div className="space-y-2">
                        <IGRPLabelPrimitive>{t('themeColor')}</IGRPLabelPrimitive>
                        <div className="grid grid-cols-12 gap-2 mt-2">
                            {THEME_COLORS.map((color) => (
                                <button
                                    key={color.value}
                                    type="button"
                                    onClick={() => formik.setFieldValue('themeColor', color.value)}
                                    className={`
                      w-8 h-8 rounded-full 
                      ${formik.values.themeColor === color.value ? 'ring-2 ring-offset-2 ring-primary' : ''}
                    `}
                                    style={{
                                        backgroundColor: color.value
                                    }}
                                    title={color.name}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return renderStep1()
            case 2:
                return renderStep2()
            case 3:
                return renderStep3()
            case 4:
                return renderStep4()
            default:
                return null
        }
    }

    return (
        <IGRPDialogPrimitive>
            <IGRPDialogTriggerPrimitive asChild>
                {children ? (
                    children
                ) : (
                    <IGRPButtonPrimitive>
                        <PlusCircle className="w-4 h-4" />
                        {t('createNewProject')}
                    </IGRPButtonPrimitive>
                )}
            </IGRPDialogTriggerPrimitive>
            <IGRPDialogContentPrimitive
                className="flex min-h-0 max-h-[min(90vh,calc(100dvh-2rem))] w-[calc(100vw-2rem)] max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:max-w-[700px] lg:max-w-[800px] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                {isCreatingProject && (
                    <div className="absolute inset-0 z-[70] flex items-center justify-center rounded-[inherit] bg-background/85 backdrop-blur-[1px]">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>A criar projeto e a abrir...</span>
                        </div>
                    </div>
                )}
                <IGRPDialogHeaderPrimitive className="shrink-0 border-b border-border px-4 py-3 sm:px-6">
                    <IGRPDialogTitlePrimitive>{t('newProject')}</IGRPDialogTitlePrimitive>
                    <IGRPDialogDescriptionPrimitive>
                        {t('newProject')}
                    </IGRPDialogDescriptionPrimitive>
                </IGRPDialogHeaderPrimitive>
                <form
                    onSubmit={formik.handleSubmit}
                    className="flex min-h-0 flex-1 flex-col"
                >
                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-4 sm:px-6">
                        <div className="relative mb-6">
                            <div className="absolute top-5 left-0 right-0 h-[2px] bg-muted" />
                            <div className="relative flex justify-between">
                                {STEPS.map((s) => (
                                    <StepButton
                                        key={s.id}
                                        step={s.id}
                                        currentStep={step}
                                        onClick={() => handleStepClick(s.id)}
                                        disabled={!canNavigateToStep(s.id)}
                                    >
                                        {t(s.label)}
                                    </StepButton>
                                ))}
                            </div>
                        </div>
                        <div className="pb-2">{renderStepContent()}</div>
                    </div>

                    <IGRPDialogFooterPrimitive className="mt-0 shrink-0 border-t border-border bg-background px-4 py-3 sm:px-6">
                        <div className="flex w-full justify-between gap-2">
                            {step > 1 ? (
                                <IGRPButtonPrimitive
                                    type="button"
                                    variant="outline"
                                    onClick={handleBack}
                                    disabled={isCreatingProject}
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    {t('back')}
                                </IGRPButtonPrimitive>
                            ) : (
                                <div />
                            )}
                            {step < STEPS.length ? (
                                <IGRPButtonPrimitive
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        handleNext()
                                    }}
                                    disabled={!canNavigateToStep(step + 1) || isCreatingProject}
                                >
                                    {t('next')}
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </IGRPButtonPrimitive>
                            ) : (
                                <IGRPButtonPrimitive
                                    type="submit"
                                    disabled={formik.isSubmitting || isCreatingProject}
                                >
                                    {(formik.isSubmitting || isCreatingProject) && (
                                        <Loader2 className="animate-spin" />
                                    )}
                                    {isCreatingProject ? 'A criar...' : t('createProject')}
                                </IGRPButtonPrimitive>
                            )}
                        </div>
                    </IGRPDialogFooterPrimitive>
                </form>
            </IGRPDialogContentPrimitive>
        </IGRPDialogPrimitive>
    )
}
