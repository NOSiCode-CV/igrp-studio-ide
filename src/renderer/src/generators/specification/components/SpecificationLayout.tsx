import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@renderer/components/ui/sidebar'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from '@renderer/components/ui/tooltip'
import { TabProvider } from '@renderer/components/navigation/TabContext'
import { DataModelsPanel } from '@renderer/features/data-models'
import { cn } from '@renderer/lib/utils'
import { loadDocs } from '@renderer/redux/specDocs/thunks'
import { loadKB } from '@renderer/redux/specKB/thunks'
import { ROUTES } from '@renderer/routes/routeConstants'
import { Database, FileText, Home, Library, Sparkles, Workflow } from 'lucide-react'
import { useEffect, type JSX } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { ProcessesSelectionProvider } from '../../../features/bpmn/components/ProcessesSelection'
import { useSpecification } from '../contexts/SpecificationContext'
import type { SpecificationTab } from '../types'
import DocumentsPanel from './DocumentsPanel'
import KnowledgeBasePanel from './KnowledgeBasePanel'
import ProcessesPanel from './ProcessesPanel'
import PrototypePanel from './PrototypePanel'

interface SpecificationLayoutProps {
    basePath?: string
    currentItem?: any
}

interface RailItem {
    id: SpecificationTab
    label: string
    icon: typeof FileText
}

// Ordered to match the data flow: KB feeds Documents, Documents feed Prototype,
// Processes lives next to the rest of the spec authoring surface.
const RAIL_ITEMS: RailItem[] = [
    { id: 'knowledge-base', label: 'Knowledge', icon: Library },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'data', label: 'Data', icon: Database },
    { id: 'prototype', label: 'Prototype', icon: Sparkles },
    { id: 'processes', label: 'Processes', icon: Workflow }
]

const RailButton = ({
    item,
    active,
    onClick
}: {
    item: RailItem
    active: boolean
    onClick: () => void
}): JSX.Element => {
    const Icon = item.icon
    // Use shadcn `Tooltip` instead of the native `title` attribute — the
    // native one renders an OS-level light tooltip that ignores the app
    // theme (always white on macOS), breaking the dark-mode chrome.
    return (
        <TooltipProvider delayDuration={300}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        onClick={onClick}
                        className={cn(
                            'flex flex-col items-center justify-center gap-1 rounded-lg py-2 text-xs font-medium transition-colors',
                            'hover:bg-accent',
                            active ? 'text-primary' : 'text-muted-foreground'
                        )}
                    >
                        <Icon className="h-5 w-5" />
                        <span className="w-16 truncate text-center text-ellipsis">
                            {item.label}
                        </span>
                    </button>
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

const SecondaryPanel = ({
    activeTab,
    basePath,
    currentItem
}: {
    activeTab: SpecificationTab
    basePath?: string
    currentItem?: any
}): JSX.Element => {
    const title =
        activeTab === 'documents'
            ? 'Documents'
            : activeTab === 'knowledge-base'
              ? 'Knowledge Base'
              : activeTab === 'processes'
                ? 'Processes'
                : 'Prototype'

    return (
        <aside className="flex w-[320px] flex-col border-r bg-sidebar">
            <header className="flex h-12 shrink-0 items-center justify-between border-b px-4">
                <h2 className="text-sm font-semibold">{title}</h2>
            </header>
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'documents' && (
                    <DocumentsPanel basePath={basePath} currentItem={currentItem} variant="list" />
                )}
                {activeTab === 'knowledge-base' && (
                    <KnowledgeBasePanel
                        basePath={basePath}
                        currentItem={currentItem}
                        variant="list"
                    />
                )}
                {activeTab === 'prototype' && (
                    <PrototypePanel basePath={basePath} currentItem={currentItem} variant="list" />
                )}
                {activeTab === 'processes' && (
                    <ProcessesPanel basePath={basePath} currentItem={currentItem} variant="list" />
                )}
            </div>
        </aside>
    )
}

const MainContent = ({
    activeTab,
    basePath,
    currentItem
}: {
    activeTab: SpecificationTab
    basePath?: string
    currentItem?: any
}): JSX.Element => {
    return (
        <main className="flex-1 overflow-hidden">
            {activeTab === 'documents' && (
                <DocumentsPanel basePath={basePath} currentItem={currentItem} variant="content" />
            )}
            {activeTab === 'knowledge-base' && (
                <KnowledgeBasePanel
                    basePath={basePath}
                    currentItem={currentItem}
                    variant="content"
                />
            )}
            {activeTab === 'prototype' && (
                <PrototypePanel basePath={basePath} currentItem={currentItem} variant="content" />
            )}
            {activeTab === 'processes' && (
                <ProcessesPanel basePath={basePath} currentItem={currentItem} variant="content" />
            )}
            {activeTab === 'data' && basePath && <DataModelsPanel basePath={basePath} />}
        </main>
    )
}

const SpecificationLayout = ({ basePath, currentItem }: SpecificationLayoutProps): JSX.Element => {
    const { activeTab, setActiveTab } = useSpecification()
    const navigate = useNavigate()
    const dispatch = useDispatch<any>()

    // Eagerly load KB + docs so every tab (Documents, Prototype) has them in
    // store on first render — avoids the "no KB items" surprise when the user
    // never visits the KB tab.
    useEffect(() => {
        if (!basePath) return
        dispatch(loadKB(basePath))
        dispatch(loadDocs(basePath))
    }, [basePath, dispatch])

    return (
        <ProcessesSelectionProvider>
            <TabProvider>
                <div className="flex h-full w-full pb-8">
                    {/* Icon rail — same 80px width as the Studio's main sidebar
                (`app-sidebar.tsx`), so the two layouts look continuous when the
                user navigates between generators. */}
                    <aside className="flex w-20 shrink-0 flex-col items-stretch gap-2 border-r bg-sidebar p-2">
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    size="lg"
                                    asChild
                                    className="md:h-8 md:p-0 items-center justify-center"
                                >
                                    <a
                                        href={ROUTES.HOME}
                                        onClick={(e) => {
                                            e.preventDefault()
                                            navigate(ROUTES.HOME)
                                        }}
                                    >
                                        <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                            <Home className="size-4" />
                                        </div>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>

                        <div className="my-1 h-px bg-border" />

                        {RAIL_ITEMS.map((item) => (
                            <RailButton
                                key={item.id}
                                item={item}
                                active={activeTab === item.id}
                                onClick={() => setActiveTab(item.id)}
                            />
                        ))}
                    </aside>

                    {/* Secondary panel — hidden for tabs that own their own multi-pane
                layout (Prototype, Data). */}
                    {activeTab !== 'prototype' && activeTab !== 'data' && (
                        <SecondaryPanel
                            activeTab={activeTab}
                            basePath={basePath}
                            currentItem={currentItem}
                        />
                    )}

                    {/* Main content */}
                    <MainContent
                        activeTab={activeTab}
                        basePath={basePath}
                        currentItem={currentItem}
                    />
                </div>
            </TabProvider>
        </ProcessesSelectionProvider>
    )
}

export default SpecificationLayout
