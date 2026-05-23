# Process / BPMN Integration — Implementation Plan

> **Scope.** Bring **full BPMN authoring** to the desktop Studio. Today the UI
> generator only **connects to** an existing Process API (read-only-ish); now
> we want to **create** Projects, Process Definitions, draw diagrams, and
> manage Variables — same experience as the online product
> (`process/studio/frontend/igrp-process-studio-ui`).
>
> **Two consumers, one shared layer.** The same BPMN code is reused by:
> 1. The **Specification project type** (new rail item `processes` next to
>    Knowledge / Documents / Prototype).
> 2. The **UI generator** (`generators/ui/browser/processes/`) — refactored to
>    consume the shared layer instead of its own SDK/auth.
>
> **Out of scope.** **Deploy** stays parked (governance/versioning still being
> defined — independent of auth, which is now in scope).
>
> **Self-contained.** This plan is executed in its own Claude Code session,
> independent of the Specification project type work. Read it cold; everything
> needed is here or linked.
>
> **Branch.** No new branch — work continues on the current feature branch
> (`feat/specification-generator`). The Process integration is treated as an
> additive feature alongside the Specification project type; both ship from
> the same branch.
>
> **Auth.** Authentication handling lands **in this milestone** (was previously
> deferred). Deploy remains out of scope — that decision is independent of
> auth, since deploying touches versioning + governance that are still being
> discussed.

---

## 1. Context & motivation

The online iGRP Process Studio already provides a polished BPMN authoring
experience built on:

- `@igrp/framework-process-studio-bpmn-editor` (the `IGRPBpmnModeler`
  component — bpmn-js wrapper)
- `@igrp/framework-process-studio-client` (typed REST SDK)
- `@igrp/framework-process-studio-types` (canonical interfaces)
- TanStack Query for caching + mutations
- A pages layout: `/process` (list) and `/process/[code]/editor` (Diagram +
  Delegates + Variables tabs)

The desktop Studio already has a partial BPMN module under
`src/renderer/src/generators/ui/browser/processes/` plus a custom
`bpmn-service.ts` that talks REST through the IPC `fetchData` helper. It
**reuses the same modeler library** but reinvents the client and types, lacks
auto-save, has no Variables UI, and never converts the diagram between Camunda
and Activiti dialects — which the online product does on every save/load.

The goal is to bring the desktop experience to **functional parity with the
online editor** (minus deploy), reusing the published packages so the two
products stay aligned over time.

## 2. Inventory

### 2.1. What the online has that we will adopt

| Asset | File / package |
|---|---|
| Editor wrapper | `IGRPBpmnModeler` from `@igrp/framework-process-studio-bpmn-editor` |
| Typed SDK | `@igrp/framework-process-studio-client` (`createProcessStudioClient`) — `processDefinitions`, `variables`, `projects` |
| Types | `@igrp/framework-process-studio-types` (`ProcessDefinition`, `VariableDefinition`, `Project`, `PaginatedResponse`) |
| Camunda↔Activiti conversion | `convertCamundaToActiviti` / `convertActivitiToCamunda` in `app/(myapp)/functions/utils.ts` |
| Server functions | `app/(myapp)/functions/process-definition.ts` (`getProcessDefinitionById`, `createOrUpdateProcessDefinition`, `saveDiagramProcessDefinition`, `getVariables`, `createOrUpdateVariable`) |
| TanStack hooks | `app/(myapp)/hooks/process.ts` (`useDetailProcessDefinition`, `useSaveDiagramProcessDefinition`) |
| Editor page composition | `app/(igrp)/(generated)/process/[code]/editor/page.tsx` — Diagram tab + DelegatesHelper + Variables (auto-save with debounce) |
| Delegates helper | `app/(myapp)/components/delegates-helper.tsx` |

### 2.2. What the desktop already has

| File | What it does | Keep / replace |
|---|---|---|
| [generators/ui/browser/processes/bpmn-manager.tsx](studio/igrp-studio-ide/src/renderer/src/generators/ui/browser/processes/bpmn-manager.tsx) | Top-level: list configs + processes per project | Keep, refactor to use SDK |
| [bpmn-config-card / bpmn-config-grid / bpmn-connection-modal](studio/igrp-studio-ide/src/renderer/src/generators/ui/browser/processes/components/) | Manage API endpoint configs (`apiUrl`, `basePath`, `token`) | Keep — desktop-specific multi-config |
| [bpmn-local-view.tsx](studio/igrp-studio-ide/src/renderer/src/generators/ui/browser/processes/components/bpmn-local-view.tsx) (404 lines) | Renders local `.bpmn` files from the project workspace | Keep as **local-file viewer**; new editor is for API-backed processes |
| [bpmn-project-selector.tsx](studio/igrp-studio-ide/src/renderer/src/generators/ui/browser/processes/bpmn-project-selector.tsx) | Picks active project | Keep |
| [process-card / process-artifact-card](studio/igrp-studio-ide/src/renderer/src/generators/ui/browser/processes/components/) | Display cards for projects / processes / artifacts | Keep |
| [hooks/useBPMNData.ts](studio/igrp-studio-ide/src/renderer/src/generators/ui/browser/processes/hooks/useBPMNData.ts) | Loads BPMN data | Replace internals with SDK calls |
| [services/bpmn-service.ts](studio/igrp-studio-ide/src/renderer/src/services/bpmn-service.ts) | Custom `makeRequest` over `window.api.fetchData` | Wrap SDK instead; preserve public surface for the existing UI |
| [components/bpmn-diagram-viewer.tsx](studio/igrp-studio-ide/src/renderer/src/components/bpmn-diagram-viewer.tsx) | Standalone `IGRPBpmnModeler` wrapper (~60 lines, no save/load) | Keep as a lightweight viewer (used elsewhere); the new editor is a separate component |

### 2.3. Gaps to close

| Capability | Online | Desktop today | Action |
|---|---|---|---|
| Typed SDK | ✓ | makeRequest manual | **Adopt** SDK |
| Camunda↔Activiti conversion | ✓ | ✗ | **Port utils** |
| Auto-save | debounced mutation | manual Save button | **Build** (TanStack mutation or Redux thunk + setTimeout) |
| Variables UI | full CRUD | ✗ | **Build** |
| Editor with tabs (Diagram / XML / Variables) | ✓ | only viewer | **Build** |
| Auth refresh | NextAuth session | static token | **In scope** (M6.A) |
| Deploy | ✓ | ✗ | **Out of scope** (tracked) |

## 3. Decisions

| # | Decision |
|---|---|
| D1 | Adopt `@igrp/framework-process-studio-client` and `@igrp/framework-process-studio-types`. The desktop's existing `bpmn-service` becomes a **thin wrapper** that injects the active config and forwards to the SDK. |
| D2 | Add **TanStack Query** but **scoped** — only for the new BPMN module. Existing Redux slices (`specKB`, `specDocs`, `specPrototype`, `PageBuilder`, `git`) stay untouched. Caching pays off for processes lists and diagram fetches. |
| D3 | Camunda↔Activiti conversion is **always applied at the boundary**: `Activiti → Camunda` on load (modeler input), `Camunda → Activiti` on save (server input). Mirrors the online product. |
| D4 | The new editor lives at a new route `PATH_PROCESS_EDITOR = '/process-editor/:processId'` and is reachable from the existing process list/cards. The current `BPMNManager` becomes the list view. |
| D5 | **Deploy is out of scope.** Save (draft) only. The Deploy button stays as a placeholder modal — but the rationale is now governance/versioning, **not** auth (auth is solved in M6.A). |
| D6 | Auth supports **three credential modes** in the BPMN config: (a) static bearer token, (b) OAuth 2.0 password grant, (c) OAuth 2.0 client credentials grant. The desktop performs the token exchange in the **main process** so refresh tokens never reach the renderer. |
| D7 | Reuse the IGRP design system (`@igrp/igrp-framework-react-design-system`) — no new shadcn or other UI lib. |
| D8 | Tokens (access + refresh) are stored encrypted via Electron `safeStorage`, keyed by config id. **Never** persisted in plain JSON or in `electron-store`. |
| D9 | The SDK gets an `Authorization` header from a centralised resolver (`process-auth-service`). Every 401/403 response triggers exactly one transparent refresh attempt; on second failure the user sees a "Reconnect" toast that opens the BPMN config card. |
| D10 | All BPMN code lives in a **single shared module** at `src/renderer/src/features/bpmn/` — services, hooks, components, types, conversion utils. **Neither generator owns BPMN code directly.** The UI generator's `browser/processes/` and the Specification's new `processes` rail tab are **thin consumers** of this module. |
| D11 | Specification's rail gains a new tab `processes` so process authoring lives next to spec authoring (same project context — `basePath`, KB, docs). Order in the rail: **Knowledge → Documents → Prototype → Processes**. |
| D12 | The existing `generators/ui/browser/processes/` keeps its top-level entry points (`bpmn-manager.tsx`, `bpmn-project-selector.tsx`) but their internals are replaced by imports from `features/bpmn/`. Any service file that duplicates SDK/auth/conversion is removed. |

## 4. Architecture

### 4.1. Shared BPMN module (top-level)

Everything BPMN-related lives in **one** place. Both consumers (Specification
rail tab + UI generator's processes browser) import only from here. No
generator duplicates SDK calls, conversion, or auth.

```
src/renderer/src/features/bpmn/                  ← NEW shared module
├── index.ts                                     (public re-exports — what consumers import)
├── client/
│   ├── process-studio-client.ts                 (SDK factory bound to active config + auth)
│   └── client-context.tsx                       (React provider — single instance per window)
├── auth/
│   ├── useProcessAuthStatus.ts                  (renderer view; talks to main via IPC)
│   └── auth-types.ts                            (AuthKind union shared with main)
├── hooks/
│   ├── useProcessDefinitions.ts                 (list — TanStack)
│   ├── useProcessDefinition.ts                  (detail; loads → Camunda after conversion)
│   ├── useSaveProcessDiagram.ts                 (mutation; Camunda → Activiti on save)
│   ├── useAutoSaveDiagram.ts                    (debounce wrapper around the above)
│   ├── useVariables.ts                          (list)
│   ├── useVariableMutations.ts                  (CRUD)
│   └── useBPMNConfig.ts                         (active config + connection helpers)
├── components/
│   ├── ProcessList.tsx                          (project → processes table; filter; new btn)
│   ├── ProcessEditor/                           (the full editor — Tabs)
│   │   ├── ProcessEditor.tsx
│   │   ├── EditorHeader.tsx                     (name, breadcrumb, Save status, Deploy placeholder)
│   │   ├── DiagramTab.tsx                       (IGRPBpmnModeler + auto-save)
│   │   ├── XmlTab.tsx                           (Monaco read/edit raw XML)
│   │   ├── VariablesTab.tsx                     (CRUD VariableDefinition)
│   │   └── DelegatesHelper.tsx                  (ported from online)
│   ├── connection/
│   │   ├── BPMNConnectionModal.tsx              (auth-kind aware)
│   │   ├── BPMNConfigCard.tsx
│   │   └── BPMNConfigGrid.tsx
│   └── BPMNLocalView.tsx                        (local .bpmn file viewer — moved from UI generator)
├── conversion/
│   ├── camunda-activiti.ts                      (port of online utils)
│   └── camunda-activiti.test.ts                 (round-trip tests)
└── types/
    └── index.ts                                 (re-exports + extensions on top of @igrp/framework-process-studio-types)
```

### 4.2. Consumers

```
src/renderer/src/generators/specification/components/
└── ProcessesPanel.tsx                           ← NEW — content variant for the new 'processes' rail tab
                                                   (renders ProcessList; click → navigate to editor)

src/renderer/src/generators/ui/browser/processes/  ← REFACTORED — pure consumer now
├── bpmn-manager.tsx                              (uses features/bpmn/components/ProcessList)
├── bpmn-project-selector.tsx                     (kept; uses features/bpmn/hooks)
├── components/                                   (cards/grids that orchestrate, no BPMN logic)
│   ├── process-card.tsx
│   ├── process-artifact-card.tsx
│   ├── copy-legacy-version.tsx
│   └── generate-new-step-form.tsx
├── hooks/
│   └── useBPMNData.ts                            (gone — replaced by features/bpmn/hooks)
└── utils/                                        (gone — moved to features/bpmn/conversion + main services)

src/main/services/
├── process-auth-service.ts                       ← NEW (token lifecycle, only place tokens live decrypted)
└── (bpmn-service.ts in renderer/src/services becomes a tiny shim or is deleted — see M6.0)
```

### 4.3. Why this layout

| Concern | Where it lives | Why |
|---|---|---|
| Token storage + refresh | `main/services/process-auth-service.ts` | Renderer must never see refresh tokens; main owns secrets |
| SDK instance | `features/bpmn/client/` | Single source of truth for headers/config; both consumers share the same instance |
| Conversion | `features/bpmn/conversion/` | Pure functions, easily unit-tested, used identically by both consumers |
| TanStack hooks | `features/bpmn/hooks/` | Caching is a feature of the **module**, not of the generator that calls it |
| UI components | `features/bpmn/components/` | The `ProcessEditor` is the same in Specification and UI generator — written once |
| Routing / layout | the consuming generator | Each generator decides where to mount the editor (rail tab vs. existing browser) |

### 4.4. Routing

The full `ProcessEditor` is mounted inline by each consumer (no global route):

- **Specification rail** — `ProcessesPanel` shows `<ProcessList />`; selecting
  a process replaces the panel with `<ProcessEditor processId=… />` (in-panel
  navigation; "Back to list" button in the header).
- **UI generator browser** — `bpmn-manager.tsx` shows `<ProcessList />`;
  selecting a process opens the same `<ProcessEditor />` inside its current
  layout.

We deliberately avoid a top-level route (`/process-editor/:id`) so the editor
keeps its **project context** (`basePath`, active config) coming from the
generator that owns it.

### 4.5. TanStack scope

Wrap `<App />` in `QueryClientProvider`. Reuse the same client across the app
but **scope** queries to BPMN keys only:

```ts
['bpmn', 'projects']
['bpmn', 'project', projectId]
['bpmn', 'process', processId]
['bpmn', 'variables', processId]
```

Mutations: `saveDiagram`, `createOrUpdateProcess`, `createVariable`,
`updateVariable`, `deleteVariable`. They **invalidate** the relevant query
keys on success.

## 5. Milestones

> **Acceptance per milestone:** type-check passes, the tab renders, the
> documented behaviour works manually against a real Process API.

### M6.A — Process auth service (new)

> Lands first because every other milestone depends on a working
> `Authorization` header. Replaces the static-token-only model.

**Backend (main):**
- [ ] `src/main/services/process-auth-service.ts` — owns the token lifecycle
      per `BPMNConfig.id`. Public surface: `getAccessToken(configId)`,
      `refresh(configId)`, `signIn(configId, credentials)`, `signOut(configId)`,
      `clearAll()`.
- [ ] Three auth flows behind a discriminated union on
      `BPMNConfig.auth.kind`:
  - `'static'` — existing bearer token, returned as-is.
  - `'password'` — POST to `<authUrl>/oauth/token` with
    `grant_type=password&client_id=…&username=…&password=…`. Stores the
    `access_token` + `refresh_token` + `expires_at`.
  - `'client_credentials'` — POST `grant_type=client_credentials` with
    `client_id` + `client_secret`. No refresh token; we re-grant on
    expiry.
- [ ] Token storage in `<userData>/process-auth.bin` encrypted via
      `safeStorage`. Schema: `{ [configId]: { accessToken, refreshToken?,
      expiresAt, tokenType } }`.
- [ ] Refresh strategy: when `expiresAt - now < 60s` OR a 401 fires, call
      `refresh()`. Single in-flight refresh per config (Promise dedupe) so
      concurrent SDK calls share the result.
- [ ] IPC channel `spec:process-auth:*` —
      `get-access-token / sign-in / sign-out / status / clear`. Renderer
      never sees raw tokens; it gets `{ ready: boolean, expiresAt?: number,
      kind: AuthKind }`.

**Renderer:**
- [ ] Extend `BPMNConfig` type: add `auth: { kind: 'static', token } |
      { kind: 'password', authUrl, clientId, username, password? } |
      { kind: 'client_credentials', authUrl, clientId, clientSecret }`.
      Keep backward compat: existing configs default to `kind: 'static'`.
- [ ] Update `bpmn-connection-modal.tsx` — radio for auth kind + dynamic
      form fields per kind. "Test connection" calls `signIn` first then a
      throwaway list query.
- [ ] Status badge on `BPMNConfigCard` — `Connected` / `Token expires in
      Xm` / `Reconnect…`.
- [ ] SDK factory (`process-studio-client.ts`) calls
      `window.processAuth.getAccessToken(configId)` on every request via a
      header interceptor; on 401 it invalidates the cached token, calls
      `refresh`, and retries the original request **once**.

**Tests:**
- [ ] Unit: token expiry math (refresh 60s before expiry; do not refresh
      `static`).
- [ ] Unit: in-flight dedupe (3 concurrent calls trigger 1 refresh).
- [ ] Component: connection modal — switching auth kind clears unrelated
      fields; Test connection round-trip with a mocked OAuth server.

### M6.0 — Shared module scaffold (`features/bpmn/`)

- [ ] `yarn add @igrp/framework-process-studio-client @igrp/framework-process-studio-types @tanstack/react-query --ignore-engines`
- [ ] Create `src/renderer/src/features/bpmn/` with the layout from §4.1.
- [ ] `client/process-studio-client.ts` — SDK factory pulling token from the
      auth IPC bridge (M6.A).
- [ ] `client/client-context.tsx` — React provider; lazily creates the SDK
      instance per active config; invalidates when the active config changes.
- [ ] `index.ts` — explicit public API; nothing else is importable from
      outside the module (lint rule optional).
- [ ] Wrap `<App />` with `QueryClientProvider` (default `staleTime:
      30_000` for read queries).

### M6.1 — Conversion utility

- [ ] Port `convertCamundaToActiviti` / `convertActivitiToCamunda` from the
      online repo to `features/bpmn/conversion/camunda-activiti.ts`.
- [ ] Unit tests: round-trip determinism (`activiti → camunda → activiti`
      and `camunda → activiti → camunda`) on representative diagrams (start
      event, user task with form key, service task with delegate, gateway,
      end event).

### M6.2 — TanStack hooks

- [ ] `useProcessDefinitions(projectId)` — list.
- [ ] `useProcessDefinition(processId)` — detail (returns XML in **Camunda**
      after conversion).
- [ ] `useSaveProcessDiagram(processId)` — mutation (Camunda in, Activiti
      out) with optimistic update + invalidation.
- [ ] `useAutoSaveDiagram` — debounce (1.5 s) wrapper around the save
      mutation; flush on blur/unmount; cancel in-flight on subsequent
      change.
- [ ] `useVariables(processId)` — list.
- [ ] `useVariableMutations(processId)` — create / update / delete.
- [ ] All hooks expose loading / error states; errors toast via
      `useIGRPToast`.

### M6.3 — `ProcessEditor` component (shared)

- [ ] `components/ProcessEditor/ProcessEditor.tsx` — accepts
      `{ processId, onClose? }` and owns Tabs state.
- [ ] `EditorHeader.tsx` — process name, breadcrumb (Project → Process),
      Save status indicator (`Saving… / Saved Xs ago / Unsaved`), placeholder
      `Deploy…` button (info modal).
- [ ] No routing — the editor is **embedded** by each consumer.

### M6.4 — Diagram tab

- [ ] `DiagramTab.tsx` — `<IGRPBpmnModeler>` consuming Camunda XML.
- [ ] Wire `useAutoSaveDiagram` to its `onChange`; surface status to the
      `EditorHeader`.
- [ ] Click on element → `DelegatesHelper` (ported from online) in a side
      panel.

### M6.5 — XML tab

- [ ] Monaco editor (read-write) showing the **Camunda** XML.
- [ ] Save button + on-blur save (same mutation as DiagramTab; goes
      through `convertCamundaToActiviti`).
- [ ] "Format" + "Validate" buttons (validate via `bpmn-moddle` if
      lightweight; otherwise just XML well-formedness).

### M6.6 — Variables tab

- [ ] List of `VariableDefinition` (name, type, required, defaultValue,
      scope).
- [ ] `+ New variable` modal (form per the type system — string, number,
      boolean, date, json).
- [ ] Inline edit / delete with confirmation.
- [ ] Empty state with explainer.

### M6.7 — Specification consumer (new rail tab)

- [ ] `SpecificationContext` — extend the `SpecificationTab` union with
      `'processes'`.
- [ ] `SpecificationLayout.tsx` — add the new rail item (label
      `Processes`, icon `Workflow` from lucide). Order:
      **Knowledge → Documents → Prototype → Processes**.
- [ ] `components/ProcessesPanel.tsx` (content variant) — renders
      `ProcessList` (from `features/bpmn`); selecting a process swaps to
      `<ProcessEditor processId=… onClose={…}/>` inside the same panel
      (no global navigation; back button restores the list).
- [ ] List variant for the secondary panel — quick filter + "+ New" button
      that opens the create-process modal.
- [ ] i18n keys (`processes`, `processes.empty`, `processes.new`).

### M6.8 — UI generator consumer (refactor)

- [ ] `generators/ui/browser/processes/bpmn-manager.tsx` — replace inline
      list logic with `<ProcessList />` from `features/bpmn`.
- [ ] Open editor inline using `<ProcessEditor />` (same component).
- [ ] Delete the duplicated `services/bpmn-service.ts` once nothing depends
      on it (or reduce to a tiny shim that simply re-exports the
      `useBPMNConfig` helpers from the shared module — one place, one
      decision).
- [ ] Move `bpmn-local-view.tsx` to `features/bpmn/components/BPMNLocalView.tsx`
      and re-import from the UI generator.

### M6.9 — Tests

- [ ] Unit: `conversion.ts` round-trips.
- [ ] Unit: `useAutoSaveDiagram` debounce + cancellation (fake timers).
- [ ] Component (RTL): VariablesTab CRUD with a mocked SDK.
- [ ] Smoke (happy path manual): list → open editor → edit diagram →
      auto-save → reload → diagram preserved (in **both** consumers).

### M6.10 — Polish

- [ ] Loading skeletons everywhere.
- [ ] Error states with retry.
- [ ] i18n keys completed.
- [ ] Keyboard: `Cmd/Ctrl+S` saves manually (in addition to debounce).
- [ ] Disable form controls when no active config — prompt to set one
      (deep-link to the BPMN config card).

## 6. IPC / preload changes

**None expected.** The SDK runs entirely in the renderer and talks REST via
`fetch`. The existing `window.api.fetchData` IPC stays available for legacy
paths but is no longer the main path for BPMN.

If we hit CORS issues that force routing through main, add an opt-in:

```ts
// services/process-studio-client.ts
// when env IGRP_PROCESS_API_VIA_MAIN === '1', wire `fetch` to window.api.fetchData
```

## 7. Out of scope (tracked)

- **Deploy** (`processDefinitions.deploy`) — needs auth refresh + clear
  semantics for "live" vs draft. Deferred.
- **OAuth refresh tokens.** Today the active config holds a static token. A
  dedicated milestone will add refresh + re-auth UI when expirations bite.
- **Project CRUD on the server.** Listing works; create/update/delete of
  Projects via the API stays on the online product for now.
- **Multiple concurrent editors** for the same process (collaboration). Out
  of scope.
- **Diagram diffing / version history of processes.** The Process API may
  support versions; surfacing them is post-MVP.

## 8. Risks & mitigation

| Risk | Mitigation |
|---|---|
| SDK version drift across desktop / online | Pin both projects to the same `@igrp/framework-process-studio-*` versions; bump together |
| Camunda↔Activiti conversion regressions | Port verbatim, lock with round-trip tests; keep utils file in 1:1 sync with the online copy until a shared package exists |
| TanStack + Redux mixed mental model | Document the rule: TanStack for **server state in BPMN module**, Redux for **app state + Specification project type**. Don't bleed |
| 401 due to expired token | Toast + redirect to BPMN config card; manual re-paste of token. Refresh story is the next milestone |
| Auto-save while user is rapidly typing in XML tab | Debounce + cancellation; "Unsaved" indicator until idle 1.5s; abort previous mutation on new change |
| Large diagrams in the editor | bpmn-js handles 1000+ shapes fine; nothing to do |
| CORS in dev | Electron renderer requests are file://; if the API rejects, fall back to `window.api.fetchData` (already exists) |

## 9. Estimated effort

| Phase | Items | Estimate |
|---|---|---|
| **Auth (M6.A)** | service + IPC + connection modal + status + tests | **~3 h** |
| Shared module + conversion + hooks (M6.0–M6.2) | features/bpmn scaffold, SDK, conversion, TanStack hooks | ~3.5 h |
| ProcessEditor + Diagram (M6.3–M6.4) | header + modeler + auto-save + delegates | ~3 h |
| XML + Variables tabs (M6.5–M6.6) | Monaco + variables CRUD | ~3 h |
| Specification consumer (M6.7) | new rail tab + ProcessesPanel | ~1.5 h |
| UI-gen consumer refactor (M6.8) | swap to shared module + cleanup | ~1.5 h |
| Tests (M6.9) | conversion + debounce + CRUD + smoke both consumers | ~2 h |
| Polish (M6.10) | states + i18n + shortcuts | ~1 h |

**Total: ~18.5 h** of focused work for the MVP described — covers **both
consumers** end-to-end, not just one.

## 10. Approval gate

Before starting M6.A in the dedicated session, confirm:

1. ✅ Deploy is out of scope (no UI, only placeholder modal).
2. ✅ Adopt `@igrp/framework-process-studio-{client,types}` packages.
3. ✅ Add TanStack Query scoped to BPMN module only.
4. ✅ Camunda↔Activiti conversion always at the boundary.
5. ✅ Auth handled in M6.A — three flows (static / password / client_credentials)
      with `safeStorage` token storage and main-process refresh.
6. ✅ All BPMN code lives in **shared `src/renderer/src/features/bpmn/`**;
      both consumers (Specification rail + UI generator browser) import only
      from there. No global route — editor is embedded inline by each
      consumer.
7. ✅ Specification gains a new rail tab `processes`; UI generator's
      `browser/processes/` refactors to consume the shared module.
8. ✅ Same feature branch as Specification work (`feat/specification-generator`),
      no fork.
9. ☐ Decide if the Variables tab supports the full IGRP variable type system
      or only the basics (string / number / boolean / date) on day one.
10. ☐ Confirm which OAuth flows the Process API actually exposes — pin the
       auth implementation to whatever the server supports (default: password
       grant, since that's what the online product uses behind NextAuth).
