'use client';

import { useState } from 'react';
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@renderer/components/ui/card';
import { Input } from '@renderer/components/ui/input';
import { Label } from '@renderer/components/ui/label';
import { Separator } from '@renderer/components/ui/separator';
import { Switch } from '@renderer/components/ui/switch';
import { Copy, Check, Trash2, AlertTriangle, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@renderer/components/ui/alert-dialog';
import { IWorkspace } from 'src/main/types';
import { Textarea } from '@renderer/components/ui/textarea';
import { formatDistanceToNow } from 'date-fns';
import { getLocale } from '@renderer/utils';
import { useWorkspace } from '@renderer/hooks/use-workspace';
import useToast from '@renderer/hooks/useToast';
import { setWorkspace } from '@renderer/redux/thunks';
import { useDispatch } from 'react-redux';

interface WorkspaceSettingsProps {
    workspace: IWorkspace;
}

export function WorkspaceSettings({ workspace }: WorkspaceSettingsProps) {
    const [workspaceName, setWorkspaceName] = useState(workspace.name);
    const [workspaceDescription, setWorkspaceDescription] = useState(
        workspace.description
    );
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [copied, setCopied] = useState(false);

    const dispatch: any = useDispatch();
    const { showSuccessToast } = useToast();

    const { t } = useTranslation();


    const {
        actions: { updateWorkspace, deleteWorkspace },
    } = useWorkspace();

    const handleSaveWorkspace = () => {
        setIsSaving(true);

        // Simulate API call
        setTimeout(() => {
            const uodatedWorkspace = {
                ...workspace,
                name: workspaceName,
                description: workspaceDescription,
            };

            updateWorkspace(workspace.id, uodatedWorkspace);

            dispatch(setWorkspace(uodatedWorkspace));

            showSuccessToast(`${t('workspace')} "${workspaceName}" ${t('updated')}`);

            setIsSaving(false);
        }, 800);
    };

    const handleDeleteWorkspace = () => {
        setIsDeleting(true);

        // Simulate API call
        setTimeout(() => {
            deleteWorkspace(workspace.id);
            setIsDeleting(false);
        }, 800);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="compact-card-header">
                    <CardTitle className="text-sm">
                        {t('workspaceInformation')}
                    </CardTitle>
                    <CardDescription className="text-xs">
                    {t('workspaceInformation')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="compact-card-content space-y-3">
                    <div className="space-y-2">
                        <Label htmlFor="workspace-id">{t('workspaceId')}</Label>
                        <div className="flex space-x-2">
                            <Input
                                id="workspace-id"
                                value={workspace.id}
                                readOnly
                                className="h-8 text-xs font-mono bg-muted/50 flex-1 rounded-r-none"
                            />
                            <IGRPButtonPrimitive
                                variant="outline"
                                size="sm"
                                className="h-8 rounded-l-none border-l-0"
                                onClick={() => copyToClipboard(workspace.id)}
                            >
                                {copied ? (
                                    <Check className="h-3.5 w-3.5" />
                                ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                )}
                            </IGRPButtonPrimitive>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                                {t('workspaceIdDescription')}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="workspace-name">{t('nameDescription')}</Label>
                        <Input
                            id="workspace-name"
                            value={workspaceName}
                            onChange={(e) => setWorkspaceName(e.target.value)}
                            className="h-8 text-xs"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="workspace-description">
                            {t('description')}
                        </Label>
                        <Textarea
                            id="workspace-description"
                            value={workspaceDescription}
                            onChange={(e) =>
                                setWorkspaceDescription(e.target.value)
                            }
                            className="h-20 text-xs resize-none"
                        />
                    </div>
                </CardContent>
                <CardFooter className="compact-card-footer flex justify-between">
                    {workspace.updatedAt && (
                        <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="h-3.5 w-3.5 mr-1" />
                            {t('lastUpdated')} :{' '}
                            {formatDistanceToNow(workspace.updatedAt, {
                                addSuffix: true,
                                locale: getLocale(),
                            })}
                        </div>
                    )}
                    <IGRPButtonPrimitive
                        size="sm"
                        className="h-7"
                        onClick={handleSaveWorkspace}
                        disabled={
                            isSaving ||
                            (workspaceName === workspace.name &&
                                workspaceDescription === workspace.description)
                        }
                    >
                        {isSaving ? t('saving') : t('saveChanges')}
                    </IGRPButtonPrimitive>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader className="compact-card-header">
                    <CardTitle className="text-sm">{t('advancedSettings')}</CardTitle>
                    <CardDescription className="text-xs">
                             {t('configureAdvancedOptions')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="compact-card-content space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-xs font-medium">{t('autoSave')}</div>
                            <div className="text-sm text-muted-foreground">
                              {t('autoSaveChanges')}
                            </div>
                        </div>
                        <Switch defaultChecked />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-xs font-medium">
                            {t('enableVersioning')}
                            </div>
                            <div className="text-sm text-muted-foreground">
                             {t('trackChanges')}
                            </div>
                        </div>
                        <Switch defaultChecked />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-xs font-medium">
                            {t('experimentalFeatures')} 
                            </div>
                            <div className="text-sm text-muted-foreground">
                            {t('enableExperimentalFeatures')}
                            </div>
                        </div>
                        <Switch />
                    </div>
                </CardContent>
            </Card>
            <Card className="border-destructive/50">
                <CardHeader className="compact-card-header">
                    <CardTitle className="text-sm text-destructive">
                        {t('dangerZone')}
                    </CardTitle>
                    <CardDescription className="text-xs">
                        {t('irreversibleActions')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="compact-card-content">
                    <div className="border rounded-md border-destructive/30 p-3">
                        <div className="flex items-start justify-between">
                            <div>
                                <h4 className="text-xs font-medium">
                                {t('deleteWorkspace')}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                {t('deleteWarning')}
                                </p>
                            </div>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <IGRPButtonPrimitive
                                        variant="destructive"
                                        size="sm"
                                        className="h-7"
                                    >
                                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                                        <span>{t('delete')}</span>
                                    </IGRPButtonPrimitive>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="compact-dialog">
                                    <AlertDialogHeader className="compact-dialog-header">
                                        <AlertDialogTitle className="text-base flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4 text-destructive" />
                                            {t('deleteWorkspace')}
                                        </AlertDialogTitle>
                                        <AlertDialogDescription className="text-xs">
                                             {t('cannotUndoAction')}
                                            <span className="font-medium">
                                                {' '}
                                                {workspace.name}{' '}
                                            </span>
                                            {t('workspaceAndProjects')}
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <div className="py-3">
                                        <div className="border rounded-md p-2 bg-muted/30">
                                            <div className="text-xs font-medium mb-1">
                                                {workspace.name}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {workspace.description}
                                            </div>
                                            <div className="text-sm mt-1">
                                                <span className="text-muted-foreground">
                                                {t('id')}  {' '}
                                                </span>
                                                <span className="font-mono">
                                                    {workspace.id}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <AlertDialogFooter className="compact-dialog-footer flex flex-1 items-center ">
                                        <AlertDialogCancel className="h-7 text-xs">
                                        {t('cancel')}
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                            className="h-7 text-xs bg-destructive hover:bg-destructive/90"
                                            onClick={handleDeleteWorkspace}
                                        >
                                            {isDeleting
                                                ? t('deleting')
                                                :  t('deleteWorkspace')}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
