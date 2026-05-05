# Plano: Modo Analista do iGRP Studio

> Documento de planeamento e arquitetura — **sem implementação**.
> Objetivo: adicionar um fluxo paralelo "Analista" ao iGRP Studio Electron,
> permitindo prototipar páginas funcionais com mock data, IA e preview em
> tempo real — sem quebrar o fluxo Developer existente e sem misturar mock
> data no TSX gerado.

---

## Sumário executivo

O iGRP Studio é uma aplicação Electron low-code que:
1. Permite desenhar páginas visualmente (drag-and-drop).
2. Produz um **PageConfig JSON** por página.
3. Tem um **Engine Handlebars** que transforma JSON → TSX (Next.js Pages Router).
4. Developers implementam as custom functions (hooks, APIs).
5. Rodam `next dev` para ver a página.

**Proposta**: adicionar um **Modo Analista** — toggle global no Studio que, em vez
de correr o engine + `next dev`, interpreta o PageConfig em runtime no próprio
Electron, com dados mock em ficheiros separados. Analista pode usar IA para
acelerar geração de páginas e mocks. No handoff, entrega apenas o JSON — o mock
nunca entra no repositório de produção.

---

## Fase 1 — Análise do projeto atual (ground truth)

### 1.1 Estrutura Electron
- **Main**: `studio/igrp-studio-ide/src/main/index.ts` — handlers em `src/main/handlers/{workspace,app-logic,db,git,api}-handler.ts`.
- **Preload**: `src/preload/index.ts` expõe `window.api` (incl. `fetchData`, workspace CRUD).
- **Renderer**: `src/renderer/src/App.tsx`. UI de desenho em `src/renderer/src/generators/ui/`:
  - Canvas principal: `generators/ui/page-builder.tsx`
  - DnD: `generators/ui/types/components/MainComponent.tsx` (Droppable/Draggable em `lib/dnd/`)
  - Hooks-chave: `useDroppedComponents`, `usePageSave`, `useCustomCode`.

### 1.2 Page-definition JSON
- Schema TypeScript: `studio/packages/nextjs-engine/src/interfaces/types.ts:18`
- Tipo principal:
  ```typescript
  PageConfig {
    type, useClient, path, pageName,
    args,          // route params (ex: uuid)
    types,         // TS type defs por tabela
    imports,
    states,        // state declarations
    references,
    functions,     // page-scoped regular funcs (goToEdit, formatDate)
    actions,
    components: Layout   // árvore visual recursiva
  }
  ```
- Árvore recursiva:
  ```typescript
  Layout { componentName, tag, properties, children[], interactions{}, rules[] }
  ```
- Validação Zod em `packages/nextjs-engine/src/schema/pageConfig.ts`.
- Versionável (`version?: string` em `VersionableElement`).
- **Armazenamento**: ficheiros JSON por página em `<workspace>/.igrpstudio/pages/<id>.json`.

### 1.3 Engine (Handlebars, NÃO AST)
- Entry: `studio/packages/nextjs-engine/src/index.ts`
- Pipeline: `generatePage()` → valida Zod → `renderTemplate(TEMPLATES.PAGE, ctx)` → escreve TSX.
- Templates: `packages/nextjs-engine/public/templates/**/*.hbs` (90+ componentes).
- Helpers Handlebars custom executam transformações da árvore: `resolve-imports`, `resolve-states`, `render-layout`, `extractTableColumns`, `addClassNameFromProperties`.
- **Crítico**: a lógica de layout/estilo vive nos **helpers**, não nos componentes React.
- Execução: on-demand via IPC quando o utilizador salva.

### 1.4 `fetchData` e custom functions
- No Studio (renderer): `hooks/use-core.ts` — `fetchData(endpoint, headers)` → `window.api.fetchData` → main process.
- No TSX gerado, toda a lógica de negócio é uma **string JS** dentro de `components.interactions.onLoad.function.fnCustomCode.fnCode` — tipicamente 50–80 linhas que chamam hooks do projeto (ex.: `useDetalheUtente(uuid)`), transformam `data` e chamam `setXxx(...)` para popular states.
- `fnCustomCode.imports`: array de `import`s de hooks/utils do projeto (ex.: `@/app/(myapp)/hooks/use-utente`).
- `fnCustomSet` (handlers pequenos, ex.: `(e) => { setAnoSelected(e.target.value) }`) — interpretáveis com segurança.

### 1.5 Biblioteca de componentes
- Única dependência visual: **`@igrp/igrp-framework-react-design-system`** (`studio/igrp-studio-ide/package.json:44`).
- **Já está no renderer do Electron** (o próprio Studio usa IGRP* primitives na sua UI) → grande vantagem: os mesmos componentes já estão em memória, não precisamos bundle adicional.
- Componentes **project-local** (`LoadingPage`, `UserSummaryBar` em `src/app/(myapp)/components/*`) **não** estão no design system — precisam de estratégia separada.

### 1.6 Preview existente
- Já existe um preview em `generators/ui/components/preview-menu.tsx`, mas é pesado: dispara IPC `start-nextjs` (spawna `next dev`) e abre uma BrowserWindow apontando para `localhost:PORT`. Não serve para Analista.

### 1.7 Storage
- Workspaces: `~/Library/Application Support/IGRP-Studio/igrpstudio.workspaces.json`.
- Páginas: JSON por página dentro de `<workspace>/.igrpstudio/pages/<id>.json`.

---

## Fase 2 — Arquitetura proposta

### 2.1 Diagrama

```
┌─────────────────────────────────────────────────────────────────────┐
│                      IGRP STUDIO (Electron)                          │
│                                                                      │
│  ┌─────────────── Renderer (React) ──────────────────────────────┐  │
│  │                                                                │  │
│  │  ┌─── Page Builder (canvas DnD, PARTILHADO) ──────────────┐   │  │
│  │  │   useDroppedComponents  →  PageConfig JSON (in-memory)  │   │  │
│  │  └──────────────────────────┬──────────────────────────────┘   │  │
│  │                             │                                   │  │
│  │                ┌──── Mode Toggle ────┐                           │  │
│  │                ▼                     ▼                           │  │
│  │       ┌──────────────┐       ┌──────────────────────┐            │  │
│  │       │ DEVELOPER    │       │  ANALYST (novo)       │            │  │
│  │       │              │       │                       │            │  │
│  │       │ save → IPC → │       │  1. Mock Studio       │            │  │
│  │       │ engine.gen   │       │     (Faker + IA)      │            │  │
│  │       │ → TSX file   │       │  2. AI Copilot        │            │  │
│  │       │              │       │     (gera PageConfig) │            │  │
│  │       │ Preview =    │       │  3. Live Preview      │            │  │
│  │       │ next dev     │       │     (Runtime Renderer)│            │  │
│  │       └──────────────┘       └───────────┬──────────┘            │  │
│  │                                          ▼                       │  │
│  │                       ┌───────── Runtime Renderer ────────┐     │  │
│  │                       │ interpreta PageConfig JSON        │     │  │
│  │                       │ map componentName → React comp    │     │  │
│  │                       │ lê mock-data.json p/ binding      │     │  │
│  │                       │ (iframe sandbox no renderer)      │     │  │
│  │                       └───────────────────────────────────┘     │  │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌──────────────────── Main Process ─────────────────────────────┐   │
│  │  workspace-handler       mock-data-handler (novo)              │   │
│  │  app-logic-handler       ai-handler (novo: Claude)             │   │
│  │  engine (INALTERADO)                                            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────┘

Disk:
 <workspace>/.igrpstudio/
   pages/<id>.json          ← PageConfig (produção, partilhado)
 <workspace>/.analyst/       ← ignorado pelo engine + .gitignore
   mocks/<id>.mock.json      ← mock data (exclusivo Analyst)
   prompts/<id>.log          ← histórico de prompts IA (opcional)
```

### 2.2 Integração no Studio — toggle de modo global

- **Decisão**: toggle global no header, **não** aba separada nem perspective.
- Motivo: canvas, árvore de componentes, painel de properties e schema `PageConfig` são os mesmos. Só mudam:
  - O botão "Preview" (Developer → `next dev` spawn; Analyst → runtime renderer).
  - A presença dos painéis "AI Copilot" e "Mock Studio" (só no modo Analista).
- Implementação: `AppModeContext` (`'developer' | 'analyst'`). Painéis leem o modo para mostrar/ocultar.
- Persistência: `workspace.preferredMode` no `workspace.json`.

### 2.3 Preview runtime (peça crítica)

**Decisão: Interpretador JSON → React em runtime, num `<iframe>` sandboxed do renderer.**

| Alternativa | Veredicto |
|---|---|
| `next dev` spawn | Pesado, lento, exige build Node — inadequado para analista |
| Gerar TSX + compilar com esbuild em memória | Lento, reintroduz toolchain |
| **Interpretador JSON → React em runtime** | ✅ Reaproveita design-system já carregada; latência ~0 |
| Electron BrowserView | Overhead; iframe no mesmo renderer é suficiente |

**Estrutura do interpretador** (novo package: `studio/packages/runtime-renderer`):
1. **Component Registry em runtime**: map `componentName → React.Component` espelhando o registry do engine, importando de `@igrp/igrp-framework-react-design-system`.
2. **Interpreter**: função `render(pageConfig, mock): ReactElement` — percorre `Layout.children` e emite JSX (equivalente runtime dos helpers Handlebars do engine).
3. **Data layer stub**: `fetchData`, `actions`, `states` implementados com `useState`/`useReducer` sobre o mock. **Nunca faz HTTP.**
4. **Isolamento**: iframe com `sandbox="allow-scripts allow-same-origin"` + CSP restritiva.

**Cuidado crítico**: o interpretador duplica lógica dos helpers Handlebars. Para evitar divergência:
- Extrair essa lógica para `packages/nextjs-engine/src/core/` (TS puro, sem Handlebars) e **chamar dos dois lados** (Handlebars helpers + interpreter).
- **Este refactor é pré-requisito do modo Analista** e o maior risco técnico.

### 2.4 Separação mock vs real data (não-negociável)

**Estrutura**:
```
<workspace>/
  .igrpstudio/pages/<id>.json     ← PageConfig (fonte única, sem mock)
  .analyst/mocks/<id>.mock.json   ← paralelo, referenciado por pageId
```

**Formato do `<id>.mock.json`** (revisado com base no exemplo real `viewUtente`):
```jsonc
{
  "$version": 1,
  "pageId": "viewUtente",
  "pageConfigHash": "sha1:…",      // detecta drift
  "args": { "uuid": "fake-utente-001" },
  "onLoadMode": "mock",             // "mock" | "pass-through"
  "stateOverrides": {
    "nomeMaeText": "Maria Santos",
    "anoSelected": "2024"
  },
  "hookStubs": {
    "useDetalheUtente": { "returns": { "data": {/*…*/}, "isLoading": false } },
    "useListaUtentes":  { "returns": { "data": [/*…*/] } }
  },
  "tableData": {
    "contentTableutentes": [/*…*/],
    "contribuicoes":       [/*…*/]
  },
  "fakerSeed": 42
}
```

**Dois modos de preview**:
- **`onLoadMode: mock`** (analista from-scratch): `fnCustomCode` é **ignorado**; runtime só inicializa states com `stateOverrides` e popula tables com `tableData`. Zero risco.
- **`onLoadMode: pass-through`** (analista validando página já feita por dev): executa `fnCode` real num sandbox com hooks stubados. Mais fiel, requer stubs coerentes.

**Garantias de zero-leak no TSX**:
1. Engine é **read-only de `.igrpstudio/pages/`** — nunca olha para `.analyst/`. Isolamento por path.
2. CI check: grep no TSX gerado por marcadores `__mock__` / paths `.analyst/` → falha build.
3. `.analyst/` entra no `.gitignore` por default do template de workspace.
4. Teste unitário no engine: "dado page X com/sem mock, o TSX gerado é idêntico".

### 2.5 Integração IA

**Decisão: API externa (Claude via Anthropic SDK), não modelo local.**

Justificativa:
- Qualidade para saída JSON-estruturada com schema grande (PageConfig) favorece modelos frontier.
- Ollama local exigiria instalador pesado, GB de modelos, e ainda assim inferior em structured output.
- "Offline": o canvas manual funciona sem IA; IA é acelerador, não bloqueante.
- Usar `tool_use` / `response_format: json_schema` do Anthropic SDK para **forçar conformidade ao Zod schema do PageConfig**.

**Onde a IA entra** (3 pontos, do mais valioso ao menos):
1. **Gerar PageConfig a partir de descrição** (`"cadastro de clientes com tabela filtrable"`). Prompt recebe Zod schema + catálogo de componentes + 3–5 exemplos few-shot.
2. **Gerar mock data** coerente com a `PageConfig` já montada. Claude infere shape a partir de `types[]` + leituras no `fnCustomCode` (ex.: `data?.utenteId` → mock tem `utenteId`).
3. **Sugestões contextuais inline** (ex.: "este form parece faltar validação X"). Valor menor, Phase ≥4.

**Handler arquitetural**:
- `src/main/handlers/ai-handler.ts` (novo). Chama Anthropic SDK (API key só no main, nunca expor ao renderer).
- **Prompt caching agressivo**: catálogo de componentes + Zod schema no system prompt cacheado (TTL 5 min, ~90% tokens savings).
- Settings: API key em `settings.json` por utilizador; fallback UI educada quando ausente.

### 2.6 Handoff Analista → Developer

**O que é entregue**: apenas `.igrpstudio/pages/<id>.json` (PageConfig). O `.analyst/` fica no workspace do analista e **nunca é committado**.

**Fluxo**:
1. Analista trabalha numa branch `analyst/feature-x`, commit só em `.igrpstudio/pages/` (bloqueado por `.gitignore`).
2. "Promote to Developer" no UI: valida `PageConfig` com o Zod do engine, gera TSX localmente (simula o fluxo dev), abre diff preview, e fecha o modo analyst para a página.
3. Developer faz pull da branch, abre a página em Developer mode, escreve o `fnCustomCode` real + implementa os hooks importados como ficheiros separados (`@/app/(myapp)/hooks/*`).
4. O mock pode ser **arquivado** para testes (`.analyst/mocks/archive/`) e reutilizado em Storybook/Playwright, mas nunca entra no TSX.

**Separação natural confirmada pelo exemplo real**:
- **Analista mexe em**: `components[]`, `states[]`, `types[]`, `args[]`, `functions[]`, `rules[]`, `interactions.fnCustomSet` (handlers UI pequenos).
- **Developer escreve**: `interactions.onLoad.fnCustomCode` (lógica de dados) + ficheiros em `@/app/(myapp)/{hooks,components,functions}/*`.
- **Enforcement**: no modo Analyst, editor de `fnCustomCode` fica read-only.

---

## Fase 3 — Ferramentas recomendadas

| Peça | Recomendação | Alternativas descartadas |
|---|---|---|
| Runtime interpreter | TS puro, novo package `runtime-renderer` | `react-live` (limitado); MDX (wrong tool) |
| Sandbox preview | `<iframe sandbox>` no renderer | BrowserView (overhead); popup (UX ruim) |
| Extração de helpers | Handlebars helpers → `@igrp/nextjs-engine/core` (TS puro) | Rewrite com ts-morph (fora de escopo) |
| Mock synthesis | `@faker-js/faker` + overlays IA | Chance.js; MSW (é sobre rede, não dados) |
| LLM | `@anthropic-ai/sdk` com prompt caching + tool-use structured output | OpenAI; Ollama local |
| Validação | Zod (já em uso) + JSON Schema derivado para prompt IA | — |
| Storage mock | JSON files em `.analyst/` no workspace | SQLite (overkill); IndexedDB (handoff difícil) |
| Diff UI (handoff) | `react-diff-viewer-continued` | Monaco diff (já deve estar no Studio) |
| Parser de expressões | `jsep` (5 KB) para `rules.condition` + `segments` | `eval` livre (❌ inseguro); `expr-eval` |
| Sandbox JS completo | `SES / Lockdown` para `onLoadMode: pass-through` | `vm2` (CVEs conhecidos); `isolated-vm` (só Node) |

---

## Fase 4 — Roadmap incremental

| Fase | Entrega | Cobertura no exemplo real `viewUtente` |
|---|---|---|
| **0 — Prep** | Extrair helpers Handlebars para TS puro compartilhável. Testes snapshot garantindo TSX idêntico. | Precondição — bloqueia tudo |
| **1 — Runtime MVP** | Interpreter de `components[]` + IGRP* primitives + placeholders para project-local + avaliador jsep para `rules` e `segments` + executor seguro de `fnCustomSet` | 70% — renderiza a maior parte da página |
| **2 — Mock Studio básico** | `mock-data.json` com `args` + `stateOverrides` + `tableData` + UI para edição | Analista cria página from scratch |
| **3 — `onLoadMode: mock`** | Ignora `fnCustomCode`, inicializa states do mock, liga tableData aos tables por tag | Analista vê a página funcionar com dados |
| **4 — AI Copilot** | Gera PageConfig; infere mock a partir de `types[]` + leituras no `fnCode` | Acelerador |
| **5 — `onLoadMode: pass-through`** | Sandbox avalia `fnCustomCode` com `hookStubs`; IA gera `hookStubs` coerentes | Analista valida página dev-authored |
| **6 — Registry opt-in** | Projeto declara componentes local-safe para preview (`.analyst/components-registry.tsx`) | `LoadingPage`, `UserSummaryBar` etc. |

**MVP viável**: Fases 0 + 1 + 2 + 3.
Com isto, analista consegue recriar a `viewUtente` do zero e ver todas as tabelas/cards funcionando com mock — sem nunca tocar em `fnCustomCode`.

**Dependências**: 0 → 1 → (2 ∥ 3) → 4 → 5 → 6. Fases 2 e 3 podem ir em paralelo por equipas diferentes.

---

## Decisões-chave

| Decisão | Escolha | Motivo |
|---|---|---|
| Integração no Studio | Toggle de modo global | Reuso máximo do canvas |
| Preview | Interpretador JSON→React em iframe | Latência, simplicidade, offline |
| Mock location | `.analyst/mocks/` paralelo | Zero-leak no TSX garantido por path |
| Fonte única layout | Extrair helpers para core TS puro | Evita drift permanente |
| IA | Anthropic SDK remoto + structured output | Qualidade + simplicidade |
| Catálogo de componentes runtime | Registry manual espelhando engine | Auto-gerar a partir de `.hbs` é impraticável |
| Handoff | Só `pages/*.json` vai para Git | Princípio "zero mock em produção" |
| `fnCustomCode` | Modo `mock` ignora; modo `pass-through` sandboxed | Código analista != código dev |
| Componentes project-local | Placeholder inteligente no MVP | Evita transpilar TSX no Electron |
| Expressões (`rules`, `segments`) | `jsep` + mini-evaluador whitelist | Determinístico e auditável |

---

## Riscos e trade-offs

1. **Duplicação de lógica engine ↔ runtime** — maior risco técnico.
   **Mitigação**: Fase 0 (extrair core TS compartilhado) + teste de paridade por fixture. **Sem isto, o preview mente.**

2. **Design-system em Server Components**: se algum IGRP* primitive assumir `next/navigation` ou Server Component-only, quebra no iframe.
   **Mitigação**: auditoria inicial; stubs no runtime para hooks Next (`useRouter`, `useSearchParams`).

3. **`fnCustomCode` executar código arbitrário**: `actionCustomCode.actionCode` pode ter qualquer JS.
   **Mitigação intencional**: modo `mock` **não executa**; modo `pass-through` isola em sandbox SES.

4. **Zod schema drift**: se engine evolui `PageConfig` e runtime não acompanha, preview quebra.
   **Mitigação**: `PageConfig` fica no engine; runtime só depende dele.

5. **IA custos**: prompt com catálogo completo é grande.
   **Mitigação**: prompt caching (Anthropic SDK, TTL 5min) reduz ~90% dos tokens.

6. **Offline**: modo Analista funciona 100% sem IA; apenas geração AI exige rede. Aceitável.

7. **Componentes exclusivos de produção** (charts server-rendered, PDF viewer) podem ter renderização degradada.
   **Mitigação**: fallback estético "preview not available, switch to dev mode".

8. **Drift `fnCustomCode` ↔ states/tables**: se dev renomeia state, `fnCode` pode quebrar silenciosamente.
   **Mitigação**: lint pass no engine que parseia `fnCode` com `@babel/parser`, extrai `setXxx` e cross-checa com `states[].name`.

---

## Frameworks de referência (obrigatórios de estudar)

### Os dois mais próximos
1. **Plasmic** — https://www.plasmic.app · https://github.com/plasmicapp/plasmic
   - Mesma ideia de "JSON único → code-gen + headless runtime SDK".
   - `@plasmicapp/loader-react` é o equivalente do runtime renderer proposto.
   - "Example data" nas data sources = mock separado do real.

2. **Puck** — https://puck.dev · https://github.com/measuredco/puck
   - Visual editor React open-source, minimalista (~50 KB).
   - `<Render data={data} config={config} />` é o interpretador JSON→React puro.
   - `config` = registry de componentes — idêntico ao vosso `component.setRenderer()`.
   - **Referência de arquitetura para a Fase 1 MVP.**

### Por peça da arquitetura

| Peça | Framework | Notas |
|---|---|---|
| Runtime interpreter | **Puck**, **Builder.io SDK**, **WebStudio** (https://webstudio.is), **Craft.js** | Ver `packages/core/lib/data/walk-tree.ts` do Puck |
| Dual output (code-gen + runtime) | **Plasmic**, **TeleportHQ UIDL**, **Mitosis** | UIDL spec muito instrutivo |
| Mock paralelo | **MSW** (Mock Service Worker), **Storybook + msw-storybook-addon**, **Retool** "Sample Data" | MSW é o padrão de mock sem poluir prod |
| AI gera JSON | **v0.dev** (Vercel), **Builder.io Visual Copilot**, **Plasmic AI**, **Locofy** | Estudar prompting e few-shot |
| Sandbox JS | **jsep**, **expr-eval**, **SES/Lockdown** | Evitar `vm2` (CVEs) |
| Low-code desktop open-source | **Appsmith**, **ToolJet**, **Budibase**, **Noodl** (open-source 2024, Electron) | Noodl mais próximo do vosso stack |

### Leitura prioritária (alto ROI)
1. Puck `packages/core/lib/data/walk-tree.ts` + `render.tsx` — ~400 linhas, cabe numa tarde.
2. Plasmic `packages/loader-react/src/index.ts` — data-binding + states em runtime.
3. Builder.io `@builder.io/react/blocks` — como tratam componentes custom registados pelo utilizador (equivalente a `LoadingPage`, `UserSummaryBar`).

---

## Próximo passo recomendado

**Spike de 1–2 dias** antes de commitar ao roadmap completo:
1. Pegar a `viewUtente.json` como fixture.
2. Escrever um interpreter mínimo cobrindo só os componentes usados nessa página: `page`, `section`, `container`, `columns`, `column`, `grid`, `pageHeader`, `infoCard`, `infoSection`, `infoItem`, `tabs`, `tabsItem`, `table`, `tableTextCell`, `tableLinkCell`, `tableBadgeCell`, `tableActionListCell`, `inputText`.
3. Hard-code um mock mínimo (uuid, states, tableData).
4. Renderizar dentro de uma janela Electron isolada.

**Objetivo do spike**: responder à dúvida-chave —
**"os componentes IGRP* funcionam fora do build Next.js?"**.

Se sim, a arquitetura está validada e o roadmap pode arrancar pela Fase 0.
Se não, precisa de rearranjo (ex.: converter componentes problemáticos para
client-only shims no runtime-renderer).
