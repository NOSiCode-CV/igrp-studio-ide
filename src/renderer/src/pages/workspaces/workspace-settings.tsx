'use client';

import { useState } from 'react';
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
import {
    IGRPCard,
    IGRPCardContent,
    IGRPCardDescription,
    IGRPCardFooter,
    IGRPCardHeader,
    IGRPCardTitle,
} from '@igrp/igrp-framework-react-design-system';
import { IGRPInputText } from '@igrp/igrp-framework-react-design-system';
import { IGRPLabel } from '@igrp/igrp-framework-react-design-system';
import { IGRPSeparator } from '@igrp/igrp-framework-react-design-system';
import { IGRPSwitch } from '@igrp/igrp-framework-react-design-system';
import { Copy, Check, Trash2, AlertTriangle, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
    IGRPModalDialog,
    IGRPModalDialogContent,
    IGRPModalDialogDescription,
    IGRPModalDialogFooter,
    IGRPModalDialogHeader,
    IGRPModalDialogTitle,
    IGRPModalDialogTrigger,
} from '@igrp/igrp-framework-react-design-system';
import { IWorkspace } from 'src/main/types';
import { IGRPTextarea } from '@igrp/igrp-framework-react-design-system';
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
            <IGRPCard>
                <IGRPCardHeader className="compact-card-header">
                    <IGRPCardTitle className="text-sm">
                        {t('workspaceInformation')}
                    </IGRPCardTitle>
                    <IGRPCardDescription className="text-xs">
                    {t('workspaceInformation')}
                    </IGRPCardDescription>
                </IGRPCardHeader>
                <IGRPCardContent className="compact-card-content space-y-3">
                    <div className="space-y-2">
                        <IGRPLabel htmlFor="workspace-id">{t('workspaceId')}</IGRPLabel>
                        <div className="flex space-x-2">
                            <IGRPInputText
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
                        <IGRPLabel htmlFor="workspace-name">{t('nameDescription')}</IGRPLabel>
                        <IGRPInputText
                            id="workspace-name"
                            value={workspaceName}
                            onChange={(e) => setWorkspaceName(e.target.value)}
                            className="h-8 text-xs"
                        />
                    </div>

                    <div className="space-y-2">
                        <IGRPLabel htmlFor="workspace-description">
                            {t('description')}
                        </IGRPLabel>
                        <IGRPTextarea
                            name="workspace-description"
                            id="workspace-description"
                            value={workspaceDescription}
                            onChange={(e) =>
                                setWorkspaceDescription(e.target.value)
                            }
                            className="h-20 text-xs resize-none"
                        />
                    </div>
                </IGRPCardContent>
                <IGRPCardFooter className="compact-card-footer flex justify-between">
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
                </IGRPCardFooter>
            </IGRPCard>

            <IGRPCard>
                <IGRPCardHeader className="compact-card-header">
                    <IGRPCardTitle className="text-sm">{t('advancedSettings')}</IGRPCardTitle>
                    <IGRPCardDescription className="text-xs">
                             {t('configureAdvancedOptions')}
                    </IGRPCardDescription>
                </IGRPCardHeader>
                <IGRPCardContent className="compact-card-content space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-xs font-medium">{t('autoSave')}</div>
                            <div className="text-sm text-muted-foreground">
                              {t('autoSaveChanges')}
                            </div>
                        </div>
                        <IGRPSwitch name="auto-save" defaultChecked />
                    </div>

                    <IGRPSeparator />

                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-xs font-medium">
                            {t('enableVersioning')}
                            </div>
                            <div className="text-sm text-muted-foreground">
                             {t('trackChanges')}
                            </div>
                        </div>
                        <IGRPSwitch name="enable-versioning" defaultChecked />
                    </div>

                    <IGRPSeparator />

                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-xs font-medium">
                            {t('experimentalFeatures')} 
                            </div>
                            <div className="text-sm text-muted-foreground">
                            {t('enableExperimentalFeatures')}
                            </div>
                        </div>
                        <IGRPSwitch name="experimental-features" />
                    </div>
                </IGRPCardContent>
            </IGRPCard>
            <IGRPCard className="border-destructive/50">
                <IGRPCardHeader className="compact-card-header">
                    <IGRPCardTitle className="text-sm text-destructive">
                        {t('dangerZone')}
                    </IGRPCardTitle>
                    <IGRPCardDescription className="text-xs">
                        {t('irreversibleActions')}
                    </IGRPCardDescription>
                </IGRPCardHeader>
                <IGRPCardContent className="compact-card-content">
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
                            <IGRPModalDialog>
                                <IGRPModalDialogTrigger asChild>
                                    <IGRPButtonPrimitive
                                        variant="destructive"
                                        size="sm"
                                        className="h-7"
                                    >
                                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                                        <span>{t('delete')}</span>
                                    </IGRPButtonPrimitive>
                                </IGRPModalDialogTrigger>
                                <IGRPModalDialogContent className="compact-dialog">
                                    <IGRPModalDialogHeader className="compact-dialog-header">
                                        <IGRPModalDialogTitle className="text-base flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4 text-destructive" />
                                            {t('deleteWorkspace')}
                                        </IGRPModalDialogTitle>
                                        <IGRPModalDialogDescription className="text-xs">
                                             {t('cannotUndoAction')}
                                            <span className="font-medium">
                                                {' '}
                                                {workspace.name}{' '}
                                            </span>
                                            {t('workspaceAndProjects')}
                                        </IGRPModalDialogDescription>
                                    </IGRPModalDialogHeader>
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
                                    <IGRPModalDialogFooter className="compact-dialog-footer flex flex-1 items-center ">
                                        <IGRPButtonPrimitive
                                            variant="outline"
                                            className="h-7 text-xs"
                                        >
                                            {t('cancel')}
                                        </IGRPButtonPrimitive>
                                        <IGRPButtonPrimitive
                                            className="h-7 text-xs bg-destructive hover:bg-destructive/90"
                                            onClick={handleDeleteWorkspace}
                                        >
                                            {isDeleting
                                                ? t('deleting')
                                                :  t('deleteWorkspace')}
                                        </IGRPButtonPrimitive>
                                    </IGRPModalDialogFooter>
                                </IGRPModalDialogContent>
                            </IGRPModalDialog>
                        </div>
                    </div>
                </IGRPCardContent>
            </IGRPCard>
        </div>
    );
}
