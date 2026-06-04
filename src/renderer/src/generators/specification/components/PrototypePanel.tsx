import MonacoEditor, { DiffEditor } from '@monaco-editor/react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { cn } from '@renderer/lib/utils'
import type { RootState } from '@renderer/redux'
import {
    protoTurnApplied,
    protoTurnCommitted,
    protoTurnFailed,
    protoTurnFinished,
    protoTurnParseError,
    protoTurnStarted,
    type FileChangeKind,
    type PrototypeFile,
    type PrototypeLog,
    type PrototypeSnapshot
} from '@renderer/redux/specPrototype/reducer'
import {
    loadPrototypeFiles,
    loadPrototypeSnapshots,
    openPrototypeFile,
    refreshDevStatus,
    restorePrototypeSnapshot,
    startPrototypeDev,
    stopPrototypeDev
} from '@renderer/redux/specPrototype/thunks'
import { loadManifest } from '@renderer/redux/specPrototypeManifest/thunks'
import { selectDocNodes, selectSelectedDocId } from '@renderer/redux/specDocs/reducer'
import {
    AlertCircle,
    Bug,
    CheckCircle2,
    ChevronDown,
    Copy,
    Download,
    Edit3,
    ExternalLink,
    FileCode,
    FolderOpen,
    History,
    Layout as LayoutIcon,
    LayoutGrid,
    Library,
    Loader2,
    MessageSquare,
    Monitor,
    MoveHorizontal,
    Pause,
    Play,
    RefreshCw,
    RotateCcw,
    Search,
    Smartphone,
    Tablet,
    Terminal,
    Trash2
} from 'lucide-react'
import {
    type CSSProperties,
    type JSX,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState
} from 'react'
import { useDispatch, useSelector, useStore } from 'react-redux'
import { Group, Panel, Separator } from 'react-resizable-panels'
import { AIAssistant, type ChatAttachment } from './shared/AIAssistant'
import { EditCanvas } from './prototype/EditCanvas'
import { DocAttachPicker } from '@renderer/features/spec-attachments'
import {
    PaletteComponentCard,
    readPersistedComponentIds,
    writePersistedComponentIds,
    useEnginePalette,
    type EnginePaletteComponent
} from '@renderer/features/component-palette'
import { useEngineCatalog } from '@renderer/features/engine-catalog'
import {
    usePrototypeSkills,
    type InstalledSkillSummary,
    type SkillUpdateSummary
} from '../hooks/usePrototypeSkills'
import { GOLDEN_LIST_PAGE_EXAMPLE } from './prototype/ai-prompts/golden-list-example'
import { buildEngineCatalogBlock } from './prototype/ai-prompts/engine-catalog'
import { buildSkillContextBlock } from './prototype/ai-prompts/skill-context'
import { buildTree, type TreeNode } from './prototype/files/file-tree'
import { languageFromExt, monacoOptions } from './prototype/files/monaco-config'
import { computePreviewUrl } from './prototype/preview/url'
import {
    readPersistedAttachedIds,
    writePersistedAttachedIds
} from './prototype/persistence/attached-ids'
import {
    MIN_CHAT_WIDTH,
    readPersistedChatWidth,
    writePersistedChatWidth
} from './prototype/persistence/chat-width'
import {
    MAX_CUSTOM_VIEWPORT,
    MIN_CUSTOM_VIEWPORT,
    readPersistedCustomViewport,
    writePersistedCustomViewport
} from './prototype/persistence/custom-viewport'
import {
    CANONICAL_SKILL,
    SKILL_BANNER_DISMISS_KEY_PREFIX,
    SKILL_UPDATE_DISMISS_KEY_PREFIX
} from './prototype/persistence/skill-banner-dismiss'

interface PanelProps {
    basePath?: string
    currentItem?: any
    variant?: 'list' | 'content'
}

type DeviceFrame = 'desktop' | 'tablet' | 'mobile' | 'custom'

/**
 * Preview tab has two interaction modes — runtime preview (next dev served
 * inside the webview) and the edit canvas (low-fi wireframe of the manifest
 * tree, mutated locally and re-applied via `engine.createPage`). The toggle
 * lives in the PreviewToolbar so both modes share the same surface.
 */
type PreviewMode = 'live' | 'edit'
type PrototypeTab = 'preview' | 'files' | 'logs' | 'history'

const TABS: { id: PrototypeTab; label: string }[] = [
    { id: 'preview', label: 'Preview' },
    { id: 'files', label: 'Files' },
    { id: 'logs', label: 'Logs' },
    { id: 'history', label: 'History' }
]

type ChatPanelMode = 'chat' | 'palette'

// Persistence helpers moved to `./prototype/persistence/{chat-width,
// attached-ids,custom-viewport,skill-banner-dismiss}.ts` (P1).

// Pinned palette components (M4.28) live in `features/component-palette` so
// the persistence shape can be reused by future generators that want their
// own pinned-component vocabulary. We pass `namespace: 'prototype'` here.
const PALETTE_NAMESPACE = { namespace: 'prototype' as const }

// M6.1 — engine-catalog block builder for the manifest-first system prompt.
//
// The full engine catalog can be ~100 components × dozens of properties each
// — too large to inline in every chat turn. We pick a curated set of
// always-included "structural" components (containers, common form fields,
// headlines) plus whatever the user pinned via the palette. Property names
// are listed but not their value schemas; the LLM has enough signal from
// labels + property keys + the spec context to produce a valid manifest.

// `computePreviewUrl` moved to `./prototype/preview/url.ts` (P2).
// M7 golden anatomy + M6.1 always-included component list moved to
// `./prototype/ai-prompts/{golden-list-example,always-included}.ts` (P1).

// `buildSkillContextBlock` moved to `./prototype/ai-prompts/skill-context.ts` (P2).
// `buildEngineCatalogBlock` moved to `./prototype/ai-prompts/engine-catalog.ts` (P2).

// Custom viewport width (M4.19) moved to
// `./prototype/persistence/custom-viewport.ts` (P1).

// ─── List variant — placeholder; the rail hides the secondary panel here. ─

const ListVariant = (): JSX.Element => (
    <div className="flex flex-col gap-3 p-3 text-xs text-muted-foreground">
        Prototype builder is opened in the main area.
    </div>
)

// ─── Content variant ──────────────────────────────────────────────────────

const ContentVariant = ({ basePath }: PanelProps): JSX.Element => {
    const dispatch = useDispatch<any>()
    const store = useStore<RootState>()
    const docs = useSelector(selectDocNodes)
    const selectedId = useSelector(selectSelectedDocId)
    const kbItems = useSelector((s: RootState) => s.specKB.items)
    const devStatus = useSelector((s: RootState) => s.specPrototype.devStatus)
    const lastTurnId = useSelector((s: RootState) => s.specPrototype.lastTurnId)
    const turns = useSelector((s: RootState) => s.specPrototype.turns)
    // Engine component catalog — same source the UI generator uses. We read
    // it here so the chat-level chip rendering and the system-prompt
    // "UI components to use" section reference the live catalog rather than
    // a stale static list. Trigger the fetch eagerly so pinned chips render
    // correctly even before the user opens the Palette tab.
    const { componentsRegistered, loadRegistryComponent } = useEngineCatalog()
    useEffect(() => {
        if (componentsRegistered.length === 0) {
            void loadRegistryComponent()
        }
    }, [componentsRegistered.length, loadRegistryComponent])

    // M-Skill — installed skill discovery + companion file IO. Used by
    // `contextProvider` to inject relevant skill sections into the system
    // prompt at turn time. Ref'd via mutable refs so the closure that
    // `useCallback(contextProvider)` captures always sees the latest data
    // without forcing the callback to re-create on every skill refresh.
    const skillsCtx = usePrototypeSkills(basePath)
    const skillsRef = useRef(skillsCtx.skills)
    const readCompanionSectionRef = useRef(skillsCtx.readCompanionSection)
    useEffect(() => {
        skillsRef.current = skillsCtx.skills
        readCompanionSectionRef.current = skillsCtx.readCompanionSection
    }, [skillsCtx.skills, skillsCtx.readCompanionSection])

    const [activeTab, setActiveTab] = useState<PrototypeTab>('preview')
    const [device, setDevice] = useState<DeviceFrame>('desktop')
    const [previewMode, setPreviewMode] = useState<PreviewMode>('live')
    const [customWidth, setCustomWidth] = useState<number>(() => readPersistedCustomViewport())
    const handleChangeCustomWidth = useCallback((next: number) => {
        const clamped = Math.max(MIN_CUSTOM_VIEWPORT, Math.min(MAX_CUSTOM_VIEWPORT, next))
        setCustomWidth(clamped)
        writePersistedCustomViewport(clamped)
    }, [])

    // Spec attachments — explicit picker drives chat context (M4.29).
    // No more implicit "active doc" path. Persisted per-project.
    const [attachedDocIds, setAttachedDocIds] = useState<string[]>(() =>
        readPersistedAttachedIds(basePath)
    )

    // Component palette pins (M4.28) — same shape as spec attachments.
    const [chatPanelMode, setChatPanelMode] = useState<ChatPanelMode>('chat')
    const [attachedComponentIds, setAttachedComponentIds] = useState<string[]>(() =>
        readPersistedComponentIds(basePath, PALETTE_NAMESPACE)
    )

    // Persist any change to component pins.
    useEffect(() => {
        writePersistedComponentIds(basePath, attachedComponentIds, PALETTE_NAMESPACE)
    }, [attachedComponentIds, basePath])

    const toggleAttachedComponent = useCallback((id: string) => {
        setAttachedComponentIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        )
    }, [])

    const removeAttachedComponent = useCallback((id: string) => {
        setAttachedComponentIds((prev) => prev.filter((x) => x !== id))
    }, [])

    // Resolve pinned ids against the live engine palette. Anything not in the
    // current catalog gets dropped — handles stale persisted ids from an
    // earlier static-catalog session. The lookup also keeps the chip name
    // and group label in sync with whatever the engine reports now.
    const enginePalette = useEnginePalette(componentsRegistered)
    const enginePaletteById = useMemo(() => {
        const map = new Map<string, EnginePaletteComponent>()
        for (const item of enginePalette.all) map.set(item.id, item)
        return map
    }, [enginePalette.all])

    const attachedComponents = useMemo<EnginePaletteComponent[]>(
        () =>
            attachedComponentIds
                .map((id) => enginePaletteById.get(id))
                .filter((c): c is EnginePaletteComponent => Boolean(c)),
        [attachedComponentIds, enginePaletteById]
    )

    const lastTurn = lastTurnId ? turns[lastTurnId] : null

    // Auto-seed once per (basePath, nodes-arrived). If the user has nothing
    // saved AND there's a doc currently selected in the Documents rail, use
    // it as a hint — but they remain free to remove it. We guard with a ref
    // so re-renders don't re-seed after the user explicitly empties the list.
    const seededRef = useRef(false)
    useEffect(() => {
        if (seededRef.current) return
        if (!basePath) return
        if (docs.length === 0) return
        seededRef.current = true
        const persisted = readPersistedAttachedIds(basePath)
        const validPersisted = persisted.filter((id) => docs.some((d) => d.id === id))
        if (validPersisted.length > 0) {
            setAttachedDocIds(validPersisted)
            return
        }
        if (selectedId && docs.some((d) => d.id === selectedId)) {
            setAttachedDocIds([selectedId])
        }
    }, [basePath, docs, selectedId])

    // Persist any change to attached ids.
    useEffect(() => {
        writePersistedAttachedIds(basePath, attachedDocIds)
    }, [attachedDocIds, basePath])

    // Auto-clean orphans (attached doc was deleted from disk).
    useEffect(() => {
        const validIds = new Set(docs.map((n) => n.id))
        setAttachedDocIds((prev) => {
            const next = prev.filter((id) => validIds.has(id))
            return next.length === prev.length ? prev : next
        })
    }, [docs])

    const toggleAttachedDoc = useCallback((id: string) => {
        setAttachedDocIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        )
    }, [])

    const removeAttachedDoc = useCallback((id: string) => {
        setAttachedDocIds((prev) => prev.filter((x) => x !== id))
    }, [])

    const chatAttachments = useMemo<ChatAttachment[]>(() => {
        const out: ChatAttachment[] = []
        for (const id of attachedDocIds) {
            const ref = docs.find((n) => n.id === id)
            if (!ref) continue
            const dirty = Boolean(store.getState().specDocs.byDoc[id]?.dirty)
            out.push({ id: `doc:${id}`, name: ref.name, kind: 'doc', dirty })
        }
        for (const comp of attachedComponents) {
            out.push({ id: `comp:${comp.id}`, name: comp.name, kind: 'component' })
        }
        return out
        // store is a stable ref — read inside; recompute when ids/docs change.
    }, [attachedDocIds, attachedComponents, docs, store])

    // Single removal entry-point — chips don't know whether they back a doc
    // or a palette component, so we route by the `kind:` prefix we encoded
    // when building the chip list above.
    const handleRemoveAttachment = useCallback(
        (chipId: string) => {
            if (chipId.startsWith('doc:')) {
                removeAttachedDoc(chipId.slice(4))
            } else if (chipId.startsWith('comp:')) {
                removeAttachedComponent(chipId.slice(5))
            }
        },
        [removeAttachedDoc, removeAttachedComponent]
    )

    const estimateAttachmentTokens = useCallback(
        (id: string): number | null => {
            const buf = store.getState().specDocs.byDoc[id]?.buffer
            if (typeof buf !== 'string') return null
            return Math.ceil(buf.length / 4)
        },
        [store]
    )

    // Chat width — resizable left pane (M4.30). Persisted globally.
    const [chatWidth, setChatWidth] = useState<number>(() => readPersistedChatWidth())
    const onResizeChat = useCallback((size: { inPixels: number }) => {
        if (size.inPixels >= MIN_CHAT_WIDTH) {
            setChatWidth(size.inPixels)
            writePersistedChatWidth(size.inPixels)
        }
    }, [])

    // Initial loads when basePath becomes available.
    useEffect(() => {
        if (!basePath) return
        dispatch(loadPrototypeFiles(basePath))
        dispatch(refreshDevStatus(basePath))
        dispatch(loadPrototypeSnapshots(basePath))
    }, [basePath, dispatch])

    // Lazy-start dev server the first time the user opens the Preview tab.
    const devStartedRef = useRef(false)
    useEffect(() => {
        if (!basePath || activeTab !== 'preview' || devStartedRef.current) return
        if (devStatus.running) {
            devStartedRef.current = true
            return
        }
        devStartedRef.current = true
        dispatch(startPrototypeDev(basePath))
    }, [activeTab, basePath, devStatus.running, dispatch])

    // First-run UX (M4.18) — when `npm install` starts (`installing` flips
    // false→true), auto-switch to the Logs tab so the user sees the live
    // download progress instead of a frozen Preview placeholder. Only on
    // the rising edge: if the user navigates away while installing, we
    // don't snap them back.
    const wasInstallingRef = useRef(false)
    useEffect(() => {
        if (devStatus.installing && !wasInstallingRef.current) {
            wasInstallingRef.current = true
            setActiveTab('logs')
        } else if (!devStatus.installing) {
            wasInstallingRef.current = false
        }
    }, [devStatus.installing])

    // Tree refresh + preview navigation when the main process reports a
    // turn finished. The engine writes to `app/pages/<pageName>/page.tsx`
    // which Next.js routes at `/pages/<pageName>` — but the webview is
    // probably still pointing at `/`. We pull the freshly-written manifest
    // and navigate the webview to the new route so the user sees their
    // generated page without manual URL fiddling.
    useEffect(() => {
        if (!basePath) return
        const off = window.specPrototype.onTreeChanged(async (payload) => {
            if (payload.basePath !== basePath) return
            dispatch(loadPrototypeFiles(basePath))
            dispatch(loadPrototypeSnapshots(basePath))
            const manifest = await dispatch(loadManifest(basePath))
            const view = document.querySelector('webview.spec-prototype-preview') as {
                reload?: () => void
                loadURL?: (url: string) => void
                getURL?: () => string
            } | null
            if (!view) return
            const targetUrl = computePreviewUrl(devStatus.url, manifest)
            if (targetUrl && view.loadURL && view.getURL?.() !== targetUrl) {
                view.loadURL(targetUrl)
            } else {
                view.reload?.()
            }
        })
        return off
    }, [basePath, dispatch, devStatus.url])

    const contextProvider = useCallback(
        async ({ userMessage, useKB }: { userMessage: string; useKB: boolean }) => {
            void userMessage

            // ─── Read attached specs (buffer-first, IPC fallback) ───────
            const storeState = store.getState()
            const attachedSections: string[] = []
            for (const id of attachedDocIds) {
                const refNode = docs.find((n) => n.id === id)
                if (!refNode) continue
                const liveBuffer = storeState.specDocs.byDoc[id]?.buffer
                const dirty = Boolean(storeState.specDocs.byDoc[id]?.dirty)
                let content = liveBuffer
                if (typeof content !== 'string') {
                    try {
                        if (basePath) {
                            const result = await window.specDoc.read(basePath, id)
                            content = result?.content ?? ''
                        }
                    } catch {
                        content = ''
                    }
                }
                const tag = dirty ? ' (unsaved buffer)' : ''
                attachedSections.push(
                    `### Spec: ${refNode.name}${tag}\n\n\`\`\`markdown\n${content ?? ''}\n\`\`\``
                )
            }

            // KB items: union of kbRefs across all attached specs.
            const linkedKbIds = new Set<string>()
            for (const id of attachedDocIds) {
                const ref = docs.find((n) => n.id === id)
                ref?.kbRefs?.forEach((kbId) => linkedKbIds.add(kbId))
            }
            const linkedKb = kbItems.filter((k) => linkedKbIds.has(k.id))

            const sections: string[] = []

            // M6.1 — manifest-first prompt. The LLM emits a `PageConfig` JSON
            // (StructuredComponent tree) that the host validates and feeds to
            // `window.engine.createPage(config, 'nextjs', join(basePath, 'prototype'))`,
            // which is the same engine entry point the Page Builder uses on
            // Save. Removes the file-ops path entirely — no LLM-generated TSX,
            // no env vars, no auth providers, no lockfile drift. The engine
            // package owns the compile-to-code step.
            const catalogBlock = buildEngineCatalogBlock(componentsRegistered, attachedComponents)

            // M-Skill Fase 1/3 — when the `igrp-studio-metadata` skill is
            // installed, pull the most relevant companion sections into the
            // prompt instead of relying solely on the embedded golden example.
            // The skill corpus is richer (full patterns / catalog / process
            // steps / troubleshooting) and updated independently of Studio
            // builds via `igrp skill update`.
            const skillBlock = await buildSkillContextBlock(
                userMessage,
                skillsRef.current,
                readCompanionSectionRef.current
            )

            sections.push(
                [
                    'You are the Prototype Builder of an IGRP Studio "Specification" project. You translate the attached spec(s) into a **PageConfig JSON manifest** that the IGRP Next.js engine compiles into a working page. **You do not write TSX or any code yourself** — you describe the page declaratively in JSON and the engine handles the rest.',
                    '',
                    '## Output contract — STRICT',
                    '',
                    'Reply with **exactly one** fenced JSON block whose body is a single `PageConfig` object. Nothing before, nothing after. No prose, no explanations. The host parses the block, validates it, and feeds it to `engine.createPage(...)`.',
                    '',
                    '```json',
                    '{ /* PageConfig — see anatomy below */ }',
                    '```',
                    '',
                    'If the user asks a question (e.g. "what components are available?"), reply in prose **outside** any fenced block — no JSON gets applied.',
                    '',
                    '## PageConfig anatomy — STRICT (engine-validated)',
                    '',
                    '### Top-level fields',
                    '```ts',
                    'interface PageConfig {',
                    '  type: "page"                       // literal "page"',
                    '  pageName: string                   // identifier — alphanumeric + dash/underscore, leading letter (e.g. "contribuintes", "abrirCaixa")',
                    '  path: string                       // Next.js route segments WITHOUT leading slash — examples below',
                    '  description?: string               // human-readable subtitle',
                    '  forceDynamic?: boolean             // false unless the spec needs `export const dynamic = "force-dynamic"`',
                    '  id: string                         // engine-internal id, kebab/camel mix (e.g. "page_contribuintes")',
                    '  args?: Array<{ id, name, type, isList, isOptional, isInterface, isFunction, isState }>',
                    '                                     // declare each `[uuid]` / `[id]` route segment here as a string arg',
                    '  parentName?: string                // when the page lives under another route, e.g. "caixaAtendedores"',
                    '  components: StructuredComponent    // SINGLE root, must be { componentName: "page", … }',
                    '  types: TypeDef[]                   // [] when no data shapes',
                    '  states: State[]                    // [] when no useState',
                    '  functions: CustomFunctionConfig[]  // [] when no page-level fns',
                    '  imports: Import[]                  // [] for engine-only deps',
                    '}',
                    '```',
                    '',
                    '### `path` — Next.js App Router segments, NO leading slash',
                    'Valid examples:',
                    '- `"contribuintes"` — simple route',
                    '- `"caixa/dias/[uuid]/atendedores/novo"` — dynamic `[uuid]` segment (declare as `args` entry)',
                    '- `"(parametrizacao)/categorias"` — route group `(parametrizacao)` for layout grouping',
                    '- `"users/[[...slug]]"` — optional catch-all (rare)',
                    '',
                    'INVALID:',
                    '- `"/contribuintes"` ❌ leading slash — engine regex rejects',
                    '- `"contribuintes/list"` when `list` is non-routable — pick `pageName: "contribuintesList", path: "contribuintes/list"`',
                    '',
                    '### `StructuredComponent` shape (every node)',
                    '```ts',
                    'interface StructuredComponent {',
                    '  id: string                                  // unique within page — short, role-hint, e.g. "section_main", "table_contribuintes"',
                    '  componentName: string                       // MUST be drawn from the catalog below',
                    '  tag: string                                 // short reference tag, used by other nodes (e.g. "section1", "pageHeader1", "totalGeral")',
                    '  label: string                               // human-readable, defaults to a Title Case form of componentName',
                    '  type?: "group" | "" | undefined             // "group" for containers; "" for table cells; omit otherwise',
                    '  allowTypes?: boolean                        // true ONLY on table containers (binds rows to a TypeDef)',
                    '  children: StructuredComponent[]             // [] for atoms (button, inputText, badge)',
                    '  interactions: Record<string, unknown>       // {} unless wired. Shape: { onClick: { type:"function", function:{ type:"function", fnCustomSet?, fnCustomCode? }, action?:{} } }',
                    '  data: Record<string, unknown>               // {} unless bound. Each binding key has shape { state?: {...}, value?: {...}, options?: {...} }',
                    '  properties: {                               // component-specific UI props. ALWAYS include `commonProperties`.',
                    '    commonProperties: { generateReference?: boolean } | {}',
                    '    [key: string]: any                        // className, content, title, variant, iconProperties, dataProperties, ...',
                    '  }',
                    '  childProperties?: Record<string, unknown>   // {} or { className: "..." } — props applied to children wrapper',
                    '  style?: { layout?: { type, flex?, grid?, block? } } // ONLY on flex / grid containers',
                    '  rules?: Array<{ type: "visibility", condition: "..." }> // conditional render based on state',
                    '  dataType?: string                           // ONLY on tables, references TypeDef.name',
                    '}',
                    '```',
                    '',
                    '## Rules — STRICT',
                    '',
                    '1. **No extra top-level fields.** The engine validates with `additionalProperties: false`. Only emit fields listed in the schema above.',
                    '2. **Root component MUST be `componentName: "page"`** with `properties.commonProperties = {}` (or `{ generateReference: false }`) and one or more `section` children.',
                    '3. **Every node needs `tag`** — short reference like `section1`, `pageHeader1`, `totalGeral`. NOT optional even when no other node references it.',
                    '4. **Every node needs `properties.commonProperties`** — `{}` or `{ generateReference: false }`. Empty object suffices; omitting fails validation.',
                    '5. **`interactions: {}` and `data: {}`** when not wired. They are NOT optional fields; emit empty objects.',
                    '6. **`componentName` MUST be drawn from the catalog below.** Inventing a name fails the build.',
                    "7. **Custom components from the user's project** (e.g. `Dashboard`, `LoadingPage`) are NOT in the catalog and MUST NOT be emitted in a fresh prototype. Compose from primitives instead.",
                    '8. **`path` without leading slash.** Use Next.js App Router segments. Declare `[uuid]`-style segments under `args`.',
                    '9. **`id` and `tag` MUST be unique** within the page tree. Short snake-case or camelCase. Examples: `page_root`, `section_main`, `pageheader_users`, `table_users`, `tabletextcell_name`.',
                    "10. **Use the spec's terminology verbatim** for `properties.title`, `properties.placeholder`, `properties.label`. Portuguese stays Portuguese.",
                    '11. **`types`, `states`, `functions`, `imports` default to `[]`** unless the spec mandates real state. Forms without a real backend = `[]` (engine still generates the form fine).',
                    '12. **The manifest is the handoff artifact — keep it clean.** Devs in other Studios will reuse this `page.json` and wire it to a real backend. For list/table pages, DO declare the `states` array (`tableData: Invoice[]`, defaultValue `"[]"`) AND the `data.data.state` binding on the table, BUT in `onLoad.fnCode` write **only a commented stub** pointing at the production hook — DO NOT inline mock arrays. The Studio runs a separate post-engine step to seed preview data into a sibling file; that step needs the binding to exist but reads the values from `<pageName>.mock.json`, not from the manifest.',
                    '13. **Never emit a component name that is not in the catalog.** When uncertain about an action component (e.g. an "view details" row action), use `tableLinkAction` inside a `tableActionListCell` — same shape as the golden anatomy. Inventing names like `tableActionView` produces an `Unsupported Component` placeholder in the generated code, which then crashes the runtime via `React.Children.only`.',
                    '14. **`pageHeader` without action button:** omit `children` entirely (or use `[]`) AND do NOT emit `properties.actions`/related action-slot props. When the header has nothing in the action slot, the engine wraps the empty children in `<div class="flex items-center gap-2"></div>` which is fine; problems arise when the LLM tries to invent action props or wraps phantom content.',
                    '',
                    // Prefer the skill-driven block when available; fall back
                    // to the inline golden anatomy when the skill isn't
                    // installed (Studio works either way).
                    skillBlock ||
                        [
                            '## Golden anatomy example (list page with header + filter + table)',
                            '',
                            "Reference for shape only — adapt to the user's spec. Every field shown is required at that nesting level.",
                            '',
                            '```json',
                            GOLDEN_LIST_PAGE_EXAMPLE,
                            '```'
                        ].join('\n'),
                    '',
                    '## List/table state shape — REQUIRED',
                    '',
                    'For every `<table>` (or list with `dataType`), emit these THREE pieces so the preview-seeding step can populate rows AND the dev gets a clean handoff:',
                    '',
                    '**A. One state per table** — array typed to the row type:',
                    '```json',
                    '"states": [',
                    '  { "id": "state_td", "name": "tableData", "type": "Invoice", "defaultValue": "[]", "imports": [], "isArray": true, "isOptional": false }',
                    ']',
                    '```',
                    '',
                    '**B. Bind the table to that state** — `data.data.state.name` matches the state `name`:',
                    '```json',
                    '"data": {',
                    '  "data": { "state": { "id": "", "name": "tableData", "type": "", "imports": [], "generate": false } }',
                    '}',
                    '```',
                    '',
                    '**C. `onLoad` with a COMMENTED hook stub** — show the dev where the real backend call goes. NEVER inline mock arrays here; the Studio writes a separate `<pageName>.mock.json` after generation. Example:',
                    '```json',
                    '"interactions": {',
                    '  "onLoad": {',
                    '    "type": "function",',
                    '    "function": {',
                    '      "type": "function",',
                    '      "fnCustomCode": { "imports": [] },',
                    '      "fnCode": "// Wire to the real backend in production:\\n// const { data } = useInvoicesQuery();\\n// useEffect(() => { if (data) setTableData(data) }, [data]);"',
                    '    },',
                    '    "action": {}',
                    '  }',
                    '}',
                    '```',
                    '',
                    'For stat tiles (`infoCard`/`statsCard` showing counts), declare matching number states (`totalCount`, `paidCount`, …) with `defaultValue: "0"`. The seeding step will compute them from the seeded `tableData` and emit `setTotalCount(seed.filter(...).length)`-style calls in the preview-only sibling.',
                    '',
                    'For non-list pages (forms, dashboards without tables), no special state shape is needed — the form will simply render empty fields and the seeding step is a no-op.',
                    '',
                    '## Document roles — STRICT',
                    '',
                    '- **Reference specifications** (`## Reference specifications`) — markdown docs the user pinned to this chat. Authoritative source material; preserve their terminology and structure.',
                    '- **Knowledge Base** (`## Knowledge Base context`) — external reference (PDFs, URLs). Lower authority than the specs.',
                    '',
                    'If no spec is attached, produce a minimal placeholder page with a single `pageHeader` inside `section` inside `page`, with title "Attach a spec to begin". Do NOT improvise a full app.',
                    '',
                    catalogBlock
                ].join('\n')
            )

            if (attachedSections.length > 0) {
                sections.push(
                    `## Reference specifications (${attachedSections.length})\n\n${attachedSections.join('\n\n')}`
                )
            } else {
                sections.push(
                    '## Reference specifications\n_None attached. Ask the user to attach a spec via the @Attach button before generating substantial code._'
                )
            }

            // M4.28 — palette-pinned components: directive-only injection.
            // We don't ship the LLM the full IGRP catalog; the model just gets
            // the component names + their engine group so it can map each to
            // a concrete shadcn/IGRP component. Group label gives enough
            // semantic hint (e.g. "Form Elements") without us authoring per-
            // component prose.
            if (attachedComponents.length > 0) {
                const lines = attachedComponents
                    .map((c) => `- **${c.name}** (${c.groupLabel}, id: \`${c.id}\`)`)
                    .join('\n')
                sections.push(
                    `## UI components to use (pinned by user)\nWhen generating UI, prefer these components as the primary building blocks; pick others only when these don't fit. Don't dump every pinned component on every page — use them where they earn their place.\n\n${lines}`
                )
            }

            // KB block — search only when the user explicitly enables KB and
            // there are linked items to scope the search by.
            if (useKB && linkedKb.length > 0 && userMessage.trim() && basePath) {
                try {
                    const hits = await window.specKB.search(basePath, userMessage, 6, {
                        kbItemIds: linkedKb.map((k) => k.id)
                    })
                    if (hits.length > 0) {
                        const lookup = new Map(linkedKb.map((k) => [k.id, k.name]))
                        const formatted = hits
                            .map((h, idx) => {
                                const ownerId = h.metadata?.kbItemId as string | undefined
                                const ownerName = ownerId
                                    ? (lookup.get(ownerId) ?? ownerId)
                                    : 'Unknown'
                                return `### Chunk ${idx + 1} · score ${h.score.toFixed(3)} · from "${ownerName}"\n\n${h.text}`
                            })
                            .join('\n\n---\n\n')
                        sections.push(
                            `## Knowledge Base context (top ${hits.length} chunks, retrieved from linked items)\n\n${formatted}`
                        )
                    }
                } catch {
                    // Swallow — search failure shouldn't block generation.
                }
            }

            if (linkedKb.length > 0) {
                const names = linkedKb.map((k) => `- ${k.name}`).join('\n')
                sections.push(`## Linked Knowledge Base items (${linkedKb.length})\n${names}`)
            }

            if (lastTurn?.summary) {
                sections.push(
                    `## Previous turn\n- ${lastTurn.summary}${lastTurn.sha ? ` (${lastTurn.sha.slice(0, 7)})` : ''}`
                )
            }

            // Label for the composer footer.
            let label: string
            if (attachedDocIds.length === 0) {
                label = 'No spec attached'
            } else if (attachedDocIds.length === 1) {
                const only = docs.find((d) => d.id === attachedDocIds[0])
                label = `Spec: ${only?.name ?? 'attached'}`
            } else {
                label = `${attachedDocIds.length} specs attached`
            }
            if (linkedKb.length > 0) {
                label += ` · ${linkedKb.length} KB linked${useKB ? '' : ' (KB off)'}`
            }

            return {
                systemPrompt: sections.join('\n\n'),
                contextLabel: label
            }
        },
        [attachedDocIds, attachedComponents, basePath, docs, kbItems, lastTurn, store]
    )

    return (
        <Group orientation="horizontal" className="flex h-full w-full">
            {/* Build chat (resizable) */}
            <Panel
                id="proto-chat"
                defaultSize={`${chatWidth}px`}
                minSize="320px"
                maxSize="50%"
                onResize={onResizeChat}
            >
                <aside className="flex h-full w-full flex-col border-r bg-sidebar">
                    <ChatPanelTabs
                        mode={chatPanelMode}
                        onChangeMode={setChatPanelMode}
                        pinnedCount={attachedComponentIds.length}
                    />
                    {/* Palette is overlaid on top while active so the chat
                        stays mounted (display:none); message history and
                        streaming state survive tab switches. */}
                    <div className="relative min-h-0 flex-1">
                        {/* Both panes are absolute-positioned over the same
                            relative slot so the AIAssistant and palette
                            mount once and toggle visibility — chat history,
                            streaming, and composer draft survive tab swaps.
                            `flex flex-col` ensures the inner pane stretches
                            to fill the panel width when the user resizes
                            the chat ↔ main divider. */}
                        <div
                            className={cn(
                                'absolute inset-0 flex-col',
                                chatPanelMode === 'chat' ? 'flex' : 'hidden'
                            )}
                        >
                            <AIAssistant
                                className="h-full w-full"
                                mode="prototype"
                                title="Prototype builder"
                                placeholder="Describe a feature or change…"
                                submitLabel="Build"
                                supportsKB
                                persistenceKey={basePath ? `prototype:${basePath}` : undefined}
                                chatBackend={
                                    basePath
                                        ? {
                                              kind: 'prototype',
                                              basePath,
                                              onTurnEvent: (event) => dispatch(event)
                                          }
                                        : undefined
                                }
                                attachments={chatAttachments}
                                onRemoveAttachment={handleRemoveAttachment}
                                composerSlot={
                                    <DocAttachPicker
                                        nodes={docs}
                                        attachedIds={attachedDocIds}
                                        onToggle={toggleAttachedDoc}
                                        estimateTokens={estimateAttachmentTokens}
                                    />
                                }
                                onPrototypeRestore={(sha) => {
                                    if (!basePath) return
                                    dispatch(restorePrototypeSnapshot(basePath, sha))
                                }}
                                onPrototypeOpenFile={(path) => {
                                    if (!basePath) return
                                    setActiveTab('files')
                                    dispatch(openPrototypeFile(basePath, path))
                                }}
                                contextProvider={contextProvider}
                            />
                        </div>
                        <div
                            className={cn(
                                'absolute inset-0 flex-col',
                                chatPanelMode === 'palette' ? 'flex' : 'hidden'
                            )}
                        >
                            <ComponentPalettePane
                                attachedIds={attachedComponentIds}
                                onToggle={toggleAttachedComponent}
                            />
                        </div>
                    </div>
                </aside>
            </Panel>
            <Separator className="w-px cursor-col-resize bg-border transition-colors hover:bg-primary/40" />

            {/* Main */}
            <Panel id="proto-main" minSize="40%">
                <main className="flex h-full w-full flex-col bg-background">
                    {devStatus.installing && <FirstRunBanner />}
                    {/* Recommend the `igrp-studio-metadata` skill when it
                        isn't installed yet — generation quality drops
                        noticeably without the patterns/component-reference
                        corpus, so we surface it upfront. Dismissable. */}
                    <SkillInstallBanner
                        basePath={basePath}
                        skills={skillsCtx.skills}
                        installSkill={skillsCtx.installSkill}
                    />
                    {/* When the registry has a newer version of any
                        installed skill, surface an amber banner with
                        installed→latest + an Update button that spawns
                        `igrp skill update`. Dismiss is per-version so a
                        future release pops it again. */}
                    <SkillUpdateBanner
                        basePath={basePath}
                        updates={skillsCtx.updates}
                        updateSkill={skillsCtx.updateSkill}
                    />
                    <header className="flex h-12 shrink-0 items-center justify-between border-b bg-background px-4">
                        <div className="flex items-center gap-1 rounded-md bg-accent/40 p-1">
                            {TABS.map((t) => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setActiveTab(t.id)}
                                    className={cn(
                                        'rounded px-2.5 py-1 text-[11px] font-medium transition-colors',
                                        activeTab === t.id
                                            ? 'bg-secondary text-secondary-foreground'
                                            : 'text-muted-foreground hover:bg-accent'
                                    )}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        {activeTab === 'preview' && (
                            <PreviewToolbar
                                previewMode={previewMode}
                                onChangePreviewMode={setPreviewMode}
                                device={device}
                                onChangeDevice={setDevice}
                                customWidth={customWidth}
                                onChangeCustomWidth={handleChangeCustomWidth}
                                url={devStatus.url}
                                running={devStatus.running}
                                onToggleDev={() => {
                                    if (!basePath) return
                                    if (devStatus.running) dispatch(stopPrototypeDev(basePath))
                                    else dispatch(startPrototypeDev(basePath))
                                }}
                                basePath={basePath}
                            />
                        )}
                    </header>

                    <div className="relative flex-1 overflow-hidden p-6">
                        {activeTab === 'preview' && previewMode === 'live' && (
                            <PreviewPane
                                device={device}
                                customWidth={customWidth}
                                url={devStatus.url}
                                running={devStatus.running}
                                installing={devStatus.installing}
                                onSwitchToLogs={() => setActiveTab('logs')}
                            />
                        )}
                        {activeTab === 'preview' && previewMode === 'edit' && (
                            <EditCanvas basePath={basePath} />
                        )}
                        {activeTab === 'files' && <FilesPane basePath={basePath} />}
                        {activeTab === 'logs' && <LogsPane />}
                        {activeTab === 'history' && <HistoryPane basePath={basePath} />}
                    </div>

                    <PrototypeFooter basePath={basePath} />
                </main>
            </Panel>
        </Group>
    )
}

// ─── First-run banner (M4.18) ─────────────────────────────────────────────
//
// Indeterminate progress bar shown while `npm install` runs the very first
// time the dev server is started for a project. The Logs tab is auto-focused
// in parallel so the user sees the actual download stream — this banner is
// just a thin reminder of what's happening so it stays out of the way.

// ─── Chat panel tabs (M4.28) ──────────────────────────────────────────────
//
// Two-way switch in the left panel header. Mounts both the chat and the
// palette but toggles `display`, so the AIAssistant's local state (message
// history, streaming chunks, composer draft) survives jumps between modes.

const ChatPanelTabs = ({
    mode,
    onChangeMode,
    pinnedCount
}: {
    mode: ChatPanelMode
    onChangeMode: (next: ChatPanelMode) => void
    pinnedCount: number
}): JSX.Element => (
    // Sits on top of the `bg-sidebar` aside; we use the same sidebar token
    // (instead of an opacity-tinted background) so the tab row reads as part
    // of the rail rather than a different surface.
    <div className="flex h-10 shrink-0 items-center gap-1 border-b border-border/80 bg-sidebar px-2">
        <ChatPanelTabButton
            active={mode === 'chat'}
            onClick={() => onChangeMode('chat')}
            icon={<MessageSquare size={13} />}
            label="Chat"
        />
        <ChatPanelTabButton
            active={mode === 'palette'}
            onClick={() => onChangeMode('palette')}
            icon={<LayoutGrid size={13} />}
            label="Palette"
            badge={pinnedCount > 0 ? pinnedCount : undefined}
        />
    </div>
)

const ChatPanelTabButton = ({
    active,
    onClick,
    icon,
    label,
    badge
}: {
    active: boolean
    onClick: () => void
    icon: JSX.Element
    label: string
    badge?: number
}): JSX.Element => (
    <button
        type="button"
        onClick={onClick}
        className={cn(
            'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors',
            active
                ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
                : 'text-muted-foreground hover:bg-accent'
        )}
    >
        {icon}
        {label}
        {badge !== undefined && (
            <span
                className={cn(
                    'rounded-full px-1.5 py-px text-[9px] font-semibold',
                    active ? 'bg-primary/20 text-primary' : 'bg-muted-foreground/20'
                )}
            >
                {badge}
            </span>
        )}
    </button>
)

// ─── Component palette pane (M4.28) ───────────────────────────────────────

const ComponentPalettePane = ({
    attachedIds,
    onToggle
}: {
    attachedIds: string[]
    onToggle: (id: string) => void
}): JSX.Element => {
    const [query, setQuery] = useState('')

    // Pull the engine's component catalog (`window.engine.getComponent(NEXTJS)`)
    // — the same source the UI generator's visual palette uses, so the
    // Prototype design intent stays in sync with what the engine actually
    // knows how to generate. The provider lives at App root, so it's safe to
    // call from here even before the UI generator is mounted.
    const { componentsRegistered, loadRegistryComponent, isLoading } = useEngineCatalog()
    useEffect(() => {
        if (componentsRegistered.length === 0) {
            void loadRegistryComponent()
        }
    }, [componentsRegistered.length, loadRegistryComponent])

    const palette = useEnginePalette(componentsRegistered)

    const filteredGroups = useMemo(() => {
        const needle = query.trim().toLowerCase()
        if (!needle) return palette.groups
        return palette.groups
            .map((g) => ({
                ...g,
                items: g.items.filter(
                    (c) =>
                        c.name.toLowerCase().includes(needle) ||
                        c.id.toLowerCase().includes(needle) ||
                        g.label.toLowerCase().includes(needle)
                )
            }))
            .filter((g) => g.items.length > 0)
    }, [palette.groups, query])

    const attachedSet = useMemo(() => new Set(attachedIds), [attachedIds])
    const empty = componentsRegistered.length === 0
    const noMatch = !empty && filteredGroups.length === 0

    return (
        <div className="flex h-full w-full flex-col">
            <div className="border-b px-3 py-2">
                <div className="relative">
                    <Search
                        size={11}
                        className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                        placeholder="Find a component…"
                        className="h-7 pl-7 text-[11px]"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
                <p className="mt-1.5 text-[10px] leading-snug text-muted-foreground">
                    Click to pin · remove via chip in chat
                    {attachedIds.length > 0 && (
                        <span className="ml-1 font-medium text-primary">
                            · {attachedIds.length} pinned
                        </span>
                    )}
                </p>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
                {empty ? (
                    <p className="px-2 py-3 text-[11px] italic text-muted-foreground">
                        {isLoading
                            ? 'Loading engine catalog…'
                            : 'No components available — engine catalog is empty.'}
                    </p>
                ) : noMatch ? (
                    <p className="px-2 py-3 text-[11px] italic text-muted-foreground">
                        No components match "{query}".
                    </p>
                ) : (
                    filteredGroups.map((group) => (
                        <section key={group.key} className="mb-3">
                            <h4 className="mb-1.5 px-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                                {group.label}
                            </h4>
                            <div className="grid grid-cols-2 gap-1.5">
                                {group.items.map((c) => (
                                    <PaletteComponentCard
                                        key={c.id}
                                        icon={c.icon}
                                        label={c.name}
                                        deprecated={c.deprecated}
                                        active={attachedSet.has(c.id)}
                                        showGripHint={false}
                                        onClick={() => onToggle(c.id)}
                                    />
                                ))}
                            </div>
                        </section>
                    ))
                )}
            </div>
        </div>
    )
}

// ─── Skill install banner (M-Skill Fase 2) ──────────────────────────────
//
// Surfaces a one-click install for the canonical Prototype skill when it
// isn't present in `.agents/skills/`. Stays out of the way once dismissed
// (per-project, localStorage). Install spawns the CLI via IPC and refreshes
// the local skill list on success.

// Skill banner dismissal keys moved to
// `./prototype/persistence/skill-banner-dismiss.ts` (P1).

const SkillInstallBanner = ({
    basePath,
    skills,
    installSkill
}: {
    basePath: string | undefined
    skills: InstalledSkillSummary[]
    installSkill: (name: string) => Promise<{ ok: boolean; error?: string }>
}): JSX.Element | null => {
    const [installing, setInstalling] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const dismissKey = basePath ? `${SKILL_BANNER_DISMISS_KEY_PREFIX}${basePath}` : null
    const [dismissed, setDismissed] = useState<boolean>(() => {
        if (!dismissKey || typeof window === 'undefined') return false
        try {
            return window.localStorage?.getItem(dismissKey) === '1'
        } catch {
            return false
        }
    })

    const installed = useMemo(() => skills.some((s) => s.name === CANONICAL_SKILL), [skills])

    if (!basePath || installed || dismissed) return null

    const dismiss = () => {
        setDismissed(true)
        if (!dismissKey) return
        try {
            window.localStorage?.setItem(dismissKey, '1')
        } catch {
            // noop — private mode etc.
        }
    }

    const handleInstall = async () => {
        setInstalling(true)
        setError(null)
        const result = await installSkill(CANONICAL_SKILL)
        setInstalling(false)
        if (!result.ok) {
            setError(result.error ?? 'Install failed.')
        }
    }

    return (
        <div className="flex items-center gap-3 border-b bg-blue-500/5 px-4 py-2 text-[11px]">
            <Library size={14} className="text-blue-500" />
            <div className="flex-1">
                <span className="font-medium">Recommended:</span> install the{' '}
                <code className="rounded bg-muted px-1 py-0.5 font-mono">{CANONICAL_SKILL}</code>{' '}
                skill for better generation quality.
                {error && (
                    <span className="ml-2 text-red-500" title={error}>
                        — {error.length > 80 ? `${error.slice(0, 80)}…` : error}
                    </span>
                )}
            </div>
            <button
                type="button"
                onClick={handleInstall}
                disabled={installing}
                className={cn(
                    'flex items-center gap-1 rounded-md border px-2 py-1 text-[10.5px] font-medium transition-colors',
                    installing
                        ? 'border-border bg-card text-muted-foreground'
                        : 'border-blue-500/30 bg-blue-500/10 text-blue-600 hover:bg-blue-500/15'
                )}
            >
                {installing ? (
                    <Loader2 size={11} className="animate-spin" />
                ) : (
                    <Download size={11} />
                )}
                {installing ? 'Installing…' : 'Install'}
            </button>
            <button
                type="button"
                onClick={dismiss}
                className="text-[10.5px] text-muted-foreground hover:text-foreground"
                title="Dismiss"
            >
                ✕
            </button>
        </div>
    )
}

// Update banner — same visual language as install, in amber, surfaces ONE
// skill at a time (the first with `hasUpdate`). Dismiss is per
// `${basePath}:${name}:${latest}` so a new version pops the banner again,
// while clicking ✕ on 1.0.2 doesn't keep silencing 1.0.3.
const SkillUpdateBanner = ({
    basePath,
    updates,
    updateSkill
}: {
    basePath: string | undefined
    updates: SkillUpdateSummary[]
    updateSkill: (name: string) => Promise<{ ok: boolean; error?: string }>
}): JSX.Element | null => {
    const [updating, setUpdating] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [dismissedKeys, setDismissedKeys] = useState<Set<string>>(() => {
        if (typeof window === 'undefined' || !basePath) return new Set()
        try {
            const raw = window.localStorage?.getItem(
                `${SKILL_UPDATE_DISMISS_KEY_PREFIX}${basePath}`
            )
            return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
        } catch {
            return new Set()
        }
    })

    // First update that isn't dismissed for its (name, latest) tuple.
    const candidate = useMemo(() => {
        return (
            updates.find(
                (u) => u.hasUpdate && u.latest && !dismissedKeys.has(`${u.name}:${u.latest}`)
            ) ?? null
        )
    }, [updates, dismissedKeys])

    if (!basePath || !candidate) return null

    const dismiss = () => {
        if (!candidate.latest) return
        const key = `${candidate.name}:${candidate.latest}`
        const next = new Set(dismissedKeys)
        next.add(key)
        setDismissedKeys(next)
        try {
            window.localStorage?.setItem(
                `${SKILL_UPDATE_DISMISS_KEY_PREFIX}${basePath}`,
                JSON.stringify(Array.from(next))
            )
        } catch {
            // noop — private mode etc.
        }
    }

    const handleUpdate = async () => {
        setUpdating(true)
        setError(null)
        const result = await updateSkill(candidate.name)
        setUpdating(false)
        if (!result.ok) {
            setError(result.error ?? 'Update failed.')
        }
        // On success the hook re-checks; the banner will hide itself
        // when `hasUpdate` flips to false (installed === latest).
    }

    return (
        <div className="flex items-center gap-3 border-b bg-amber-500/5 px-4 py-2 text-[11px]">
            <RefreshCw size={14} className="text-amber-500" />
            <div className="flex-1">
                <span className="font-medium">Update available:</span>{' '}
                <code className="rounded bg-muted px-1 py-0.5 font-mono">{candidate.name}</code>{' '}
                <span className="text-muted-foreground">
                    {candidate.installed ?? '?'} → {candidate.latest}
                </span>
                {error && (
                    <span className="ml-2 text-red-500" title={error}>
                        — {error.length > 80 ? `${error.slice(0, 80)}…` : error}
                    </span>
                )}
            </div>
            <button
                type="button"
                onClick={handleUpdate}
                disabled={updating}
                className={cn(
                    'flex items-center gap-1 rounded-md border px-2 py-1 text-[10.5px] font-medium transition-colors',
                    updating
                        ? 'border-border bg-card text-muted-foreground'
                        : 'border-amber-500/30 bg-amber-500/10 text-amber-700 hover:bg-amber-500/15 dark:text-amber-400'
                )}
            >
                {updating ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />}
                {updating ? 'Updating…' : 'Update'}
            </button>
            <button
                type="button"
                onClick={dismiss}
                className="text-[10.5px] text-muted-foreground hover:text-foreground"
                title="Dismiss until next version"
            >
                ✕
            </button>
        </div>
    )
}

const FirstRunBanner = (): JSX.Element => (
    <div className="relative overflow-hidden border-b bg-amber-500/5 px-4 py-2 text-[11px] text-amber-700 dark:text-amber-400">
        <div className="flex items-center gap-2">
            <Loader2 size={12} className="animate-spin" />
            <span className="font-medium">Installing dependencies…</span>
            <span className="text-muted-foreground">
                first-time setup, ~30s. Live progress in the Logs tab.
            </span>
        </div>
        <div className="absolute bottom-0 left-0 h-0.5 w-1/3 animate-[firstrun_1.4s_linear_infinite] bg-amber-500/60" />
        <style>{`@keyframes firstrun{0%{transform:translateX(-100%)}100%{transform:translateX(400%)}}`}</style>
    </div>
)

// ─── Preview ──────────────────────────────────────────────────────────────

const PreviewToolbar = ({
    previewMode,
    onChangePreviewMode,
    device,
    onChangeDevice,
    customWidth,
    onChangeCustomWidth,
    url,
    running,
    onToggleDev,
    basePath
}: {
    previewMode: PreviewMode
    onChangePreviewMode: (mode: PreviewMode) => void
    device: DeviceFrame
    onChangeDevice: (d: DeviceFrame) => void
    customWidth: number
    onChangeCustomWidth: (next: number) => void
    url: string | null
    running: boolean
    onToggleDev: () => void
    basePath: string | undefined
}): JSX.Element => {
    const reload = () => {
        const view = document.querySelector('webview.spec-prototype-preview') as {
            reload?: () => void
        } | null
        view?.reload?.()
    }
    const toggleDevTools = () => {
        // Each Electron <webview> has its own DevTools, decoupled from the
        // host window's DevTools. Useful when debugging the running prototype
        // without leaving the Studio.
        const view = document.querySelector('webview.spec-prototype-preview') as {
            isDevToolsOpened?: () => boolean
            openDevTools?: () => void
            closeDevTools?: () => void
        } | null
        if (!view) return
        if (view.isDevToolsOpened?.()) view.closeDevTools?.()
        else view.openDevTools?.()
    }
    return (
        <div className="flex items-center gap-2">
            {/* Preview ⇄ Edit toggle — primary affordance for the right-side
                main area. In `edit` mode the device picker becomes irrelevant
                (we render the manifest wireframe, not the running app), so
                we visually de-emphasise it. */}
            <div className="flex items-center gap-0.5 rounded-md border bg-card p-0.5">
                <PreviewModeButton
                    active={previewMode === 'live'}
                    onClick={() => onChangePreviewMode('live')}
                    icon={<Play size={11} />}
                    label="Preview"
                />
                <PreviewModeButton
                    active={previewMode === 'edit'}
                    onClick={() => onChangePreviewMode('edit')}
                    icon={<Edit3 size={11} />}
                    label="Edit"
                />
            </div>
            <div
                className={cn(
                    'flex items-center gap-1 rounded-md border bg-card p-1 transition-opacity',
                    previewMode === 'edit' && 'opacity-50'
                )}
            >
                <DeviceButton
                    active={device === 'desktop'}
                    onClick={() => onChangeDevice('desktop')}
                    icon={<Monitor size={13} />}
                    title="Desktop"
                />
                <DeviceButton
                    active={device === 'tablet'}
                    onClick={() => onChangeDevice('tablet')}
                    icon={<Tablet size={13} />}
                    title="Tablet"
                />
                <DeviceButton
                    active={device === 'mobile'}
                    onClick={() => onChangeDevice('mobile')}
                    icon={<Smartphone size={13} />}
                    title="Mobile"
                />
                <DeviceButton
                    active={device === 'custom'}
                    onClick={() => onChangeDevice('custom')}
                    icon={<MoveHorizontal size={13} />}
                    title="Custom width"
                />
            </div>
            {device === 'custom' && (
                <div className="flex items-center gap-1 rounded-md border bg-card px-2 py-1 text-[11px]">
                    <input
                        type="number"
                        value={customWidth}
                        min={MIN_CUSTOM_VIEWPORT}
                        max={MAX_CUSTOM_VIEWPORT}
                        onChange={(e) => {
                            const next = Number(e.target.value)
                            if (Number.isFinite(next)) onChangeCustomWidth(next)
                        }}
                        className="w-16 bg-transparent text-right outline-none"
                    />
                    <span className="text-muted-foreground">px</span>
                </div>
            )}
            <PreviewUrlBar url={url} />
            <PagesDropdown devUrl={url} basePath={basePath} />
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={reload}
                disabled={!running}
                title="Reload preview"
            >
                <RefreshCw size={14} />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onToggleDev}
                title={running ? 'Stop dev server' : 'Start dev server'}
            >
                {running ? <Pause size={14} /> : <Play size={14} />}
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={toggleDevTools}
                disabled={!running}
                title="Toggle DevTools for the preview"
            >
                <Bug size={14} />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={!url}
                onClick={() => url && window.open(url, '_blank')}
                title="Open in browser"
            >
                <ExternalLink size={14} />
            </Button>
        </div>
    )
}

// ─── URL bar (editable) ────────────────────────────────────────────────
//
// Read-only display in M4.7 became a friction point as soon as the user
// generated a second page — the engine wrote `app/pages/<name>/page.tsx`
// but the webview stayed at `/`. The user had no way to type a URL or
// pick a page. Now: editable input + a `Pages ▾` dropdown (computed from
// the prototype file tree).

const PreviewUrlBar = ({ url }: { url: string | null }): JSX.Element => {
    const [draft, setDraft] = useState<string>(url ?? '')
    const lastUrlRef = useRef(url)
    // Sync external URL updates (auto-navigate after generation, reload,
    // user picks from Pages dropdown). Don't clobber a draft the user is
    // actively typing: we only re-sync when the external URL changed AND
    // it doesn't match the current draft.
    useEffect(() => {
        if (url !== lastUrlRef.current) {
            lastUrlRef.current = url
            setDraft(url ?? '')
        }
    }, [url])

    const navigate = useCallback((target: string) => {
        const view = document.querySelector('webview.spec-prototype-preview') as {
            loadURL?: (u: string) => void
        } | null
        view?.loadURL?.(target)
    }, [])

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault()
                if (!draft.trim()) return
                navigate(draft.trim())
            }}
            className="flex h-8 w-72 items-center rounded-md bg-muted px-2 text-[11px]"
        >
            <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="dev server stopped"
                disabled={!url}
                spellCheck={false}
                className="flex-1 bg-transparent font-mono text-[10.5px] text-muted-foreground outline-none disabled:cursor-not-allowed"
                title={url ?? 'dev server stopped'}
            />
        </form>
    )
}

// ─── Pages dropdown ─────────────────────────────────────────────────────
//
// Lists every `app/pages/<name>/page.tsx` the engine has generated in this
// prototype. Click → loads the corresponding URL in the webview. Picks up
// changes automatically because `state.specPrototype.files` is refreshed on
// every `tree-changed` event.

// IGRP framework template writes pages under
//   `src/app/(igrp)/(generated)/<name>/page.tsx`
// (route groups `(igrp)` and `(generated)` are organisational and don't
// appear in the URL). We also accept a few looser shapes so the dropdown
// stays populated if the engine ever emits a different layout:
//   - `src/app/(group1)/(group2)/<name>/page.tsx`   (current template)
//   - `src/app/<name>/page.tsx`                    (no groups)
//   - `app/pages/<name>/page.tsx`                  (legacy / non-`src`)
const PAGE_ROUTE_RE = /^(?:src\/)?app\/(?:pages\/)?(?:\([^)]+\)\/)*([^/]+)\/page\.tsx$/

const PagesDropdown = ({
    devUrl,
    basePath
}: {
    devUrl: string | null
    basePath: string | undefined
}): JSX.Element => {
    const dispatch = useDispatch<any>()
    const files = useSelector((s: RootState) => s.specPrototype.files)
    const [open, setOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const pages = useMemo(() => {
        const seen = new Set<string>()
        const out: string[] = []
        for (const f of files) {
            const match = f.path.match(PAGE_ROUTE_RE)
            if (!match) continue
            const name = match[1]
            // Skip the root-level `app/page.tsx` (Next.js index) — only
            // care about distinct page folders.
            if (name === 'page.tsx') continue
            if (seen.has(name)) continue
            seen.add(name)
            out.push(name)
        }
        return out.sort()
    }, [files])

    useEffect(() => {
        if (!open) return
        const onClick = (e: MouseEvent) => {
            if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', onClick)
        return () => document.removeEventListener('mousedown', onClick)
    }, [open])

    const navigate = useCallback(
        (pageName: string) => {
            if (!devUrl) return
            const view = document.querySelector('webview.spec-prototype-preview') as {
                loadURL?: (u: string) => void
            } | null
            // Route groups in the engine path (`(igrp)`, `(generated)`) do
            // NOT appear in the URL — Next.js serves the page at the
            // segment name directly. So `users` page lives at `/users`,
            // not `/pages/users`.
            view?.loadURL?.(`${devUrl.replace(/\/+$/, '')}/${pageName}`)
            setOpen(false)
        },
        [devUrl]
    )

    const refresh = useCallback(() => {
        if (basePath) dispatch(loadPrototypeFiles(basePath))
    }, [basePath, dispatch])

    // Dropdown is *always* openable now — empty / no-server states surface
    // as messages inside the popover instead of a dead button. Refresh
    // file tree on open so a freshly-generated page lands quickly.
    const handleToggle = () => {
        if (!open) refresh()
        setOpen((v) => !v)
    }

    const reason = !devUrl
        ? 'Dev server not running — start it from the Preview toolbar.'
        : pages.length === 0
          ? 'No pages found yet. Ask the chat to generate one.'
          : null

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={handleToggle}
                className={cn(
                    'flex h-8 items-center gap-1 rounded-md border bg-card px-2 text-[10.5px] transition-colors hover:bg-accent'
                )}
                title={
                    reason ??
                    `${pages.length} page${pages.length === 1 ? '' : 's'} — click to switch`
                }
            >
                Pages
                <span
                    className={cn(
                        'rounded px-1 text-[9px] font-semibold',
                        pages.length > 0
                            ? 'bg-primary/15 text-primary'
                            : 'bg-muted text-muted-foreground'
                    )}
                >
                    {pages.length}
                </span>
                <ChevronDown size={10} />
            </button>
            {open && (
                <div className="absolute right-0 top-9 z-30 max-h-72 w-52 overflow-y-auto rounded-md border bg-popover p-1 shadow-lg">
                    {reason ? (
                        <p className="px-2 py-1.5 text-[10.5px] italic text-muted-foreground">
                            {reason}
                        </p>
                    ) : (
                        pages.map((name) => (
                            <button
                                key={name}
                                type="button"
                                onClick={() => navigate(name)}
                                disabled={!devUrl}
                                className={cn(
                                    'flex w-full items-center justify-between rounded px-2 py-1 text-left text-[11px]',
                                    devUrl ? 'hover:bg-accent' : 'cursor-not-allowed opacity-50'
                                )}
                            >
                                <span className="font-mono">{name}</span>
                                <ExternalLink size={10} className="text-muted-foreground/60" />
                            </button>
                        ))
                    )}
                    <div className="mt-1 border-t pt-1">
                        <button
                            type="button"
                            onClick={refresh}
                            className="flex w-full items-center justify-center gap-1 rounded px-2 py-1 text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground"
                        >
                            <RefreshCw size={9} />
                            Refresh
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

const DeviceButton = ({
    active,
    onClick,
    icon,
    title
}: {
    active: boolean
    onClick: () => void
    icon: JSX.Element
    title: string
}): JSX.Element => (
    <button
        type="button"
        onClick={onClick}
        title={title}
        className={cn(
            'flex h-6 w-6 items-center justify-center rounded transition-colors',
            active
                ? 'bg-secondary text-secondary-foreground'
                : 'text-muted-foreground hover:bg-accent'
        )}
    >
        {icon}
    </button>
)

const PreviewModeButton = ({
    active,
    onClick,
    icon,
    label
}: {
    active: boolean
    onClick: () => void
    icon: JSX.Element
    label: string
}): JSX.Element => (
    <button
        type="button"
        onClick={onClick}
        className={cn(
            'flex items-center gap-1.5 rounded px-2 py-1 text-[11px] font-medium transition-colors',
            active
                ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
                : 'text-muted-foreground hover:bg-accent'
        )}
    >
        {icon}
        {label}
    </button>
)

const PreviewPane = ({
    device,
    customWidth,
    url,
    running,
    installing,
    onSwitchToLogs
}: {
    device: DeviceFrame
    customWidth: number
    url: string | null
    running: boolean
    installing: boolean
    onSwitchToLogs: () => void
}): JSX.Element => {
    // Surface the latest install/dev-server error inline. Without this, a
    // failed start would only show "Dev server is stopped" with no clue.
    const lastError = useSelector((s: RootState) => {
        const logs = s.specPrototype.logs
        for (let i = logs.length - 1; i >= 0; i--) {
            if (logs[i].level === 'error') return logs[i]
        }
        return null
    })
    const widthStyle: CSSProperties =
        device === 'desktop'
            ? { width: '100%' }
            : device === 'tablet'
              ? { width: 768 }
              : device === 'mobile'
                ? { width: 375 }
                : { width: customWidth, maxWidth: '100%' }
    return (
        <div className="flex h-full items-center justify-center">
            <div
                style={widthStyle}
                className={cn(
                    'relative h-full overflow-hidden rounded-xl border bg-white shadow-2xl transition-[width] duration-300'
                )}
            >
                <div className="flex h-8 items-center gap-1.5 border-b bg-gray-100 px-4">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                </div>
                <div className="h-[calc(100%-32px)] bg-gray-50">
                    {running && url ? (
                        <webview
                            src={url}
                            className="spec-prototype-preview"
                            style={{ width: '100%', height: '100%', border: 'none' }}
                        />
                    ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-gray-500">
                            <LayoutIcon size={48} className="opacity-20" />
                            <div className="max-w-md space-y-2 text-center text-sm">
                                {installing ? (
                                    <>
                                        <p className="font-medium text-gray-700">
                                            Installing dependencies…
                                        </p>
                                        <p className="text-[11px] italic text-gray-500">
                                            Running <code>npm install</code> for the first time.
                                            This can take a couple of minutes — see the Logs tab for
                                            live progress.
                                        </p>
                                    </>
                                ) : running ? (
                                    <>
                                        <p className="italic">Starting preview…</p>
                                        <p className="text-[11px] italic">
                                            Waiting for the dev server to bind to its port.
                                        </p>
                                    </>
                                ) : lastError ? (
                                    <>
                                        <p className="font-medium text-red-600">
                                            Dev server failed to start.
                                        </p>
                                        <pre className="max-h-32 overflow-y-auto rounded-md border border-red-200 bg-red-50 p-2 text-left text-[11px] text-red-700">
                                            {lastError.line}
                                        </pre>
                                        <button
                                            type="button"
                                            onClick={onSwitchToLogs}
                                            className="text-[11px] text-primary hover:underline"
                                        >
                                            Open Logs tab for details →
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <p className="italic">Dev server is stopped.</p>
                                        <p className="text-[11px] italic">
                                            Click ▶ in the toolbar to start, or describe a feature
                                            in the Build chat.
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── Files ────────────────────────────────────────────────────────────────
//
// `TreeNode` + `buildTree` moved to `./prototype/files/file-tree.ts` (P2).

const FilesPane = ({ basePath }: { basePath?: string }): JSX.Element => {
    const dispatch = useDispatch<any>()
    const files = useSelector((s: RootState) => s.specPrototype.files)
    const changedPaths = useSelector((s: RootState) => s.specPrototype.changedPaths)
    const activeFile = useSelector((s: RootState) => s.specPrototype.activeFile)
    const activeFileContent = useSelector((s: RootState) => s.specPrototype.activeFileContent)
    const loading = useSelector((s: RootState) => s.specPrototype.activeFileLoading)

    const tree = useMemo(() => buildTree(files, changedPaths), [files, changedPaths])

    return (
        <div className="flex h-full overflow-hidden rounded-xl border bg-background">
            <aside className="flex w-64 shrink-0 flex-col border-r bg-card">
                <div className="flex items-center justify-between border-b p-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Project Explorer
                    </span>
                    <button
                        type="button"
                        onClick={() => basePath && dispatch(loadPrototypeFiles(basePath))}
                        title="Refresh"
                        className="rounded p-1 hover:bg-accent"
                    >
                        <RefreshCw size={11} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                    {tree.length === 0 ? (
                        <p className="px-2 py-3 text-[11px] text-muted-foreground">
                            No files yet — describe a feature in the Build chat to scaffold the
                            prototype.
                        </p>
                    ) : (
                        tree.map((node) => (
                            <FileTreeRow
                                key={node.path}
                                node={node}
                                allFiles={files}
                                changedPaths={changedPaths}
                                activeFile={activeFile}
                                onSelect={(path) =>
                                    basePath && dispatch(openPrototypeFile(basePath, path))
                                }
                            />
                        ))
                    )}
                </div>
            </aside>
            <FileViewer
                basePath={basePath}
                activeFile={activeFile}
                activeFileContent={activeFileContent}
                loading={loading}
                changedPaths={changedPaths}
            />
        </div>
    )
}

// ─── File viewer (Monaco read-only + optional diff vs HEAD~1) ────────────
//
// `languageFromExt` + `monacoOptions` moved to
// `./prototype/files/monaco-config.ts` (P2).

const FileViewer = ({
    basePath,
    activeFile,
    activeFileContent,
    loading,
    changedPaths
}: {
    basePath?: string
    activeFile: string | null
    activeFileContent: string | null
    loading: boolean
    changedPaths: Record<string, FileChangeKind>
}): JSX.Element => {
    const status = activeFile ? changedPaths[activeFile] : undefined
    const canDiff = Boolean(activeFile && status === 'modified')
    // If the active file isn't dirty in the last turn, force off — avoids
    // a stale diff sticking around when the user navigates to an untouched
    // file after viewing a modified one.
    const [diffOn, setDiffOn] = useState(false)
    useEffect(() => {
        if (!canDiff) setDiffOn(false)
    }, [canDiff, activeFile])

    const [previousContent, setPreviousContent] = useState<string | null>(null)
    const [diffLoading, setDiffLoading] = useState(false)
    useEffect(() => {
        if (!diffOn || !basePath || !activeFile) {
            setPreviousContent(null)
            return
        }
        let cancelled = false
        setDiffLoading(true)
        window.specPrototype
            .readFileAt(basePath, 'HEAD~1', activeFile)
            .then((res) => {
                if (cancelled) return
                setPreviousContent(res.content)
            })
            .catch(() => {
                if (cancelled) return
                setPreviousContent(null)
            })
            .finally(() => {
                if (cancelled) return
                setDiffLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [diffOn, basePath, activeFile])

    const language = activeFile ? languageFromExt(activeFile) : 'plaintext'

    return (
        <section className="flex flex-1 flex-col bg-background">
            <header className="flex h-10 items-center justify-between border-b bg-card px-4">
                <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] text-muted-foreground">
                        {activeFile ? `prototype/${activeFile}` : 'No file selected'}
                    </span>
                    {status && (
                        <span
                            className={cn(
                                'rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide',
                                status === 'new'
                                    ? 'bg-emerald-500/15 text-emerald-500'
                                    : status === 'modified'
                                      ? 'bg-blue-500/15 text-blue-500'
                                      : 'bg-red-500/15 text-red-500'
                            )}
                        >
                            {status}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    {canDiff && (
                        <button
                            type="button"
                            onClick={() => setDiffOn((v) => !v)}
                            className={cn(
                                'rounded px-2 py-1 text-[10px] font-medium transition-colors',
                                diffOn
                                    ? 'bg-secondary text-secondary-foreground'
                                    : 'text-muted-foreground hover:bg-accent'
                            )}
                            title="Compare with previous commit (HEAD~1)"
                        >
                            {diffOn ? 'Hide diff' : 'View diff'}
                        </button>
                    )}
                </div>
            </header>
            <div className="flex-1 overflow-hidden bg-background">
                {loading ? (
                    <p className="p-6 text-[11px] text-muted-foreground">Loading…</p>
                ) : activeFileContent === null ? (
                    <p className="p-6 text-[11px] text-muted-foreground">
                        Select a file from the explorer to preview its contents.
                    </p>
                ) : diffOn ? (
                    diffLoading ? (
                        <p className="p-6 text-[11px] text-muted-foreground">Loading diff…</p>
                    ) : (
                        <DiffEditor
                            height="100%"
                            language={language}
                            original={previousContent ?? ''}
                            modified={activeFileContent}
                            theme="vs-dark"
                            options={{ ...monacoOptions, renderSideBySide: false }}
                        />
                    )
                ) : (
                    <MonacoEditor
                        height="100%"
                        language={language}
                        value={activeFileContent}
                        theme="vs-dark"
                        options={monacoOptions}
                    />
                )}
            </div>
        </section>
    )
}

interface FileTreeRowProps {
    node: TreeNode
    allFiles: PrototypeFile[]
    changedPaths: Record<string, FileChangeKind>
    activeFile: string | null
    onSelect: (path: string) => void
}

const FileTreeRow = ({
    node,
    allFiles,
    changedPaths,
    activeFile,
    onSelect
}: FileTreeRowProps): JSX.Element => {
    const [open, setOpen] = useState(true)
    const isFolder = node.type === 'folder'
    const isActive = !isFolder && activeFile === node.path
    const status = changedPaths[node.path]

    return (
        <div>
            <button
                type="button"
                onClick={() => (isFolder ? setOpen((v) => !v) : onSelect(node.path))}
                className={cn(
                    'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors',
                    isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
                )}
                style={{ paddingLeft: `${node.depth * 12 + 8}px` }}
            >
                {isFolder ? (
                    <FolderOpen size={14} className="text-blue-500" />
                ) : (
                    <FileCode size={14} className="text-muted-foreground" />
                )}
                <span className="flex-1 truncate">{node.name}</span>
                {status && (
                    <span
                        className={cn(
                            'h-1.5 w-1.5 rounded-full',
                            status === 'new'
                                ? 'bg-emerald-500'
                                : status === 'modified'
                                  ? 'bg-blue-500'
                                  : 'bg-red-500'
                        )}
                        title={status}
                    />
                )}
            </button>
            {isFolder && open && node.children && (
                <div>
                    {node.children.map((child) => (
                        <FileTreeRow
                            key={child.path}
                            node={child}
                            allFiles={allFiles}
                            changedPaths={changedPaths}
                            activeFile={activeFile}
                            onSelect={onSelect}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── Logs ─────────────────────────────────────────────────────────────────

type LogFilter = 'all' | 'errors' | 'warns+errors'

const LogsPane = (): JSX.Element => {
    const dispatch = useDispatch<any>()
    const logs = useSelector((s: RootState) => s.specPrototype.logs)
    const scrollRef = useRef<HTMLDivElement>(null)

    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState<LogFilter>('all')
    // Pause auto-scroll while the user is hovering — stops the viewport
    // from snapping back to bottom while they read older lines.
    const [paused, setPaused] = useState(false)

    const filtered = useMemo(() => {
        const needle = search.trim().toLowerCase()
        return logs.filter((log) => {
            if (filter === 'errors' && log.level !== 'error') return false
            if (filter === 'warns+errors' && log.level === 'info') return false
            if (needle && !log.line.toLowerCase().includes(needle)) return false
            return true
        })
    }, [logs, search, filter])

    useEffect(() => {
        if (paused) return
        const el = scrollRef.current
        if (el) el.scrollTop = el.scrollHeight
    }, [filtered, paused])

    const handleClear = useCallback(() => {
        dispatch({ type: 'specPrototype/protoLogsReplaced', payload: [] })
    }, [dispatch])

    const handleCopy = useCallback(async () => {
        const text = filtered
            .map((l) => `[${new Date(l.timestamp).toISOString()}] ${l.level.padEnd(5)} ${l.line}`)
            .join('\n')
        try {
            await navigator.clipboard.writeText(text)
        } catch {
            // noop — not all envs grant clipboard access; failing silently
            // is fine since the user retains the logs visible on screen.
        }
    }, [filtered])

    const counts = useMemo(() => {
        let info = 0
        let warn = 0
        let error = 0
        for (const log of logs) {
            if (log.level === 'error') error++
            else if (log.level === 'warn') warn++
            else info++
        }
        return { info, warn, error }
    }, [logs])

    return (
        <div className="flex h-full flex-col rounded-xl border bg-background">
            <div className="flex items-center gap-3 border-b px-4 py-2.5">
                <div className="flex items-center gap-2 text-emerald-500">
                    <Terminal size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                        Dev Server Logs
                    </span>
                </div>
                <div className="flex items-center gap-1 rounded-md border bg-card p-0.5">
                    <LogFilterButton
                        active={filter === 'all'}
                        onClick={() => setFilter('all')}
                        label={`All (${logs.length})`}
                    />
                    <LogFilterButton
                        active={filter === 'warns+errors'}
                        onClick={() => setFilter('warns+errors')}
                        label={`Warn+Err (${counts.warn + counts.error})`}
                    />
                    <LogFilterButton
                        active={filter === 'errors'}
                        onClick={() => setFilter('errors')}
                        label={`Err (${counts.error})`}
                    />
                </div>
                <div className="relative flex-1 max-w-xs">
                    <Search
                        size={11}
                        className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                        placeholder="Search…"
                        className="h-7 pl-7 text-[11px]"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="ml-auto flex items-center gap-1">
                    {paused && (
                        <span className="text-[10px] text-amber-500" title="Auto-scroll paused">
                            paused
                        </span>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Copy filtered logs to clipboard"
                        onClick={handleCopy}
                        disabled={filtered.length === 0}
                    >
                        <Copy size={12} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Clear logs"
                        onClick={handleClear}
                        disabled={logs.length === 0}
                    >
                        <Trash2 size={12} />
                    </Button>
                </div>
            </div>
            <div
                ref={scrollRef}
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
                className="flex-1 overflow-y-auto p-4 font-mono text-[12px]"
            >
                {logs.length === 0 ? (
                    <p className="italic text-muted-foreground">
                        No logs yet. The dev server starts when you open the Preview tab or hit ▶.
                    </p>
                ) : filtered.length === 0 ? (
                    <p className="italic text-muted-foreground">
                        No entries match the current filter.
                    </p>
                ) : (
                    <div className="space-y-1">
                        {filtered.map((log, idx) => (
                            <LogLine key={idx} log={log} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

const LogFilterButton = ({
    active,
    onClick,
    label
}: {
    active: boolean
    onClick: () => void
    label: string
}): JSX.Element => (
    <button
        type="button"
        onClick={onClick}
        className={cn(
            'rounded px-2 py-0.5 text-[10px] font-medium transition-colors',
            active
                ? 'bg-secondary text-secondary-foreground'
                : 'text-muted-foreground hover:bg-accent'
        )}
    >
        {label}
    </button>
)

const LogLine = ({ log }: { log: PrototypeLog }): JSX.Element => {
    const ts = new Date(log.timestamp).toLocaleTimeString()
    const colour =
        log.level === 'error'
            ? 'text-red-500'
            : log.level === 'warn'
              ? 'text-amber-500'
              : 'text-foreground'
    return (
        <div className="flex gap-3">
            <span className="select-none text-muted-foreground">[{ts}]</span>
            <span className={cn('whitespace-pre-wrap break-all', colour)}>{log.line}</span>
        </div>
    )
}

// ─── History ──────────────────────────────────────────────────────────────

const HistoryPane = ({ basePath }: { basePath?: string }): JSX.Element => {
    const dispatch = useDispatch<any>()
    const snapshots = useSelector((s: RootState) => s.specPrototype.snapshots)

    return (
        <div className="h-full overflow-y-auto p-2">
            <div className="mb-3 flex items-center justify-between px-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {snapshots.length} snapshot{snapshots.length === 1 ? '' : 's'}
                </span>
                <button
                    type="button"
                    onClick={() => basePath && dispatch(loadPrototypeSnapshots(basePath))}
                    title="Refresh"
                    className="rounded p-1 hover:bg-accent"
                >
                    <RefreshCw size={11} />
                </button>
            </div>
            {snapshots.length === 0 ? (
                <div className="rounded-xl border border-dashed bg-muted/30 p-8 text-center">
                    <History size={28} className="mx-auto mb-3 text-muted-foreground/40" />
                    <p className="text-sm font-medium">No snapshots yet</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Each successful build turn creates a snapshot you can restore from.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {snapshots.map((snap) => (
                        <SnapshotCard
                            key={snap.hash}
                            snap={snap}
                            onRestore={() => {
                                if (!basePath) return
                                if (
                                    window.confirm(
                                        `Restore snapshot ${snap.hash}? Uncommitted changes will be lost.`
                                    )
                                ) {
                                    dispatch(restorePrototypeSnapshot(basePath, snap.hash))
                                }
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

const SnapshotCard = ({
    snap,
    onRestore
}: {
    snap: PrototypeSnapshot
    onRestore: () => void
}): JSX.Element => (
    <div className="group space-y-3 rounded-xl border bg-card p-4 transition-all hover:border-primary/30">
        <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <History size={12} />
                {snap.date} · {snap.author}
            </div>
            <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px] opacity-0 transition-opacity group-hover:opacity-100"
                onClick={onRestore}
            >
                Restore version
            </Button>
        </div>
        <p className="text-xs leading-relaxed">{snap.message}</p>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1 font-mono">
                <FileCode size={12} /> {snap.hash}
            </span>
            <span className="flex items-center gap-1">
                <CheckCircle2 size={12} className="text-emerald-500" /> Committed
            </span>
        </div>
    </div>
)

// ─── Footer ──────────────────────────────────────────────────────────────

const PrototypeFooter = ({ basePath }: { basePath?: string }): JSX.Element => {
    const dispatch = useDispatch<any>()
    const lastError = useSelector((s: RootState) => s.specPrototype.error)

    const handleExport = useCallback(async () => {
        if (!basePath) return
        try {
            const result = await window.specPrototype.export(basePath)
            if (result.ok && result.path) {
                window.alert(`Exported to:\n${result.path}`)
            }
        } catch (err) {
            window.alert(`Export failed: ${err instanceof Error ? err.message : String(err)}`)
        }
    }, [basePath])

    const handleOpenFolder = useCallback(async () => {
        if (!basePath) return
        try {
            const result = await window.specPrototype.openFolder(basePath)
            if (!result.ok && result.error) {
                window.alert(`Open folder failed: ${result.error}`)
            }
        } catch (err) {
            window.alert(`Open folder failed: ${err instanceof Error ? err.message : String(err)}`)
        }
    }, [basePath])

    const handleReset = useCallback(async () => {
        if (!basePath) return
        if (!window.confirm('Stop the dev server and clear local prototype state?')) return
        await window.specPrototype.stopDev(basePath)
        dispatch({ type: 'specPrototype/protoReset' })
    }, [basePath, dispatch])

    return (
        <footer className="flex h-12 shrink-0 items-center justify-between border-t bg-card px-4">
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-2 text-xs"
                    onClick={handleExport}
                    disabled={!basePath}
                >
                    <Download size={14} /> Export project…
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-2 text-xs"
                    onClick={handleOpenFolder}
                    disabled={!basePath}
                    title="Open the prototype folder in your file manager"
                >
                    <FolderOpen size={14} /> Open folder
                </Button>
                <span className="ml-2 truncate text-[10px] text-muted-foreground">
                    {basePath ?? '—'}
                </span>
                {lastError && (
                    <span className="ml-3 flex items-center gap-1 text-[10px] text-red-500">
                        <AlertCircle size={11} />
                        <span className="max-w-[280px] truncate" title={lastError}>
                            {lastError}
                        </span>
                    </span>
                )}
            </div>
            <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-2 text-xs text-red-500 hover:bg-red-500/10"
                onClick={handleReset}
                disabled={!basePath}
            >
                <RotateCcw size={14} /> Reset prototype
            </Button>
        </footer>
    )
}

const PrototypePanel = ({ variant = 'content', ...rest }: PanelProps): JSX.Element => {
    return variant === 'list' ? <ListVariant /> : <ContentVariant {...rest} />
}

// Re-export the action creators we'll need from outside (used by the
// AIAssistant prototype dispatcher to push turn events into Redux).
export const prototypeChunkActions = {
    protoTurnStarted,
    protoTurnApplied,
    protoTurnFailed,
    protoTurnCommitted,
    protoTurnParseError,
    protoTurnFinished
}

export default PrototypePanel
