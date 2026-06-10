# IGRP Studio Horizon - AI Project Context

## Project Identity

- Project name: `igrp-studio-horizon`
- Product type: Electron desktop application
- UI stack:
  - Electron
  - React
  - TypeScript
  - Redux
  - Formik
  - Tailwind-based design system via `@igrp/igrp-framework-react-design-system`
- Primary backend code generation targets:
  - Spring Boot via `@igrp/igrp-studio-springboot-engine`
  - Next.js via `@igrp/igrp-studio-nextjs-engine`
  - .NET via `@igrp/dotnet-engine`

## Specs and Constitution

Project specs live in `specs/`. These files are NOT auto-loaded into context — read them on demand when the task touches GraphQL design intent, phased scope, or product-level rules.

### Constitution (product-level intent for GraphQL)

- `specs/constitution/mission.md` — purpose, source-of-truth rule (manifest is authoritative), relationship with REST, non-goals.
- `specs/constitution/roadmap.md` — phased plan from Phase 1 (manifest) through Phase 6 (improvements).
- `specs/constitution/tech-stack.md` — Renderer/Preload/Main responsibilities, V1 constraints, GraphQL modeling rules (Query/Mutation/Subscription, return modes, no REST-isms).

### GraphQL feature phases

Each phase folder contains `requirements.md`, `plan.md`, and `validation.md`.

- `specs/features/graphql/phase-1-manifest/` — implemented in repo.
- `specs/features/graphql/phase-2-ui-mapping/` — implemented in repo.
- `specs/features/graphql/phase-3-validation/` — implemented in repo.
- `specs/features/graphql/phase-4-generator/` — NOT implemented; spec describes Spring Boot resolver/schema generation that does not exist in code.
- `specs/features/graphql/phase-5-integration/` — NOT implemented.
- `specs/features/graphql/phase-6-improvements/` — NOT implemented.

When the spec and the repo disagree, the repo is the current truth — flag the divergence rather than acting on the spec as if it were shipped.

## Core Architecture

### Renderer

- Location:
  - `src/renderer/src`
- Responsibilities:
  - Studio UI
  - API Designer UI
  - Page Builder UI
  - GraphQL Designer UI
  - state management and tab/navigation behavior
  - form editing and validation
  - calling `window.api`, `window.engine`, and `window.graphql`

### Preload

- Location:
  - `src/preload/index.ts`
  - `src/preload/index.d.ts`
- Responsibilities:
  - secure bridge from Renderer to Electron Main
  - exposes:
    - `window.api` for project/workspace/file access
    - `window.engine` for backend/frontend engine generation
    - `window.graphql` for GraphQL manifest CRUD/persistence only

### Main

- Location:
  - `src/main`
- Responsibilities:
  - Electron process bootstrapping
  - IPC handlers
  - filesystem access
  - workspace/git/docker/database integrations
  - engine resolution through `EngineFactory`
  - GraphQL manifest persistence service

## Main Subsystems

### API Designer

- Primary Renderer area:
  - `src/renderer/src/generators/api`
- Existing artifact families:
  - Controllers / Actions
  - Models / Schemas
  - DTOs (visually renamed to `Contract`)
  - Responses
  - Enums
  - GraphQL

### Page Builder / Next.js

- Driven by `EVENTS.NEXT.*`
- Uses `NextjsEngine`
- Supports:
  - pages
  - processes
  - metadata loading
  - component registration

### Engine Layer

- `src/main/engines/EngineFactory.ts`
- `src/main/engines/SpringEngine.ts`
- `src/main/engines/NextjsEngine.ts`
- `src/main/engines/DotNetEngine.ts`
- Existing Studio pattern:
  - Renderer save/create action
  - `window.engine.*`
  - preload IPC invoke
  - `api-handler.ts`
  - `EngineFactory.getEngine(...)`
  - specific engine method
  - external engine package writes project artifacts

### GraphQL Designer

- Renderer:
  - `src/renderer/src/generators/api/pages/graphql`
- Main:
  - `src/main/types/graphql-manifest.types.ts`
  - `src/main/services/graphql/graphql-manifest.service.ts`
  - `src/main/handlers/graphql/graphql-manifest.handler.ts`
- Persistence path:
  - `<project-root>/.igrpstudio/<module>/graphql/graphql.json`

## How JSON Generation Works

### Existing Studio Pattern

- Artifact editors in Renderer build structured config objects from form state.
- Save actions call `window.engine.createX(...)` for engine-backed artifacts such as:
  - DTO / Contract
  - Controller / Action
  - Model
  - Module
- The engine packages generate project code/files from those config objects.

### GraphQL Pattern

- GraphQL persists a manifest **and** generates backend code from it. Two
  distinct steps (verified 2026-06-04 against Spring + .NET engines):
- Step 1 — manifest CRUD:
  - UI form state
  - UI-side sanitize/map
  - `window.graphql`
  - preload IPC
  - GraphQL manifest handler
  - GraphQL manifest service
  - `.igrpstudio/<module>/graphql/graphql.json`
- Step 2 — code generation (on operation save/update/delete; subscriptions skipped):
  - `GraphQLService.generateSchemas` reads the persisted manifest (`listGraphQLOperations`)
  - builds a `GraphQLSchemaConfig` per non-primitive return type
  - `window.engine.createGraphqlSchema(config, engineType, basePath)`
  - `EngineFactory` → engine `createGraphqlSchema` (Spring or .NET)
  - engine emits GraphQL backend code (e.g. .NET/HotChocolate `*QueryType.cs`, resolver service, `*.graphqls`)

### Source of Truth Rules

- For GraphQL, the manifest JSON is the source of truth.
- UI state is not a source of truth.
- Generation reads from the manifest/config (`listGraphQLOperations`), not live UI state.

## Engine Role

### Spring Boot

- Current Spring engine methods are used for:
  - DTO generation
  - Controller generation
  - Model generation
  - Module creation
  - Response generation
  - Enum generation
  - deletion / duplication / serialization
- Implemented in:
  - `src/main/engines/SpringEngine.ts`
- Delegates to:
  - `@igrp/igrp-studio-springboot-engine`

### Next.js

- Next.js engine is used for Page Builder and related frontend generation.
- Implemented in:
  - `src/main/engines/NextjsEngine.ts`

### GraphQL Status Relative to Engine

- GraphQL manifest persistence exists in Horizon.
- `window.engine.createGraphqlSchema(...)` **is** an active path: wired from
  the GraphQL Designer (`useGraphQLOperation` → `GraphQLService` → preload →
  `api-handler` → `EngineFactory` → engine), and framework-aware (Spring + .NET).
- It is implemented by both `SpringEngine` and `DotNetEngine` (the latter
  delegates to `@igrp/dotnet-engine`'s `addGraphQLSchema`).
- .NET schema generation was verified 2026-06-04 to emit HotChocolate artifacts
  (`*QueryType.cs`, resolver service, `*.graphqls`).
- NOTE: this corrects an earlier doc state that described GraphQL generation as
  reverted / not integrated.

## Core Philosophy

- Low-code first:
  - users model artifacts visually
  - Studio persists structured definitions
  - engines generate project code
- Reuse existing patterns:
  - do not create parallel architecture for GraphQL
  - reuse API Designer navigation, tabs, forms, preload bridge, and engine flow
- JSON/config driven:
  - manifest/config is authoritative
  - UI should not bypass persistence contracts
- Minimize duplication:
  - GraphQL should plug into the same Studio architecture used by existing artifacts

## Current GraphQL Scope in Repo

- Implemented:
  - Phase 1 manifest types/service/handler/persistence
  - Phase 2 UI mapping and Studio integration
  - Phase 3 validation before save
  - Active schema/resolver generation via `window.engine.createGraphqlSchema`
    (Spring + .NET); .NET emits HotChocolate artifacts
- Not implemented / unverified:
  - subscription generation (explicitly skipped in `GraphQLService`)
  - runtime GraphQL behavior beyond compile (no running-server test performed)

## Important Corrections Already Established

- Real metadata folder is:
  - `.igrpstudio`
- Incorrect historical path:
  - `igrpstudio`
- GraphQL should not expose raw `graphql.json` in the sidebar tree.
- `window.graphql` is for manifest CRUD/persistence only.
- `window.engine` is the generation channel for GraphQL — `createGraphqlSchema`
  is wired and active (see "GraphQL Status Relative to Engine").

## Unknowns

- Official external GraphQL engine/pipeline contract: `UNKNOWN`
- Official product decision for the final GraphQL generation trigger beyond current repo state: `UNKNOWN`
