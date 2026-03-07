import {
    IGRPButtonPrimitive,
    IGRPDialogContentPrimitive,
    IGRPDialogDescriptionPrimitive,
    IGRPDialogHeaderPrimitive,
    IGRPDialogPrimitive,
    IGRPDialogTitlePrimitive,
    IGRPInputPrimitive,
    IGRPLabelPrimitive,
    IGRPTextarea
} from '@igrp/igrp-framework-react-design-system'
import { useWorkspace } from '@renderer/hooks/use-workspace'
import useToast from '@renderer/hooks/useToast'
import { FolderOpen } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { IWorkspace } from 'src/main/types'

interface CreateWorkspaceProps {
    open: boolean
    onSuccess?: (workspaceName: IWorkspace) => void
    onOpenChange?: (open: boolean) => void
}

const CreateWorkspace = ({ open, onSuccess, onOpenChange }: CreateWorkspaceProps) => {
    const { t } = useTranslation()
    const { showErrorToast } = useToast()
    const [isCreating, setIsCreating] = useState(false)
    const [workspaceName, setWorkspaceName] = useState('My Workspace')
    const [slug, setSlug] = useState('my-workspace')
    const [workspaceDescription, setWorkspaceDescription] = useState(
        'My development workspace with Docker projects'
    )
    const [directoryPath, setDirectoryPath] = useState('')
    const {
        actions: { validateWorkspaceName, createWorkspace }
    } = useWorkspace()

    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (open && inputRef.current) {
            inputRef.current.focus()
            inputRef.current.select()
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
        window.electron.ipcRenderer.send('open-directory-dialog')
        window.electron.ipcRenderer.on('file-content', (_e: any, result: any) => {
            if (!result.canceled) {
                setDirectoryPath(result.filePaths[0])
            }
        })
    }

    return (
        <IGRPDialogPrimitive open={open} onOpenChange={() => onOpenChange?.(!open)} modal>
            <IGRPDialogContentPrimitive className="max-w-[500px]">
                <IGRPDialogHeaderPrimitive>
                    <IGRPDialogTitlePrimitive>
                        {t('workspace.createTitle')}
                    </IGRPDialogTitlePrimitive>
                    <IGRPDialogDescriptionPrimitive className="text-xs">
                        {t('createWorkspaceInfo')}
                    </IGRPDialogDescriptionPrimitive>
                </IGRPDialogHeaderPrimitive>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <IGRPLabelPrimitive htmlFor="workspaceName">
                            {t('workspace.nameLabel')}
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

                    <div className="space-y-2">
                        <IGRPLabelPrimitive htmlFor="slug">
                            {t('workspace.slug')}
                        </IGRPLabelPrimitive>
                        <IGRPInputPrimitive
                            id="slug"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            placeholder={t('workspace.slug')}
                        />
                    </div>

                    <div className="compact-form-field space-y-2">
                        <IGRPLabelPrimitive htmlFor="description">
                            {t('description')}
                        </IGRPLabelPrimitive>
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
                        <IGRPLabelPrimitive>{t('workspace.locationLabel')}</IGRPLabelPrimitive>
                        <div className="flex  gap-2">
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

                    <div className="flex justify-end pt-4">
                        <IGRPButtonPrimitive
                            onClick={handleCreate}
                            disabled={isCreating || !directoryPath}
                        >
                            {isCreating ? t('creating') : t('workspace.createButton')}
                        </IGRPButtonPrimitive>
                    </div>
                </div>
            </IGRPDialogContentPrimitive>
        </IGRPDialogPrimitive>
    )
}

export default CreateWorkspace
