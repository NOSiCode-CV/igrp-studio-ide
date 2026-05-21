import { Button } from '@renderer/components/ui/button'
import { Checkbox } from '@renderer/components/ui/checkbox'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@renderer/components/ui/dialog'
import { Label } from '@renderer/components/ui/label'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import { IGRPCombobox } from '@igrp/igrp-framework-react-design-system'
import { Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Connection } from 'src/main/types'
import { ConnectionForm } from '../connection/ConnectionForm'
import { useConnections } from '../hooks/useConnections'

const EMPTY_CONNECTION: Connection = {
    name: '',
    databaseType: '',
    connectionType: 'general',
    host: '',
    port: undefined,
    user: '',
    password: '',
    database: ''
}

const IGNORED_TABLES = new Set(['flyway_schema_history'])

interface ImportFromDbWizardProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    basePath: string | undefined
    onImported?: (entityIds: string[]) => void
}

type Step = 'connection' | 'tables' | 'preview' | 'committing'

export function ImportFromDbWizard({
    open,
    onOpenChange,
    basePath,
    onImported
}: ImportFromDbWizardProps): React.ReactNode {
    const { t } = useTranslation()
    const {
        connections,
        loading: loadingConnections,
        refresh: refreshConnections
    } = useConnections()

    const [step, setStep] = useState<Step>('connection')
    const [connectionName, setConnectionName] = useState<string>('')
    const [tables, setTables] = useState<string[]>([])
    const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set())
    const [loadingTables, setLoadingTables] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [newConnOpen, setNewConnOpen] = useState(false)

    useEffect(() => {
        if (!open) {
            setStep('connection')
            setConnectionName('')
            setTables([])
            setSelectedTables(new Set())
            setError(null)
        }
    }, [open])

    const connectionOptions = useMemo(
        () => connections.map((c) => ({ label: c.name, value: c.name })),
        [connections]
    )

    const handlePickConnection = async (name: string): Promise<void> => {
        setConnectionName(name)
        setError(null)
        setLoadingTables(true)
        try {
            const result = await window.igrpStudio.connection.getTables(name)
            if (!result.success) {
                setError(result.message ?? t('failed_to_load_tables'))
                return
            }
            setTables((result.tables as string[]).filter((tbl) => !IGNORED_TABLES.has(tbl)).sort())
            setStep('tables')
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err))
        } finally {
            setLoadingTables(false)
        }
    }

    const toggleTable = (table: string): void => {
        setSelectedTables((prev) => {
            const next = new Set(prev)
            if (next.has(table)) next.delete(table)
            else next.add(table)
            return next
        })
    }

    const toggleAll = (): void => {
        setSelectedTables((prev) => (prev.size === tables.length ? new Set() : new Set(tables)))
    }

    const handleCommit = async (): Promise<void> => {
        if (!basePath || selectedTables.size === 0) return
        setStep('committing')
        setError(null)
        try {
            const imported = await window.specData.importFromDb(
                basePath,
                connectionName,
                Array.from(selectedTables)
            )
            onImported?.(imported.map((e) => e.id))
            onOpenChange(false)
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err))
            setStep('preview')
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl sm:max-w-2xl md:max-w-3xl max-h-[80vh] flex flex-col overflow-hidden">
                <DialogHeader>
                    <DialogTitle>{t('import_from_db')}</DialogTitle>
                    <DialogDescription>{t('import_from_db_description')}</DialogDescription>
                </DialogHeader>

                {error && <p className="text-sm text-destructive px-1">{error}</p>}

                {step === 'connection' && (
                    <div className="space-y-2 py-2">
                        <div className="flex items-end justify-between gap-2">
                            <Label>{t('select_connection')}</Label>
                            <Button size="sm" variant="ghost" onClick={() => setNewConnOpen(true)}>
                                <Plus className="h-3.5 w-3.5 mr-1" />
                                {t('add_new_connection')}
                            </Button>
                        </div>
                        {loadingConnections ? (
                            <p className="text-xs text-muted-foreground">{t('loading')}</p>
                        ) : connectionOptions.length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                                {t('no_connections_configured')}
                            </p>
                        ) : (
                            <IGRPCombobox
                                value={connectionName}
                                onChange={(v) => void handlePickConnection(v as string)}
                                options={connectionOptions}
                                placeholder={t('select_connection')}
                                className="w-full"
                            />
                        )}
                        {loadingTables && (
                            <p className="text-xs text-muted-foreground">{t('loading_tables')}</p>
                        )}
                    </div>
                )}

                {step === 'tables' && (
                    <div className="space-y-2 py-2">
                        <div className="flex items-center justify-between">
                            <Label>
                                {t('tables_in_connection', { connection: connectionName })}
                            </Label>
                            <button
                                type="button"
                                onClick={toggleAll}
                                className="text-xs underline text-muted-foreground"
                            >
                                {selectedTables.size === tables.length
                                    ? t('select_none')
                                    : t('select_all')}
                            </button>
                        </div>
                        <ScrollArea className="h-[320px] border rounded p-2">
                            <ul className="space-y-1">
                                {tables.map((tbl) => (
                                    <li key={tbl}>
                                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                                            <Checkbox
                                                checked={selectedTables.has(tbl)}
                                                onCheckedChange={() => toggleTable(tbl)}
                                            />
                                            <span>{tbl}</span>
                                        </label>
                                    </li>
                                ))}
                            </ul>
                        </ScrollArea>
                        <p className="text-xs text-muted-foreground">
                            {t('tables_selected_count', { count: selectedTables.size })}
                        </p>
                    </div>
                )}

                {step === 'preview' && (
                    <div className="space-y-2 py-2 overflow-hidden flex-1 flex flex-col min-h-0">
                        <p className="text-sm">
                            {t('about_to_import', {
                                count: selectedTables.size,
                                connection: connectionName
                            })}
                        </p>
                        <ul className="text-xs text-muted-foreground list-disc pl-5 overflow-auto flex-1 min-h-0 border rounded p-2">
                            {Array.from(selectedTables).map((tbl) => (
                                <li key={tbl}>{tbl}</li>
                            ))}
                        </ul>
                        <p className="text-xs text-muted-foreground italic">
                            {t('reimport_smart_merge_note')}
                        </p>
                    </div>
                )}

                {step === 'committing' && <p className="py-4 text-sm">{t('importing')}</p>}

                <DialogFooter>
                    {step !== 'connection' && step !== 'committing' && (
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setStep(step === 'preview' ? 'tables' : 'connection')}
                        >
                            {t('back')}
                        </Button>
                    )}
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => onOpenChange(false)}
                        disabled={step === 'committing'}
                    >
                        {t('cancel')}
                    </Button>
                    {step === 'tables' && (
                        <Button
                            type="button"
                            onClick={() => setStep('preview')}
                            disabled={selectedTables.size === 0}
                        >
                            {t('next')}
                        </Button>
                    )}
                    {step === 'preview' && (
                        <Button type="button" onClick={handleCommit}>
                            {t('import')}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>

            {/* Inline "create connection" — saves via the global connection
                IPC, refreshes the list, then auto-selects the new entry. */}
            <Dialog open={newConnOpen} onOpenChange={setNewConnOpen}>
                <DialogContent className="max-w-2xl sm:max-w-2xl md:max-w-3xl max-h-[85vh] overflow-auto">
                    <DialogHeader>
                        <DialogTitle>{t('add_new_connection')}</DialogTitle>
                        <DialogDescription>{t('fill_details_to_add_connection')}</DialogDescription>
                    </DialogHeader>
                    <ConnectionForm
                        connection={EMPTY_CONNECTION}
                        onSubmit={async (values: Connection) => {
                            await window.igrpStudio.connection.save(values)
                            setNewConnOpen(false)
                            await refreshConnections()
                            // Auto-pick + advance: the user came here to import.
                            void handlePickConnection(values.name)
                        }}
                        onCancel={() => setNewConnOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </Dialog>
    )
}
