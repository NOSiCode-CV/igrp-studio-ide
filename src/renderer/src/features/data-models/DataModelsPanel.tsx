import {
    IGRPButtonPrimitive,
    IGRPTabsContentPrimitive,
    IGRPTabsListPrimitive,
    IGRPTabsPrimitive,
    IGRPTabsTriggerPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { Database } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DataChatPanel } from './chat/DataChatPanel'
import { ProjectERDCanvas } from './diagram/ProjectERDCanvas'
import { EntityEditor } from './editor/EntityEditor'
import { EntityList } from './editor/EntityList'
import { ImportFromDbWizard } from './import/ImportFromDbWizard'

interface DataModelsPanelProps {
    basePath: string
    /** Optional: an active doc surfaces entities → doc context cross-link. */
    activeDoc?: { name: string; content: string } | null
    /** Optional: linked KB items for RAG. */
    activeKbRefs?: string[]
}

/**
 * Top-level shell for the Specification rail's `data` tab.
 *
 * Layout: chat-left (360px) + main-right (Entities | ERD). Mirrors the
 * Prototype panel's split. Wire-up into the Specification rail itself
 * (adding the rail item) is deferred — that change touches
 * `SpecificationLayout.tsx` which is currently being modified by the BPMN
 * integration session.
 */
export function DataModelsPanel({
    basePath,
    activeDoc,
    activeKbRefs
}: DataModelsPanelProps): React.ReactNode {
    const { t } = useTranslation()
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [importOpen, setImportOpen] = useState(false)
    const [view, setView] = useState<'entities' | 'erd'>('entities')

    // Cmd/Ctrl+I → open import wizard. Cmd/Ctrl+S is intentionally NOT
    // intercepted: autosave runs continuously already, and the host shell
    // owns the global save shortcut for active editors.
    useEffect(() => {
        const handler = (e: KeyboardEvent): void => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i') {
                e.preventDefault()
                setImportOpen(true)
            }
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [])

    return (
        <div className="flex h-full">
            <aside className="w-[360px] border-r flex flex-col">
                <DataChatPanel
                    basePath={basePath}
                    activeDoc={activeDoc}
                    activeKbRefs={activeKbRefs}
                    className="flex-1"
                />
            </aside>
            <main className="flex-1 flex flex-col min-w-0">
                <IGRPTabsPrimitive
                    value={view}
                    onValueChange={(v) => setView(v as 'entities' | 'erd')}
                    className="flex-1 flex flex-col"
                >
                    <div className="flex items-center justify-between border-b px-3 py-1.5">
                        <IGRPTabsListPrimitive>
                            <IGRPTabsTriggerPrimitive value="entities">
                                {t('entities')}
                            </IGRPTabsTriggerPrimitive>
                            <IGRPTabsTriggerPrimitive value="erd">
                                {t('erd')}
                            </IGRPTabsTriggerPrimitive>
                        </IGRPTabsListPrimitive>
                        <IGRPButtonPrimitive
                            size="sm"
                            variant="ghost"
                            onClick={() => setImportOpen(true)}
                        >
                            <Database className="h-4 w-4 mr-1" />
                            {t('import_from_db')}
                        </IGRPButtonPrimitive>
                    </div>
                    <IGRPTabsContentPrimitive
                        value="entities"
                        className="flex-1 flex min-h-0"
                    >
                        <div className="w-[260px] border-r overflow-hidden">
                            <EntityList
                                basePath={basePath}
                                selectedId={selectedId}
                                onSelect={setSelectedId}
                                onImportFromDb={() => setImportOpen(true)}
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            {selectedId ? (
                                <EntityEditor
                                    basePath={basePath}
                                    entityId={selectedId}
                                    onDeleted={() => setSelectedId(null)}
                                />
                            ) : (
                                <div className="h-full flex items-center justify-center text-sm text-muted-foreground p-6 text-center">
                                    {t('select_or_create_entity')}
                                </div>
                            )}
                        </div>
                    </IGRPTabsContentPrimitive>
                    <IGRPTabsContentPrimitive
                        value="erd"
                        className="flex-1 min-h-0"
                    >
                        <ProjectERDCanvas
                            basePath={basePath}
                            onEntityClick={(id) => {
                                setSelectedId(id)
                                setView('entities')
                            }}
                            onImportFromDb={() => setImportOpen(true)}
                        />
                    </IGRPTabsContentPrimitive>
                </IGRPTabsPrimitive>
            </main>
            <ImportFromDbWizard
                open={importOpen}
                onOpenChange={setImportOpen}
                basePath={basePath}
                onImported={(ids) => {
                    if (ids.length > 0) setSelectedId(ids[0])
                }}
            />
        </div>
    )
}
