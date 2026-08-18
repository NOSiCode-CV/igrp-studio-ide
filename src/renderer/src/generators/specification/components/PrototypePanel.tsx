/**
 * Prototype tab — orchestrator for the Specification rail's `prototype`
 * surface.
 *
 * This file owns the wiring only: it composes the chat aside (with
 * Chat / Palette modes), the device-framed Preview pane (or the manifest
 * Edit canvas), the Files / Logs / History tabs, the dev-server toggle,
 * and the contextual prompt builder (`buildSystemPrompt`) that ships to
 * the AIAssistant on every turn.
 *
 * Sub-components, constants, and pure helpers live under `./prototype/`:
 *
 *     ai-prompts/   golden anatomy, always-included list, engine catalog
 *                   + skill-context system-prompt builders
 *     persistence/  localStorage read/write for chat width, viewport,
 *                   attached doc ids, skill banner dismissal
 *     preview/      PreviewToolbar + PreviewPane + URL bar + Pages
 *                   dropdown + device pill + computePreviewUrl
 *     files/        FilesPane (Explorer + Monaco viewer), file-tree
 *                   folding, language detection
 *     logs/         LogsPane with filter + search + auto-scroll
 *     history/      HistoryPane snapshot grid + restore
 *     banners/      first-run, skill-install, skill-update banners
 *     chat/         tab switcher (Chat / Palette) + ComponentPalettePane
 *     footer/       Export / Open / Reset action bar
 *
 * Look there for the component bodies; this file is just the glue.
 */
import { cn } from '@renderer/lib/utils'
import type { RootState } from '@renderer/redux'
import {
    protoTurnApplied,
    protoTurnCommitted,
    protoTurnFailed,
    protoTurnFinished,
    protoTurnParseError,
    protoTurnStarted
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
import { type JSX, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector, useStore } from 'react-redux'
import { Group, Panel, Separator } from 'react-resizable-panels'
import { AIAssistant, type ChatAttachment } from './shared/AIAssistant'
import { EditCanvas } from './prototype/EditCanvas'
import { DocAttachPicker } from '@renderer/features/spec-attachments'
import {
    readPersistedComponentIds,
    writePersistedComponentIds,
    useEnginePalette,
    type EnginePaletteComponent
} from '@renderer/features/component-palette'
import { useEngineCatalog } from '@renderer/features/engine-catalog'
import { usePrototypeSkills } from '../hooks/usePrototypeSkills'
import { GOLDEN_LIST_PAGE_EXAMPLE } from './prototype/ai-prompts/golden-list-example'
import { buildEngineCatalogBlock } from './prototype/ai-prompts/engine-catalog'
import { buildSkillContextBlock } from './prototype/ai-prompts/skill-context'
import { computePreviewUrl } from './prototype/preview/url'
import { PreviewPane } from './prototype/preview/PreviewPane'
import { PreviewToolbar } from './prototype/preview/PreviewToolbar'
import type { DeviceFrame, PreviewMode } from './prototype/preview/types'
import { FilesPane } from './prototype/files/FilesPane'
import { LogsPane } from './prototype/logs/LogsPane'
import { HistoryPane } from './prototype/history/HistoryPane'
import { ChatPanelTabs } from './prototype/chat/ChatPanelTabs'
import { ComponentPalettePane } from './prototype/chat/ComponentPalettePane'
import type { ChatPanelMode } from './prototype/chat/types'
import { PrototypeFooter } from './prototype/footer/PrototypeFooter'
import { FirstRunBanner } from './prototype/banners/FirstRunBanner'
import { SkillInstallBanner } from './prototype/banners/SkillInstallBanner'
import { SkillUpdateBanner } from './prototype/banners/SkillUpdateBanner'
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
interface PanelProps {
    basePath?: string
    currentItem?: any
    variant?: 'list' | 'content'
}

type PrototypeTab = 'preview' | 'files' | 'logs' | 'history'

const TABS: { id: PrototypeTab; label: string }[] = [
    { id: 'preview', label: 'Preview' },
    { id: 'files', label: 'Files' },
    { id: 'logs', label: 'Logs' },
    { id: 'history', label: 'History' }
]

// Pinned palette components (M4.28) live in `features/component-palette` so
// the persistence shape can be reused by future generators that want their
// own pinned-component vocabulary. We pass `namespace: 'prototype'` here.
const PALETTE_NAMESPACE = { namespace: 'prototype' as const }

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
