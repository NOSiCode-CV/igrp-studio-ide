import {
    IGRPButtonPrimitive,
    IGRPDialogContentPrimitive,
    IGRPDialogDescriptionPrimitive,
    IGRPDialogHeaderPrimitive,
    IGRPDialogOverlayPrimitive,
    IGRPDialogPrimitive,
    IGRPDialogTitlePrimitive,
    IGRPInputPrimitive,
    IGRPLabelPrimitive,
    IGRPTextarea
} from '@igrp/igrp-framework-react-design-system'
import { useWorkspace } from '@renderer/hooks/use-workspace'
import useToast from '@renderer/hooks/useToast'
import {
    Activity,
    AlertCircle,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Copy,
    Cpu,
    FolderOpen,
    Globe,
    Monitor,
    Play,
    Sparkles
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { IWorkspace } from 'src/main/types'

interface CreateWorkspaceProps {
    open: boolean
    onSuccess?: (workspaceName: IWorkspace) => void
    onOpenChange?: (open: boolean) => void
    mode?: 'dialog' | 'inline'
    /** When true, user cannot dismiss the dialog (overlay / Esc) until a workspace is created. */
    preventDismiss?: boolean
}

const CreateWorkspace = ({
    open,
    onSuccess,
    onOpenChange,
    mode = 'dialog',
    preventDismiss = false
}: CreateWorkspaceProps) => {
    const { t } = useTranslation()
    const { showErrorToast, showSuccessToast } = useToast()
    const [isCreating, setIsCreating] = useState(false)
    const [workspaceName, setWorkspaceName] = useState('My Workspace')
    const [slug, setSlug] = useState('my-workspace')
    const [workspaceDescription, setWorkspaceDescription] = useState(
        'My development workspace with Docker projects'
    )
    const [directoryPath, setDirectoryPath] = useState('')
    const [dialogStep, setDialogStep] = useState(0)
    const {
        actions: { validateWorkspaceName, createWorkspace }
    } = useWorkspace()
    const isFormStepValid =
        workspaceName.trim().length > 0 && slug.trim().length > 0 && directoryPath.trim().length > 0
    const isCreateDisabled = isCreating || !directoryPath.trim()
    const currentPlatform = window.api.i18nextElectronBackend.clientOptions.platform
    const isWindows = currentPlatform === 'win32'
    const platformGuide = isWindows
        ? {
            label: 'Windows',
            Icon: Monitor,
            instruction: (
                <>
                    Run Notepad as <strong>Administrator</strong> and open:
                </>
            ),
            command: 'C:\\Windows\\System32\\drivers\\etc\\hosts'
        }
        : {
            label: 'macOS / Linux',
            Icon: Cpu,
            instruction: <>Open your terminal and run:</>,
            command: 'sudo nano /etc/hosts'
        }
    const stepKeys = ['form', 'docker', 'dns'] as const
    const totalSteps = stepKeys.length

    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (open && inputRef.current) {
            inputRef.current.focus()
            inputRef.current.select()
        }
    }, [open])

    useEffect(() => {
        if (!open) {
            setDialogStep(0)
        }
    }, [open])

    const handleCreate = async () => {
        if (!workspaceName.trim()) {
            showErrorToast(t('workspace.nameRequired'))
            return
        }

        const validationError = validateWorkspaceName(workspaceName, slug)
        if (validationError) {
            showErrorToast(validationError)
            return
        }

        setIsCreating(true)
        try {
            const workspace = await createWorkspace({
                name: workspaceName,
                path: directoryPath,
                slug,
                description: workspaceDescription
            })
            if (workspace) {
                onSuccess?.(workspace)
                onOpenChange?.(false)
            }
        } catch (error) {
            console.error(t('workspace.creationFailed'), error)
            showErrorToast(error)
        } finally {
            setIsCreating(false)
        }
    }

    const handleSelectDirectory = async (): Promise<void> => {
        const result = await window.api.openDirectory(t('workspace.locationLabel'))
        if (!result.canceled && result.basePath) {
            setDirectoryPath(result.basePath)
        }
    }

    const handleCopyHostsCommand = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(platformGuide.command)
            showSuccessToast(t('copied'))
        } catch {
            showErrorToast(new Error('Could not copy to clipboard'))
        }
    }, [platformGuide.command, showErrorToast, showSuccessToast, t])

    const formFieldsContent = (
        <div className="grid gap-5 py-4">
            <div className="compact-form-field space-y-2">
                <IGRPLabelPrimitive htmlFor="workspaceName">
                    {t('workspace.nameLabel')} <span className="text-red-500">*</span>
                </IGRPLabelPrimitive>
                <IGRPInputPrimitive
                    ref={inputRef}
                    id="workspaceName"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    placeholder={t('workspace.namePlaceholder')}
                    autoFocus
                />
            </div>
            <div className="compact-form-field space-y-2">
                <div className="compact-form-field space-y-2">
                    <IGRPLabelPrimitive htmlFor="slug">{t('workspace.slug')} <span className="text-red-500">*</span></IGRPLabelPrimitive>
                    <IGRPInputPrimitive
                        id="slug"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        placeholder={t('workspace.slug')}
                    />
                </div>
                {directoryPath && <p className="text-xs text-muted-foreground">
                    {`${directoryPath}/${slug}`}
                </p>}
            </div>

            <div className="compact-form-field space-y-2">
                <IGRPLabelPrimitive htmlFor="description">{t('description')}</IGRPLabelPrimitive>
                <IGRPTextarea
                    id="description"
                    name="description"
                    placeholder={t('workspace.describe')}
                    value={workspaceDescription}
                    onChange={(e) => setWorkspaceDescription(e.target.value)}
                    className="h-20 text-sm py-1.5 px-2"
                />
            </div>

            <div className="space-y-2">
                <IGRPLabelPrimitive>{t('workspace.locationLabel')} <span className="text-red-500">*</span></IGRPLabelPrimitive>
                <div className="flex gap-2">
                    <IGRPInputPrimitive
                        value={directoryPath}
                        readOnly
                        placeholder={t('workspace.locationPlaceholder')}
                        className="w-full flex-1"
                    />
                    <IGRPButtonPrimitive
                        variant="outline"
                        size="icon"
                        onClick={handleSelectDirectory}
                        disabled={isCreating}
                        type="button"
                    >
                        <FolderOpen className="h-4 w-4" />
                        <span className="sr-only">{t('workspace.browseButton')}</span>
                    </IGRPButtonPrimitive>
                </div>
            </div>
        </div >
    )

    const infoSteps = [
        {
            title: 'Docker Orchestration',
            description: 'Start your local platform stack with one action.',
            content: (
                <div className="space-y-4">
                    <div className="rounded-xl border border-border bg-muted/20 p-4">
                        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border">
                            <Play className="w-4 h-4 text-primary" />
                            <span className="text-sm font-semibold text-foreground">Run in Docker</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-3">
                            This launches proxy, authentication, databases, and core services.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 border border-border rounded-xl bg-card">
                            <Globe className="w-4 h-4 text-primary mb-2" />
                            <p className="text-xs font-semibold text-foreground">Proxy</p>
                        </div>
                        <div className="p-3 border border-border rounded-xl bg-card">
                            <Activity className="w-4 h-4 text-primary mb-2" />
                            <p className="text-xs font-semibold text-foreground">Auth</p>
                        </div>
                        <div className="p-3 border border-border rounded-xl bg-card">
                            <Cpu className="w-4 h-4 text-primary mb-2" />
                            <p className="text-xs font-semibold text-foreground">Databases</p>
                        </div>
                        <div className="p-3 border border-border rounded-xl bg-card">
                            <Monitor className="w-4 h-4 text-primary mb-2" />
                            <p className="text-xs font-semibold text-foreground">Web Services</p>
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: 'DNS & Platform Access',
            description: 'Map your local domain and access platform services.',
            content: (
                <div className="space-y-4">
                    <div className="p-3 rounded-xl border border-border bg-muted/20 flex gap-2">
                        <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground">
                            Add <code className="text-foreground">127.0.0.1 {slug}</code> to your
                            hosts file to access the platform endpoints locally.
                        </p>
                    </div>
                    <div className="space-y-3">
                        <div className="p-3 border border-border rounded-xl bg-card">
                            <div className="flex items-center gap-2 mb-2">
                                <platformGuide.Icon className="w-4 h-4 text-muted-foreground" />
                                <span className="font-bold text-sm text-foreground">
                                    {platformGuide.label}
                                </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mb-2">
                                {platformGuide.instruction}
                            </p>
                            <div className="flex h-10 min-h-10 max-h-10 gap-0 overflow-hidden rounded-md ring-1 ring-border/50">
                                <code className="flex min-h-0 min-w-0 flex-1 items-center overflow-hidden bg-foreground px-3 font-mono text-[10px] leading-tight text-background">
                                    <span className="min-w-0 break-all">{platformGuide.command}</span>
                                </code>
                                <IGRPButtonPrimitive
                                    type="button"
                                    variant="secondary"
                                    className="box-border flex h-10 min-h-10 max-h-10 w-10 shrink-0 items-center justify-center rounded-none border-0 bg-foreground p-0 leading-none text-background"
                                    onClick={() => void handleCopyHostsCommand()}
                                    aria-label={t('copyToClipboard')}
                                    title={t('copy')}
                                >
                                    <Copy className="h-4 w-4 shrink-0" />
                                </IGRPButtonPrimitive>
                            </div>
                            <p className="text-[10px] text-primary mt-2 font-medium">Add: 127.0.0.1 {slug}</p>
                        </div>
                    </div>
                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                        <p className="text-xs text-emerald-800 font-medium mb-2 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            Once configured, you can visit:
                        </p>
                        <ul className="text-[11px] text-emerald-700 space-y-1 ml-6 list-disc">
                            <li>
                                <strong>/</strong> : iGRP Application Center
                            </li>
                            <li>
                                <strong>/auth</strong> : Keycloak Authentication
                            </li>
                            <li>
                                <strong>/pgadmin</strong> : Database Management
                            </li>
                            <li>
                                <strong>/minio</strong> : Object Storage (S3)
                            </li>
                            <li>
                                <strong>/eureka</strong> : Service Discovery
                            </li>
                        </ul>
                    </div>
                    <div className="p-3 rounded-xl border border-border bg-primary/10 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <p className="text-xs font-medium text-foreground">
                            Workspace is ready after this step.
                        </p>
                    </div>
                </div>
            )
        }
    ]

    const formContent = (
        <div className="grid gap-5 py-4">
            {formFieldsContent}
            <div className="flex justify-end pt-2">
                <IGRPButtonPrimitive onClick={handleCreate} disabled={isCreateDisabled}>
                    {isCreating ? t('creating') : t('workspace.createButton')}
                </IGRPButtonPrimitive>
            </div>
        </div>
    )

    if (mode === 'inline') {
        return (
            <div className="w-full">
                <div className="space-y-1 mb-2">
                    <h3 className="text-base font-semibold">{t('workspace.createTitle')}</h3>
                    <p className="text-xs text-muted-foreground">{t('createWorkspaceInfo')}</p>
                </div>
                {formContent}
            </div>
        )
    }

    const handleDialogOpenChange = (nextOpen: boolean) => {
        if (preventDismiss && !nextOpen) {
            return
        }
        onOpenChange?.(nextOpen)
    }

    return (
        <IGRPDialogPrimitive open={open} onOpenChange={handleDialogOpenChange} modal>
            <IGRPDialogOverlayPrimitive className="bg-background/70 backdrop-blur-[2px]" />
            <IGRPDialogContentPrimitive
                className="max-w-[560px]"
                {...(preventDismiss
                    ? {
                          onInteractOutside: (e: { preventDefault: () => void }) => e.preventDefault(),
                          onEscapeKeyDown: (e: { preventDefault: () => void }) => e.preventDefault()
                      }
                    : {})}
            >
                <IGRPDialogHeaderPrimitive>
                    <IGRPDialogTitlePrimitive>
                        {dialogStep === 0 ? t('workspace.createTitle') : infoSteps[dialogStep - 1].title}
                    </IGRPDialogTitlePrimitive>
                    <IGRPDialogDescriptionPrimitive>
                        {dialogStep === 0 ? t('createWorkspaceInfo') : infoSteps[dialogStep - 1].description}
                    </IGRPDialogDescriptionPrimitive>
                </IGRPDialogHeaderPrimitive>
                {dialogStep === 0 ? formFieldsContent : infoSteps[dialogStep - 1].content}

                <div className="pt-4 border-t border-border flex items-center justify-between">
                    <div className="flex gap-1.5">
                        {stepKeys.map((stepKey, idx) => (
                            <div
                                key={stepKey}
                                className={`h-1.5 rounded-full transition-all duration-300 ${idx === dialogStep ? 'w-6 bg-primary' : 'w-1.5 bg-muted'
                                    }`}
                            />
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        <IGRPButtonPrimitive
                            type="button"
                            variant="outline"
                            onClick={() => setDialogStep((prev) => Math.max(prev - 1, 0))}
                            disabled={dialogStep === 0}
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                        </IGRPButtonPrimitive>

                        {dialogStep < totalSteps - 1 ? (
                            <IGRPButtonPrimitive
                                type="button"
                                disabled={dialogStep === 0 && !isFormStepValid}
                                onClick={() => setDialogStep((prev) => Math.min(prev + 1, totalSteps - 1))}
                            >
                                Next
                                <ChevronRight className="w-4 h-4" />
                            </IGRPButtonPrimitive>
                        ) : (
                            <IGRPButtonPrimitive type="button" onClick={handleCreate} disabled={isCreateDisabled}>
                                {isCreating ? t('creating') : t('workspace.createButton')}
                            </IGRPButtonPrimitive>
                        )}
                    </div>
                </div>
            </IGRPDialogContentPrimitive>
        </IGRPDialogPrimitive>
    )
}

export default CreateWorkspace
