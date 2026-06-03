import { Button } from '@renderer/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@renderer/components/ui/dialog'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@renderer/components/ui/radio-group'
import { FrameworkIcon } from '@renderer/components/framework-icon'
import { LabelRequired } from '@renderer/components/label-required'
import { useWorkspace } from '@renderer/hooks/use-workspace'
import { errorMessage, useZodForm } from '@renderer/lib/form'
import {
    ArrowLeft,
    ArrowRight,
    FolderOpen,
    Loader2,
    Monitor,
    PlusCircle,
    Server,
    Sparkles,
    Upload
} from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import type { FieldErrors } from 'react-hook-form'
import type { FrameworkType, ProjectData } from 'src/main/types'
import { DotNetConfig } from './components/configurations/dotnet-config'
import { NextConfig } from './components/configurations/next-config'
import { SpecificationConfig } from './components/configurations/specification-config'
import { SpringConfig } from './components/configurations/spring-config'
import { StepButton } from './components/step-button'
import {
    backendFrameworks,
    frontendFrameworks,
    specificationFrameworks,
    STEPS,
    THEME_COLORS
} from './data'
import { useProjectValidation } from './validation'

interface ConfigComponentProps {
    data: any
    /**
     * Legacy shape kept stable across the migration: `errors?.config?.field`
     * is a plain string. The wizard adapts RHF errors into this bag before
     * passing them down so each config component (next/spring/dotnet/spec)
     * stays unchanged.
     */
    errors?: { config?: Record<string, string | undefined> }
    onChange: (config: any) => void
}

type ConfigComponent = React.FC<ConfigComponentProps>

const componentsMap: Record<string, ConfigComponent> = {
    springboot: SpringConfig,
    nextjs: NextConfig,
    dotnet: DotNetConfig,
    specification: SpecificationConfig
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

/**
 * Flattens the nested RHF errors for the `config` sub-form into the plain
 * `{ config: { name, group, artifact, database } }` shape the per-framework
 * config components have read since the Formik days.
 */
function flattenConfigErrors(errors: FieldErrors<ProjectData>): {
    config?: Record<string, string | undefined>
} {
    const config = errors.config as Record<string, { message?: string }> | undefined
    if (!config) return {}
    const out: Record<string, string | undefined> = {}
    for (const [k, v] of Object.entries(config)) {
        if (v && typeof v === 'object' && 'message' in v && typeof v.message === 'string') {
            out[k] = v.message
        }
    }
    return { config: out }
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
            storageMode: 'managed',
            themeColor: '#000000',
            icon: '',
            workspaceId: workspace?.id || ''
        }),
        [workspace?.id]
    )

    const schema = useProjectValidation({ t, step })

    // The wizard's form values are a superset of `ProjectData` (free-form
    // `config` etc.). Use `Record<string, any>` so RHF accepts `setValue`
    // calls for dynamically-typed fields without `never` mismatches; the
    // surface is still type-checked through `values` reads below.
    type ProjectFormValues = Record<string, any> & Partial<ProjectData>
    const form = useZodForm<ProjectFormValues>({
        schema: schema as unknown as import('zod').z.ZodType<ProjectFormValues, unknown>,
        defaultValues: initialValues as ProjectFormValues
    })
    const { register, watch, setValue, reset, trigger, handleSubmit, formState } = form
    const { errors, touchedFields, isSubmitting } = formState

    const values = watch()
    const flattenedErrors = React.useMemo(() => flattenConfigErrors(errors), [errors])

    const inputRef = React.useRef<HTMLInputElement>(null)
    const iconUploadRef = React.useRef<HTMLInputElement>(null)
    const wasOpenRef = React.useRef(open)

    // Wire RHF's ref for the project-name input alongside the autofocus ref.
    const nameRegister = register('name')
    const nameRefHandler = (el: HTMLInputElement | null): void => {
        nameRegister.ref(el)
        inputRef.current = el
    }

    React.useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus()
            inputRef.current.select()
        }
    }, [])

    /**
     * Handles file upload for project icons. Saves the file to disk and
     * stores only the relative path; keeps JSON small and supports larger
     * files than embedding base64.
     */
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        try {
            if (!file.type.startsWith('image/')) {
                alert('Please select a valid image file.')
                return
            }

            const maxSize = 5 * 1024 * 1024 // 5MB
            if (file.size > maxSize) {
                alert('File size too large. Please select an image smaller than 5MB.')
                return
            }

            if (!values.name || values.name.trim() === '') {
                alert('Please enter a project name before uploading an icon.')
                return
            }

            const fileExtension = file.name.split('.').pop() || 'png'
            const fileName = `icon_${Date.now()}.${fileExtension}`

            const iconsPath = `${workspace.path}/icons`
            const filePath = `${iconsPath}/${fileName}`

            const result = await window.api.saveProjectIcon({
                filePath,
                fileData: await file.arrayBuffer(),
                assetsPath: iconsPath
            })

            if (result.success) {
                const relativePath = `icons/${fileName}`
                setValue('icon', relativePath, { shouldDirty: true })
            } else {
                console.error('Failed to save icon file:', result.error)
                alert('Failed to save icon file. Please try again.')
            }
        } catch (error) {
            console.error('Error uploading file:', error)
            alert('Error uploading file. Please try again.')
        }
    }

    const getIconPreviewUrl = React.useCallback(
        async (iconPath: string): Promise<string | null> => {
            if (!iconPath) return null
            if (iconPath.startsWith('data:')) return iconPath
            if (iconPath.startsWith('icons/') || iconPath.startsWith('assets/')) {
                try {
                    const result = await window.api.getIconFile(iconPath, workspace.path)
                    if (result.success) return result.data
                    console.warn('Failed to load icon file:', result.error)
                    return null
                } catch (error) {
                    console.error('Error loading icon file:', error)
                    return null
                }
            }
            return null
        },
        [workspace.path]
    )

    const isFrontend = values.type === 'frontend'
    const isSpecification = values.type === 'specification'

    const frameworks = isSpecification
        ? specificationFrameworks
        : isFrontend
          ? frontendFrameworks
          : backendFrameworks

    const canNavigateToStep = (targetStep: number) => {
        if (targetStep === 1) return true
        if (targetStep === 2) return !!values.name && !!values.type
        if (targetStep === 3) return !!values.framework
        if (targetStep === 4) return !!values.config
        if (targetStep === STEPS.length) return !!values.path?.trim()
        return false
    }

    const handleStepClick = (targetStep: number) => {
        if (canNavigateToStep(targetStep)) {
            setStep(targetStep)
        }
    }

    const handleNext = async () => {
        const valid = await trigger()

        if (step === 1 && errors.name) return
        if (step === 3 && !valid && errors.config !== undefined) return

        if (step < STEPS.length && canNavigateToStep(step + 1)) {
            setStep(step + 1)
        }
    }

    const handleBack = () => {
        if (step > 1) setStep(step - 1)
    }

    const handleOpenDirectory = async () => {
        const result = await window.api.openDirectory(t('projectDirectory'))
        if (!result.canceled && result.basePath) {
            setValue('path', result.basePath, { shouldValidate: true })
        }
    }

    const handleChangeType = (value: string) => {
        if (values.framework !== value)
            setValue('framework', '' as FrameworkType, { shouldValidate: true })
        setValue('type', value as ProjectData['type'], { shouldValidate: true, shouldTouch: true })
    }

    const handleChangeFramework = (value: string) => {
        if (values.framework !== value)
            setValue('config', {} as ProjectData['config'], { shouldValidate: false })
        setValue('framework', value as FrameworkType, {
            shouldValidate: true,
            shouldTouch: true
        })
    }

    const SelectedComponent = values?.framework ? componentsMap[values?.framework] : null

    // Reset only when the dialog transitions from open -> closed.
    React.useEffect(() => {
        const wasOpen = wasOpenRef.current
        wasOpenRef.current = open
        if (wasOpen && !open) {
            reset(initialValues)
            setStep(1)
        }
    }, [reset, initialValues, open])

    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
                event.preventDefault()
                setOpen(true)
            }
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [])

    // Auto-compute `path` while the project is managed by the workspace.
    React.useEffect(() => {
        if (values.storageMode === 'linked') return

        const targetPath = `${workspace.path}/projects/${values?.config?.name ?? values.name}`

        if (values.path !== targetPath) {
            setValue('path', targetPath, { shouldValidate: false })
        }
    }, [
        setValue,
        values?.config?.name,
        values.name,
        values.path,
        values.storageMode,
        workspace.path
    ])

    // Update icon preview.
    React.useEffect(() => {
        const updatePreview = async () => {
            if (values.icon) {
                const url = await getIconPreviewUrl(values.icon)
                setPreviewUrl(url)
            } else {
                setPreviewUrl(null)
            }
        }
        updatePreview()
    }, [values.icon, getIconPreviewUrl])

    const onFormSubmit = handleSubmit(async (submitted) => {
        setIsCreatingProject(true)
        try {
            await saveOrOpenProject({
                project: {
                    ...(submitted as ProjectData),
                    name: submitted?.name || '',
                    framework: (submitted?.framework || '') as FrameworkType,
                    path: submitted?.path || '',
                    config: submitted?.config || {}
                }
            })
        } finally {
            setIsCreatingProject(false)
        }
    })

    const nameError = errorMessage(errors.name as never)
    const typeError = errorMessage(errors.type as never)
    const frameworkError = errorMessage(errors.framework as never)
    const pathError = errorMessage(errors.path as never)

    const renderStep1 = () => (
        <div className="space-y-4">
            <div className="space-y-2">
                <LabelRequired>{t('projectName')}</LabelRequired>
                <Input
                    {...nameRegister}
                    ref={nameRefHandler}
                    id="name"
                    placeholder={t('enterProjectName')}
                    autoFocus
                    maxLength={50}
                    className="mt-2"
                />
                {touchedFields.name && nameError && (
                    <p className="text-xs text-destructive">{nameError}</p>
                )}
            </div>

            {/* Project Icon Upload with Preview */}
            <div className="space-y-2">
                <Label>{t('projectIcon')}</Label>
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
                                <Button
                                    variant="outline"
                                    size="sm"
                                    type="button"
                                    onClick={() => iconUploadRef.current?.click()}
                                >
                                    {t('upload')}...
                                </Button>
                            </>
                        )}
                    </div>
                </label>
            </div>

            <div className="space-y-2">
                <Label>{t('projectType')}</Label>
                <RadioGroup
                    name="type"
                    value={values.type}
                    onValueChange={(value) => handleChangeType(value)}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2"
                >
                    <div
                        className={`border rounded-lg p-4 cursor-pointer hover:border-primary/50 ${
                            values.type === 'frontend' ? 'border-primary' : ''
                        }`}
                    >
                        <RadioGroupItem value="frontend" id="frontend" className="sr-only" />
                        <Label
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
                        </Label>
                    </div>
                    <div
                        className={`border rounded-lg p-4 cursor-pointer hover:border-primary/50 ${
                            values.type === 'backend' ? 'border-primary' : ''
                        }`}
                    >
                        <RadioGroupItem value="backend" id="backend" className="sr-only" />
                        <Label htmlFor="backend" className="flex items-center gap-2 cursor-pointer">
                            <Server className="w-5 h-5" />
                            <div>
                                <div>{t('backend')}</div>
                                <div className="text-sm text-gray-500">
                                    {t('backendDescription')}
                                </div>
                            </div>
                        </Label>
                    </div>
                    <div
                        className={`border rounded-lg p-4 cursor-pointer hover:border-primary/50 ${
                            values.type === 'specification' ? 'border-primary' : ''
                        }`}
                    >
                        <RadioGroupItem
                            value="specification"
                            id="specification"
                            className="sr-only"
                        />
                        <Label
                            htmlFor="specification"
                            className="flex items-center gap-2 cursor-pointer"
                        >
                            <Sparkles className="w-5 h-5" />
                            <div>
                                <div>{t('specification', { defaultValue: 'Specification' })}</div>
                                <div className="text-sm text-gray-500">
                                    {t('specificationDescription', {
                                        defaultValue: 'Document and prototype using AI'
                                    })}
                                </div>
                            </div>
                        </Label>
                    </div>
                </RadioGroup>
                {touchedFields.type && typeError && (
                    <p className="text-xs text-destructive">{typeError}</p>
                )}
            </div>
        </div>
    )

    const renderStep2 = () => (
        <div className="space-y-4">
            <Label>{t('selectFramework')}</Label>
            <RadioGroup
                name="framework"
                value={values.framework}
                onValueChange={(value) => handleChangeFramework(value)}
                className="grid gap-4 mt-2"
            >
                {frameworks.map((fw) => {
                    return (
                        <div
                            key={fw.id}
                            className={`border rounded-lg p-4 cursor-pointer hover:border-primary/50 ${
                                values.framework === fw.id ? 'border-primary' : ''
                            } ${!fw.availableSupport ? 'pointer-events-none opacity-75' : ''}`}
                        >
                            <RadioGroupItem
                                value={fw.id}
                                id={fw.id}
                                className="sr-only"
                                disabled={!fw.availableSupport}
                            />
                            <Label
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
                            </Label>
                        </div>
                    )
                })}
            </RadioGroup>
            {touchedFields.framework && frameworkError && (
                <p className="text-xs text-destructive">{frameworkError}</p>
            )}
        </div>
    )

    const renderStep3 = (): React.ReactNode => (
        <div className="space-y-4">
            {SelectedComponent ? (
                <>
                    <Label>{t('frameworkConfiguration')}</Label>
                    <div className="mt-3">
                        <ProjectConfigForm
                            type={values.framework ?? ''}
                            data={values.config}
                            errors={flattenedErrors}
                            onChange={(config) =>
                                setValue('config', config, {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                    shouldTouch: true
                                })
                            }
                        />
                    </div>
                </>
            ) : (
                <div className="text-center text-muted-foreground pb-8">
                    {t('configurationComingSoon', { framework: values.framework })}
                </div>
            )}
        </div>
    )

    const pathRegister = register('path')

    const renderStep4 = (): React.ReactNode => (
        <div className="rounded-lg border p-4 space-y-6">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">{t('projectName')}</Label>
                    <Input {...nameRegister} ref={nameRefHandler} id="name" />
                    {touchedFields.name && nameError && (
                        <p className="text-xs text-destructive">{nameError}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label>{t('projectLocation')}</Label>
                    <RadioGroup
                        value={values.storageMode ?? 'managed'}
                        onValueChange={(value) => {
                            setValue('storageMode', value as ProjectData['storageMode'], {
                                shouldValidate: true
                            })
                            // Switching back to managed clears any custom
                            // path so the auto-compute effect can take
                            // over again on the next render.
                            if (value === 'managed') {
                                setValue('path', '', { shouldValidate: false })
                            }
                        }}
                        className="grid grid-cols-2 gap-2"
                    >
                        <label className="flex items-start gap-2 border rounded-md p-3 cursor-pointer hover:bg-muted/40">
                            <RadioGroupItem value="managed" id="storage-managed" />
                            <div className="space-y-0.5">
                                <p className="text-sm font-medium">{t('projectLocationManaged')}</p>
                                <p className="text-xs text-muted-foreground">
                                    {t('projectLocationManagedHint')}
                                </p>
                            </div>
                        </label>
                        <label className="flex items-start gap-2 border rounded-md p-3 cursor-pointer hover:bg-muted/40">
                            <RadioGroupItem value="linked" id="storage-linked" />
                            <div className="space-y-0.5">
                                <p className="text-sm font-medium">{t('projectLocationLinked')}</p>
                                <p className="text-xs text-muted-foreground">
                                    {t('projectLocationLinkedHint')}
                                </p>
                            </div>
                        </label>
                    </RadioGroup>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="path">{t('projectDirectory')}</Label>
                    <div className="flex gap-2">
                        <Input
                            {...pathRegister}
                            id="path"
                            placeholder={t('enterProjectDirectory')}
                            readOnly={values.storageMode !== 'linked'}
                        />
                        <Button
                            variant="outline"
                            size="icon"
                            type="button"
                            onClick={(e) => {
                                e.preventDefault()
                                handleOpenDirectory()
                            }}
                            disabled={values.storageMode !== 'linked'}
                        >
                            <FolderOpen className="h-4 w-4" />
                        </Button>
                    </div>
                    {touchedFields.path && pathError && (
                        <p className="text-xs text-destructive">{pathError}</p>
                    )}
                </div>

                {isFrontend && (
                    <div className="space-y-2">
                        <Label>{t('themeColor')}</Label>
                        <div className="grid grid-cols-12 gap-2 mt-2">
                            {THEME_COLORS.map((color) => (
                                <button
                                    key={color.value}
                                    type="button"
                                    onClick={() =>
                                        setValue('themeColor', color.value, { shouldDirty: true })
                                    }
                                    className={`
                      w-8 h-8 rounded-full
                      ${values.themeColor === color.value ? 'ring-2 ring-offset-2 ring-primary' : ''}
                    `}
                                    style={{ backgroundColor: color.value }}
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
        <Dialog>
            <DialogTrigger asChild>
                {children ? (
                    children
                ) : (
                    <Button>
                        <PlusCircle className="w-4 h-4" />
                        {t('createNewProject')}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent
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
                <DialogHeader className="shrink-0 border-b border-border px-4 py-3 sm:px-6">
                    <DialogTitle>{t('newProject')}</DialogTitle>
                    <DialogDescription>{t('newProject')}</DialogDescription>
                </DialogHeader>
                <form onSubmit={onFormSubmit} className="flex min-h-0 flex-1 flex-col">
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

                    <DialogFooter className="mt-0 shrink-0 border-t border-border bg-background px-4 py-3 sm:px-6">
                        <div className="flex w-full justify-between gap-2">
                            {step > 1 ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleBack}
                                    disabled={isCreatingProject}
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    {t('back')}
                                </Button>
                            ) : (
                                <div />
                            )}
                            {step < STEPS.length ? (
                                <Button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        handleNext()
                                    }}
                                    disabled={!canNavigateToStep(step + 1) || isCreatingProject}
                                >
                                    {t('next')}
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            ) : (
                                <Button type="submit" disabled={isSubmitting || isCreatingProject}>
                                    {(isSubmitting || isCreatingProject) && (
                                        <Loader2 className="animate-spin" />
                                    )}
                                    {isCreatingProject ? 'A criar...' : t('createProject')}
                                </Button>
                            )}
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
