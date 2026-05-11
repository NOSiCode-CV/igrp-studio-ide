# Specification Project Type — Implementation Plan

> Status: Draft v0.1 · Branch: `feat/specification-generator` (on top of `dev`)
> Repo: `studio/igrp-studio-ide`

## 1. Objetivo

Adicionar um novo tipo de projeto **`Specification`** ao IGRP Studio, ao lado dos geradores existentes (`ui`, `api`). O utilizador documenta a especificação (Documents + Knowledge Base) e gera/itera um protótipo a partir dela.

Não é um produto novo — é uma extensão do IDE existente.

### 1.1. Arquitetura de 3 pilares (alinhada ao protótipo visual)

O protótipo validado em `app.new` consolidou a UI em **3 ferramentas** (não 4): o Chat deixou de ser tab autónoma e passou a ser **AI Assistant integrado** dentro de Documents e Prototype.

| Pilar | Papel | AI Assistant |
|---|---|---|
| **Documents** (cérebro) | Editor Markdown (edit / preview / split) com `react-markdown` + GFM | Chat lateral para análise de requisitos em tempo real |
| **Knowledge Base** (memória) | Repositório indexado de referências (PDF, DOCX, URLs, YouTube…) | — (consultada via RAG pelos outros pilares) |
| **Prototype** (execução) | Build chat + Live Preview multi-viewport + Files + Logs + Version History | Chat dedicado à geração/edição de código |

Rota inicial do gerador: `documents`. Tema: **Dark Root** (`#000000`) Black & Blue. Command palette global `Cmd/Ctrl+K`.

## 2. Inventário do que reutilizamos (já existe no repo)

| Capability | Localização atual |
|---|---|
| Conversão de ficheiros → Markdown | `src/main/handlers/markitdown-handler.ts` + `scripts/build-markitdown-bin.sh` |
| Editor de código | Monaco (`@monaco-editor/react`) — `src/renderer/src/components/monaco-editor.tsx` |
| Terminal embebido | xterm + node-pty — `src/renderer/src/components/integrated-terminal.tsx` |
| Git local | `src/main/services/git-service.ts` |
| Workspace model | `src/main/services/workspace-service.ts` |
| Engines (scaffold runtime) | `src/main/engines/{NextjsEngine,SpringEngine,DotNetEngine}.ts` + `EngineFactory.ts` |
| Settings persistentes | `electron-store` |
| Tabs / navegação interna | `src/renderer/src/components/navigation/TabContext` |
| Estado global | Redux Toolkit — `src/renderer/src/redux` |
| Design system | `@igrp/igrp-framework-react-design-system` + Tailwind v4 + shadcn |
| i18n | i18next — `src/renderer/src/localization` |
| Testes | Jest — `jest.config.ts`, `__tests__/` |

## 3. Decisões técnicas (questões da spec — fechadas)

1. **Renderer:** Vite (já é o atual, não há migração).
2. **MarkItDown:** reutilizar mecanismo existente (`build-markitdown-bin.sh`).
3. **Embeddings:** configurável; default cloud (OpenAI `text-embedding-3-small`).
4. **Git:** reutilizar `git-service.ts`.
5. **Editor Markdown:** Monaco em `language=markdown` + preview side-by-side.
6. **Preview do protótipo:** `next dev` via `NextjsEngine` + `<webview>` Electron.
7. **Multi-projeto:** seguir o modelo atual (um workspace ativo por janela).
8. **Estado:** Redux Toolkit slices (não Zustand) — alinhado ao repo.
9. **Secrets:** `safeStorage` do Electron para API keys.
10. **VectorDB:** LanceDB embarcado (npm `@lancedb/lancedb`), pasta por projeto dentro do workspace.

## 4. Estrutura de ficheiros — novos módulos

```
src/
├── main/
│   ├── engines/
│   │   ├── EngineFactory.ts                # MOD: registar 'specification'
│   │   └── SpecificationEngine.ts          # NEW
│   ├── handlers/
│   │   ├── spec-project-handler.ts         # NEW
│   │   ├── spec-kb-handler.ts              # NEW
│   │   ├── spec-chat-handler.ts            # NEW
│   │   ├── spec-prototype-handler.ts       # NEW
│   │   └── markitdown-handler.ts           # REUSE
│   └── services/
│       ├── llm/
│       │   ├── openrouter-service.ts       # NEW
│       │   ├── cli-llm-service.ts          # NEW (node-pty)
│       │   └── llm-router.ts               # NEW
│       ├── vectordb-service.ts             # NEW (LanceDB)
│       ├── rag-service.ts                  # NEW
│       └── prototype-generator-service.ts  # NEW
│
├── preload/
│   └── index.ts                            # MOD: expor window.api.spec.*
│
├── renderer/src/
│   ├── generators/specification/           # NEW (já scaffolded)
│   │   ├── index.tsx
│   │   ├── components/
│   │   │   ├── TabManager.tsx
│   │   │   ├── DocumentsPanel.tsx          # + AIAssistant lateral
│   │   │   ├── KnowledgeBasePanel.tsx
│   │   │   ├── PrototypePanel.tsx          # build chat + preview + files + logs
│   │   │   └── shared/
│   │   │       ├── AIAssistant.tsx         # chat reutilizado em Docs e Prototype
│   │   │       ├── MarkdownEditor.tsx
│   │   │       ├── MarkdownPreview.tsx     # react-markdown + remark-gfm
│   │   │       ├── DropZone.tsx
│   │   │       └── CommandPalette.tsx
│   │   ├── contexts/SpecificationContext.tsx
│   │   ├── hooks/
│   │   ├── helpers/
│   │   └── types/index.ts
│   ├── redux/slices/
│   │   ├── spec-projects.slice.ts          # NEW
│   │   ├── spec-kb.slice.ts                # NEW
│   │   ├── spec-chat.slice.ts              # NEW
│   │   └── spec-prototype.slice.ts         # NEW
│   └── routes/
│       ├── routeConstants.ts               # MOD: PATH_PAGE_BUILDER_SPECIFICATION
│       └── Routes.tsx                      # MOD: registar GeneratorSpecification
│
└── docs/specification-project-type/
    └── IMPLEMENTATION_PLAN.md              # este documento
```

## 5. Esquema IPC (canais novos)

Padrão: `spec:<domain>:<action>`. Expostos no preload em `window.api.spec.*`.

### `spec:project:*`
- `spec:project:create` ← `{ name, description, settings }` → `SpecificationProject`
- `spec:project:get` ← `{ id }` → `SpecificationProject`
- `spec:project:update` ← `{ id, patch }` → `SpecificationProject`
- `spec:project:list` ← `{ workspaceId }` → `SpecificationProject[]`

### `spec:kb:*`
- `spec:kb:add-file` ← `{ projectId, filePath }` → `KBItem` (stream de progresso via `spec:kb:progress`)
- `spec:kb:add-url` ← `{ projectId, url }` → `KBItem`
- `spec:kb:list` ← `{ projectId }` → `KBItem[]`
- `spec:kb:reindex` ← `{ projectId, itemId }` → `KBItem`
- `spec:kb:remove` ← `{ projectId, itemId }` → `void`
- `spec:kb:search` ← `{ projectId, query, topK }` → `Array<{ chunk, score, source }>`
- `spec:kb:preview` ← `{ projectId, itemId }` → `{ markdown, metadata }`

### `spec:doc:*`
- `spec:doc:create` / `spec:doc:read` / `spec:doc:write` / `spec:doc:delete` / `spec:doc:list`
- `spec:doc:convert-and-insert` ← `{ projectId, docId, filePath }` → `{ markdown }`
- `spec:doc:send-to-kb` ← `{ projectId, docId }` → `KBItem`

### `spec:chat:*`
- `spec:chat:list-sessions` ← `{ projectId, scope }` → `Session[]`
- `spec:chat:send` ← `{ projectId, sessionId, message, model, useRag }` → stream via `spec:chat:chunk`
- `spec:chat:cancel` ← `{ requestId }` → `void`
- `spec:chat:list-models` ← `{ provider }` → `Model[]`

### `spec:prototype:*`
- `spec:prototype:generate` ← `{ projectId, message, attachments }` → stream via `spec:prototype:op`
- `spec:prototype:files` ← `{ projectId }` → `FileTree`
- `spec:prototype:read-file` ← `{ projectId, path }` → `{ content }`
- `spec:prototype:start-dev` ← `{ projectId }` → `{ url }`
- `spec:prototype:stop-dev` ← `{ projectId }` → `void`
- `spec:prototype:logs` (event) → linhas do dev server
- `spec:prototype:export` ← `{ projectId, targetPath }` → `void`
- `spec:prototype:snapshots` ← `{ projectId }` → `Snapshot[]`
- `spec:prototype:restore` ← `{ projectId, snapshotId }` → `void`

### `spec:settings:*`
- `spec:settings:get` / `spec:settings:set` (chaves: API keys via safeStorage, default model, embeddings, CLI paths)

## 6. Esqueletos críticos (assinaturas)

```ts
// main/engines/SpecificationEngine.ts
export class SpecificationEngine implements BaseEngine {
    init(workspacePath: string): Promise<void>
    create(opts: { name; description; settings }): Promise<SpecificationProject>
    open(id: string): Promise<SpecificationProject>
    delete(id: string): Promise<void>
}

// main/services/llm/llm-router.ts
export interface LLMAdapter {
    listModels(): Promise<Model[]>
    chat(messages: Message[], opts: ChatOptions): AsyncIterable<Chunk>
    supportsVision(): boolean
}
export class LLMRouter {
    register(provider: string, adapter: LLMAdapter): void
    get(provider: string): LLMAdapter
}

// main/services/vectordb-service.ts
export class VectorDBService {
    openCollection(projectId: string): Promise<Table>
    upsert(projectId, items: { id; vector; text; meta }[]): Promise<void>
    query(projectId, vector, topK): Promise<Hit[]>
}

// main/services/rag-service.ts
export class RagService {
    ingest(projectId, mdPath): Promise<{ chunks: number }>
    retrieve(projectId, query, topK): Promise<Hit[]>
    buildContext(projectId, query): Promise<{ blocks: ContextBlock[] }>
}

// main/services/prototype-generator-service.ts
export class PrototypeGeneratorService {
    generate(input: {
        projectId; message; attachments; specContext; existingTree
    }): AsyncIterable<FileOpEvent>
    apply(projectId, ops: FileOp[]): Promise<Snapshot>
}
```

## 7. Roadmap por milestone

### M1 — Foundations (scaffold + engine) ✅
- [x] Branch `feat/specification-generator`.
- [x] Pasta `generators/specification/` com `index.tsx`, panels (Documents/KB/Prototype), contexto, types.
- [x] `routeConstants.PATH_PAGE_BUILDER_SPECIFICATION` + lazy import em `Routes.tsx`.
- [x] `SpecificationEngine` em `main/engines/` + registo no `EngineFactory` (`ENV_TYPES.SPECIFICATION`, case `'specification'`).
- [x] `FrameworkType` e `SpecificationConfigData` em `main/types.d.ts`.
- [x] Tipo `Specification` na wizard de criação de projeto (`pages/project/`) com template `data.specificationFrameworks` + `SpecificationConfig` em `components/configurations/`.
- [x] Navegação automática pós-criação via `navigateToNextPage` (`use-workspace.ts`) → `PATH_PAGE_BUILDER_SPECIFICATION`.
- [x] Layout sidebar-09 com rail (Home + KB + Documents + Prototype) + secondary panel + main content.
- [x] Footer-aware container (`pb-8`) para o footer fixo do Studio.
- [x] **Rail alinhado ao `app-sidebar.tsx` do Studio** (largura `w-20`, active state `text-primary`, label `text-xs` com truncate, hover `bg-accent`). Continuidade visual entre generators.
- [x] **Rail reordenado** para reflectir o data flow: **Knowledge → Documents → Prototype**.
- [x] Secondary panel **escondido na tab Prototype** (que tem layout próprio chat+main).
- [~] Slice Redux `spec-projects.slice.ts` + IPC `spec:project:*` — **adiada** (CRUD de projetos vem do `workspace-service` existente; um slice dedicado só é necessário se aparecerem operações específicas do tipo).

> **Decisão de design — engine reutiliza `NextjsEngine`:** O `SpecificationEngine.createProject` cria a estrutura `{docs, kb, vectors, chats, prototype}` e delega `NextjsEngine.createProject` para `<basePath>/prototype/`. Conversão `SpecificationConfigData → NextConfigData` via helper `toNextConfig()` para descartar campos extras (`defaultLLM`, `embeddings`, `systemPrompt`) que o lib do Next.js não conhece. `addProjectToWorkspace` do workspace-engine é skipado para `framework === 'specification'` (lib externo não conhece o tipo).

### M2 — Documents ✅ (M2D)

> **Fluxo correcto:** KB → Documents (autoria) → Prototype. **Documents não envia para KB** — consome via `kbRefs` (lista de KBItems linkados). Templates aceleram a autoria.

- [x] `DocumentsPanel`: explorer + editor Markdown (**Monaco** com `language=markdown`) + preview (`react-markdown` + `remark-gfm`) + modos edit/preview/split.
- [x] Drop zone integrada no editor → `spec:doc:convert-and-insert` (usa `markitdown-handler`).
- [x] CRUD de docs via `spec:doc:*` + slice `redux/specDocs/` (debounce save 500ms; flush no unmount).
- [x] FileTree recursivo com hover actions: `+ doc inside` / `+ folder inside` / rename / remove (em pastas) e seleção (em ficheiros).
- [x] `NewNodeDialog` com **template picker** (Blank, PRD, User Stories, Architecture, API Spec, Data Model).
- [x] Inspector com ToC parser (ignora code fences) + **lista de KB items com checkbox** (toggle linka ao doc via `kbRefs`).
- [x] **KB inline em Documents:** `+ file` / `🔗 URL` no Inspector adicionam directo à KB sem mudar de tab; itens em ingestão aparecem com spinner.
- [x] ~~`Use in Prototype` button no Inspector~~ — **descontinuado em M4.12** (substituído pelo spec picker no chat do Prototype, ver M4.29). A remover do `DocInspector.tsx`.
- [x] Eager-load de KB e Docs em `SpecificationLayout` para que Documents tenha sempre KB items disponíveis.

### M2D.18 — Multi-doc tabs ✅

> **Motivação:** abrir vários documentos em simultâneo, cada um com o seu próprio buffer, AI chat, diff pendente e KB linked. Substitui o modelo single-doc onde trocar de ficheiro fazia flush do buffer e perdia o histórico do chat.

**Decisões de arquitectura**

- **Reutilizar `TabContext`** (`src/renderer/src/components/navigation/TabContext.tsx`) — mesmo provider que o `ui` e `api` generators. `tab.id === docId` (string estável). Tab-0 (placeholder "Overview") fica reservada para "no document open".
- **Padrão tabs-mounted-hidden** (igual ao `ui/components/TabManager.tsx`) — todos os panes abertos ficam montados, o inactivo recebe `display: hidden`. Sem unmount/remount entre tabs → Monaco e AIAssistant **preservam o estado local** sem precisar de Redux para o chat.
- **Slice `specDocs` normalizado** — substituído `{ buffer, dirty, viewMode, inspectorOpen, chatOpen }` (singular) por `byDoc: Record<docId, DocPerState>` + `saving: Record<docId, boolean>`. Entries criadas lazy no primeiro `docSelected` ou `docFocused`; removidas em `docTabClosed` / `docNodeRemoved`.
- **`pendingProposal` + `proposalHistory` + `proposalSummaries` per-doc no Redux** — antes era state local em `DocumentsPanel`. Agora vivem em `byDoc[docId]`, sobrevivem ao `display:hidden` e são acessíveis ao `DocFooter` / outros consumers se preciso.
- **Selectors `docId`-scoped** (`selectDocBuffer(docId)`, `selectDocViewMode(docId)`, etc.) — nenhum consumer faz `useSelector(s => s.specDocs.byDoc)`. Editar um doc não re-renderiza panes de outros tabs. `makeSelectDocProposalStatus(docId)` usa `createSelector` para memoizar a união pending+history.
- **`AIAssistant` continua local-state** — `messages: ChatMessage[]` em `useState`, sem Redux. Justificação: cada `DocTabPane` tem o seu `AIAssistant`; com tabs montados, o histórico persiste enquanto o tab estiver aberto. Streaming concorrente já é seguro pelo filtro `findIndex(m => m.id === requestId)` que faz noop em chunks de outras instâncias. Evita refactor invasivo e dispatch-por-token.
- **`selectDoc` thunk inteligente** — só faz IPC `window.specDoc.read` no primeiro open. Re-clicks despoletam apenas `docFocused` (lightweight, sem IO). Clicks em tab headers já existentes não re-lêem do disco nem fazem flush do buffer.
- **`TabsCleanup` component** — observa `tabs[]` e dispatcha `docTabClosed(id)` para qualquer id que desapareça. Mantém `byDoc` enxuto.

**Trade-offs assumidos**

- N AIAssistants montados → N setState noop por chunk de streaming. Para 10-15 tabs é trivial (cada noop é ~1µs). Acima disso a UX (não a perf) começa a degradar — limite igual ao do VSCode.
- N Monaco instances mounted → ~150KB extra por tab. Aceitável até ~15 tabs. Mitigação futura se necessária: refactor `DocEditor` para "1 editor + N models" pattern do VSCode (deferido — YAGNI).

**Ficheiros impactados**

- **MOD** `src/renderer/src/redux/specDocs/reducer.ts` — `byDoc` map + selectors + actions (`docFocused`, `docTabClosed`, `docProposalStaged`, `docProposalResolved`).
- **MOD** `src/renderer/src/redux/specDocs/thunks.ts` — `selectDoc` agora skipa IPC quando doc já aberto; `saveDocBuffer` payload `{id, ...}`.
- **MOD** `src/renderer/src/generators/specification/components/DocumentsPanel.tsx` — `ContentVariant` reescrito com `useTabs()` + `TabsNavigation` + `DocTabPane` por tab + `TabsCleanup`. `ListVariant.handleSelect` chama `handleNewTab` antes de `selectDoc`.
- **MOD** `src/renderer/src/generators/specification/components/SpecificationLayout.tsx` — wrap em `<TabProvider>`.
- **MOD** `src/renderer/src/generators/specification/components/PrototypePanel.tsx` — usa selectors novos (`selectDocBuffer(selectedId)`).
- **MOD** `src/renderer/src/generators/specification/utils/searchReplaceParser.ts` — `ProposalStatus` movido para cá (canonical home). `AIAssistant` re-exporta para back-compat.
- **MOD** `src/renderer/src/generators/specification/components/shared/AIAssistant.tsx` — import de `ProposalStatus` do utils + re-export.

### M2D.19 — Resizable right pane (Chat | Inspector tabs) ✅

> **Motivação:** o chat estava preso a 360px enquanto o inspector ocupava ~22% à direita; juntos comiam metade do ecrã com o md content esmagado no meio. Utilizador quer chat maior + ajustar a largura à mão.

**Decisões de arquitectura**

- **Right pane mutuamente exclusivo** — chat e inspector partilham o mesmo painel à direita; o utilizador alterna por tabs no header (`Chat | Inspector | ✕`). Justificação: o inspector é principalmente setup (linkar KB, navegar ToC) — raramente preciso de o ter aberto ao mesmo tempo que itera com o chat. Padrão familiar (VSCode/Cursor sidebar).
- **Slice `rightPane: 'chat' | 'inspector' | null`** substitui `chatOpen` + `inspectorOpen`. Acção única `docRightPaneSet({id, pane})`. Toolbar buttons fazem toggle: clicar o activo colapsa.
- **`react-resizable-panels` v4** (já em deps, usado em `features/markitdown`) — `Group` + `Panel` + `Separator`. Min 320px, max 50% viewport, default 480px. `onResize` recebe `{inPixels}` e dispatcha `rightPaneWidthChanged`.
- **Largura persistida em `localStorage`** (key `spec.docs.rightPaneWidth`) — global, não per-doc nem per-tab. Lida no `initialSpecDocsState` via `readPersistedRightPaneWidth()`. `try/catch` em volta de `setItem` para sobreviver a private mode.
- **Inspector "embedded"** — `DocInspector` perdeu o `<aside w-22% border-l>` e o header "Inspector" próprio; agora renderiza só o body de scroll. O `DocRightPane` (novo componente local em `DocumentsPanel`) fornece o chrome (tabs header, border, fundo).
- **`DocFooter` ficou só status** — botão de toggle do inspector mudou-se para o `DocToolbar`.
- **Quando `rightPane === null`** — não renderiza `<Group>`, retorna o `mdColumn` directo. Evita um `Separator` decorativo sem segundo painel.
- **Toolbar collapse trigger único** (padrão shadcn `SidebarTrigger`) — em vez de dois botões `Assistant + Inspector` na toolbar, ficou um só `PanelRightOpen / PanelRightClose` ao lado do Export. A escolha de tab (Chat vs Inspector) acontece dentro do right pane (no header já existente). Toolbar fica enxuta, sinal visual familiar.
- **Memória do último modo** — `useState<lastPane>` no `DocTabPane` lembra o último valor não-null de `rightPane`. Reabrir restaura o que estava (inspector → colapsa → reabrir = inspector). State per-tab; sobrevive enquanto a tab estiver montada (que é sempre, no padrão tabs-mounted-hidden). Não precisa de slice change.

**Ficheiros impactados (M2D.19)**

- **MOD** `src/renderer/src/redux/specDocs/reducer.ts` — `DocRightPane` type + `rightPane` field per-doc + `rightPaneWidth` global + actions `docRightPaneSet` / `rightPaneWidthChanged` + selectors `selectDocRightPane` / `selectRightPaneWidth` + helpers de persistência localStorage.
- **MOD** `src/renderer/src/generators/specification/components/DocumentsPanel.tsx` — `DocTabPane` usa `<Group> + <Panel> + <Separator>`; novo componente local `DocRightPane` (tabs header + close button + body slot).
- **MOD** `src/renderer/src/generators/specification/components/documents/DocToolbar.tsx` — props `chatOpen + onToggleChat` substituídos por `rightPane + onSetRightPane`; novo grupo de buttons (Assistant + Inspector).
- **MOD** `src/renderer/src/generators/specification/components/documents/DocFooter.tsx` — drop do botão `onToggleInspector`.
- **MOD** `src/renderer/src/generators/specification/components/documents/DocInspector.tsx` — drop do `<aside>` chrome e do header "Inspector"; passa a `<div className="flex h-full flex-col">`.

### M2D.20 — Sync scroll Preview → Editor ✅

> **Motivação:** no `viewMode='split'`, scroll na preview agora segue para a linha equivalente no editor Monaco. Direcção única (preview → editor) — pedido explícito do utilizador. Editor → preview pode vir depois se útil.

**Decisões técnicas**

- **Mapeamento via remark AST:** `react-markdown` v9 expõe `node.position.start.line` para cada bloco do mdast. `DocPreview` usa a prop `components` para anexar `data-source-line={N}` em todos os blocos relevantes (h1-h6, p, ul, ol, blockquote, pre, table, hr). Inline elements (em, strong, code) não recebem o atributo — granularidade de bloco é suficiente.
- **Hook `usePreviewToEditorScrollSync`** (`hooks/useDocScrollSync.ts`) — adiciona um `scroll` listener no container da preview, throttled com `requestAnimationFrame`. Em cada tick, percorre `[data-source-line]` em ordem de documento e escolhe o primeiro cujo bottom esteja `>= viewportTop` da preview. Chama `editor.revealLineInCenter(line)` no Monaco.
- **Hook desactivado fora do split** — `enabled = viewMode === 'split' && !pendingProposal`. Quando há `pendingProposal` o editor é trocado por `DocDiffPreview`, partindo a ref do Monaco — desligar o sync evita refs zombie.
- **Sem editor → preview** — explicitamente fora de scope. Evita feedback-loop guards e mantém a implementação simples.
- **Refs fora do Redux** — `editorRef`, `previewRef` em `useRef` no `DocTabPane`. State per-tab, sobrevive enquanto a tab estiver montada (sempre, no padrão tabs-mounted-hidden).
- **Edge case — code blocks longos:** uma `<pre>` ocupa muitas linhas mas o source mapping é fixo (a linha da abertura do fence). Aceite — comportamento idêntico ao VSCode/Cursor markdown preview.
- **Output contract dos `Components` do react-markdown v9** — tipos rigorosos exigem assinaturas específicas por tag (`HTMLAttributes<HTMLHeadingElement>` etc.). Em vez de um factory genérico (que não satisfaz o contrato), `DocPreview` usa um helper minúsculo `sourceLineAttr(node)` espalhado em cada componente inline.

**Ficheiros impactados (M2D.20)**

- **MOD** `src/renderer/src/generators/specification/components/documents/DocPreview.tsx` — `forwardRef<HTMLDivElement>` + prop `components` com `sourceLineAttr` por bloco.
- **MOD** `src/renderer/src/generators/specification/components/documents/DocEditor.tsx` — nova prop `onMount?: OnMount` para o pai apanhar a Monaco instance.
- **NEW** `src/renderer/src/generators/specification/hooks/useDocScrollSync.ts` — hook isolado, rAF-throttled, no-op quando `enabled=false`.
- **MOD** `src/renderer/src/generators/specification/components/DocumentsPanel.tsx` (`DocTabPane`) — refs + `usePreviewToEditorScrollSync(previewRef, editorRef, viewMode === 'split' && !pendingProposal)`.

### M2D.21 — Chat doc attachments ✅

> **Motivação:** o utilizador quer anexar outro doc do mesmo spec ao chat actual como input read-only ("baseado no PRD, gera User Stories"). Antes a única forma era enviar para a KB — workflow indirecto e com staleness. Agora há um botão `@ Attach` no composer.

**Decisões de arquitectura**

- **Anexos vivem com a chat session, não com o doc** — `attachedDocIds: string[]` em `useState` no `DocTabPane`. Persiste enquanto a tab estiver aberta (= AIAssistant montado, mensagens preservadas). Não vai para Redux nem para disco. Distinção clara face a `kbRefs` (doc-level, persistido).
- **Externos → KB; produzidos no spec → chat attach.** Regra simples para o utilizador: se é PDF/URL externo, manda para a KB (com indexação RAG). Se é outro spec doc autorado neste projecto, anexa directamente ao chat — sem indexação intermediária.
- **Buffer-first read** — `contextProvider` lê via `store.getState().specDocs.byDoc[id]?.buffer` quando o doc anexado também está aberto noutra tab (apanha edições não-guardadas), com fallback para `window.specDoc.read(basePath, id)` quando não. Marca `(unsaved buffer)` no nome quando dirty.
- **Sem subscrição de `byDoc` no DocTabPane** — uso `useStore()` para obter ref ao store e leio dentro da closure do `contextProvider` (executa por turn, não em cada render). Evita re-render do DocTabPane em cada keystroke de outra tab anexada.
- **3 papéis explícitos no system prompt** — secção "Document roles — STRICT" diz ao LLM: (1) Active document = único editável via SEARCH/REPLACE; (2) Reference documents = read-only inputs, citação `[Doc: <name>]`, NUNCA emitir SEARCH/REPLACE contra eles; (3) Knowledge Base = external knowledge, citação `[KB: <name>]`, menor autoridade.
- **Order do system prompt:** instructions → Reference documents (read-only) → Active document (editing target, mais perto da user message) → KB items list → KB chunks (RAG). Active doc fica perto da user message para captura de recência da atenção.
- **Anti-recursão** — anexos não trazem os seus próprios anexos. 1 nível só. Hard-coded (não há recursão para começar).
- **Auto-clean orphans** — `useEffect([nodes])` filtra ids que deixaram de existir.
- **Picker UX** (`DocAttachPicker`) — popover compacto com search + checkboxes. Estimativa de tokens (`~chars/4`) ao lado de cada item quando o buffer já está disponível (i.e. doc também aberto). Self-ref escondido via `excludeDocId={docId}`.
- **Chips no composer** — acima do textarea, com `(@ Nome ✕)`. Marcador amarelo `●` quando o anexado tem `dirty=true` noutra tab (UX honesta — utilizador sabe que vê o buffer e não a versão guardada).
- **`composerSlot` prop** no `AIAssistant` — não acopla o picker ao componente (mantém `AIAssistant` reutilizável noutros modes que não querem attach).

**Ficheiros impactados (M2D.21)**

- **MOD** `src/renderer/src/generators/specification/components/shared/AIAssistant.tsx` — props `attachments?: ChatAttachment[]`, `onRemoveAttachment?`, `composerSlot?: ReactNode`. Chips renderizadas acima do textarea; slot antes do hint Enter/Shift+Enter. `ChatAttachment` exported.
- **NEW** `src/renderer/src/generators/specification/components/documents/DocAttachPicker.tsx` — popover com search + checkboxes; `estimateTokens` callback opcional.
- **MOD** `src/renderer/src/generators/specification/components/DocumentsPanel.tsx` (`DocTabPane`) — `useState attachedDocIds` + `useStore` (lazy buffer reads); `chatAttachments: ChatAttachment[]` derivado; auto-clean orphans; nova secção "Document roles — STRICT" no system prompt; injecção `## Reference documents` antes de active doc; label do composer ganha sufixo `· N attached`.

### M2L — LLM Stack ✅ (era parte do M2 original)

> **Backend** dividido em adapters por provider; renderer fala apenas com `LLMRouter` via IPC.

- [x] `services/llm/types.ts` — `LLMAdapter`, `LLMMessage`, `LLMChatChunk` types.
- [x] `services/llm/openrouter-service.ts` — HTTP/SSE streaming, lista modelos com cache 1h.
- [x] `services/llm/cli-llm-service.ts` — `claude` / `ollama` via `child_process.spawn`. **Cascade de auto-probe**: override → PATH directo → login shell (`zsh -lic`) → caminhos conhecidos (incluindo `~/.nvm/versions/node/<v>/bin/`).
- [x] `services/llm/llm-router.ts` — registry + dispatch, `listAllModels` agregado, `statuses` por provider.
- [x] `services/spec-settings-service.ts` — `safeStorage` para secrets + JSON para preferences.
- [x] `services/embeddings-service.ts` actualizado para usar `specSettingsService` (consistência).
- [x] IPC `spec:llm:*` (statuses, list-models, chat-start/cancel/chunk, detect-clis) + `spec:settings:*` (secrets CRUD + test connection + preferences).
- [x] Preload `window.specLLM` + `window.specSettings` + tipos completos em `env.d.ts`.
- [x] **Settings UI** — section "AI Providers" com cards OpenRouter / OpenAI / Voyage (save com show/hide, **Test connection**, Clear) + sub-card **"Local CLIs"** com Re-detect, status, file path override.
- [x] **AIAssistant component** (`components/shared/AIAssistant.tsx`) — props-driven (`mode: 'docs' | 'prototype'`), streaming SSE, model picker agrupado por provider, Stop / Clear, render markdown+GFM, banner se nenhum provider pronto.
- [x] **Intent picker** no composer (Ask / Append / Replace) — quando Append/Replace, anexa directiva `[Studio intent: …]` à user message **e** aplica automaticamente o markdown block ao doc no fim do streaming. Replace pede confirmação. Salvaguarda: se a resposta não tiver bloco \`\`\`markdown, o auto-apply é skipado e o bubble mostra aviso âmbar.
- [x] **Action bar nas bubbles do assistant** — Copy / Insert / Replace (visível em hover; `extractMarkdownOrFull` extrai o maior bloco fenced ou cai para conteúdo inteiro).
- [x] **Retry button** em mensagens com erro — drop a assistant falhada, re-fire o histórico até ao último user message. Handler do main garante `done` mesmo quando adapter yielda só `error` (evita streaming preso).
- [x] Wired em `DocumentsPanel` — botão Assistant abre painel à direita; `contextProvider` recebe `{userMessage, useKB}` e injecta system prompt com **conteúdo do doc + nomes dos KBItems linkados** via `kbRefs`.
- [x] **Output contract reforçado** no system prompt do Documents — instrui o LLM a responder só com \`\`\`markdown block para drafts/edits, prosa para perguntas, nunca os dois juntos.
- [x] Wired em `PrototypePanel` — chat 360px à esquerda, `mode='prototype'`, `supportsKB=true`, `contextProvider` injecta spec do doc activo + KB linked + nota explícita "runtime apply pipeline OFFLINE" (até M4 backend chegar).

### M3 — Knowledge Base + RAG ✅
- [x] `VectorDBService` (LanceDB) — `@lancedb/lancedb` lazy-loaded, upsert idempotente, query com score normalizado.
- [x] `EmbeddingsService` com adapter OpenAI + **stub determinístico** (auto-fallback em dev quando não há key — sem precisar de env flag).
- [x] `Chunker` paragraph-aware com sha1 ids determinísticos + overlap.
- [x] `SpecKBService` pipeline `pending → converting → indexing → indexed` com eventos `spec:kb:progress`; `<basePath>/kb/index.json` como state of record.
- [x] IPC `spec:kb:*` (add-file/url, list, get, remove, reindex, search) + preload `window.specKB`.
- [x] Slice `redux/specKB/` + thunks + progress subscriber em `App.tsx`.
- [x] `KnowledgeBasePanel` — list (search, items reais, skeletons, +file/+URL, drop zone partilhado, menu reindex/remove) e content (metadata cards, raw/rendered toggle, semantic search com hits).
- [x] `electron-builder.yml`: `asar: false` já cobre LanceDB native bindings.
- [x] **`apache-arrow`** instalado (peer dep do LanceDB).
- [x] **M3.12 RAG real** — `specKBService.search` aceita `{ kbItemIds }` (over-fetch + filtro por `metadata.kbItemId`); IPC + preload + types propagam o filtro. AIAssistant ganha **toggle "KB on/off"** no header (Library icon). `contextProvider` em Documents corre `window.specKB.search(query, 6, { kbItemIds: refs })` e injecta os top-K chunks formatados (`### Chunk N · score X · from "Item Name"`) no system prompt. Output contract pede citações inline `[KB: <item name>]`. Label do composer reflecte estado: `KB grounded · N chunks` / `2 KB linked (KB off)` / `no KB linked`.

### M4 — Prototype (Build chat + Preview + Files + Logs + History) — UI shell ✅ · backend pendente

**M4.0 — UI shell ✅**
- [x] `PrototypePanel` reescrito com layout próprio: chat 360px à esquerda (AIAssistant `mode='prototype'`, `supportsKB`, intent picker visível) + main area com Tabs **Preview / Files / Logs / History** + footer (`Export` / `Open folder` / `Reset prototype`, todos `disabled` por agora).
- [x] **Preview** — browser frame (3 dots + viewport CSS-only **Monitor / Tablet / Mobile** com larguras 100% / 768px / 375px), URL bar `localhost:3000`, Refresh + ExternalLink. Empty state "No preview yet — describe a feature in the Build chat".
- [x] **Files** — explorer 256px com placeholder tree (folders / files / status badges new/modified) + viewer placeholder com font-mono.
- [x] **Logs** — terminal-styled (header verde "Dev Server Logs"), empty state.
- [x] **History** — empty state card + 1 sample snapshot opaco como referência visual (Restore button disabled).
- [x] Layout: `SpecificationLayout` esconde o secondary panel quando `activeTab === 'prototype'`.

**M4.1–M4.6 — Backend ✅ (concluído pré-MVP)**
- [x] **M4.1** `port-pool` + `prototype-dev-server` — spawn `next dev`, log streaming (ring buffer 500 linhas), auto-recover 2× com backoff exponencial, auto-`npm install` no first boot.
- [x] **M4.2** `file-ops` schema + parser tolerante (fenced JSON → balanced-brace fallback → raw) + sandboxed applier (rejeita abs paths e `..`, confinado em `<basePath>/prototype/`, per-op isolation).
- [x] **M4.3** `prototype-generator-service` — LLM stream → parse ops → write + `git add && git commit` por turn (lazy `git init`; tree listing capped a 200 entries).
- [x] **M4.4** IPC `spec:prototype:*` (15 channels: generate-start/cancel, apply-ops, list-files, read-file, start-dev, stop-dev, dev-status, get-dev-log-buffer, list-snapshots, restore-snapshot, export + 4 events).
- [x] **M4.5** Preload `window.specPrototype` (12 invokes + 4 listeners) + tipos.
- [x] **M4.6** Slice `redux/specPrototype` (devStatus, logs, files, snapshots, turns por requestId, changedPaths) + 11 reducers + 7 thunks.

#### M4 — Plano alargado (Prototype loop completo)

A backend foundation está sólida; o trabalho restante é **fechar o loop visível**, polir UX e adicionar features de paridade com v0/Lovable/Bolt. Reorganizado em 4 fases:

##### Fase 1 — Fechar o loop visível (MVP de aceitação §11) — ~7–9h
> Sem isto, o utilizador vê o backend a funcionar mas não tem feedback útil.

- [x] **M4.7** Preview real ✅ — `<webview src={url}>` bound a `devStatus.url`; loading/installing/error overlays; **auto-reload em `tree-changed`** (chama `webview.reload()` no callback); **toggle DevTools** via `webview.openDevTools()/closeDevTools()`; "Open in external browser" via `window.open(url)`.
- [x] **M4.8** File viewer Monaco read-only ✅ — `<MonacoEditor>` read-only + `languageFromExt` (14 ext: ts/tsx, js/jsx, json, md, css, scss, html, yaml, sh, sql, py, rb, go, rs); badges new/modified/deleted no header (cores emerald/blue/red); toggle "View diff" só visível em ficheiros modified, abre `<DiffEditor>` (inline) HEAD vs HEAD~1 via novo IPC `spec:prototype:read-file-at` → `GitService.showFileAtCommit` (`git show HEAD~1:<path>`, sandbox-validated com `..`-rejection no path e regex `[A-Za-z0-9_/.~^-]` no ref).
- [x] **M4.9** Logs streaming UI ✅ — render real de `state.logs[]` com auto-scroll + **pause-on-hover** (chip "paused" amarelo); filtros tri-state (`all` / `warns+errors` / `errors`) com counts ao lado; **search** que filtra por substring na linha; **clear** dispatcha `protoLogsReplaced([])`; **copy** põe os filtrados na clipboard com timestamp ISO + level. Empty state distingue "no logs" de "no matches".
- [x] **M4.10** History real ✅ — render dos snapshots do `git log` (hash + message + author + date), Restore wired com confirmação destrutiva.
- [x] **M4.11** Snapshot card inline no chat ✅ — `PrototypeSnapshotCard` no `AIAssistant` mostra header `<summary> · N created · M updated · K deleted · L failed · <sha7>`; lista de paths colapsável agrupada por op kind (cores emerald/blue/red, "failed" em red); cada path é clickable e abre o ficheiro na tab Files (via `onPrototypeOpenFile`); botão "Restore this turn" com confirmação destrutiva (`onPrototypeRestore`). `ChatMessage.prototype.ops` populado em runtime no chunk handler dos eventos `op-applied` / `op-failed`.
- [x] **M4.13** Footer wired ✅ — Export via `dialog.showOpenDialog` + `copyDir`; **Open folder** via novo `spec:prototype:open-folder` IPC + `shell.openPath`; Reset com confirmação + stop dev + `protoReset`.
- [x] **M4.30** **Resizable chat ↔ main pane** (paridade com M2D.19) ✅ — `react-resizable-panels` Group/Panel/Separator no `PrototypePanel`; chat min 320 / default 480 / max 50%; persistência em `localStorage` (`spec.prototype.chatWidth`). — hoje o `PrototypePanel` tem `chat 360px fixed | main flex-1`, o que é mau quando o preview tem layout largo (tablet/monitor) ou quando o utilizador quer concentrar-se no chat.
  - Reutilizar `react-resizable-panels` v4 (já em deps, já usado em M2D.19) — `<Group>` + `<Panel id="chat">` + `<Separator>` + `<Panel id="main">`.
  - Constraints: chat min 320px, max 50% viewport, default 480px (subir do 360 actual). Main fica flex.
  - **Collapse-to-icon do chat** — botão `PanelLeftClose / PanelLeftOpen` no header do chat; quando colapsado, restam só ícones (+ unread badge se a chegar streaming durante colapso).
  - **Persistência**: largura em `localStorage` (key `spec.prototype.chatWidth`) — global, não per-projecto (paridade com `spec.docs.rightPaneWidth` do M2D.19).
  - **Body completo**: o `Group` ocupa toda a área entre o rail e o footer; tabs internas do main (Preview/Files/Logs/History) continuam a ocupar 100% do `Panel` direito.
  - Edge case: quando `<webview>` recebe resize event, o iframe interno do Next dev server faz reflow — bom para multi-viewport.
- [x] **M4.27** **Preview com fake data** ✅ (parcial — directiva no system prompt) — `contextProvider` do `PrototypePanel` injecta agora "When generating components that need data, create a deterministic mock layer (e.g. `prototype/lib/mock-data.ts`) so the preview renders something useful without a backend." **Toggle "Use mock data / real data" no footer** ainda pendente (real fica placeholder até backend integration existir).

##### Fase 2 — Loop agradável de usar — ~6–8h
> Transforma a feature de "demonstrável" em "usável diariamente".

- [ ] ~~**M4.12** "Use in Prototype" do Doc Inspector~~ — **DESCONTINUADO** (decisão 2026-05). O caminho implícito (botão no Inspector que muda de tab e usa o doc activo como contexto) é substituído pelo M4.29. Acção concreta: **remover** o botão "Use in Prototype" do `DocInspector.tsx` e a prop `onUseInPrototype` do `DocumentsPanel.tsx`.
- [x] **M4.29** **Spec picker no chat do Prototype** ✅ — `DocAttachPicker` reutilizado no composer do `PrototypePanel`; `attachedDocIds` per-tab + persistência por projecto em `localStorage` (`spec.prototype.attachedSpecIds.<basePath>`); auto-seed com `selectedId` na primeira abertura; auto-clean orphans; `contextProvider` reescrito com role "Reference specification"; KB items derivam da união dos `kbRefs` dos docs anexados. **Removidos** o botão "Use in Prototype" do `DocInspector` e a prop `onUseInPrototype` (M4.12 descontinuado). — **reutiliza directamente** a infra entregue no M2D.21 (`DocAttachPicker`, tipo `ChatAttachment`, prop `composerSlot` e prop `attachments` do `AIAssistant`). Sem componente novo.
  - **No `PrototypePanel`**: replicar o pattern do `DocTabPane` — `useState attachedDocIds: string[]`, `useStore` para leitura buffer-first do `specDocs.byDoc[id]?.buffer` (fallback `window.specDoc.read` quando não aberto), derivação de `chatAttachments: ChatAttachment[]`, auto-clean de orphans via `useEffect([nodes])`.
  - **Composer**: passar `<DocAttachPicker excludeDocId={undefined} ...>` no `composerSlot` do `AIAssistant`; `attachments` + `onRemoveAttachment` ligados ao state local.
  - **System prompt**: secção "Document roles — STRICT" adaptada a `mode='prototype'`: docs anexados são "Reference specifications (read-only inputs that drive the prototype generation)"; nenhum é "active" (não há SEARCH/REPLACE no Prototype).
  - **Auto-seed** na primeira abertura: se `attachedDocIds` vazio e existir `lastFocusedDocId` no `specDocs`, pré-selecciona-o (utilizador pode desmarcar livremente). Sem fixar.
  - **Persistência**: `localStorage` key `spec.prototype.attachedSpecIds.<projectId>` para sobreviver a reload.
  - **Remove** o caminho implícito actual `selectedDocId / activeDoc → contextProvider` no `PrototypePanel`. A escolha de spec passa a ser sempre explícita via picker, reutilizando a UI já familiar do Documents chat.
- [x] **M4.15** Stop / Retry mid-stream ✅ — Stop button (Square icon) já existia desde M4.0; **Retry** dropa a bubble falhada e re-fire o histórico anterior (apenas para erros transientes — login/rate-limit/network). Pipeline-failures usam M4.17 (caminho separado e mais inteligente).
- [x] **M4.16** Progresso por turn ✅ — `PrototypeSnapshotCard` durante streaming mostra chip amarelo `🔄 applying N…` (com Loader2 spinner) que substitui o resumo final. Quando o turn termina, o chip transita para counts (`N created · M updated · K deleted`) + sha7. Restore fica disabled enquanto qualquer turn estiver em streaming (`globalStreaming`) para evitar races com `git reset --hard`.
- [x] **M4.17** Erros visíveis no chat com "Ask AI to fix" ✅ — bubbles com `error` ou `prototype.failed > 0` mostram dois botões: **Retry** (vermelho — re-fire histórico tal como M4.15) + **Ask AI to fix** (amber — handler `handleAskAIToFix` injecta uma synthetic user message com `The previous attempt failed: <error>\n\nFailed ops:\n  - <op> <path>\n\nPlease diagnose…` antes de re-fire). Disponível só para `chatBackend.kind === 'prototype'` ou `'data'` (não faz sentido para chat docs).
- [x] **M4.18** First-run UX ✅ — `useEffect` na rising edge de `devStatus.installing` faz auto-switch para a tab Logs (com `wasInstallingRef` a impedir snap-back se o user navegar enquanto instala); novo `FirstRunBanner` renderiza acima do header com Loader2 spinner + barra animada `firstrun` (CSS keyframes, 1.4s linear infinite) e copy "Installing dependencies… first-time setup, ~30s. Live progress in the Logs tab."
- [x] **M4.19** Multi-viewport custom width ✅ — `DeviceFrame` extendido com 4ª opção `'custom'`; novo botão `MoveHorizontal` no toolbar abre input numérico (px) ao lado, clamped a `[240, 2560]`; persistência global em `localStorage` (`spec.prototype.customViewportWidth`, default 1024); `widthStyle` agora é inline `CSSProperties` (não Tailwind class) com `maxWidth: 100%` para evitar overflow no main pane.
- [x] **M4.28** **Component palette com tab switch Chat ↔ Palette** ✅ — em vez de uma sidebar 3ª-coluna, a paleta vive **no mesmo Panel resizable do chat** com switch tab no header (`Chat | Palette`, com badge para componentes pinned). Decisões:
  - **Click-to-pin (não drag-drop)** — paridade com `@ Spec` do M4.29. Razão: drag-drop entre painéis é custoso para um benefício marginal; click é mais previsível, joga bem com keyboard, e o output é o mesmo.
  - **Catálogo curado** (~20 itens shadcn-flavoured agrupados em Layout/Data/Forms/Feedback/Navigation), cada um com `name + category + hint` (hint vai literal para o system prompt). Não usa `window.engine.getComponent()` — esse registo é tuned para o page builder visual e tem ruído para Next.js puro.
  - **Chips dos componentes pinned** aparecem ao lado dos chips de spec no composer do AIAssistant, distinguidos pelo prefixo `◾` vs `@`. `ChatAttachment.kind` extendido com `'component'`.
  - **AIAssistant fica mounted** quando palette está visível (`display:hidden` em vez de unmount) — preserva message history, streaming, composer draft entre switches.
  - **Persistência por projecto** em `localStorage` (`spec.prototype.attachedComponentIds.<basePath>`).
  - **System prompt** ganha secção `## UI components to use (pinned by user)` apenas quando há pins — directiva explícita "prefer these as primary building blocks; pick others when these don't fit. Don't dump every pinned component on every page."
  - Drag-drop no preview/file viewer fica **fora de scope** (avaliar em Fase 3 se houver pedido real).

##### Fase 3 — Power user / parity — ~7–11h (pós-MVP, opcional)
- [ ] **M4.20** Console + network capture do webview — `<webview>.getWebContents().debugger` para `Network.responseReceived` e `Console.messageAdded`; tab inline "DevTools" com console + network filtros.
- [ ] **M4.21** Cost & token tracking — input+output tokens + modelo + custo estimado por turn; agregação na sessão; banner colapsável no topo do chat.
- [ ] **M4.22** Starter templates — 3 presets ao criar projeto Specification: Next.js minimal, Next.js + shadcn + Tailwind, Next.js + Prisma + tRPC; copiados para `<basePath>/prototype/` no first turn.
- [ ] **M4.23** Branch isolation por sessão de chat — git branch por chat session (`spec/chat-<sessionId>`); merge para main em "Confirm" ou abandonar; paraleliza experimentos.
- [ ] **M4.24** Hot-reload feedback — detectar fast-refresh nos logs do dev-server, badge "🔄 reloaded em 230ms" no Preview.

##### Fase 4 — Hardening & tests — ~4–5h (paralelo às fases anteriores)
- [ ] **M4.14** Tests file-ops — parser (happy + balanced-brace fallback + malformed); applier sandbox (rejeita `..`, abs paths, symlinks); generator-service com mock LLM stream → parse → apply → commit; redux thunks com IPC mocks.
- [ ] **M4.25** Crash recovery — dev-server crash mid-stream: auto-restore último snapshot + flag visível no chat ("Server crashed; reverted to <sha>").
- [ ] **M4.26** Sandbox fuzzing — property-based test (fast-check) para path traversal, encoding tricks, null bytes.

**Total:** Fase 1+2 ≈ 13–17h (entrega MVP §11 + UX competitivo). Fase 3 opcional. Fase 4 em paralelo.

### M5 — Polish — pendente
- [ ] Empty/loading/error states completos em todos os panels (parcialmente feito em KB e Documents).
- [ ] Command palette: ações específicas do gerador.
- [ ] i18n keys completas (algumas adicionadas: `ai_providers`, `specification`, `specificationDescription`).
- [ ] Documentação utilizador.
- [ ] Testes — chunker determinismo (`M3.13`), docs CRUD + sendToKB (`M2D.16`), pipeline E2E.

## 8. Dependências entre tarefas

```
M1 (engine + slice + rota) ─► M2 (Docs + AIAssistant + LLMRouter)
                                 ├─► M3 (KB + RAG → ligado ao AIAssistant)
                                 └─► M4 (Prototype) ◄─ depende de M3 para contexto rico
M4 ─► M5 (polish)
```

Bloqueadores:
- M3 depende de decisão sobre bundling LanceDB (binários nativos por plataforma).
- M4 depende de M2 (LLMRouter) e idealmente M3 (RAG sobre KB).

## 9. Plano de testes

| Camada | Ferramenta | Foco |
|---|---|---|
| Unit | Jest | `LLMRouter`, `RagService.chunker`, parser de file ops, slices Redux |
| Integration | Jest + tmp dirs | `markitdown-handler` round-trip, `VectorDBService` upsert/query, `git-service` snapshots |
| Component | Jest + RTL | Panels com mocks dos slices |
| E2E | Playwright (electron) | fluxo "novo projeto → drop PDF → indexar → chat → gerar" |

## 10. Riscos & mitigação

| Risco | Mitigação |
|---|---|
| Bundle size do LanceDB nativo cresce muito | Lazy-load no main; smoke build no CI por plataforma |
| Subprocess `claude` / `ollama` não detetado | `which`/`where` na inicialização + UI clara em Settings; permitir path manual |
| API keys em texto claro | `safeStorage` obrigatório; nunca persistir em `electron-store` em claro |
| MarkItDown subprocess pesado | Fila + cancelamento; reutilizar binário já empacotado |
| `next dev` colide em portas | Port pool por projeto + retry |
| Output do LLM com file ops mal formado | JSON schema estrito + parser tolerante + retry com erro como prompt |
| Acoplamento com `NextjsEngine` | Extrair interface `DevServerRunner` se aparecerem outros stacks |

## 11. Critérios de aceitação MVP

- Criar projeto `Specification` a partir da wizard; abrir em rota inicial **Documents**.
- Drop de PDF em Documents → markdown gerado e inserido (preview com GFM).
- AIAssistant lateral em Documents responde com OpenRouter (Claude) e cita KB.
- Indexar 3 ficheiros na KB e fazer busca semântica com resultados pertinentes.
- Configurar Claude Code CLI e usar como provider alternativo.
- Em **Prototype**: pedir "gera dashboard simples" → ver resultado em Live Preview, alternar viewport (Monitor/Tablet/Smartphone), inspecionar Files/Logs, restaurar snapshot anterior.
- Exportar pasta e correr `npm install && npm run dev` fora da app.
- Command palette `Cmd/Ctrl+K` navega entre os 3 pilares e ações principais.

## 12. Próximos passos imediatos

1. **M4.1 → M4.5 (backend foundation)** — port-pool + dev-server + file-ops parser/applier + generator-service + IPC + preload. Sem isto, a tab Prototype fica decorativa.
2. **M4.6 → M4.11 (UI funcional)** — Redux slice + preview real (`<webview>`) + Files dinâmicos + Logs em streaming + History via git + snapshot cards no chat.
3. **M4.12 → M4.13 (delight)** — "Use in Prototype" do Doc Inspector + Export.
4. **Tests** — `M2D.16` (docs CRUD) + `M3.13` (chunker determinismo + KB pipeline E2E) podem correr em paralelo a M4.
5. **M5** — Polish (estados especiais, command palette `Cmd/Ctrl+K`, i18n completa, docs utilizador, testes E2E mínimos).

## 12.bis Decisões de design — edição interativa de Documents

### Histórico

| Iteração | Modelo | Razão de descontinuação |
|---|---|---|
| **v1 — Auto-apply silencioso** (M2D.10/11) | Intent picker `Ask / Append / Replace`. Em Append/Replace o reply (bloco \`\`\`markdown) era aplicado automaticamente ao buffer. | Sem revisão humana; replaces destruíam edições. |
| **v2 — DiffCard inline na bolha** (M2D.16) | Mesma base de Append/Replace, mas em vez de auto-apply mostrava um `DiffCard` dentro da bolha do chat com Apply/Reject. | Diff no chat era pequeno, fora do contexto do editor; user feedback: "queria a interação no próprio documento, tal como Claude Code edita ficheiros". |
| **v3 — DocDiffPreview no editor** (M2D.16.b) | DiffCard movido para fora do chat: `pendingProposal` no host troca o `DocEditor` por `Monaco DiffEditor` inline com toolbar Apply/Reject. | Continuava limitado a Append (concatena no fim) ou Replace (todo o doc). Não permitia "corrigir o início e adicionar no fim na mesma resposta", nem edits surgical. |
| **v4 — SEARCH/REPLACE blocks** (M2D.17) | Resposta do LLM contém um ou mais blocos `<<<<<<< SEARCH … ======= … >>>>>>> REPLACE`. Host parseia + aplica em ordem sobre snapshot; resultado vai para `DocDiffPreview`. Múltiplas edições por turno, surgical, com fallback fuzzy quando o whitespace não bate certo. | "Apply tudo de uma vez" obrigava o user a escolher entre aceitar todas ou rejeitar todas. |
| **v4.1 — Per-edit selection** (**M2D.17.b, atual**) | Cada edit ganha checkbox no checklist da bolha; toggle re-corre `applyEdits` no reducer e o `DocDiffPreview` reflecte em tempo real. Toolbar mostra `Apply N/M`. Failed edits ficam disabled (não podem ser marcados). | — |

### Por que SEARCH/REPLACE (e não alternativas)

- **Tool calling JSON** (`insert(line, text)` etc.) — exige modelo com function-calling fiável e adiciona schema externo. Excessivo para markdown.
- **Unified diff (formato git)** — modelos erram com frequência nos números de linha e linhas de contexto. Pior na prática.
- **Re-emitir o doc inteiro com diff** — funciona para docs pequenos (era a v3); cresce em custo de tokens linearmente com o tamanho do doc, e o modelo tende a "alucinar" mudanças em zonas que não devia tocar.
- **SEARCH/REPLACE (Aider/Cursor)** — battle-tested. Funciona em qualquer LLM via prompt. Cobre insert/replace/delete/rewrite com uma só primitiva. Custo proporcional ao tamanho da edição, não do doc.

### Contrato com o LLM (system prompt para Documents)

O `contextProvider` em `DocumentsPanel.tsx` injecta no system prompt um bloco que ensina o formato com 2 exemplos (insert + replace). Resumo das regras:

- Quando o utilizador pede para **modificar** o doc, responder com um ou mais blocos SEARCH/REPLACE — sem prosa à volta, sem code-fence wrapper.
- Quando o utilizador faz uma **pergunta**, responder em prosa normal (sem blocos).
- `SEARCH` tem de bater **verbatim** com o doc (whitespace incluído). Quotar contexto suficiente para ser único.
- `SEARCH` vazio + `REPLACE` com conteúdo → **append** no fim do doc.
- `SEARCH` com texto + `REPLACE` vazio → **delete**.
- Múltiplos blocos aplicam em ordem; cada um faz match contra o doc *antes de qualquer edição deste turno*.

### Robustez do parser

- `parseSearchReplaceBlocks(text)` — regex tolerante (whitespace nos delimiters, opcional após SEARCH/REPLACE).
- `applyEdits(original, edits)` — para cada edit:
  1. Match literal exacto.
  2. Fallback: match com whitespace normalizado (`\s+` ↔ ` `).
  3. Se 0 matches ou >1 match (ambíguo) → marca op como `failed` com motivo, mas continua com os outros edits.
- Resultado expõe `{ result, ops: [{kind, ok, ...}] }` para a UI mostrar resumo + falhas.

### UI (estilo Claude Code)

- **Intent picker removido** em modo `docs` — uma única caixa de chat. O modelo decide se é conversa ou edição pelo conteúdo da resposta.
- **Composer multi-line** estilo Claude Code: `<textarea>` auto-grow (cap 180px ≈ 8 linhas), `Enter` envia, `Shift+Enter` quebra linha, `Cmd/Ctrl+Enter` também envia, IME composition respeitado (acentos não disparam send).
- **Bolha do assistant não tem fundo** — guideline subtil à esquerda (`border-l-2 border-primary/30`); só mensagens do user mantêm chip primary à direita. Mensagens separadas por `divide-y divide-border/40`.
- **`ProposalChecklist`** (em `AIAssistant.tsx`) substitui o conteúdo bruto na bolha do chat por um *tool-use card colapsável* à Claude Code:
  - Header sempre visível com o trigger `▸ Edit document  ✓ N/M  ✗ K  PENDING`. Click expande/colapsa. Default aberto enquanto pending; auto-fecha após `applied`/`rejected`.
  - Cada edit é uma linha — quando o proposal está activo (pending), as linhas têm `<input type="checkbox">` interactivos e a linha inteira é clicável; quando histórico, são read-only com ícones ✓/✗.
  - "Select all" / "Unselect all" inline para alternar todos os ok edits.
  - **Sem markup SR cru** — o user nunca vê os `<<<<<<< SEARCH …`. Durante o stream, mostra um placeholder `Drafting edits…` em vez de mostrar os delimitadores parciais.
- **Labels do checklist** derivados via `describeEdit` (markdown-aware, ver §"Extensibilidade futura"): `Added section: <heading>` / `Edited section: <heading>` / `Removed: "<truncated>"` / `Replaced "<truncated>"`. Edits *fuzzy* mostram `Matched with whitespace tolerance`.
- **DocDiffPreview** (Monaco DiffEditor inline, modo unified):
  - Quando há `selected[]`, toolbar mostra `2 of 3 selected — review and apply.` e o botão `Apply 2/3`. Sem `selected[]`, fallback para `summariseOps` antigo.
  - Toggle no checklist da bolha re-corre `applyEdits` no reducer → `applied` recalcula → DiffEditor refresca em tempo real.
- **Falhas parciais** (blocos sem match) ficam listadas num accordion na toolbar do DiffPreview; o user pode aplicar o resto e voltar a pedir ajuda no chat para os que falharam.

### Ficheiros impactados

- **NEW** `src/renderer/src/generators/specification/utils/searchReplaceParser.ts` — parser + applier puro (testável). Exporta também `summariseEdits`, `describeEdit`, `ProposalSummary`, `ProposalStatus` para a UI e o Redux.
- **MOD** `redux/specDocs/reducer.ts` — `PendingProposal` carrega `{messageId, edits, snapshot, selected, applied, ops}` e `proposalSummaries: Record<msgId, ProposalSummary[]>` por doc. Actions: `docProposalStaged`, `docProposalEditToggled` (recomputa `applied` via `applyEdits` em cima da selecção), `docProposalResolved`.
- **MOD** `components/shared/AIAssistant.tsx` — sem intent picker, sem `applyOnDone`. Composer é `<textarea>` multi-line. `useEffect` de staging chama `parseSearchReplaceBlocks` e fire `onProposeChange(messageId, edits)`. Bolha do assistant sem fundo (guideline esquerda); bolha do user mantém-se. Renderiza `ProposalChecklist` (tool-use card colapsável com checkboxes) em vez do conteúdo cru.
- **MOD** `components/DocumentsPanel.tsx` — usa selectors da Redux slice. `handleProposeChange` faz `applyEdits` + `summariseEdits` e dispatcha `docProposalStaged`. Novo `handleProposalEditToggle` para o flow per-edit. `contextProvider` injecta o prompt SEARCH/REPLACE com regras + 2 exemplos.
- **MOD** `components/documents/DocDiffPreview.tsx` — drop prop `mode`. Aceita `ops` (toolbar `summariseOps`) e `selected` (toolbar `Apply N/M`). Accordion de falhas inalterado.
- **DEL** `components/shared/DiffCard.tsx` (apagado em v3).
- **CLEANUP** `package.json` — removidas deps `diff` + `@types/diff` (não usadas; Monaco faz o diff visual).

### Extensibilidade futura — reuso do AIAssistant fora de markdown

Pendente de refactor. Adiar até existir o **segundo consumidor** (provavelmente o modo `prototype` a editar TS/TSX). Por agora ficam apenas as notas, para evitar abstracção prematura.

| Camada | Estado hoje | O que fazer quando alargarmos |
|---|---|---|
| Parser SEARCH/REPLACE (`parseSearchReplaceBlocks`, `applyEdits`) | **Já genérico** — opera em qualquer texto. | Manter como está. |
| Chat puramente conversacional (sem editor host) | **Já suportado** — basta o host não passar `onProposeChange` / `proposalSummaries` ao `AIAssistant`. O `useEffect` de staging early-returns e o checklist nunca aparece. | Manter como está. |
| `DocDiffPreview` | Hard-code de `language="markdown"` no Monaco DiffEditor. | Adicionar prop `language?: string` (default `"markdown"`); host passa o language adequado ao formato. |
| System prompt SEARCH/REPLACE | Vive no `contextProvider` do host (não no `AIAssistant`). Markdown-específico no exemplo. | Cada novo host escreve o seu prompt com exemplos do seu formato. Sem refactor — só prática. |
| Labels do checklist (`describeEdit`, `firstHeading`) | Markdown-específico (procura `## Heading`). | Extrair para um sistema de `EditAdapter` por linguagem: `markdownEditAdapter`, `codeEditAdapter`, … `summariseEdits(edits, ops, adapter)` aceita o adapter como parâmetro. |
| Modos `prototype` / `data` | **Já isolados** — usam `chatBackend.kind === 'prototype'\|'data'` com pipelines próprios (file-ops, entity-ops). Não passam pelo caminho SEARCH/REPLACE; coexistem sem conflito. | Manter como está. Quando o prototype quiser editar ficheiros via SR (alternativa ao file-ops actual), reaproveita o parser genérico + adapter de código. |

**Custo estimado do refactor:** ~1h (split do parser, prop `language` no DiffPreview, primeiro adapter).

**Trigger:** primeira feature que peça edição assistida fora de markdown.

## 13. Estado actual (snapshot)

### Concluído
| Milestone | Estado | Notas |
|---|---|---|
| M1 — Foundations | ✅ | Engine + wizard + sidebar-09 layout + navegação automática + rail alinhado ao Studio |
| M2D — Documents | ✅ | Monaco + react-markdown + GFM + drop + templates + ToC + KB inline + kbRefs |
| M2D.17 — Edição interativa SEARCH/REPLACE | ✅ | Parser + applier + system prompt + UI sem intent picker · ver §12.bis (commit `417085a8`) |
| M2D.17.b — Per-edit selection + Claude-Code-style UI | ✅ | Checkbox por edit no `ProposalChecklist` colapsável; `selected[]` na Redux slice + `docProposalEditToggled` recomputa `applied` em tempo real; `Apply N/M` na toolbar do `DocDiffPreview`; composer multi-line `<textarea>` (Enter envia, Shift+Enter quebra linha); bolha do assistant sem fundo (guideline esquerda) — ver §12.bis. |
| M2D.18 — Multi-doc tabs | ✅ | `TabContext` reutilizado, `byDoc` map, AIAssistant per-tab (commit `10d9a763`) |
| M2D.19 — Resizable right pane (Chat \| Inspector) | ✅ | `react-resizable-panels`, largura persistida em localStorage |
| M2D.20 — Sync scroll Preview → Editor | ✅ | Mapeamento via remark AST + `data-source-line`, hook rAF-throttled |
| M2D.21 — Chat doc attachments | ✅ | `@ Attach` no composer, buffer-first read, 3 papéis no system prompt |
| M2L — LLM Stack | ✅ | OpenRouter SSE + Claude Code CLI (auto-probe nvm/login-shell) + Settings UI (AI Providers + Local CLIs) + AIAssistant com intent picker + Retry + action bar |
| M3 — KB + RAG | ✅ | LanceDB + chunker sha1 + OpenAI/stub embeddings + UI completa + **RAG real** (search-by-refs + KB toggle no AIAssistant + chunks no system prompt) |
| M4.0 — Prototype UI shell | ✅ | Chat + Tabs (Preview multi-viewport / Files / Logs / History) + Footer placeholders |
| M4.1–M4.6 — Prototype backend foundation | ✅ | port-pool + dev-server (auto-recover, log streaming) + file-ops (sandbox) + generator-service (LLM→parse→apply→git commit) + 15 IPC + preload + slice + 7 thunks |

### Refactors / shared modules
| Item | Estado | Notas |
|---|---|---|
| `features/dnd/` — DnD primitives partilhadas | ✅ | Extraído de `lib/dnd/`. Genéricos parametrizáveis (`<T extends DraggableItem>`); `Droppable` aceita `emptyState?: ({isHovered}) => ReactNode` em vez de importar `GenNoInfoComp`. `lib/dnd/` mantido como façade pinada a `StructuredComponent` (zero churn nos 57 imports do UI generator). UI generator passa `<GenNoInfoComp>` via prop no `lib/dnd/Droppable.tsx`. Pronto para Specification reusar com `<PaletteComponent>` ou outro tipo próprio. |
| `features/spec-attachments/` — `DocAttachPicker` | ✅ | Movido de `generators/specification/components/documents/`. Imports actualizados em `DocumentsPanel.tsx` e `PrototypePanel.tsx`. |
| `features/component-palette/` — catálogo + persistência | ✅ | Catálogo de 20 componentes shadcn (`PALETTE`, `PALETTE_BY_ID`, `PaletteComponent`, `PaletteCategory`) + helpers `readPersistedComponentIds(basePath, {namespace})` / `writePersistedComponentIds(...)` com chave `spec.<namespace>.attachedComponentIds.<basePath>`. `PrototypePanel` usa `namespace: 'prototype'`; futuros generators usam outros namespaces sem colisão. |

### Pendente
| Item | Esforço | Prioridade |
|---|---|---|
| **M4 Fase 1** — Fechar loop visível (M4.8 viewer+diff, M4.9 logs filters, M4.11 snapshot card; **M4.7 ✅**, **M4.10 ✅**, **M4.13 ✅**, **M4.27 ✅** parcial, **M4.30 ✅**) | ~3–5h | ⭐⭐⭐ Alta — entrega MVP §11 |
| **M4 Fase 2** — Loop usável (M4.15–M4.19, M4.28 drag-drop; **M4.29 ✅**, M4.12 descontinuado) | ~4–6h | ⭐⭐⭐ Alta — UX competitivo |
| **M4 Fase 3** — Power user (M4.20–M4.24) | ~7–11h | ⭐ Opcional pós-MVP |
| **M4 Fase 4** — Tests & hardening (M4.14, M4.25, M4.26) | ~4–5h | ⭐⭐ Média (paralelo) |
| Tests M2D.16 + M3.13 | ~2h | ⭐⭐ Média |
| M5 — Polish | ~3–4h | ⭐ Baixa até M4 estar feito |

### Parqueado para revisitar (sub-projectos paralelos)

Estes pilares foram esboçados como tabs adicionais no rail da Specification mas estão **fora do scope do MVP actual** — serão revisitados depois de M4/M5 fecharem. Os planos próprios continuam vivos e devem ser actualizados quando reactivados.

| Sub-projecto | Plano | Estado | Notas |
|---|---|---|---|
| **Process Integration** (BPMN authoring, rail tab `processes`) | [`process-integration/IMPLEMENTATION_PLAN.md`](../process-integration/IMPLEMENTATION_PLAN.md) | Parqueado | Scaffold inicial existe; auth service, `features/bpmn/`, ProcessEditor pendentes. Reutilizará `safeStorage` e `SpecificationContext` definidos aqui. |
| **Data Models** (entities, ERD, AIAssistant `mode='data'`, rail tab `data`) | [`data-models-integration/IMPLEMENTATION_PLAN.md`](../data-models-integration/IMPLEMENTATION_PLAN.md) | Parqueado — parcialmente implementado (commits `c551c846`, `6ca5ac56`, `7574d35a`: ConnectionForm/Manager, TablePicker, ReactFlow ERD). | Plano original mencionava gojs; implementação adoptou ReactFlow — actualizar plano ao reactivar. M7.4b (entity-ops) deve copiar o pattern do `file-ops` que sairá do M4.2/M4.3. |

**Ao reactivar:** decidir rail order canónica (proposta: `Knowledge → Documents → Data → Processes → Prototype`) e coordenar PRs que toquem `SpecificationLayout.tsx` e `SpecificationContext` para evitar conflitos.

### Decisões importantes registadas
- **Fluxo de dados unidireccional:** KB → Documents → Prototype. Documents linka KB via `kbRefs[]`, não envia para KB.
- **Rail order** reflecte o data flow: **Knowledge → Documents → Prototype**.
- **Output contract do AIAssistant em Documents (M2D.16, descontinuado)** — versão original forçava bloco \`\`\`markdown e auto-apply em Append/Replace. **Substituído em M2D.17** (ver abaixo) por edits SEARCH/REPLACE com diff inline no editor.
- **Edição interativa do Documents (M2D.17, ✅ adoptado 2026-05)** — o AIAssistant deixa de devolver "o documento todo"/"um fragmento" e passa a emitir blocos `<<<<<<< SEARCH … ======= … >>>>>>> REPLACE` (formato Aider). O host parseia, aplica em ordem sobre um snapshot do buffer, e mostra o resultado num **Monaco DiffEditor** que substitui o `DocEditor` enquanto há proposta pendente. Cobre insert/replace/delete/full-rewrite com uma só primitiva, é multi-edit por turno, não exige function-calling no LLM (funciona em qualquer modelo via prompt). Ver "Decisões de design — edição interativa de Documents" mais abaixo.
- **Per-edit selection (M2D.17.b, ✅ adoptado 2026-05)** — em vez do "Apply tudo ou Reject tudo" inicial, cada edit ganha checkbox no `ProposalChecklist` (estilo tool-use card colapsável do Claude Code). Toggle dispatcha `docProposalEditToggled` no reducer, que re-corre `applyEdits(snapshot, edits.filter(selected))` e actualiza o `applied` que alimenta o `DocDiffPreview` — refresh em tempo real. Toolbar passa a `Apply N/M`. Failed edits (no-match / multiple-matches) ficam com checkbox disabled. Default selecção: ok→true, failed→false.
- **UI estilo Claude Code (M2D.17.b)** — composer com `<textarea>` multi-line (`Enter` envia, `Shift+Enter` quebra linha, `Cmd/Ctrl+Enter` também envia, IME respeitado); bolha do assistant sem fundo (guideline esquerda fina), só user mantém chip primary à direita; mensagens separadas por divisores subtis (`divide-y`); `ProposalChecklist` esconde os blocos `<<<<<<< SEARCH …` crus do chat e mostra um header colapsável `▸ Edit document  ✓ N/M  status`; durante o stream, mostra `Drafting edits…` em vez dos delimitadores parciais.
- **RAG ground rule:** AIAssistant cita `[KB: <item name>]` quando consulta chunks reais; quando não encontra, declara explicitamente em vez de inventar.
- **Embeddings em dev:** auto-fallback para stub determinístico quando não há key OpenAI; sem precisar de env flag.
- **CLI detection:** cascade override → PATH → login shell (`zsh -lic`) → known paths (incluindo nvm versions). Resolve o problema do Electron lançado do Finder não ter PATH do `.zshrc`.
- **Storage layout** por projeto: `<basePath>/{docs,kb,vectors,chats,prototype}/`.
- **Settings:** secrets via `safeStorage` (`spec-secrets.bin`); preferences em JSON (`spec-settings.json`); ENV vars sobrepõem para dev.
- **Layout adaptativo:** `SpecificationLayout` esconde o secondary panel para a tab Prototype (que tem layout próprio chat + main).
- **Multi-doc tabs (M2D.18):** `byDoc: Record<docId, DocPerState>` no slice; padrão `tabs-mounted-hidden` (estado preservado em troca de tab); `AIAssistant` continua local-state (chat preservado naturalmente); selectors **sempre** `docId`-scoped — nunca `useSelector(s => s.specDocs.byDoc)`.
- **Right pane mutuamente exclusivo (M2D.19):** Chat e Inspector partilham o mesmo painel à direita; trigger único na toolbar (padrão shadcn `SidebarTrigger`); largura persistida em `localStorage` (key `spec.docs.rightPaneWidth`); `useState lastPane` no `DocTabPane` lembra o último modo entre colapsos.
- **Sync scroll preview → editor (M2D.20):** unidireccional, mapeamento via `node.position.start.line` injectado como `data-source-line`; hook `usePreviewToEditorScrollSync` rAF-throttled; activo só em `viewMode='split' && !pendingProposal`.
- **Chat doc attachments (M2D.21):** anexos vivem com a chat session (state local em `useState` no DocTabPane), não no slice. Regra para o user: **externos → KB; produzidos no spec → chat attach**. System prompt explicita 3 papéis (Active editável / Reference read-only / KB external) + citações `[Doc: <name>]` e `[KB: <name>]`. Buffer-first read via `useStore().getState()` para não subscrever o `DocTabPane` ao `byDoc` inteiro.
- **Hooks-order rule (lesson learned do M2D.21 bug):** **TODOS os hooks têm de ser declarados antes de qualquer early return**. O `DocTabPane` apresentou "Rendered fewer hooks than expected" quando se apagava um doc com a tab aberta, porque havia `if (!node) return ...` no meio dos hooks. Padrão correcto: hooks primeiro, depois render guards. Comentário inline no `DocTabPane` lembra a regra para evitar regressão.

### Dependências externas adicionadas
- `@lancedb/lancedb` (vector DB embarcado)
- `apache-arrow` (peer dep do LanceDB)
- `react-markdown` + `remark-gfm` (preview Documents + AIAssistant)
