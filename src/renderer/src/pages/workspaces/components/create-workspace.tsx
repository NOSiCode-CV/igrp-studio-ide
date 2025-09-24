import {
    IGRPButtonPrimitive,
    IGRPDialogContentPrimitive,
    IGRPDialogDescriptionPrimitive,
    IGRPDialogHeaderPrimitive,
    IGRPDialogPrimitive,
    IGRPDialogTitlePrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { IGRPInputText } from '@igrp/igrp-framework-react-design-system';
import { useTranslation } from 'react-i18next';
import { useEffect, useRef, useState } from 'react';
import { IGRPLabel } from '@igrp/igrp-framework-react-design-system';
import useToast from '@renderer/hooks/useToast';
import { FolderOpen } from 'lucide-react';
import { useWorkspace } from '@renderer/hooks/use-workspace';
import { IWorkspace } from 'src/main/types';
import { IGRPTextarea } from '@igrp/igrp-framework-react-design-system';

interface CreateWorkspaceProps {
    open: boolean;
    onSuccess?: (workspaceName: IWorkspace) => void;
    onOpenChange?: (open: boolean) => void;
}

const CreateWorkspace = ({
    open,
    onSuccess,
    onOpenChange,
}: CreateWorkspaceProps) => {
    const { t } = useTranslation();
    const { showErrorToast } = useToast();
    const [isCreating, setIsCreating] = useState(false);
    const [workspaceName, setWorkspaceName] = useState('My Workspace');
    const [slug, setSlug] = useState('my-workspace');
    const [workspaceDescription, setWorkspaceDescription] = useState(
        'My development workspace with Docker projects'
    );
    const [directoryPath, setDirectoryPath] = useState('');
    const {
        actions: { validateWorkspaceName, createWorkspace },
    } = useWorkspace();

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [open]);

    const handleCreate = async () => {
        if (!workspaceName.trim()) {
            showErrorToast(t('workspace.nameRequired'));
            return;
        }

        const validationError = validateWorkspaceName(workspaceName, slug);
        if (validationError) {
            showErrorToast(validationError);
            return;
        }

        setIsCreating(true);
        try {
            const workspace = await createWorkspace({
                name: workspaceName,
                path: directoryPath,
                slug,
                description: workspaceDescription,
            });
            if (workspace) {
                onSuccess?.(workspace);
                onOpenChange?.(false);
            }
        } catch (error) {
            console.error(t('workspace.creationFailed'), error);
            showErrorToast(error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleSelectDirectory = async () => {
        window.electron.ipcRenderer.send('open-directory-dialog');
        window.electron.ipcRenderer.on(
            'file-content',
            (_e: any, result: any) => {
                if (!result.canceled) {
                    setDirectoryPath(result.filePaths[0]);
                }
            }
        );
    };

    return (
        <IGRPDialogPrimitive
            open={open}
            onOpenChange={() => onOpenChange?.(!open)}
            modal
        >
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
                        <IGRPLabel htmlFor="workspaceName">
                            {t('workspace.nameLabel')}
                        </IGRPLabel>
                        <IGRPInputText
                            ref={inputRef}
                            id="workspaceName"
                            value={workspaceName}
                            onChange={(e) => setWorkspaceName(e.target.value)}
                            placeholder={t('workspace.namePlaceholder')}
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <IGRPLabel htmlFor="slug">
                            {t('workspace.slug')}
                        </IGRPLabel>
                        <IGRPInputText
                            id="slug"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            placeholder={t('workspace.slug')}
                        />
                    </div>

                    <div className="compact-form-field space-y-2">
                        <IGRPLabel htmlFor="description">
                            {t('description')}
                        </IGRPLabel>
                        <IGRPTextarea
                            id="description"
                            name="description"
                            placeholder={t('workspace.describe')}
                            value={workspaceDescription}
                            onChange={(e) =>
                                setWorkspaceDescription(e.target.value)
                            }
                            className="h-20 text-sm py-1.5 px-2"
                        />
                    </div>

                    <div className="space-y-2">
                        <IGRPLabel>{t('workspace.locationLabel')}</IGRPLabel>
                        <div className="flex gap-2">
                            <IGRPInputText
                                value={directoryPath}
                                readOnly
                                placeholder={t('workspace.locationPlaceholder')}
                            />
                            <IGRPButtonPrimitive
                                variant="outline"
                                size="icon"
                                onClick={handleSelectDirectory}
                                disabled={isCreating}
                                type="button"
                            >
                                <FolderOpen className="h-4 w-4" />
                                <span className="sr-only">
                                    {t('workspace.browseButton')}
                                </span>
                            </IGRPButtonPrimitive>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <IGRPButtonPrimitive
                            onClick={handleCreate}
                            disabled={isCreating || !directoryPath}
                        >
                            {isCreating
                                ? t('creating')
                                : t('workspace.createButton')}
                        </IGRPButtonPrimitive>
                    </div>
                </div>
            </IGRPDialogContentPrimitive>
        </IGRPDialogPrimitive>
    );
};

export default CreateWorkspace;
