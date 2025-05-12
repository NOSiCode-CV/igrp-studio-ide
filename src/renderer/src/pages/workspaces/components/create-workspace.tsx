import { Button } from '@renderer/components/ui/button';
import { Input } from '@renderer/components/ui/input';
import { useTranslation } from 'react-i18next';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@renderer/components/ui/dialog';
import { useEffect, useRef, useState } from 'react';
import { Label } from '@renderer/components/ui/label';
import useToast from '@renderer/hooks/useToast';
import { FolderOpen } from 'lucide-react';
import { useWorkspace } from '@renderer/hooks/use-workspace';
import { IWorkspace } from 'src/main/types';
import { Textarea } from '@renderer/components/ui/textarea';

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
            console.error('Workspace creation failed:', error);
            showErrorToast(error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleSelectDirectory = async () => {
        window.electron.ipcRenderer.send('open-directory-dialog');

        window.electron.ipcRenderer.on('file-content', (_e, result) => {
            if (!result.canceled) {
                setDirectoryPath(result.filePaths[0]);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={() => onOpenChange?.(!open)} modal>
            <DialogContent className="max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{t('workspace.createTitle')}</DialogTitle>
                    <DialogDescription className="text-xs">
                    {t('createWorkspaceInfo')}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="workspaceName">
                            {t('workspace.nameLabel')}
                        </Label>
                        <Input
                            ref={inputRef}
                            id="workspaceName"
                            value={workspaceName}
                            onChange={(e) => setWorkspaceName(e.target.value)}
                            placeholder={t('workspace.namePlaceholder')}
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="slug">{t('workspace.slug')}</Label>
                        <Input
                            id="slug"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            placeholder={t('workspace.slug')}
                        />
                    </div>

                    <div className="compact-form-field space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder={t('describeWorkspace')}
                            value={workspaceDescription}
                            onChange={(e) =>
                                setWorkspaceDescription(e.target.value)
                            }
                            className="h-20 text-sm py-1.5 px-2"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>{t('workspace.locationLabel')}</Label>
                        <div className="flex gap-2">
                            <Input
                                value={directoryPath}
                                readOnly
                                placeholder={t('workspace.locationPlaceholder')}
                            />
                            <Button
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
                            </Button>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button
                            onClick={handleCreate}
                            disabled={isCreating || !directoryPath}
                        >
                            {isCreating
                                ? t('creating')
                                : t('workspace.createButton')}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CreateWorkspace;
