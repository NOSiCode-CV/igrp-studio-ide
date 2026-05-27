'use client'

import { AnimatePresence, motion } from 'motion/react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Switch } from '@renderer/components/ui/switch'
import { Textarea } from '@renderer/components/ui/textarea'
import {
    IGRPCard,
    IGRPModalDialog,
    IGRPModalDialogContent,
    IGRPModalDialogDescription,
    IGRPModalDialogFooter,
    IGRPModalDialogHeader,
    IGRPModalDialogTitle,
    IGRPModalDialogTrigger,
    IGRPSeparator
} from '@igrp/igrp-framework-react-design-system'
import { useWorkspace } from '@renderer/hooks/use-workspace'
import useToast from '@renderer/hooks/useToast'
import { setWorkspace } from '@renderer/redux/thunks'
import { getLocale } from '@renderer/utils'
import { cn } from '@renderer/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import {
    AlertTriangle,
    Check,
    Clock,
    Copy,
    Info,
    Search,
    SlidersHorizontal,
    Trash2
} from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import type { IWorkspace } from 'src/main/types'

type Section = 'general' | 'advanced' | 'danger'

interface WorkspaceSettingsProps {
    workspace: IWorkspace
}

const SECTIONS = [
    { id: 'general' as Section,  tKey: 'general',    descKey: 'workspaceInfoDescription', icon: Info              },
    { id: 'advanced' as Section, tKey: 'advanced',   descKey: 'configureAdvancedOptions',  icon: SlidersHorizontal },
    { id: 'danger' as Section,   tKey: 'dangerZone', descKey: 'irreversibleActions',       icon: AlertTriangle     }
]

export function WorkspaceSettings({ workspace }: WorkspaceSettingsProps) {
    const [workspaceName, setWorkspaceName] = useState(workspace.name)
    const [workspaceDescription, setWorkspaceDescription] = useState(workspace.description)
    const [isSaving, setIsSaving] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [copied, setCopied] = useState(false)
    const [activeSection, setActiveSection] = useState<Section>('general')
    const [searchQuery, setSearchQuery] = useState('')

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

    const filtered = SECTIONS.filter((s) =>
        t(s.tKey).toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="overflow-hidden">
            <div className="flex min-h-[480px]">

                {/* Left nav panel */}
                <div className="w-[200px] shrink-0 flex flex-col gap-0.5 border-r p-3">
                    <div className="relative mb-2">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                            type="text"
                            placeholder="Search preferences..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-8 text-xs pl-8"
                        />
                    </div>

                    {filtered.map(({ id, tKey, icon: Icon }) => (
                        <Button
                            key={id}
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveSection(id)}
                            className={cn(
                                'w-full justify-start h-8 text-xs gap-2',
                                activeSection === id && 'bg-accent text-accent-foreground font-medium'
                            )}
                        >
                            <Icon className="h-4 w-4 shrink-0" />
                            {t(tKey)}
                        </Button>
                    ))}

                    <div className="flex-1" />

                    {workspace.updatedAt && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1">
                            <Clock className="h-3.5 w-3.5 shrink-0" />
                            <span>
                                {t('lastUpdated')}{' '}
                                {formatDistanceToNow(workspace.updatedAt, {
                                    addSuffix: true,
                                    locale: getLocale()
                                })}
                            </span>
                        </div>
                    )}
                </div>

                {/* Right content */}
                <main className="flex flex-1 flex-col overflow-auto">
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
                                    <h2 className="text-base font-semibold">{t('general')}</h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">{t('workspaceInfoDescription')}</p>
                                </div>
                                <div className="mx-6 border-t" />
                                <div className="mx-6 mt-4 mb-2 border rounded-lg overflow-hidden">
                                    <div className="divide-y">
                                        <div className="py-3 px-4 flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium">{t('workspaceId')}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">{t('workspaceIdDescription')}</p>
                                            </div>
                                            <div className="flex items-start gap-1 shrink-0">
                                                <div className="font-mono text-xs bg-muted/50 border rounded-md px-2 py-1.5 w-[160px] break-all leading-tight">
                                                    {workspace.id}
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 w-7 p-0 shrink-0"
                                                    onClick={() => copyToClipboard(workspace.id)}
                                                >
                                                    {copied
                                                        ? <Check className="h-3.5 w-3.5" />
                                                        : <Copy className="h-3.5 w-3.5" />
                                                    }
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="py-3 px-4 flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium">{t('nameDescription')}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">{t('workspaceNameHint')}</p>
                                            </div>
                                            <Input
                                                id="workspace-name"
                                                value={workspaceName}
                                                onChange={(e) => setWorkspaceName(e.target.value)}
                                                className="h-8 text-xs w-[200px] shrink-0"
                                            />
                                        </div>
                                        <div className="py-3 px-4 flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium">{t('description')}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">{t('workspaceDescriptionHint')}</p>
                                            </div>
                                            <Textarea
                                                id="workspace-description"
                                                value={workspaceDescription}
                                                onChange={(e) => setWorkspaceDescription(e.target.value)}
                                                className="h-20 text-xs resize-none w-[200px] shrink-0"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="px-6 py-3 flex justify-end">
                                    <Button
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
                                    <h2 className="text-base font-semibold">{t('advanced')}</h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">{t('configureAdvancedOptions')}</p>
                                </div>
                                <div className="mx-6 border-t" />
                                <div className="mx-6 mt-4 mb-2 border rounded-lg overflow-hidden">
                                    <div className="divide-y">
                                        <div className="py-3 px-4 flex items-center justify-between gap-6">
                                            <div>
                                                <p className="text-xs font-medium">{t('autoSave')}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">{t('autoSaveChanges')}</p>
                                            </div>
                                            <Switch name="auto-save" defaultChecked />
                                        </div>
                                        <div className="py-3 px-4 flex items-center justify-between gap-6">
                                            <div>
                                                <p className="text-xs font-medium">{t('enableVersioning')}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">{t('trackChanges')}</p>
                                            </div>
                                            <Switch name="enable-versioning" defaultChecked />
                                        </div>
                                        <div className="py-3 px-4 flex items-center justify-between gap-6">
                                            <div>
                                                <p className="text-xs font-medium">{t('experimentalFeatures')}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">{t('enableExperimentalFeatures')}</p>
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
                                    <h2 className="text-base font-semibold text-destructive">{t('dangerZone')}</h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">{t('irreversibleActions')}</p>
                                </div>
                                <div className="mx-6 border-t" />
                                <div className="mx-6 mt-4 border rounded-md border-destructive/30 p-4">
                                    <div className="flex items-start justify-between gap-6">
                                        <div>
                                            <p className="text-xs font-medium">{t('deleteWorkspace')}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{t('deleteWarning')}</p>
                                        </div>
                                        <IGRPModalDialog>
                                            <IGRPModalDialogTrigger asChild>
                                                <Button variant="destructive" size="sm" className="h-7 shrink-0">
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
                                                        <span className="font-medium"> {workspace.name} </span>
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
                                                            <span className="font-mono">{workspace.id}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <IGRPModalDialogFooter className="compact-dialog-footer flex flex-1 items-center">
                                                    <Button variant="outline" className="h-7 text-xs">
                                                        {t('cancel')}
                                                    </Button>
                                                    <Button
                                                        className="h-7 text-xs bg-destructive hover:bg-destructive/90"
                                                        onClick={handleDeleteWorkspace}
                                                    >
                                                        {isDeleting ? t('deleting') : t('deleteWorkspace')}
                                                    </Button>
                                                </IGRPModalDialogFooter>
                                            </IGRPModalDialogContent>
                                        </IGRPModalDialog>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </main>

            </div>
        </div>
    )
}
