'use client'

import { AnimatePresence, motion } from 'motion/react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import { Separator } from '@renderer/components/ui/separator'
import { Switch } from '@renderer/components/ui/switch'
import { Textarea } from '@renderer/components/ui/textarea'
import {
    IGRPModalDialog,
    IGRPModalDialogContent,
    IGRPModalDialogDescription,
    IGRPModalDialogFooter,
    IGRPModalDialogHeader,
    IGRPModalDialogTitle,
    IGRPModalDialogTrigger
} from '@igrp/igrp-framework-react-design-system'
import { useWorkspace } from '@renderer/hooks/use-workspace'
import useToast from '@renderer/hooks/useToast'
import { setWorkspace } from '@renderer/redux/thunks'
import { cn } from '@renderer/lib/utils'
import { AlertTriangle, Check, Copy, Info, SlidersHorizontal, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import type { IWorkspace } from 'src/main/types'

type Section = 'general' | 'advanced' | 'danger'

interface WorkspaceSettingsProps {
    workspace: IWorkspace
}

const SECTIONS = [
    { id: 'general' as Section, tKey: 'general', icon: Info },
    { id: 'advanced' as Section, tKey: 'advanced', icon: SlidersHorizontal },
    { id: 'danger' as Section, tKey: 'dangerZone', icon: AlertTriangle }
]

export function WorkspaceSettings({ workspace }: WorkspaceSettingsProps) {
    const [workspaceName, setWorkspaceName] = useState(workspace.name)
    const [workspaceDescription, setWorkspaceDescription] = useState(workspace.description)
    const [isSaving, setIsSaving] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [copied, setCopied] = useState(false)
    const [activeSection, setActiveSection] = useState<Section>('general')

    const dispatch: any = useDispatch()
    const { showSuccessToast } = useToast()
    const { t } = useTranslation()

    const {
        actions: { updateWorkspace, deleteWorkspace }
    } = useWorkspace()

    const handleSaveWorkspace = () => {
        setIsSaving(true)
        setTimeout(() => {
            const updatedWorkspace = {
                ...workspace,
                name: workspaceName,
                description: workspaceDescription
            }
            updateWorkspace(workspace.id, updatedWorkspace)
            dispatch(setWorkspace(updatedWorkspace))
            showSuccessToast(`${t('workspace')} "${workspaceName}" ${t('updated')}`)
            setIsSaving(false)
        }, 800)
    }

    const handleDeleteWorkspace = () => {
        setIsDeleting(true)
        setTimeout(() => {
            deleteWorkspace(workspace.id)
            setIsDeleting(false)
        }, 800)
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="flex h-full">
            {/* Left nav panel */}
            <div className="w-[200px] shrink-0 flex flex-col gap-0.5 border-r p-3">
                {SECTIONS.map(({ id, tKey, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setActiveSection(id)}
                        className={cn(
                            'flex w-full items-center gap-2 overflow-hidden rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                            'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                            'border-l-2',
                            id === 'danger' && 'text-destructive hover:text-destructive',
                            activeSection === id
                                ? 'border-primary bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                                : 'border-transparent text-sidebar-foreground'
                        )}
                    >
                        <Icon className="h-4 w-4 shrink-0" />
                        {t(tKey)}
                    </button>
                ))}
            </div>

            {/* Right content */}
            <main className="flex flex-col flex-1 min-h-0 h-full overflow-hidden">
                <ScrollArea className="h-full">
                    <AnimatePresence mode="wait">
                        {/* General */}
                        {activeSection === 'general' && (
                            <motion.div
                                key="general"
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.15 }}
                                className="w-full"
                            >
                                <div className="px-6 pt-6 pb-3">
                                    <div className="flex items-center gap-2">
                                        <Info className="h-4 w-4 text-muted-foreground shrink-0" />
                                        <h2 className="text-lg font-semibold">{t('general')}</h2>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-0.5">
                                        {t('workspaceInfoDescription')}
                                    </p>
                                </div>
                                <div className="px-6">
                                    <Separator />
                                </div>
                                <div className="mx-6 mt-4 mb-2 border rounded-lg overflow-hidden">
                                    <div className="divide-y">
                                        <div className="py-4 px-4 flex items-start gap-4">
                                            <div className="w-2/5 shrink-0">
                                                <Label>{t('workspaceId')}</Label>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {t('workspaceIdDescription')}
                                                </p>
                                            </div>
                                            <div className="flex items-start gap-1 flex-1 min-w-0">
                                                <div className="font-mono text-xs bg-muted/50 border rounded-md px-2 py-1.5 flex-1 min-w-0 break-all leading-tight">
                                                    {workspace.id}
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="icon-sm"
                                                    className="shrink-0"
                                                    onClick={() => copyToClipboard(workspace.id)}
                                                >
                                                    {copied ? (
                                                        <Check className="h-3.5 w-3.5" />
                                                    ) : (
                                                        <Copy className="h-3.5 w-3.5" />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="py-4 px-4 flex items-start gap-4">
                                            <div className="w-2/5 shrink-0">
                                                <Label htmlFor="workspace-name">
                                                    {t('nameDescription')}
                                                </Label>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {t('workspaceNameHint')}
                                                </p>
                                            </div>
                                            <Input
                                                id="workspace-name"
                                                value={workspaceName}
                                                onChange={(e) => setWorkspaceName(e.target.value)}
                                                className="text-sm flex-1"
                                            />
                                        </div>
                                        <div className="py-4 px-4 flex items-start gap-4">
                                            <div className="w-2/5 shrink-0">
                                                <Label htmlFor="workspace-description">
                                                    {t('description')}
                                                </Label>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {t('workspaceDescriptionHint')}
                                                </p>
                                            </div>
                                            <Textarea
                                                id="workspace-description"
                                                value={workspaceDescription}
                                                onChange={(e) =>
                                                    setWorkspaceDescription(e.target.value)
                                                }
                                                className="h-20 text-sm resize-none flex-1"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="px-6 py-3 flex justify-end">
                                    <Button
                                        size="sm"
                                        onClick={handleSaveWorkspace}
                                        disabled={
                                            isSaving ||
                                            (workspaceName === workspace.name &&
                                                workspaceDescription === workspace.description)
                                        }
                                    >
                                        {isSaving ? t('saving') : t('saveChanges')}
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {/* Advanced */}
                        {activeSection === 'advanced' && (
                            <motion.div
                                key="advanced"
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.15 }}
                                className="w-full"
                            >
                                <div className="px-6 pt-6 pb-3">
                                    <div className="flex items-center gap-2">
                                        <SlidersHorizontal className="h-4 w-4 text-muted-foreground shrink-0" />
                                        <h2 className="text-lg font-semibold">{t('advanced')}</h2>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-0.5">
                                        {t('configureAdvancedOptions')}
                                    </p>
                                </div>
                                <div className="px-6">
                                    <Separator />
                                </div>
                                <div className="mx-6 mt-4 mb-2 border rounded-lg overflow-hidden">
                                    <div className="divide-y">
                                        <div className="py-4 px-4 flex items-center justify-between gap-6">
                                            <div>
                                                <Label>{t('autoSave')}</Label>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {t('autoSaveChanges')}
                                                </p>
                                            </div>
                                            <Switch name="auto-save" defaultChecked />
                                        </div>
                                        <div className="py-4 px-4 flex items-center justify-between gap-6">
                                            <div>
                                                <Label>{t('enableVersioning')}</Label>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {t('trackChanges')}
                                                </p>
                                            </div>
                                            <Switch name="enable-versioning" defaultChecked />
                                        </div>
                                        <div className="py-4 px-4 flex items-center justify-between gap-6">
                                            <div>
                                                <Label>{t('experimentalFeatures')}</Label>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {t('enableExperimentalFeatures')}
                                                </p>
                                            </div>
                                            <Switch name="experimental-features" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Danger Zone */}
                        {activeSection === 'danger' && (
                            <motion.div
                                key="danger"
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.15 }}
                                className="w-full"
                            >
                                <div className="px-6 pt-6 pb-3">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                                        <h2 className="text-lg font-semibold text-destructive">
                                            {t('dangerZone')}
                                        </h2>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-0.5">
                                        {t('irreversibleActions')}
                                    </p>
                                </div>
                                <div className="px-6">
                                    <Separator />
                                </div>
                                <div className="mx-6 mt-4 border rounded-md border-destructive/30 p-4">
                                    <div className="flex items-start justify-between gap-6">
                                        <div>
                                            <p className="text-sm font-medium">
                                                {t('deleteWorkspace')}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {t('deleteWarning')}
                                            </p>
                                        </div>
                                        <IGRPModalDialog>
                                            <IGRPModalDialogTrigger asChild>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    className="shrink-0"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                                                    <span>{t('delete')}</span>
                                                </Button>
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
                                                        <div className="text-xs text-muted-foreground">
                                                            {workspace.description}
                                                        </div>
                                                        <div className="text-xs mt-1">
                                                            <span className="text-muted-foreground">
                                                                {t('id')}{' '}
                                                            </span>
                                                            <span className="font-mono">
                                                                {workspace.id}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <IGRPModalDialogFooter className="compact-dialog-footer flex flex-1 items-center">
                                                    <Button variant="outline" size="sm">
                                                        {t('cancel')}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        className="bg-destructive hover:bg-destructive/90"
                                                        onClick={handleDeleteWorkspace}
                                                    >
                                                        {isDeleting
                                                            ? t('deleting')
                                                            : t('deleteWorkspace')}
                                                    </Button>
                                                </IGRPModalDialogFooter>
                                            </IGRPModalDialogContent>
                                        </IGRPModalDialog>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </ScrollArea>
            </main>
        </div>
    )
}
