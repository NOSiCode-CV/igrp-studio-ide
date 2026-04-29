# Data Models / Database — Implementation Plan

> **What we're building.** A new **Data Models** feature inside the
> Specification project type that lets the user:
>
> 1. **Connect** to a database (the Studio already supports this in the API
>    generator) and **import** schema → entities.
> 2. **Author** entities **from scratch** without a connection (greenfield
>    relations, fields, constraints).
> 3. **Visualise** everything as an interactive ERD (gojs diagram already in
>    the Studio — reused).
> 4. **Chat with the AI Assistant** to author the schema — drawing on the
>    project's **Knowledge Base** and the **active Document** as context, and
>    emitting entity-ops the panel applies automatically (mirrors the
>    Prototype builder's file-ops pattern).
> 5. **Feed** the data model into the Documents AI Assistant + Prototype
>    builder so generated UI / API code matches the schema.
>
> **Specification-first feature, also reused by the API generator.** This
> feature ships as **`src/renderer/src/features/data-models/`** and is
> consumed by:
>
> 1. The **Specification project type** — gains a new rail item `data` next
>    to Knowledge / Documents / Prototype. **Chat panel is first-class here.**
> 2. The **API generator** (`generators/api/pages/diagram` and
>    `components/DatabaseManager/`) — refactored to drop its private copies
>    and consume the shared module. Chat is optional in this consumer (off
>    by default for now).
>
> **Self-contained.** Read this doc cold; everything needed (architecture,
> milestones, decisions, risks) is here.
>
> **Branch.** Same feature branch (`feat/specification-generator`). Additive.

---

## 1. Context & motivation

The Studio already has a good DB foundation that **only the API generator
uses today**:

- `src/main/handlers/db-handler.ts` — IPC `connection:*` (save / find / delete
  connections, connect, list tables, get table structure)
- `src/main/services/database-service.ts` — connection persistence
- `src/renderer/src/generators/api/components/DatabaseManager/` — UI to
  manage connections, browse tables (`ConnectionForm.tsx` 544 lines,
  `ConnectionManager.tsx` 186, `TableManager.tsx` 284, `index.tsx` 234)
- `src/renderer/src/generators/api/pages/diagram/` — gojs-powered ERD
  (`ERDDiagram.tsx` 179, `convertModelData.tsx` 53, `index.tsx` 34)
- Knex-based runtime (MySQL / PostgreSQL / Oracle / H2 supported)

These are tied to the API generator's data flow (`useStudioAPI(currentItem)`
→ models). The Specification project type cannot reuse them today, and the
"create from scratch" flow doesn't exist anywhere — entities are only
discovered by introspecting a live database.

**Goal:** make data modelling a **portable Studio capability**, available to
every project type that wants it, supporting both DB-introspection and
greenfield authoring, with the same diagram and editors.

## 2. Inventory

### 2.1. What already exists (will be lifted to the shared module)

| Asset | Location | Lines | Notes |
|---|---|---|---|
| ConnectionForm | `generators/api/components/DatabaseManager/ConnectionForm.tsx` | 544 | New / edit connection (driver, host, port, schema, ssl…) |
| ConnectionManager | `generators/api/components/DatabaseManager/ConnectionManager.tsx` | 186 | List + select + test + delete |
| TableManager | `generators/api/components/DatabaseManager/TableManager.tsx` | 284 | Browse tables of a connection, pick which to import |
| DatabaseManager (root) | `generators/api/components/DatabaseManager/index.tsx` | 234 | Orchestrates the above |
| ERDDiagram | `generators/api/pages/diagram/ERDDiagram.tsx` | 179 | gojs ERD with relations |
| convertModelData | `generators/api/pages/diagram/convertModelData.tsx` | 53 | API model → diagram nodes/links |
| Connection types page | `pages/connections.tsx` | 14 | Thin route wrapper |
| db-handler | `main/handlers/db-handler.ts` | 77 | IPC for connection lifecycle |
| database-service | `main/services/database-service.ts` | 20 | Repository over `IGRPStudioSettings` |
| Knex helpers | `getTables`, `getTableStructure` (in helpers) | — | Driver-agnostic introspection |

Total **~2k lines of working code** to reorganise — far cheaper to extract
than to rewrite.

### 2.2. What is missing (new code)

| Capability | Notes |
|---|---|
| Greenfield model authoring | Users today can only import from DB; specs need to start from nothing |
| Per-project model store | Today connections are global; entities live in the API project's metadata. Specification needs entities **scoped to the project**, persisted in `<basePath>/data-models/` |
| Manual relation editor | Drawing relations on the ERD by hand (today: only inferred from FKs) |
| Field editor (modal / inline) | Add / rename / change type / nullable / default / index |
| Diff against live DB | "These entities differ from the DB schema you imported from — sync?" |
| Export as SQL DDL | For the AI Assistant + Prototype to seed real schemas |
| Import → migrate | Re-import keeps user-added fields; prompts on conflict |

### 2.3. Gaps (online vs. desktop)

There's no online counterpart for this feature — the Studio is the home for
data modelling. So this plan is **not a parity port**; it's a clean design.

## 3. Decisions

| # | Decision |
|---|---|
| D1 | All data-model code lives in **`src/renderer/src/features/data-models/`**. Both the API generator and the Specification project type are thin consumers. No generator owns the code. |
| D2 | The Specification rail gains a new tab. Order proposal: **Knowledge → Documents → Data → Processes → Prototype** (Data feeds Processes which feed Prototype; both feed Documents). |
| D3 | Entity storage is **per-project** at `<basePath>/data-models/index.json` + per-entity files `<entityId>.json` for diff-friendly Git history. Connections stay **global** (existing settings). |
| D4 | Two source modes per entity: `imported` (linked to a connection + table; can re-sync) and `manual` (greenfield). The two coexist in the same project. |
| D5 | The diagram (gojs ERD) is **interactive** — user can drag entities, resize, draw relations. Layout is persisted alongside entity data (`layout: { x, y }`). |
| D6 | Field types use a **canonical type system** internal to the feature (string / int / decimal / boolean / date / datetime / json / blob / enum / reference). Driver-specific type mapping happens at import / DDL export time. |
| D7 | Relations supported on day one: **one-to-one, one-to-many, many-to-many** (with explicit join entity for M:N). |
| D8 | Connection-level secrets (passwords) stay in their existing storage; we don't move them. The shared module reads through the existing `connection:*` IPC. |
| D9 | When a project's data model is dirty vs the source DB, surface a "drifted" badge + a "Sync to DB" CTA. Direction is **DB → spec** for now (no destructive writes back to the database in this milestone). |
| D10 | The shared module exposes a small **public adapter** (`useEntities`, `useEntity`, `useConnections`, `<EntityTable />`, `<ERDCanvas />`, …) — generators import from `features/data-models/index.ts` only. |
| D11 | DDL export (PostgreSQL + MySQL dialects) is in-scope; runtime migrations / Liquibase are out of scope. |
| D12 | The **AIAssistant is first-class** inside the `DataModelsPanel` (Specification rail). It reuses the shared `AIAssistant` component with a new mode and a `chatBackend` that talks to a new **`spec-data-generator-service`** in the main process — same streaming pattern as the Prototype builder. |
| D13 | The chat backend emits **entity-ops** in a strict JSON contract (analogous to the Prototype's file-ops): `entity-create`, `entity-update`, `entity-delete`, `relation-add`, `relation-remove`. They're parsed, validated, sandboxed (UUID-only refs), then applied by `spec-data-service`. The renderer surfaces an "Applied N · Failed M" snapshot card on the bubble. |
| D14 | The system prompt is composed by the panel's `contextProvider` and **always** includes the current entities (id + name + types + relations summary). It optionally adds: (a) the **active document** content (when a doc is selected in the Documents tab), (b) the user-selected **KB items** via `kbRefs` linking (toggle "Use KB"), (c) the project-wide KB if the doc has none linked but the toggle is ON (last-resort fallback). |
| D15 | Auto-apply policy mirrors Prototype: when the user chooses **Apply** intent in the chat (vs **Ask**), valid JSON entity-ops are applied silently on done; if the model returns prose without a JSON block, auto-apply is skipped and the bubble shows a manual "Apply" action. Replace and bulk operations require an explicit confirmation modal. |

## 4. Architecture

### 4.1. Shared module layout

```
src/renderer/src/features/data-models/        ← NEW shared module
├── index.ts                                   (public API)
├── types/
│   ├── entity.ts                              (Entity, Field, Relation, FieldType)
│   ├── connection.ts                          (re-export from main; thin extensions)
│   └── diagram.ts                             (NodeLayout, LinkLayout)
├── store/
│   ├── entity-store.ts                        (per-project; renderer-side wrapper over IPC)
│   └── ipc.ts                                 (typed wrappers for spec:data:* + connection:*)
├── connection/
│   ├── ConnectionManager.tsx                  (was DatabaseManager/ConnectionManager.tsx)
│   ├── ConnectionForm.tsx                     (was DatabaseManager/ConnectionForm.tsx)
│   └── TablePicker.tsx                        (was TableManager.tsx — renamed for clarity)
├── editor/
│   ├── EntityList.tsx                         (table of entities; +new btn)
│   ├── EntityEditor.tsx                       (open one entity; tabs Fields / Relations / SQL)
│   ├── FieldsTable.tsx                        (CRUD field rows)
│   ├── RelationsList.tsx
│   └── EntityFormModal.tsx
├── diagram/
│   ├── ERDCanvas.tsx                          (was generators/api/pages/diagram/ERDDiagram.tsx)
│   ├── convertModelData.ts                    (moved from generators/api/pages/diagram)
│   └── layout.ts                              (auto-layout helpers — dagre or hand-rolled)
├── import/
│   ├── ImportFromDbWizard.tsx                 (pick connection → tables → preview → import)
│   └── schemaToEntities.ts                    (TableStructure → Entity[])
├── export/
│   ├── entitiesToDdl.ts                       (PostgreSQL + MySQL dialects)
│   └── entitiesToTypescript.ts                (optional helper for Prototype)
├── ops/                                       ← NEW — entity-ops contract for AI
│   ├── entity-ops.ts                          (parser + sandbox + types)
│   └── apply.ts                               (renderer-side helper to dispatch ops to IPC)
├── chat/                                      ← NEW — AIAssistant integration
│   ├── DataChatPanel.tsx                      (mounts shared <AIAssistant /> in 'data' mode)
│   └── buildSystemPrompt.ts                   (composes entities + doc + KB context)
└── hooks/
    ├── useEntities.ts                         (list + filter)
    ├── useEntity.ts                           (single entity CRUD)
    ├── useRelations.ts
    └── useConnections.ts
```

### 4.2. Backend (main process)

```
src/main/services/
├── database-service.ts                       (kept — connections repo)
├── spec-data-service.ts                      ← NEW
│   ├── list(basePath): Entity[]
│   ├── get(basePath, entityId): Entity | null
│   ├── create(basePath, input): Entity
│   ├── update(basePath, entityId, patch): Entity
│   ├── remove(basePath, entityId): void
│   ├── applyOps(basePath, ops): { applied, failed }      ← used by chat backend
│   ├── importFromConnection(basePath, connectionName, tableNames): Entity[]
│   └── exportDdl(basePath, dialect): string
└── spec-data-generator-service.ts            ← NEW (chat → entity-ops pipeline)
    └── generate(input): AsyncIterable<DataChunk>
        // input  : { basePath, userMessage, specContext, providerId, model, signal }
        // chunks : delta | op-applied | op-failed | parse-error | error | done

src/main/handlers/
├── db-handler.ts                             (kept — connection:*)
└── spec-data-handler.ts                      ← NEW
    ├── spec:data:* (CRUD + import + export + apply-ops)
    └── spec:data:generate-{start,cancel,chunk} (chat streaming, mirrors prototype)
```

Storage on disk:

```
<basePath>/data-models/
├── index.json                                (Entity[] minus content; tree of ids/names/source)
├── entities/
│   ├── <entityId>.json                       (full Entity payload — fields, relations, layout)
│   └── …
└── snapshots/
    └── <ts>.json                             (optional — pre-import backups)
```

### 4.3. Consumers

```
src/renderer/src/generators/specification/components/
└── DataModelsPanel.tsx                       ← NEW (rail tab content)
                                               Layout: chat-left + main-right (mirrors PrototypePanel)
                                                 - Chat (360px): <DataChatPanel />
                                                 - Main: tabs Entities / ERD / SQL preview
                                                   · Entities tab → <EntityList /> + <EntityEditor />
                                                   · ERD tab → <ERDCanvas />
                                                   · SQL preview tab → <SqlPreview /> (live DDL)

src/renderer/src/generators/api/                ← REFACTORED
├── pages/diagram/                             (gone — replaced by features/data-models/diagram)
└── components/DatabaseManager/                (gone — replaced by features/data-models/connection)

src/renderer/src/pages/connections.tsx          (still mounts the route, but now imports
                                                 ConnectionManager from features/data-models)
```

### 4.4. Why a shared module (not split per generator)

| Concern | Where | Why |
|---|---|---|
| Diagram engine (gojs) | `features/data-models/diagram/` | Single instance of the heavy library; same look across generators |
| Connection management | `features/data-models/connection/` | Connections are global; the UI to manage them belongs to the feature |
| Entity store (per project) | `features/data-models/store/` | Specification scopes entities to a project; API generator scopes to its module — same shape, different basePath |
| Import / Export | `features/data-models/import` + `export` | Both consumers benefit equally |

### 4.5. IPC channels (`spec:data:*`)

CRUD + import/export:

```
spec:data:list             ({ basePath })                 → Entity[]
spec:data:get              ({ basePath, entityId })       → Entity | null
spec:data:create           ({ basePath, input })          → Entity
spec:data:update           ({ basePath, entityId, patch })→ Entity
spec:data:remove           ({ basePath, entityId })       → { ok }
spec:data:reorder          ({ basePath, layout })         → { ok }       (drag positions)
spec:data:apply-ops        ({ basePath, raw })            → { applied, failed }
spec:data:import-from-db   ({ basePath, connectionName, tables }) → Entity[]
spec:data:diff-with-db     ({ basePath, entityId })       → SchemaDiff   (drift indicator)
spec:data:export-ddl       ({ basePath, dialect })        → { sql }
spec:data:changed          (event)                        — broadcast on mutations
```

Chat streaming (mirrors `spec:prototype:generate-*`):

```
spec:data:generate-start    ({ requestId, basePath, userMessage, specContext, providerId, model })
spec:data:generate-cancel   ({ requestId })
spec:data:generate-chunk    (event)
                            chunk types:
                              - delta            (raw text from the model)
                              - op-applied       ({ kind, entityId, name? })
                              - op-failed        ({ op, error })
                              - parse-error      ({ message, raw })
                              - error            ({ message, code? })
                              - done
```

`connection:*` channels stay as-is.

### 4.6. Entity-ops contract (used by `spec:data:apply-ops` and the chat)

```json
{
  "summary": "Add Order, OrderItem and link to existing Customer",
  "ops": [
    {
      "op": "entity-create",
      "name": "Order",
      "fields": [
        { "name": "id", "type": "uuid", "primaryKey": true },
        { "name": "customerId", "type": "reference", "ref": "Customer.id" },
        { "name": "total", "type": "decimal", "nullable": false }
      ]
    },
    { "op": "entity-update", "id": "<uuid>", "patch": { "name": "Customer", "fields": [ … ] } },
    { "op": "entity-delete", "id": "<uuid>" },
    { "op": "relation-add", "from": "OrderItem.orderId", "to": "Order.id", "kind": "many-to-one" },
    { "op": "relation-remove", "id": "<relationId>" }
  ]
}
```

Validation rules:

- All ids are UUIDs; reference by id (rename-safe). Names accepted in
  `entity-create`/`relation-add` are resolved to ids server-side.
- `relation-add` rejects if `from` or `to` doesn't resolve to a known field.
- `entity-delete` cascades **only** when `cascade: true` is set explicitly;
  otherwise it errors when other entities reference it.
- Field types restricted to the canonical type system (D6).

## 5. Milestones

> Acceptance per milestone: type-check passes, the new screen renders, the
> documented capability works manually.

### M7.0 — Shared module scaffold

- [ ] Create `src/renderer/src/features/data-models/` with the layout above.
- [ ] Move `ERDDiagram.tsx` + `convertModelData.tsx` → `diagram/`.
- [ ] Move `DatabaseManager/*` → `connection/` (rename TableManager →
      TablePicker; ConnectionManager / ConnectionForm preserved).
- [ ] Update `pages/connections.tsx` to import from the shared module.
- [ ] Update API generator (`generators/api/pages/diagram/index.tsx`) to
      import the moved modules. **No behaviour change** at this point.
- [ ] Add an explicit `index.ts` exporting the public surface; lint others.

### M7.1 — Canonical types + per-project store

- [ ] `types/entity.ts` — `Entity`, `Field`, `Relation`, canonical
      `FieldType` enum.
- [ ] `spec-data-service.ts` (main) — CRUD over
      `<basePath>/data-models/{index.json, entities/<id>.json}`.
- [ ] `spec:data:*` IPC + preload (`window.specData`) + types in
      `env.d.ts`.
- [ ] Renderer hooks (`useEntities`, `useEntity`) talking to the IPC.
- [ ] Storage migration: API generator's existing module → entities for the
      first opened project (best-effort; users can re-import otherwise).

### M7.2 — Specification rail tab `data`

- [ ] `SpecificationContext` — extend tab union with `'data'`.
- [ ] Rail entry in `SpecificationLayout.tsx` (icon `Database` from lucide).
      Order: **Knowledge → Documents → Data → Processes → Prototype**.
- [ ] `DataModelsPanel.tsx` (content variant): `<EntityList />` left,
      selecting an entity opens `<EntityEditor />` in the same panel.
- [ ] List variant for the secondary pane: filter + "+ New entity" + "Import
      from DB…".

### M7.3 — Greenfield entity authoring

- [ ] `EntityEditor.tsx` — Tabs **Fields / Relations / SQL preview / ERD**.
- [ ] `FieldsTable.tsx` — inline CRUD (name, type, nullable, default, index,
      pk flag, fk target). Validation (no dup names).
- [ ] `RelationsList.tsx` — add 1:1, 1:N, N:M. The N:M flow auto-creates a
      join entity by default (toggleable).
- [ ] Auto-save (debounced) writing each entity's JSON.

### M7.4 — Import from DB (refactor + reuse)

- [ ] `ImportFromDbWizard.tsx` — step 1 pick connection (test if missing;
      deep-link to connection form), step 2 select tables, step 3 preview
      mapping, step 4 commit.
- [ ] `schemaToEntities.ts` — converts `getTableStructure` output to canonical
      `Entity[]` (preserving FKs as relations, keys as pk/index).
- [ ] On commit: write to project store + tag each entity with
      `source: { connection, table }` so we can detect drift.
- [ ] Re-import preserves user-added fields and asks before overwriting
      conflicts (modal with diff).

### M7.4b — Entity-ops + chat backend

- [ ] `ops/entity-ops.ts` — schema, parser (tolerant: fenced JSON →
      balanced-brace fallback), validator (UUIDs, reference resolution,
      cascade rules), `applyOps()` helper.
- [ ] `spec-data-generator-service.ts` (main) — same shape as
      `prototype-generator-service`: builds system prompt with current
      entities + spec context, streams via `llmRouter.chat`, parses ops on
      done, applies via `spec-data-service.applyOps`, emits chunks.
- [ ] IPC `spec:data:generate-{start,cancel,chunk}` + preload exposure.
- [ ] Renderer Redux slice (`redux/specData/`): `entities`, `relations`,
      `turns` (per-request applied/failed counts for the chat snapshot card).
- [ ] Subscribers in `App.tsx` for chunks → slice updates.
- [ ] Unit tests: parser tolerance + UUID resolution + cascade rejection.

### M7.5 — ERD canvas integration

- [ ] `ERDCanvas.tsx` (renamed `ERDDiagram`) wired to the project store.
- [ ] **Drag persistence** — node positions saved as `layout` on the
      entity; debounced.
- [ ] Click on an entity card opens the `EntityEditor` in a side pane.
- [ ] Right-click on canvas → "+ New entity here", "Import from DB…", "Auto
      layout".
- [ ] Auto-layout button — uses `dagre` or a hand-rolled grid; no hard
      dep if the user never clicks.

### M7.6 — Drift detection

- [ ] `spec:data:diff-with-db` — compares live structure vs. saved entity;
      returns missing/added/changed fields.
- [ ] Badge on imported entities when drift detected; CTA "Sync from DB".
- [ ] Sync direction is **DB → spec** only (we don't push changes to the
      live DB in this milestone).

### M7.7 — Export

- [ ] `entitiesToDdl.ts` — emits PostgreSQL and MySQL CREATE TABLE
      statements with FKs and indexes.
- [ ] Toolbar button **Export DDL…** with format picker; uses the file
      picker dialog (mirror docs export).
- [ ] ~~`entitiesToTypescript.ts`~~ — **deferred to a follow-up** (will
      land when the Prototype builder needs typed scaffolding).

### M7.8 — Chat panel inside `DataModelsPanel` + cross-tab integration

> Chat mounts inside the new tab and is the **primary authoring surface**
> alongside the manual editor. It's also referenced from the other tabs.

- [ ] `chat/buildSystemPrompt.ts` — composes:
      1. **Output contract**: "respond with exactly one fenced ```json block
         using the entity-ops schema; for analytical questions reply in
         prose."
      2. **Current entities** (id + name + fields summary + relations).
      3. **Active document** content (when a doc is selected in
         Documents — read via `window.specDoc.read(basePath, selectedId)`).
      4. **Linked KB**: when "Use KB" toggle is ON and the active doc has
         `kbRefs` → run `spec:kb:search(query, refs)` for the user's
         message and inject top-K chunks (mirrors Documents panel logic).
         Fallback: if no doc active but KB has indexed items → use them
         project-wide.
- [ ] `chat/DataChatPanel.tsx` — wraps the shared `<AIAssistant />`:
      - `mode="data"` (extend the union in `AIAssistant.tsx`)
      - `chatBackend={ kind: 'data', basePath, onTurnEvent }` (extend
        `ChatBackend` union in `AIAssistant.tsx` mirroring 'prototype')
      - `supportsKB`
      - Intent picker: **Ask** / **Apply** (Append/Replace make no sense for
        entities)
      - `contextProvider` → `buildSystemPrompt`
- [ ] `AIAssistant.tsx` — accept the new `mode='data'` and the
      `chatBackend.kind === 'data'` route: stream comes from
      `window.specData.generateStart/Cancel/onChunk`; chunk types
      `op-applied` / `op-failed` / `parse-error` are forwarded to the
      Redux slice via `onTurnEvent` (same pattern as prototype).
- [ ] Snapshot card on the assistant bubble: "Applied N · Failed M ·
      summary" with a **Restore** button (revert this turn — uses the same
      undo path as the prototype).
- [ ] Doc Inspector (in `DocumentsPanel`): new section "Linked entities"
      with checkboxes (`Doc.entityRefs?: string[]`) so a spec can declare
      which entities it relies on — surfaced in the Documents AI prompt.
- [ ] `PrototypePanel.contextProvider` — adds an `## Entities` section
      summarising the project's data model when present.

### M7.9 — Tests

- [ ] Unit: `schemaToEntities` round-trip on a representative MySQL +
      PostgreSQL schema.
- [ ] Unit: `entitiesToDdl` snapshot on canonical entity set.
- [ ] Component: `FieldsTable` add/edit/delete; relation add flow.
- [ ] Smoke (manual): import → tweak → export DDL → re-import → no data
      loss; entity used in Prototype generates schema-aware code.

### M7.10 — Polish

- [ ] Loading skeletons across hooks.
- [ ] Empty states (no entities yet) with two CTAs: "Import from DB" /
      "Create new entity".
- [ ] i18n keys (`data_models`, `entities`, `relations`, `import_from_db`,
      `field_*`, `relation_*`).
- [ ] Keyboard: `Cmd/Ctrl+S` saves the active entity manually; `Cmd/Ctrl+I`
      opens import wizard.
- [ ] Drift badge tooltips with the changed fields summary.

## 6. Specification rail layout

```
┌────┐
│ ⌂  │ Home
├────┤
│ 📚 │ Knowledge      (load references)
│ 📄 │ Documents      (write specs)
│ 🗄  │ Data           ← NEW (entities, ERD, import/export)
│ 🔀 │ Processes      ← coming via process-integration plan
│ ✨ │ Prototype      (IA build)
└────┘
```

The order **Data → Processes → Prototype** keeps the conceptual flow:
*"what the system stores → how it flows → how it looks."*

## 7. Out of scope (tracked)

- **Migrations / Liquibase** generation. Pure DDL export only.
- **Push schema changes to live DB.** One-way (DB → spec).
- **Multi-schema / cross-database joins.** Single connection scope.
- **Custom Knex driver registration** — relies on what `database-service`
  already supports.
- **Versioning of entities** (Git is enough; we don't add per-entity revision
  history).
- **AI-generated entities from prose** (e.g. "create entities for an
  e-commerce app") — easy follow-up once M7.8 is in.

## 8. Risks & mitigation

| Risk | Mitigation |
|---|---|
| gojs is heavy + LGPL — already shipped, but adding more usage may bloat | We're not adding new gojs surface; we're moving the existing diagram to the shared module |
| Knex driver bundling per platform | Already solved (works in API generator); shared module reuses same handlers |
| User edits a field that's also a FK source — silent drift | Explicit confirmation modal on FK source field changes |
| Round-trip DB types lossless | Canonical type system has clear default mappings + an "advanced" override per field |
| Conflict on re-import | Diff modal + 3 actions: keep mine / take theirs / merge field-by-field |
| Storage size grows (per-entity JSON) | Storing entities as separate files keeps Git diffs tiny and avoids parsing one huge JSON |
| Renaming an entity breaks FK references in other entities | Reference IDs (UUID), not names — renames are safe |

## 9. Estimated effort

| Phase | Items | Estimate |
|---|---|---|
| M7.0 — Shared scaffold | move existing files; update imports | ~2 h |
| M7.1 — Types + store + IPC | service, handler, preload, hooks | ~2 h |
| M7.2 — Specification rail tab | layout + panel scaffolding | ~1 h |
| M7.3 — Greenfield authoring | EntityEditor + Fields + Relations | ~3 h |
| M7.4 — Import wizard | wizard + diff/merge | ~2.5 h |
| **M7.4b — Entity-ops + chat backend** | parser + generator-service + IPC + slice + tests | **~3 h** |
| M7.5 — ERD canvas + drag | move + persistence + auto-layout | ~2 h |
| M7.6 — Drift detection | diff IPC + badges | ~1 h |
| M7.7 — Export DDL + TS | two dialects + dialog | ~1.5 h |
| **M7.8 — Chat panel + cross-tab AI** | DataChatPanel + AIAssistant 'data' mode + Doc Inspector entity refs + PrototypePanel context | **~2.5 h** |
| M7.9 — Tests | round-trip + snapshot + component + chat e2e | ~2.5 h |
| M7.10 — Polish | states + i18n + shortcuts | ~1 h |

**Total: ~24 h** focused work for the MVP — covers **both consumers**
(API generator refactor + Specification new tab) **and** the AI Assistant
authoring loop end-to-end.

## 10. Approval gate

Before starting M7.0 in a dedicated session, confirm:

1. ✅ Shared module at `src/renderer/src/features/data-models/`; both
      consumers (API generator + Specification rail tab) are thin.
2. ✅ Specification rail order: **Knowledge → Documents → Data → Processes → Prototype**.
3. ✅ Per-project storage at `<basePath>/data-models/`; connections stay
      global.
4. ✅ DDL export covers PostgreSQL + MySQL; migrations are out of scope.
5. ✅ Drift detection is one-way (DB → spec); no destructive writes to live
      DB.
6. ✅ Entity ids are UUIDs; renames are safe across references.
7. ✅ AIAssistant is **first-class inside `DataModelsPanel`**, reusing the
      shared component with new `mode='data'` and `chatBackend.kind='data'`.
      Backend is a new `spec-data-generator-service` that mirrors the
      Prototype builder (LLM stream → parse entity-ops → apply → emit
      chunks).
8. ✅ Chat context: always entities + active doc; KB chunks via the
      existing "Use KB" toggle (RAG over `kbRefs` if present, project-wide
      otherwise).
9. ✅ Auto-apply policy mirrors Prototype: Apply intent applies valid
      entity-ops on done; replace/delete batches require confirmation.
10. ✅ **Canonical field types day-one — minimal + `enum` + `reference`**:
       `string`, `int`, `decimal`, `boolean`, `date`, `datetime`, `json`,
       `enum`, `reference`. Anything else (blob, geo, array, …) is a
       follow-up.
11. ✅ **N:M default — auto-create the join entity.** A toggle in the
       relation form lets advanced users opt-out and keep N:M as pure
       metadata.
12. ✅ **`entitiesToTypescript` is OUT of M7.7.** DDL only (PostgreSQL +
       MySQL). The TS interface emitter will land as a follow-up once the
       Prototype builder needs it for type-safe scaffolding.
