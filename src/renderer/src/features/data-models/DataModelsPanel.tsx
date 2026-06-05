import { Button } from '@renderer/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import { Database } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DataChatPanel } from './chat/DataChatPanel'
import { ReactFlowERD } from './diagram/ReactFlowERD'
import { EntityEditor } from './editor/EntityEditor'
import { EntityFormModal } from './editor/EntityFormModal'
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
    const [newEntityOpen, setNewEntityOpen] = useState(false)
    const [view, setView] = useState<'entities' | 'erd'>('erd')

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
        <div className="flex h-full bg-background">
            {/* Chat aside — uses `bg-sidebar` to match the Prototype panel and
                the Specification rail's secondary panels. Without an explicit
                token here the aside inherits from `<body>`, which falls back
                to a near-white surface in dark mode. */}
            <aside className="w-[360px] border-r flex flex-col bg-sidebar">
                <DataChatPanel
                    basePath={basePath}
                    activeDoc={activeDoc}
                    activeKbRefs={activeKbRefs}
                    className="flex-1"
                />
            </aside>
            <main className="flex-1 flex flex-col min-w-0 bg-background">
                <Tabs
                    value={view}
                    onValueChange={(v) => setView(v as 'entities' | 'erd')}
                    className="flex-1 flex flex-col"
                >
                    <div className="flex items-center justify-between border-b px-3 py-1.5">
                        <TabsList>
                            <TabsTrigger value="erd">{t('erd')}</TabsTrigger>
                            <TabsTrigger value="entities">{t('entities')}</TabsTrigger>
                        </TabsList>
                        <Button size="sm" variant="ghost" onClick={() => setImportOpen(true)}>
                            <Database className="h-4 w-4 mr-1" />
                            {t('import_from_db')}
                        </Button>
                    </div>
                    <TabsContent value="entities" className="flex-1 flex min-h-0">
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
                    </TabsContent>
                    <TabsContent value="erd" className="flex-1 min-h-0">
                        <ReactFlowERD
                            basePath={basePath}
                            onEntityClick={(id) => {
                                setSelectedId(id)
                                setView('entities')
                            }}
                            onNewEntity={() => setNewEntityOpen(true)}
                        />
                    </TabsContent>
                </Tabs>
            </main>
            <ImportFromDbWizard
                open={importOpen}
                onOpenChange={setImportOpen}
                basePath={basePath}
                onImported={(ids) => {
                    if (ids.length > 0) setSelectedId(ids[0])
                }}
            />
            <EntityFormModal
                open={newEntityOpen}
                onOpenChange={setNewEntityOpen}
                onSubmit={async (input) => {
                    const created = await window.specData.create(basePath, input)
                    setSelectedId(created.id)
                    setView('entities')
                }}
            />
        </div>
    )
}
