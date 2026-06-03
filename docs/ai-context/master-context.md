# Master Context

## System Overview

- `igrp-studio-horizon` is an Electron desktop IDE for low-code project design and code generation.
- The repo hosts Studio orchestration and UI, not all code generators directly.
- Generator-heavy backend/frontend creation is delegated to engine packages.

## Top-Level Architecture

### Renderer

- Path:
  - `src/renderer/src`
- Owns:
  - Studio screens
  - API Designer
  - Page Builder
  - GraphQL Designer
  - localization
  - Redux state
  - tab navigation
  - sidebar/tree rendering

### Preload

- Path:
  - `src/preload`
- Owns:
  - trusted bridge from Renderer to Main
  - Electron-safe IPC API exposure

### Main

- Path:
  - `src/main`
- Owns:
  - Electron lifecycle
  - handlers
  - services
  - helper utilities
  - engine resolution
  - IO / filesystem / workspace access

## Domains

### 1. API Designer

- Main path:
  - `src/renderer/src/generators/api`
- Artifact families:
  - Controllers / Actions
  - Models / Schemas
  - DTOs / Contracts
  - Responses
  - Enums
  - GraphQL
- Shared patterns:
  - save-through-engine for existing Spring artifacts
  - tabs via `TabContext`
  - sidebar/menu via `nav-data.tsx` and `dropdown-sidebar.tsx`
  - `PageWrapper.tsx` dispatches current editor component by `OPTION_TYPE`

### 2. Page Builder

- Main path:
  - `src/renderer/src/pages`
  - `src/renderer/src/layouts`
  - `src/renderer/src/redux`
- Integrated with Next.js engine through `EVENTS.NEXT.*`

### 3. Engine Layer

- Main files:
  - `src/main/engines/EngineFactory.ts`
  - `src/main/engines/SpringEngine.ts`
  - `src/main/engines/NextjsEngine.ts`
  - `src/main/engines/DotNetEngine.ts`
- Mental model:
  - Studio does not generate all files itself
  - Studio often transforms UI data into config payloads
  - payloads are passed into engine packages

### 4. GraphQL

- Main UI path:
  - `src/renderer/src/generators/api/pages/graphql`
- Main persistence path:
  - `src/main/services/graphql/graphql-manifest.service.ts`
- Manifest location:
  - `<project-root>/.igrpstudio/<module>/graphql/graphql.json`
- Current capability:
  - operation authoring and persistence
- Current missing capability:
  - integrated code generation

### 5. Workspace / Project Metadata

- Main handler/service/helpers:
  - `src/main/handlers/workspace-handler.ts`
  - `src/main/services/workspace-service.ts`
  - `src/main/helpers/index.ts`
- `.igrpstudio` is the project-local Studio metadata root used by this repo.

### 6. Git / Provider Integrations

- Main files:
  - `src/main/handlers/git-handler.ts`
  - `src/main/services/git-service.ts`
  - `src/main/services/github-service.ts`
  - `src/main/services/gitlab-service.ts`

### 7. Docker / Database / Doctor

- Main handlers/services:
  - `db-handler.ts`
  - `docker-handler.ts`
  - `doctor-service.ts`

## How Domains Connect

### Existing artifact flow

- Renderer editor form
- `window.engine.createX(...)`
- preload IPC
- `src/main/handlers/api-handler.ts`
- `EngineFactory.getEngine(engineType)`
- engine method
- external engine package writes project artifacts

### GraphQL flow today

- GraphQL form editor
- UI validation
- UI mapper/sanitizer
- `window.graphql.create/update/delete/list`
- preload IPC
- `src/main/handlers/graphql/graphql-manifest.handler.ts`
- `src/main/services/graphql/graphql-manifest.service.ts`
- manifest persisted under `.igrpstudio`

## Important Mental Model

- There are two distinct channels:

### `window.engine`

- purpose:
  - generation of actual project artifacts
- examples:
  - DTO
  - controller
  - model
  - module

### `window.graphql`

- purpose:
  - GraphQL manifest CRUD only
- not used for:
  - backend schema generation
  - resolver generation

- This distinction must be preserved.

## GraphQL-Specific Mental Model

- GraphQL is an extension of the API Designer, not a separate subsystem.
- GraphQL is manifest-driven.
- `.igrpstudio/<module>/graphql/graphql.json` is the persisted contract.
- The sidebar must expose GraphQL concepts:
  - GraphQL
  - Queries
  - Mutations
  - Subscriptions
- The sidebar must not expose raw `graphql.json`.

## Reuse Model

- Reused:
  - API Designer shell
  - tabs
  - sidebar/tree
  - save/delete patterns
  - Redux refresh pattern
  - preload/main IPC style
- Created specifically for GraphQL:
  - GraphQL manifest types
  - GraphQL persistence service
  - GraphQL handler
  - GraphQL UI pages/hooks/mapper/validation

## Current Boundary

- GraphQL phases 1-3 are effectively present in code.
- Phase 4 exists in specs, but active engine integration is not present in current repo code.
