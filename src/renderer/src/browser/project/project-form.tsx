import { Button } from '@renderer/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@renderer/components/ui/dialog'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@renderer/components/ui/radio-group'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@renderer/components/ui/select'
import { FrameworkIcon } from '@renderer/components/framework-icon'
import { LabelRequired } from '@renderer/components/label-required'
import { useWorkspace } from '@renderer/hooks/use-workspace'
import { errorMessage, useZodForm } from '@renderer/lib/form'
import { cn } from '@renderer/lib/utils'
import {
    Check,
    ChevronDown,
    ChevronRight,
    Database,
    FolderOpen,
    Loader2,
    Monitor,
    Palette,
    Plus,
    PlusCircle,
    Search,
    Sparkles,
    Upload,
    X
} from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import type { FieldErrors } from 'react-hook-form'
import type { Dependency } from '@igrp/igrp-studio-springboot-engine/types'
import type { FrameworkType, ProjectData } from 'src/main/types'
import { DatabaseOptions, ENV_TYPES, projectStructureStyle } from '@renderer/constants/appConstants'
import { DotNetConfig } from './components/configurations/dotnet-config'
import { NextConfig } from './components/configurations/next-config'
import { SpecificationConfig } from './components/configurations/specification-config'
import { SpringConfig } from './components/configurations/spring-config'
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

// Spring Boot helpers: derive defaults from the project name.
// `config.name` allows no spaces and no hyphens; `config.artifact` allows
// hyphens but no spaces.
const slugifyConfigName = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, '')
const slugifyArtifact = (s: string): string =>
    s
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/^-+|-+$/g, '')

// Curated LLM / embeddings model options for the Specification configure tab.
// The spec engine accepts free model strings; this is a sensible starter set.
type LlmOption = { provider: string; model: string }
const llmModels: LlmOption[] = [
    { provider: 'openrouter', model: 'anthropic/claude-sonnet-4.5' },
    { provider: 'openrouter', model: 'anthropic/claude-3.5-sonnet' },
    { provider: 'openai', model: 'gpt-4o' },
    { provider: 'openai', model: 'gpt-4o-mini' }
]
const embeddingsModels: LlmOption[] = [
    { provider: 'openai', model: 'text-embedding-3-small' },
    { provider: 'openai', model: 'text-embedding-3-large' }
]

export function ProjectWizard({ children }: { children?: React.ReactNode }) {
    const [open, setOpen] = React.useState(false)
    const [step, setStep] = React.useState(1)
    const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
    const [isCreatingProject, setIsCreatingProject] = React.useState(false)
    const [frameworkSearch, setFrameworkSearch] = React.useState('')
    const [springDependencies, setSpringDependencies] = React.useState<Dependency[]>([])
    const [springDepSearch, setSpringDepSearch] = React.useState('')
    const [springDepDropdownOpen, setSpringDepDropdownOpen] = React.useState(false)
    const springDepRef = React.useRef<HTMLDivElement>(null)

    const { t } = useTranslation()

    const {
        workspace,
        actions: { saveOrOpenProject }
    } = useWorkspace()

    const initialValues: ProjectData = React.useMemo(
        () => ({
            id: '',
            name: '',
            type: 'frontend',
            framework: '' as FrameworkType,
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
    const colorInputRef = React.useRef<HTMLInputElement>(null)
    const wasOpenRef = React.useRef(open)

    // Choose readable text/icon color (near-black vs near-white) for a swatch
    // background, mirroring the scaffold's luminance threshold (#ffffff / 1.5).
    const contrastTextColor = (hex?: string): string => {
        if (!hex) return 'rgba(255,255,255,0.9)'
        const cleaned = hex.replace('#', '')
        if (cleaned.length !== 6) return 'rgba(255,255,255,0.9)'
        const n = parseInt(cleaned, 16)
        if (Number.isNaN(n)) return 'rgba(255,255,255,0.9)'
        return n > 0xffffff / 1.5 ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)'
    }

    // Wire RHF's ref for the project-name input alongside the autofocus ref.
    const nameRegister = register('name')
    const pathRegister = register('path')
    const nameRefHandler = (el: HTMLInputElement | null): void => {
        nameRegister.ref(el)
        inputRef.current = el
    }

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

    // 2-step flow: step 1 = Project Type + Framework, step 2 = Details + Config.
    const canNavigateToStep = (targetStep: number) => {
        if (targetStep === 1) return true
        if (targetStep === 2) return !!values.type && !!values.framework
        return false
    }

    const handleStepClick = (targetStep: number) => {
        if (canNavigateToStep(targetStep)) {
            setStep(targetStep)
        }
    }

    const handleNext = async () => {
        await trigger()
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
        setFrameworkSearch('')
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

    // Lazy-load the Spring Boot dependency list when the modal opens.
    React.useEffect(() => {
        if (!open) return
        let cancelled = false
        ;(async () => {
            try {
                const { result } = await window.engine.getDependencies(ENV_TYPES.SPRING)
                if (!cancelled) setSpringDependencies(result ?? [])
            } catch (err) {
                console.error('Failed to load Spring dependencies:', err)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [open])

    // Close the Spring dependency dropdown on outside click.
    React.useEffect(() => {
        const handler = (event: MouseEvent) => {
            if (
                springDepRef.current &&
                !springDepRef.current.contains(event.target as Node)
            ) {
                setSpringDepDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    // Auto-populate Spring Boot config defaults (group, db, structure) and
    // sync config.name from the project name (no UI for config.name). Auto-fill
    // artifact only while empty so the user can override.
    // biome-ignore lint/correctness/useExhaustiveDependencies: values.config is intentionally omitted; including it would re-run on every setValue('config', …) and risk a feedback loop
    React.useEffect(() => {
        if (values.framework !== 'springboot') return
        const current = (values.config ?? {}) as Record<string, unknown>
        const updates: Record<string, unknown> = {}
        if (!current.group) updates.group = 'cv.igrp'
        if (!current.database) updates.database = 'Postgresql'
        if (!current.projectStructureStyle) updates.projectStructureStyle = 'technical'
        const expectedConfigName = slugifyConfigName(values.name || '')
        if (current.name !== expectedConfigName) updates.name = expectedConfigName
        if (!current.artifact && values.name) updates.artifact = slugifyArtifact(values.name)
        if (Object.keys(updates).length > 0) {
            setValue('config', { ...current, ...updates }, { shouldDirty: false })
        }
    }, [values.framework, values.name, setValue])

    // Auto-populate Specification config defaults (LLM, embeddings) and seed
    // a config.name from the project name only while empty.
    // biome-ignore lint/correctness/useExhaustiveDependencies: same rationale as the Spring Boot effect above; values.config is read but excluded to avoid a setValue feedback loop
    React.useEffect(() => {
        if (values.framework !== 'specification') return
        const current = (values.config ?? {}) as Record<string, unknown>
        const updates: Record<string, unknown> = {}
        if (!current.defaultLLM) updates.defaultLLM = llmModels[0]
        if (!current.embeddings) updates.embeddings = embeddingsModels[0]
        if (!current.name && values.name) updates.name = slugifyConfigName(values.name)
        if (Object.keys(updates).length > 0) {
            setValue('config', { ...current, ...updates }, { shouldDirty: false })
        }
    }, [values.framework, values.name, setValue])

    // Auto-populate Next.js config defaults. The pre-redesign `NextConfig`
    // component used a DEFAULT_NEXT_CONFIG object that always shipped
    // `description: ''` and `displayName` filled. The new wizard initialises
    // `config: {}` and only writes fields the user touches, which left
    // optional fields as `undefined` — the engine's downstream code does
    // `someField.toLowerCase()` on a couple of optional fields without
    // guards, producing "Cannot read properties of undefined (reading
    // 'toLowerCase')" at create time. Defaulting them here restores the
    // pre-redesign behavior.
    // biome-ignore lint/correctness/useExhaustiveDependencies: same rationale as the Spring Boot effect above; values.config is read but excluded to avoid a setValue feedback loop
    React.useEffect(() => {
        if (values.framework !== 'nextjs') return
        const current = (values.config ?? {}) as Record<string, unknown>
        const updates: Record<string, unknown> = {}
        if (current.description === undefined) updates.description = ''
        // Keep displayName in sync with the project name as the user types
        // (was freezing at the first character because of an `!current.displayName`
        // guard that short-circuited on every subsequent keystroke).
        if (values.name && current.displayName !== values.name) {
            updates.displayName = values.name
        }
        if (Object.keys(updates).length > 0) {
            setValue('config', { ...current, ...updates }, { shouldDirty: false })
        }
    }, [values.framework, values.name, setValue])

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

    // ---- Step content (regrouped into 2 steps) ----

    const renderProjectType = () => {
        const types: Array<{
            id: 'frontend' | 'backend' | 'specification'
            label: string
            description: string
            Icon: typeof Monitor
        }> = [
            {
                id: 'frontend',
                label: t('frontend'),
                description: t('frontendDescription'),
                Icon: Monitor
            },
            {
                id: 'backend',
                label: t('backend'),
                description: t('backendDescription'),
                Icon: Database
            },
            {
                id: 'specification',
                label: t('specification', { defaultValue: 'Specification' }),
                description: t('specificationDescription', {
                    defaultValue: 'Document and prototype using AI'
                }),
                Icon: Sparkles
            }
        ]
        return (
            <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {t('projectType')}
                </p>
                <RadioGroup
                    name="type"
                    value={values.type}
                    onValueChange={(value) => handleChangeType(value)}
                    className="mt-2 grid grid-cols-3 gap-2"
                >
                    {types.map(({ id, label, description, Icon }) => {
                        const active = values.type === id
                        return (
                            <div
                                key={id}
                                className={cn(
                                    'cursor-pointer rounded-[4px] border p-3 transition-colors',
                                    active
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border hover:border-primary/40'
                                )}
                            >
                                <RadioGroupItem value={id} id={id} className="sr-only" />
                                <Label
                                    htmlFor={id}
                                    className="flex cursor-pointer flex-col items-start gap-2"
                                >
                                    <Icon
                                        className={cn(
                                            'h-5 w-5',
                                            active ? 'text-primary' : 'text-muted-foreground'
                                        )}
                                    />
                                    <div className="space-y-0.5">
                                        <div
                                            className={cn(
                                                'text-[11px] font-bold',
                                                active ? 'text-primary' : 'text-foreground'
                                            )}
                                        >
                                            {label}
                                        </div>
                                        <div className="text-[10px] leading-snug text-muted-foreground">
                                            {description}
                                        </div>
                                    </div>
                                </Label>
                            </div>
                        )
                    })}
                </RadioGroup>
                {touchedFields.type && typeError && (
                    <p className="text-xs text-destructive">{typeError}</p>
                )}
            </div>
        )
    }

    const renderFrameworkPicker = () => {
        if (!values.type) return null
        const query = frameworkSearch.trim().toLowerCase()
        const filtered = query
            ? frameworks.filter(
                  (fw) =>
                      fw.name.toLowerCase().includes(query) ||
                      fw.description.toLowerCase().includes(query)
              )
            : frameworks
        return (
            <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {t('generator', { defaultValue: 'Generator' })}
                    </p>
                    <div className="relative w-48">
                        <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="text"
                            value={frameworkSearch}
                            onChange={(e) => setFrameworkSearch(e.target.value)}
                            placeholder={t('searchGenerators', {
                                defaultValue: 'Search generators...'
                            })}
                            className="h-7 rounded-[4px] border-[0.5px] border-muted-foreground/20 pl-7 text-[11px] shadow-none"
                        />
                    </div>
                </div>
                <RadioGroup
                    name="framework"
                    value={values.framework}
                    onValueChange={(value) => handleChangeFramework(value)}
                    className="mt-2 grid gap-2 sm:grid-cols-2"
                >
                    {filtered.map((fw) => {
                        const active = values.framework === fw.id
                        const disabled = !fw.availableSupport
                        return (
                            <div
                                key={fw.id}
                                className={cn(
                                    'cursor-pointer rounded-[4px] border p-3 transition-colors',
                                    active
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border hover:border-primary/40',
                                    disabled && 'pointer-events-none cursor-not-allowed opacity-60'
                                )}
                            >
                                <RadioGroupItem
                                    value={fw.id}
                                    id={`framework-${fw.id}`}
                                    className="sr-only"
                                    disabled={disabled}
                                />
                                <Label
                                    htmlFor={`framework-${fw.id}`}
                                    className="flex cursor-pointer items-start gap-2.5"
                                >
                                    <FrameworkIcon
                                        framework={fw.id as FrameworkType}
                                        size={28}
                                        className="shrink-0 rounded-md"
                                        alt={fw.name}
                                    />
                                    <div className="min-w-0 flex-1 space-y-0.5">
                                        <div className="flex items-center gap-1.5">
                                            <span
                                                className={cn(
                                                    'truncate text-[11px] font-bold',
                                                    active ? 'text-primary' : 'text-foreground'
                                                )}
                                            >
                                                {fw.name}
                                            </span>
                                            {disabled && (
                                                <span className="rounded bg-muted px-1 text-[8px] font-black uppercase tracking-wider text-muted-foreground">
                                                    {t('soon', { defaultValue: 'Soon' })}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[10px] leading-snug text-muted-foreground">
                                            {fw.description}
                                        </p>
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
    }

    const renderProjectDetails = () => (
        <div className="space-y-4">
            <div className="space-y-2">
                <LabelRequired>{t('projectName')}</LabelRequired>
                <Input
                    {...nameRegister}
                    ref={nameRefHandler}
                    id="name"
                    placeholder={t('enterProjectName')}
                    maxLength={50}
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
                    <div className="border border-dashed rounded-lg p-6 text-center space-y-2 cursor-pointer hover:border-primary/50">
                        {previewUrl ? (
                            <div className="flex flex-col items-center gap-2">
                                <img
                                    src={previewUrl}
                                    alt="Project icon preview"
                                    className="w-16 h-16 rounded-full object-cover"
                                />
                                <span className="text-sm text-muted-foreground">{t('clickToChangeIcon')}</span>
                            </div>
                        ) : (
                            <>
                                <Upload className="w-7 h-7 mx-auto text-muted-foreground" />
                                <div className="text-sm text-muted-foreground">
                                    {t('clickOrDragToUploadIcon')}
                                    <div className="text-xs text-muted-foreground">
                                        {t('recommendedSize')}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </label>
            </div>

            <div className="space-y-2">
                <Label>{t('projectLocation')}</Label>
                <RadioGroup
                    value={values.storageMode ?? 'managed'}
                    onValueChange={(value) => {
                        setValue('storageMode', value as ProjectData['storageMode'], {
                            shouldValidate: true
                        })
                        // Switching back to managed clears any custom path so the
                        // auto-compute effect can take over again on the next render.
                        if (value === 'managed') {
                            setValue('path', '', { shouldValidate: false })
                        }
                    }}
                    className="grid grid-cols-2 gap-2"
                >
                    <label
                        htmlFor="storage-managed"
                        className="flex items-start gap-2 border rounded-md p-3 cursor-pointer hover:bg-muted/40"
                    >
                        <RadioGroupItem value="managed" id="storage-managed" />
                        <div className="space-y-0.5">
                            <p className="text-sm font-medium">{t('projectLocationManaged')}</p>
                            <p className="text-xs text-muted-foreground">
                                {t('projectLocationManagedHint')}
                            </p>
                        </div>
                    </label>
                    <label
                        htmlFor="storage-linked"
                        className="flex items-start gap-2 border rounded-md p-3 cursor-pointer hover:bg-muted/40"
                    >
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
                                className={`w-8 h-8 rounded-full ${
                                    values.themeColor === color.value
                                        ? 'ring-2 ring-offset-2 ring-primary'
                                        : ''
                                }`}
                                style={{ backgroundColor: color.value }}
                                title={color.name}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )

    const renderFrameworkConfig = (): React.ReactNode =>
        SelectedComponent ? (
            <div className="space-y-3 border-t pt-4">
                <Label>{t('frameworkConfiguration')}</Label>
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
        ) : null

    // Scaffold-faithful step-2 layout for Next.js: PROJECT DETAILS (icon
    // uploader + Name/Description/Location) on top, FRONTEND CONFIGURATION
    // (Application Name + Theme Color swatch) below. Other frameworks keep
    // the generic Project Details + framework config layout.
    const renderNextJsStep2 = () => (
        <div className="space-y-4">
            {/* Section 1: PROJECT DETAILS */}
            <div className="border-b pb-4">
                <p className="pb-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {t('projectDetails', { defaultValue: 'Project Details' })}
                </p>
                <div className="relative pl-[74px]">
                {/* Icon uploader (absolutely positioned, 48×48) */}
                <button
                    type="button"
                    onClick={() => iconUploadRef.current?.click()}
                    aria-label={t('projectIcon')}
                    className="absolute left-0 top-0 flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-dashed bg-muted/30 text-muted-foreground transition-colors hover:border-primary/60 hover:bg-primary/5 hover:text-primary active:scale-95"
                >
                    {previewUrl ? (
                        <img src={previewUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <Plus className="h-5 w-5" />
                    )}
                </button>
                <input
                    ref={iconUploadRef}
                    type="file"
                    id="icon-upload"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                />

                {/* Fields */}
                <div className="space-y-3">
                    {/* Name */}
                    <div className="flex items-start gap-3">
                        <Label
                            htmlFor="name"
                            className="w-[82px] shrink-0 pt-1.5 text-[11px] text-muted-foreground"
                        >
                            {t('projectName')} <span className="text-destructive">*</span>
                        </Label>
                        <div className="max-w-[350px] flex-1">
                            <Input
                                {...nameRegister}
                                ref={nameRefHandler}
                                id="name"
                                placeholder={t('enterProjectName', {
                                    defaultValue: 'e.g. acme-dashboard'
                                })}
                                maxLength={50}
                                className="h-7 rounded-[4px] text-[11px]"
                            />
                            {touchedFields.name && nameError && (
                                <p className="mt-1 text-xs text-destructive">{nameError}</p>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="flex items-start gap-3">
                        <Label className="w-[82px] shrink-0 pt-1.5 text-[11px] text-muted-foreground">
                            {t('description', { defaultValue: 'Description' })}
                        </Label>
                        <Input
                            type="text"
                            value={values.config?.description ?? ''}
                            onChange={(e) =>
                                setValue(
                                    'config',
                                    { ...(values.config ?? {}), description: e.target.value },
                                    { shouldDirty: true }
                                )
                            }
                            placeholder={t('projectDescription', {
                                defaultValue: 'Briefly describe this project...'
                            })}
                            className="h-7 max-w-[350px] flex-1 rounded-[4px] text-[11px]"
                        />
                    </div>

                    {/* Location */}
                    <div className="flex items-start gap-3">
                        <Label className="w-[82px] shrink-0 pt-1.5 text-[11px] text-muted-foreground">
                            {t('projectLocation')}
                        </Label>
                        <div className="max-w-[350px] flex-1 space-y-1.5">
                            <RadioGroup
                                value={values.storageMode ?? 'managed'}
                                onValueChange={(value) => {
                                    setValue(
                                        'storageMode',
                                        value as ProjectData['storageMode'],
                                        { shouldValidate: true }
                                    )
                                    if (value === 'managed') {
                                        setValue('path', '', { shouldValidate: false })
                                    }
                                }}
                                className="flex gap-4"
                            >
                                <label
                                    htmlFor="storage-managed-next"
                                    className="flex cursor-pointer items-center gap-1.5 text-[11px] text-foreground"
                                >
                                    <RadioGroupItem
                                        value="managed"
                                        id="storage-managed-next"
                                        className="h-3.5 w-3.5"
                                    />
                                    {t('projectLocationManaged')}
                                </label>
                                <label
                                    htmlFor="storage-linked-next"
                                    className="flex cursor-pointer items-center gap-1.5 text-[11px] text-foreground"
                                >
                                    <RadioGroupItem
                                        value="linked"
                                        id="storage-linked-next"
                                        className="h-3.5 w-3.5"
                                    />
                                    {t('projectLocationLinked')}
                                </label>
                            </RadioGroup>
                            <div className="flex gap-1">
                                <Input
                                    {...pathRegister}
                                    id="path"
                                    placeholder={t('enterProjectDirectory')}
                                    disabled={values.storageMode !== 'linked'}
                                    className="h-7 rounded-[4px] font-mono text-[10.5px]"
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    type="button"
                                    className="h-7 w-7 rounded-[4px]"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        handleOpenDirectory()
                                    }}
                                    disabled={values.storageMode !== 'linked'}
                                >
                                    <FolderOpen className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                            {touchedFields.path && pathError && (
                                <p className="text-xs text-destructive">{pathError}</p>
                            )}
                        </div>
                    </div>
                </div>
                </div>
            </div>

            {/* Section 2: FRONTEND CONFIGURATION */}
            <div className="space-y-3 pl-[8px]">
                <p className="pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {t('frontendConfiguration', { defaultValue: 'Frontend Configuration' })}
                </p>

                {/* Application Name */}
                <div className="flex items-start gap-3">
                    <Label
                        htmlFor="app-name"
                        className="w-[72px] shrink-0 pt-1.5 text-[11px] text-muted-foreground"
                    >
                        {t('applicationName')}
                    </Label>
                    <div className="max-w-[350px] flex-1">
                        <Input
                            id="app-name"
                            value={values.config?.name ?? ''}
                            onChange={(e) =>
                                setValue(
                                    'config',
                                    { ...(values.config ?? {}), name: e.target.value },
                                    { shouldDirty: true, shouldValidate: true }
                                )
                            }
                            placeholder="my-next-app"
                            maxLength={100}
                            className="h-7 rounded-sm text-[11px]"
                        />
                        {flattenedErrors.config?.name && (
                            <p className="mt-1 text-xs text-destructive">
                                {flattenedErrors.config.name}
                            </p>
                        )}
                    </div>
                </div>

                {/* Theme Color */}
                <div className="flex items-start gap-3">
                    <Label className="w-[72px] shrink-0 pt-1.5 text-[11px] text-muted-foreground">
                        {t('themeColor')}
                    </Label>
                    <button
                        type="button"
                        onClick={() => colorInputRef.current?.click()}
                        className="flex h-7 max-w-[350px] flex-1 items-center justify-between rounded-sm border px-2"
                        style={{ backgroundColor: values.themeColor || '#000000' }}
                        aria-label={t('themeColor')}
                    >
                        <span
                            className="font-mono text-[11px] font-bold"
                            style={{ color: contrastTextColor(values.themeColor) }}
                        >
                            {values.themeColor || '#000000'}
                        </span>
                        <Palette
                            className="h-3.5 w-3.5"
                            style={{ color: contrastTextColor(values.themeColor) }}
                        />
                    </button>
                    <input
                        ref={colorInputRef}
                        type="color"
                        value={values.themeColor || '#000000'}
                        onChange={(e) =>
                            setValue('themeColor', e.target.value, { shouldDirty: true })
                        }
                        className="sr-only"
                        aria-label={t('themeColor')}
                    />
                </div>
            </div>
        </div>
    )

    // Scaffold-faithful step-2 layout for Spring Boot: PROJECT DETAILS (icon
    // uploader + Name/Description/Location) on top, BACKEND CONFIGURATION
    // (Group/Artifact, DB/Structure, Features, Dependencies) below.
    const renderSpringBootStep2 = () => {
        const cfg = (values.config ?? {}) as Record<string, any>
        const cfgErr = flattenedErrors.config ?? {}
        const setCfg = (next: Record<string, unknown>) =>
            setValue(
                'config',
                { ...cfg, ...next },
                { shouldValidate: true, shouldDirty: true, shouldTouch: true }
            )

        const selectedDeps: Dependency[] = Array.isArray(cfg.dependencies)
            ? cfg.dependencies
            : []
        const depQuery = springDepSearch.trim().toLowerCase()
        const filteredDeps = springDependencies
            .filter(
                (d) =>
                    !selectedDeps.some(
                        (s) => s.groupId === d.groupId && s.artifactId === d.artifactId
                    )
            )
            .filter((d) =>
                depQuery
                    ? `${d.groupId}:${d.artifactId} ${d.name ?? ''}`
                          .toLowerCase()
                          .includes(depQuery)
                    : true
            )

        const handleAddDep = (dep: Dependency) => {
            setCfg({ dependencies: [...selectedDeps, dep] })
            setSpringDepSearch('')
            setSpringDepDropdownOpen(false)
        }
        const handleRemoveDep = (dep: Dependency) => {
            setCfg({
                dependencies: selectedDeps.filter(
                    (d) => !(d.groupId === dep.groupId && d.artifactId === dep.artifactId)
                )
            })
        }

        const features: Array<{ key: string; label: string }> = [
            {
                key: 'enableObservability',
                label: t('observability', { defaultValue: 'Observability' })
            },
            {
                key: 'enableEntityRevision',
                label: t('entityRevision', { defaultValue: 'Entity Revision' })
            },
            { key: 'enableGraalVm', label: t('graalVm', { defaultValue: 'Graal VM' }) }
        ]

        return (
            <div className="space-y-4">
                {/* Section 1: PROJECT DETAILS (shared scaffold layout) */}
                <div className="border-b pb-4">
                    <p className="pb-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {t('projectDetails', { defaultValue: 'Project Details' })}
                    </p>
                    <div className="relative pl-[74px]">
                        <button
                            type="button"
                            onClick={() => iconUploadRef.current?.click()}
                            aria-label={t('projectIcon')}
                            className="absolute left-0 top-0 flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-dashed bg-muted/30 text-muted-foreground transition-colors hover:border-primary/60 hover:bg-primary/5 hover:text-primary active:scale-95"
                        >
                            {previewUrl ? (
                                <img src={previewUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                                <Plus className="h-5 w-5" />
                            )}
                        </button>
                        <input
                            ref={iconUploadRef}
                            type="file"
                            id="icon-upload"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <Label
                                    htmlFor="name"
                                    className="w-[82px] shrink-0 pt-1.5 text-[11px] text-muted-foreground"
                                >
                                    {t('projectName')}{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <div className="max-w-[350px] flex-1">
                                    <Input
                                        {...nameRegister}
                                        ref={nameRefHandler}
                                        id="name"
                                        placeholder={t('enterProjectName', {
                                            defaultValue: 'e.g. acme-dashboard'
                                        })}
                                        maxLength={50}
                                        className="h-7 rounded-[4px] text-[11px]"
                                    />
                                    {touchedFields.name && nameError && (
                                        <p className="mt-1 text-xs text-destructive">
                                            {nameError}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Label className="w-[82px] shrink-0 pt-1.5 text-[11px] text-muted-foreground">
                                    {t('description', { defaultValue: 'Description' })}
                                </Label>
                                <Input
                                    type="text"
                                    value={cfg.description ?? ''}
                                    onChange={(e) => setCfg({ description: e.target.value })}
                                    placeholder={t('projectDescription', {
                                        defaultValue: 'Briefly describe this project...'
                                    })}
                                    className="h-7 max-w-[350px] flex-1 rounded-[4px] text-[11px]"
                                />
                            </div>
                            <div className="flex items-start gap-3">
                                <Label className="w-[82px] shrink-0 pt-1.5 text-[11px] text-muted-foreground">
                                    {t('projectLocation')}
                                </Label>
                                <div className="max-w-[350px] flex-1 space-y-1.5">
                                    <RadioGroup
                                        value={values.storageMode ?? 'managed'}
                                        onValueChange={(value) => {
                                            setValue(
                                                'storageMode',
                                                value as ProjectData['storageMode'],
                                                { shouldValidate: true }
                                            )
                                            if (value === 'managed') {
                                                setValue('path', '', { shouldValidate: false })
                                            }
                                        }}
                                        className="flex gap-4"
                                    >
                                        <label
                                            htmlFor="storage-managed"
                                            className="flex cursor-pointer items-center gap-1.5 text-[11px] text-foreground"
                                        >
                                            <RadioGroupItem
                                                value="managed"
                                                id="storage-managed"
                                                className="h-3.5 w-3.5"
                                            />
                                            {t('projectLocationManaged')}
                                        </label>
                                        <label
                                            htmlFor="storage-linked"
                                            className="flex cursor-pointer items-center gap-1.5 text-[11px] text-foreground"
                                        >
                                            <RadioGroupItem
                                                value="linked"
                                                id="storage-linked"
                                                className="h-3.5 w-3.5"
                                            />
                                            {t('projectLocationLinked')}
                                        </label>
                                    </RadioGroup>
                                    <div className="flex gap-1">
                                        <Input
                                            {...pathRegister}
                                            id="path"
                                            placeholder={t('enterProjectDirectory')}
                                            disabled={values.storageMode !== 'linked'}
                                            className="h-7 rounded-[4px] font-mono text-[10.5px]"
                                        />
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            type="button"
                                            className="h-7 w-7 rounded-[4px]"
                                            onClick={(e) => {
                                                e.preventDefault()
                                                handleOpenDirectory()
                                            }}
                                            disabled={values.storageMode !== 'linked'}
                                        >
                                            <FolderOpen className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                    {touchedFields.path && pathError && (
                                        <p className="text-xs text-destructive">{pathError}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 2: BACKEND CONFIGURATION */}
                <div className="space-y-3 pl-[8px]">
                    <p className="pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {t('backendConfiguration', { defaultValue: 'Backend Configuration' })}
                    </p>

                    {/* Group + Artifact */}
                    <div className="flex items-start gap-3">
                        <Label
                            htmlFor="group"
                            className="w-[72px] shrink-0 pt-1.5 text-[11px] text-muted-foreground"
                        >
                            {t('group', { defaultValue: 'Group' })}
                        </Label>
                        <div className="flex max-w-[350px] flex-1 items-start gap-3">
                            <div className="flex-1">
                                <Input
                                    id="group"
                                    value={(cfg.group as string) ?? ''}
                                    onChange={(e) => setCfg({ group: e.target.value })}
                                    placeholder="cv.igrp"
                                    maxLength={100}
                                    className="h-7 rounded-sm text-[11px]"
                                />
                                {cfgErr.group && (
                                    <p className="mt-1 text-xs text-destructive">{cfgErr.group}</p>
                                )}
                            </div>
                            <Label
                                htmlFor="artifact"
                                className="w-[64px] shrink-0 pt-1.5 text-[11px] text-muted-foreground"
                            >
                                {t('artifact', { defaultValue: 'Artifact' })}{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <div className="flex-1">
                                <Input
                                    id="artifact"
                                    value={(cfg.artifact as string) ?? ''}
                                    onChange={(e) => setCfg({ artifact: e.target.value })}
                                    placeholder={t('enterArtifact', {
                                        defaultValue: 'acme-dashboard'
                                    })}
                                    maxLength={50}
                                    className="h-7 rounded-sm text-[11px]"
                                />
                                {cfgErr.artifact && (
                                    <p className="mt-1 text-xs text-destructive">{cfgErr.artifact}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* DB Engine + Structure Style */}
                    <div className="flex items-start gap-3">
                        <Label className="w-[72px] shrink-0 pt-1.5 text-[11px] text-muted-foreground">
                            {t('dbEngine', { defaultValue: 'DB Engine' })}{' '}
                            <span className="text-destructive">*</span>
                        </Label>
                        <div className="flex max-w-[350px] flex-1 items-start gap-3">
                            <div className="flex-1">
                                <Select
                                    value={(cfg.database as string) ?? ''}
                                    onValueChange={(value) => setCfg({ database: value })}
                                >
                                    <SelectTrigger
                                        size="sm"
                                        className="h-7 w-full rounded-sm border-input bg-background px-2 text-[11px] shadow-none [&>svg]:size-3"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DatabaseOptions.map((opt) => (
                                            <SelectItem
                                                key={opt.value}
                                                value={opt.value}
                                                className="text-[11px]"
                                            >
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {cfgErr.database && (
                                    <p className="mt-1 text-xs text-destructive">{cfgErr.database}</p>
                                )}
                            </div>
                            <Label className="w-[64px] shrink-0 pt-1.5 text-[11px] text-muted-foreground">
                                {t('structureStyle', { defaultValue: 'Structure Style' })}
                            </Label>
                            <div className="flex-1">
                                <Select
                                    value={(cfg.projectStructureStyle as string) ?? 'technical'}
                                    onValueChange={(value) =>
                                        setCfg({ projectStructureStyle: value })
                                    }
                                >
                                    <SelectTrigger
                                        size="sm"
                                        className="h-7 w-full rounded-sm border-input bg-background px-2 text-[11px] shadow-none [&>svg]:size-3"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {projectStructureStyle.map((opt) => (
                                            <SelectItem
                                                key={opt.value}
                                                value={opt.value}
                                                className="text-[11px]"
                                            >
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Features */}
                    <div className="flex items-start gap-3">
                        <Label className="w-[72px] shrink-0 pt-1.5 text-[11px] text-muted-foreground">
                            {t('features', { defaultValue: 'Features' })}
                        </Label>
                        <div className="flex max-w-[350px] flex-1 gap-1.5">
                            {features.map(({ key, label }) => {
                                const checked = Boolean(cfg[key])
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setCfg({ [key]: !checked })}
                                        className={cn(
                                            'flex flex-1 items-center justify-between rounded-[4px] border px-2 py-1 text-left transition-colors',
                                            checked
                                                ? 'border-primary bg-primary/5 text-foreground'
                                                : 'border-border bg-background text-muted-foreground hover:bg-muted/50'
                                        )}
                                    >
                                        <span className="text-[10px] font-medium">{label}</span>
                                        <span
                                            className={cn(
                                                'flex h-3 w-3 shrink-0 items-center justify-center rounded-[4px] border',
                                                checked
                                                    ? 'border-primary bg-primary text-primary-foreground'
                                                    : 'border-border bg-background'
                                            )}
                                        >
                                            {checked && <Check className="h-2.5 w-2.5" />}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="my-3 border-t" />

                    {/* Dependencies */}
                    <p className="pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {t('dependencies', { defaultValue: 'Dependencies' })}
                    </p>
                    <div className="flex items-start gap-3">
                        <Label className="w-[72px] shrink-0 pt-1.5 text-[11px] text-muted-foreground">
                            {t('furtherDependencies', { defaultValue: 'Further dependencies' })}
                        </Label>
                        <div className="max-w-[350px] flex-1 space-y-2">
                            <div className="relative" ref={springDepRef}>
                                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    type="text"
                                    value={springDepSearch}
                                    onChange={(e) => {
                                        setSpringDepSearch(e.target.value)
                                        setSpringDepDropdownOpen(true)
                                    }}
                                    onFocus={() => setSpringDepDropdownOpen(true)}
                                    placeholder={t('searchDependenciesPlaceholder', {
                                        defaultValue:
                                            'Type to filter, for example starter, devtools, commons, ...'
                                    })}
                                    className="h-7 rounded-sm pl-8 text-[11px]"
                                />
                                {springDepDropdownOpen && filteredDeps.length > 0 && (
                                    <div className="absolute bottom-full left-0 right-0 z-20 mb-1 max-h-[140px] overflow-y-auto rounded-sm border bg-background shadow-lg">
                                        {filteredDeps.map((dep) => (
                                            <button
                                                key={`${dep.groupId}-${dep.artifactId}`}
                                                type="button"
                                                onClick={() => handleAddDep(dep)}
                                                className="flex w-full cursor-pointer items-center justify-between px-2 py-1.5 text-left hover:bg-muted/50"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <div className="truncate font-mono text-[10px] font-bold text-foreground">
                                                        {dep.groupId}:{dep.artifactId}
                                                    </div>
                                                    {dep.name && (
                                                        <div className="truncate font-mono text-[9px] text-muted-foreground">
                                                            {dep.name}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-sm hover:bg-muted">
                                                    <Plus className="h-3 w-3" />
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {selectedDeps.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    {selectedDeps.map((dep) => {
                                        const shortName = dep.artifactId || dep.groupId
                                        return (
                                            <span
                                                key={`${dep.groupId}-${dep.artifactId}`}
                                                title={`${dep.groupId}:${dep.artifactId}`}
                                                className="flex max-w-[180px] items-center gap-1 rounded-sm border border-primary/30 bg-primary/5 py-0.5 pl-2 pr-1 font-mono text-[9px] font-medium text-foreground"
                                            >
                                                <span className="truncate">{shortName}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveDep(dep)}
                                                    className="flex h-3.5 w-3.5 items-center justify-center rounded-sm hover:bg-muted"
                                                >
                                                    <X className="h-2.5 w-2.5" />
                                                </button>
                                            </span>
                                        )
                                    })}
                                </div>
                            )}
                            <p className="text-[10px] leading-tight text-muted-foreground">
                                {t('igrpStudioInfo', {
                                    defaultValue:
                                        'IGRP Studio already adds required dependencies. Add your custom dependencies here.'
                                })}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Scaffold-faithful step-2 layout for Specification: PROJECT DETAILS on
    // top, AI SPECIFICATION SETTINGS (Application Name + Default LLM +
    // Embeddings model) below.
    const renderSpecificationStep2 = () => {
        const cfg = (values.config ?? {}) as Record<string, any>
        const cfgErr = flattenedErrors.config ?? {}
        const setCfg = (next: Record<string, unknown>) =>
            setValue(
                'config',
                { ...cfg, ...next },
                { shouldValidate: true, shouldDirty: true, shouldTouch: true }
            )

        const currentLlm = (cfg.defaultLLM as LlmOption | undefined) ?? llmModels[0]
        const currentEmb = (cfg.embeddings as LlmOption | undefined) ?? embeddingsModels[0]

        return (
            <div className="space-y-4">
                {/* Section 1: PROJECT DETAILS (shared scaffold layout) */}
                <div className="border-b pb-4">
                    <p className="pb-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {t('projectDetails', { defaultValue: 'Project Details' })}
                    </p>
                    <div className="relative pl-[74px]">
                        <button
                            type="button"
                            onClick={() => iconUploadRef.current?.click()}
                            aria-label={t('projectIcon')}
                            className="absolute left-0 top-0 flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-dashed bg-muted/30 text-muted-foreground transition-colors hover:border-primary/60 hover:bg-primary/5 hover:text-primary active:scale-95"
                        >
                            {previewUrl ? (
                                <img src={previewUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                                <Plus className="h-5 w-5" />
                            )}
                        </button>
                        <input
                            ref={iconUploadRef}
                            type="file"
                            id="icon-upload"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <Label
                                    htmlFor="name"
                                    className="w-[82px] shrink-0 pt-1.5 text-[11px] text-muted-foreground"
                                >
                                    {t('projectName')}{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <div className="max-w-[350px] flex-1">
                                    <Input
                                        {...nameRegister}
                                        ref={nameRefHandler}
                                        id="name"
                                        placeholder={t('enterProjectName', {
                                            defaultValue: 'e.g. acme-dashboard'
                                        })}
                                        maxLength={50}
                                        className="h-7 rounded-[4px] text-[11px]"
                                    />
                                    {touchedFields.name && nameError && (
                                        <p className="mt-1 text-xs text-destructive">
                                            {nameError}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Label className="w-[82px] shrink-0 pt-1.5 text-[11px] text-muted-foreground">
                                    {t('description', { defaultValue: 'Description' })}
                                </Label>
                                <Input
                                    type="text"
                                    value={cfg.description ?? ''}
                                    onChange={(e) => setCfg({ description: e.target.value })}
                                    placeholder={t('projectDescription', {
                                        defaultValue: 'Briefly describe this project...'
                                    })}
                                    className="h-7 max-w-[350px] flex-1 rounded-[4px] text-[11px]"
                                />
                            </div>
                            <div className="flex items-start gap-3">
                                <Label className="w-[82px] shrink-0 pt-1.5 text-[11px] text-muted-foreground">
                                    {t('projectLocation')}
                                </Label>
                                <div className="max-w-[350px] flex-1 space-y-1.5">
                                    <RadioGroup
                                        value={values.storageMode ?? 'managed'}
                                        onValueChange={(value) => {
                                            setValue(
                                                'storageMode',
                                                value as ProjectData['storageMode'],
                                                { shouldValidate: true }
                                            )
                                            if (value === 'managed') {
                                                setValue('path', '', { shouldValidate: false })
                                            }
                                        }}
                                        className="flex gap-4"
                                    >
                                        <label
                                            htmlFor="storage-managed"
                                            className="flex cursor-pointer items-center gap-1.5 text-[11px] text-foreground"
                                        >
                                            <RadioGroupItem
                                                value="managed"
                                                id="storage-managed"
                                                className="h-3.5 w-3.5"
                                            />
                                            {t('projectLocationManaged')}
                                        </label>
                                        <label
                                            htmlFor="storage-linked"
                                            className="flex cursor-pointer items-center gap-1.5 text-[11px] text-foreground"
                                        >
                                            <RadioGroupItem
                                                value="linked"
                                                id="storage-linked"
                                                className="h-3.5 w-3.5"
                                            />
                                            {t('projectLocationLinked')}
                                        </label>
                                    </RadioGroup>
                                    <div className="flex gap-1">
                                        <Input
                                            {...pathRegister}
                                            id="path"
                                            placeholder={t('enterProjectDirectory')}
                                            disabled={values.storageMode !== 'linked'}
                                            className="h-7 rounded-[4px] font-mono text-[10.5px]"
                                        />
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            type="button"
                                            className="h-7 w-7 rounded-[4px]"
                                            onClick={(e) => {
                                                e.preventDefault()
                                                handleOpenDirectory()
                                            }}
                                            disabled={values.storageMode !== 'linked'}
                                        >
                                            <FolderOpen className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                    {touchedFields.path && pathError && (
                                        <p className="text-xs text-destructive">{pathError}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 2: AI SPECIFICATION SETTINGS */}
                <div className="space-y-3 pl-[8px]">
                    <p className="pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {t('aiSpecificationSettings', { defaultValue: 'AI Specification Settings' })}
                    </p>

                    {/* Application Name */}
                    <div className="flex items-start gap-3">
                        <Label
                            htmlFor="app-name"
                            className="w-[80px] shrink-0 pt-1.5 text-[11px] leading-tight text-muted-foreground"
                        >
                            {t('applicationName')}
                        </Label>
                        <div className="max-w-[350px] flex-1">
                            <Input
                                id="app-name"
                                value={(cfg.name as string) ?? ''}
                                onChange={(e) => setCfg({ name: e.target.value })}
                                placeholder="my-spec-project"
                                maxLength={100}
                                className="h-7 rounded-sm text-[11px]"
                            />
                            {cfgErr.name && (
                                <p className="mt-1 text-xs text-destructive">{cfgErr.name}</p>
                            )}
                        </div>
                    </div>

                    {/* Default LLM + Embeddings model */}
                    <div className="flex items-start gap-3">
                        <Label className="w-[80px] shrink-0 pt-1.5 text-[11px] leading-tight text-muted-foreground">
                            {t('defaultLLM', { defaultValue: 'Default LLM' })}
                        </Label>
                        <div className="flex max-w-[350px] flex-1 items-start gap-3">
                            <div className="flex-1">
                                <div className="relative">
                                    <select
                                        value={currentLlm.model}
                                        onChange={(e) => {
                                            const sel = llmModels.find(
                                                (m) => m.model === e.target.value
                                            )
                                            if (sel) setCfg({ defaultLLM: sel })
                                        }}
                                        className="h-7 w-full appearance-none rounded-sm border border-input bg-background pl-2 pr-6 text-[11px] focus-visible:outline-none focus-visible:ring-1"
                                    >
                                        {llmModels.map((m) => (
                                            <option key={m.model} value={m.model}>
                                                {m.model}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                                </div>
                            </div>
                            <Label className="w-[100px] shrink-0 pt-1.5 text-[11px] leading-tight text-muted-foreground">
                                {t('embeddingsModel', { defaultValue: 'Embeddings model' })}
                            </Label>
                            <div className="flex-1">
                                <div className="relative">
                                    <select
                                        value={currentEmb.model}
                                        onChange={(e) => {
                                            const sel = embeddingsModels.find(
                                                (m) => m.model === e.target.value
                                            )
                                            if (sel) setCfg({ embeddings: sel })
                                        }}
                                        className="h-7 w-full appearance-none rounded-sm border border-input bg-background pl-2 pr-6 text-[11px] focus-visible:outline-none focus-visible:ring-1"
                                    >
                                        {embeddingsModels.map((m) => (
                                            <option key={m.model} value={m.model}>
                                                {m.model}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const renderStepContent = () => {
        if (step === 1) {
            return (
                <div className="space-y-6">
                    {renderProjectType()}
                    {renderFrameworkPicker()}
                </div>
            )
        }
        // Step 2: Next.js gets the scaffold-matching custom layout; other
        // frameworks keep the generic Project Details + framework config.
        if (values.framework === 'nextjs') {
            return renderNextJsStep2()
        }
        if (values.framework === 'springboot') {
            return renderSpringBootStep2()
        }
        if (values.framework === 'specification') {
            return renderSpecificationStep2()
        }
        return (
            <div className="space-y-6">
                {renderProjectDetails()}
                {renderFrameworkConfig()}
            </div>
        )
    }

    // ---- Sidebar stage summaries ----
    const typeLabel =
        values.type === 'frontend'
            ? t('frontend')
            : values.type === 'backend'
              ? t('backend')
              : values.type === 'specification'
                ? t('specification', { defaultValue: 'Specification' })
                : ''
    const selectedFramework = frameworks.find((f) => f.id === values.framework)
    const stageSummary: Record<number, string> = {
        1: [typeLabel, selectedFramework?.name].filter(Boolean).join(' · '),
        2: values.name || ''
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
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
                className="flex min-h-0 max-h-[min(700px,96vh)] w-[calc(100vw-2rem)] max-w-2xl sm:max-w-2xl flex-col gap-0 overflow-hidden rounded-md p-0 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                {isCreatingProject && (
                    <div className="absolute inset-0 z-[70] flex items-center justify-center rounded-[inherit] bg-background/85 backdrop-blur-[1px]">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>{t('createProject')}...</span>
                        </div>
                    </div>
                )}

                {/* Header bar */}
                <DialogHeader className="shrink-0 flex-row items-center gap-2 space-y-0 border-b bg-muted/30 py-2 pl-3 pr-10">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-primary text-primary-foreground">
                        <Plus className="h-3 w-3" strokeWidth={3} />
                    </span>
                    <DialogTitle className="text-sm font-medium tracking-tight">
                        {t('newProject')}
                    </DialogTitle>
                    <DialogDescription className="sr-only">{t('newProject')}</DialogDescription>
                </DialogHeader>

                <form onSubmit={onFormSubmit} className="flex min-h-0 flex-1 flex-col">
                    {/* Body: sidebar + content */}
                    <div className="flex min-h-0 flex-1 overflow-hidden">
                        {/* Stage sidebar */}
                        <aside className="flex w-[180px] shrink-0 flex-col gap-1 border-r bg-muted/20 p-3">
                            <p className="mb-1 px-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                                {t('stages', { defaultValue: 'Stages' })}
                            </p>
                            {STEPS.map((s) => {
                                const isActive = step === s.id
                                const isDone = step > s.id
                                const reachable = canNavigateToStep(s.id)
                                return (
                                    <button
                                        key={s.id}
                                        type="button"
                                        disabled={!reachable}
                                        onClick={() => handleStepClick(s.id)}
                                        className={cn(
                                            'flex items-center gap-2 border-l-2 px-2 py-1.5 text-left transition-colors',
                                            isActive
                                                ? 'border-primary bg-background font-semibold text-primary shadow-xs'
                                                : 'border-transparent text-muted-foreground hover:bg-muted/50',
                                            !reachable && 'cursor-not-allowed opacity-50'
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                                                isActive
                                                    ? 'bg-primary text-primary-foreground'
                                                    : isDone
                                                      ? 'bg-primary/15 text-primary'
                                                      : 'bg-muted text-muted-foreground'
                                            )}
                                        >
                                            {isDone ? <Check className="h-3 w-3" /> : s.id}
                                        </span>
                                        <span className="min-w-0">
                                            <span className="block truncate text-[11px]">
                                                {t(s.label)}
                                            </span>
                                            {stageSummary[s.id] && (
                                                <span className="block truncate text-[9.5px] font-normal text-muted-foreground">
                                                    {stageSummary[s.id]}
                                                </span>
                                            )}
                                        </span>
                                    </button>
                                )
                            })}
                        </aside>

                        {/* Step content */}
                        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">
                            {renderStepContent()}
                        </div>
                    </div>

                    {/* Footer nav */}
                    <div className="flex shrink-0 items-center justify-end gap-2 border-t bg-muted/30 px-4 py-2.5">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => (step > 1 ? handleBack() : setOpen(false))}
                            disabled={isCreatingProject}
                        >
                            {step > 1 ? t('back') : t('cancel', { defaultValue: 'Cancel' })}
                        </Button>
                        {step < STEPS.length ? (
                            <Button
                                type="button"
                                size="sm"
                                className="min-w-[110px]"
                                onClick={(e) => {
                                    e.preventDefault()
                                    handleNext()
                                }}
                                disabled={!canNavigateToStep(step + 1) || isCreatingProject}
                            >
                                {t('next')}
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                size="sm"
                                className="min-w-[110px]"
                                disabled={isSubmitting || isCreatingProject}
                            >
                                {isSubmitting || isCreatingProject ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Check className="h-4 w-4" />
                                )}
                                {t('createProject')}
                            </Button>
                        )}
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
