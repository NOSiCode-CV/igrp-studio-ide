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
- [x] `Use in Prototype` button no Inspector (placeholder; activa em M4).
- [x] Eager-load de KB e Docs em `SpecificationLayout` para que Documents tenha sempre KB items disponíveis.

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

**M4.1+ — Backend (pendente):**
- [ ] **M4.1** `port-pool` + `prototype-dev-server` — `next dev` spawn por projeto, log streaming, auto-recover.
- [ ] **M4.2** `file-ops` schema + parser tolerante + sandboxed applier (paths confinados em `<basePath>/prototype/`).
- [ ] **M4.3** `prototype-generator-service` — LLM stream → parse ops → write + `git add && git commit` por turn.
- [ ] **M4.4** IPC `spec:prototype:*` (generate-start/cancel/chunk, list-files, read-file, start-dev, stop-dev, dev-log, list-snapshots, restore-snapshot, export).
- [ ] **M4.5** Preload `window.specPrototype` + tipos.
- [ ] **M4.6** Slice `redux/specPrototype` (sessions, files tree, logs, snapshots).
- [ ] **M4.7** Preview real com `<webview>` apontando para `localhost:<port>`.
- [ ] **M4.8** Files com tree dinâmico + diff viewer (badges new/modified vindas do último turn).
- [ ] **M4.9** Logs em streaming real (xterm-style).
- [ ] **M4.10** History com `git log` real + restore (`git reset --hard <sha>`).
- [ ] **M4.11** Snapshot card no chat (cada turn) com restore inline.
- [ ] **M4.12** "Use in Prototype" do Doc Inspector dispara o pipeline com spec + KB context.
- [ ] **M4.13** Export prototype (zip ou copy folder via `dialog.showSaveDialog`).
- [ ] **M4.14** Tests: file-ops parser + sandbox + git snapshots.

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
| **v4 — SEARCH/REPLACE blocks** (**M2D.17, atual**) | Resposta do LLM contém um ou mais blocos `<<<<<<< SEARCH … ======= … >>>>>>> REPLACE`. Host parseia + aplica em ordem sobre snapshot; resultado vai para `DocDiffPreview`. Múltiplas edições por turno, surgical, com fallback fuzzy quando o whitespace não bate certo. | — |

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

### UI

- **Intent picker removido** em modo `docs` — uma única caixa de chat. O modelo decide se é conversa ou edição pelo conteúdo da resposta.
- **Bolha do chat** mostra resumo compacto: "3 edições propostas — review no editor" (ou status `applied` / `rejected` / `stale` quando histórico).
- **DocDiffPreview** continua a usar Monaco DiffEditor inline; toolbar mostra agora "N edições · M falhas" em vez de Append/Replace.
- **Falhas parciais** (blocos que não fizeram match) ficam listadas num accordion na toolbar; o user pode aplicar o resto e voltar a pedir ajuda no chat para os que falharam.

### Ficheiros impactados

- **NEW** `src/renderer/src/generators/specification/utils/searchReplaceParser.ts` — parser + applier puro (testável).
- **MOD** `components/shared/AIAssistant.tsx` — remove intent picker e `applyOnDone`; useEffect de staging passa a chamar `parseSearchReplaceBlocks` e fire `onProposeChange(messageId, edits)`.
- **MOD** `components/DocumentsPanel.tsx` — `pendingProposal` carrega `{messageId, edits, snapshot, applied, ops}`; `contextProvider` injecta o prompt SEARCH/REPLACE.
- **MOD** `components/documents/DocDiffPreview.tsx` — drop prop `mode`, aceita `ops` para o resumo.
- **DEL** `components/shared/DiffCard.tsx` (já apagado em v3).
- **CLEANUP** `package.json` — remover deps `diff` + `@types/diff` (não usadas após v4; Monaco DiffEditor faz o diff visual).

## 13. Estado actual (snapshot)

### Concluído
| Milestone | Estado | Notas |
|---|---|---|
| M1 — Foundations | ✅ | Engine + wizard + sidebar-09 layout + navegação automática + rail alinhado ao Studio |
| M2D — Documents | ✅ | Monaco + react-markdown + GFM + drop + templates + ToC + KB inline + kbRefs |
| M2D.17 — Edição interativa SEARCH/REPLACE | 🚧 | Parser + applier + system prompt + UI sem intent picker · ver §12.bis |
| M2L — LLM Stack | ✅ | OpenRouter SSE + Claude Code CLI (auto-probe nvm/login-shell) + Settings UI (AI Providers + Local CLIs) + AIAssistant com intent picker + Retry + action bar |
| M3 — KB + RAG | ✅ | LanceDB + chunker sha1 + OpenAI/stub embeddings + UI completa + **RAG real** (search-by-refs + KB toggle no AIAssistant + chunks no system prompt) |
| M4.0 — Prototype UI shell | ✅ | Chat + Tabs (Preview multi-viewport / Files / Logs / History) + Footer placeholders |

### Pendente
| Item | Esforço | Prioridade |
|---|---|---|
| **M4.1–M4.14** Prototype backend | Pesado (~8–12h) | ⭐⭐⭐ Alta — fecha KB→Spec→Prototype |
| Tests M2D.16 + M3.13 | ~2h | ⭐⭐ Média |
| M5 — Polish | ~3–4h | ⭐ Baixa até M4 estar feito |

### Decisões importantes registadas
- **Fluxo de dados unidireccional:** KB → Documents → Prototype. Documents linka KB via `kbRefs[]`, não envia para KB.
- **Rail order** reflecte o data flow: **Knowledge → Documents → Prototype**.
- **Output contract do AIAssistant em Documents (M2D.16, descontinuado)** — versão original forçava bloco \`\`\`markdown e auto-apply em Append/Replace. **Substituído em M2D.17** (ver abaixo) por edits SEARCH/REPLACE com diff inline no editor.
- **Edição interativa do Documents (M2D.17, ✅ adoptado 2026-05)** — o AIAssistant deixa de devolver "o documento todo"/"um fragmento" e passa a emitir blocos `<<<<<<< SEARCH … ======= … >>>>>>> REPLACE` (formato Aider). O host parseia, aplica em ordem sobre um snapshot do buffer, e mostra o resultado num **Monaco DiffEditor** que substitui o `DocEditor` enquanto há proposta pendente. **Apply** consolida tudo de uma vez no buffer; **Reject** descarta. Cobre insert/replace/delete/full-rewrite com uma só primitiva, é multi-edit por turno, não exige function-calling no LLM (funciona em qualquer modelo via prompt). Ver "Decisões de design — edição interativa de Documents" mais abaixo.
- **RAG ground rule:** AIAssistant cita `[KB: <item name>]` quando consulta chunks reais; quando não encontra, declara explicitamente em vez de inventar.
- **Embeddings em dev:** auto-fallback para stub determinístico quando não há key OpenAI; sem precisar de env flag.
- **CLI detection:** cascade override → PATH → login shell (`zsh -lic`) → known paths (incluindo nvm versions). Resolve o problema do Electron lançado do Finder não ter PATH do `.zshrc`.
- **Storage layout** por projeto: `<basePath>/{docs,kb,vectors,chats,prototype}/`.
- **Settings:** secrets via `safeStorage` (`spec-secrets.bin`); preferences em JSON (`spec-settings.json`); ENV vars sobrepõem para dev.
- **Layout adaptativo:** `SpecificationLayout` esconde o secondary panel para a tab Prototype (que tem layout próprio chat + main).

### Dependências externas adicionadas
- `@lancedb/lancedb` (vector DB embarcado)
- `apache-arrow` (peer dep do LanceDB)
- `react-markdown` + `remark-gfm` (preview Documents + AIAssistant)
