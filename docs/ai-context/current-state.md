# Current State

## What Is Already Implemented

### Specs

- Constitution files exist:
  - `specs/constitution/mission.md`
  - `specs/constitution/tech-stack.md`
  - `specs/constitution/roadmap.md`
- GraphQL feature specs exist for:
  - Phase 1 manifest
  - Phase 2 UI mapping
  - Phase 3 validation
  - Phase 4 generator
  - Phase 5 integration
  - Phase 6 improvements

### GraphQL Phase 1 - Manifest

- Implemented files:
  - `src/main/types/graphql-manifest.types.ts`
  - `src/main/services/graphql/graphql-manifest.service.ts`
  - `src/main/handlers/graphql/graphql-manifest.handler.ts`
- Implemented behavior:
  - strict manifest types
  - validation rules
  - load / save / create / update / delete / list operations
  - atomic write via temp file + rename
  - auto-create empty manifest when missing
  - persistence under:
    - `.igrpstudio/<module>/graphql/graphql.json`

### GraphQL Phase 2 - UI Mapping

- Implemented files:
  - `src/renderer/src/generators/api/pages/graphql/types.ts`
  - `src/renderer/src/generators/api/pages/graphql/mapper.ts`
  - `src/renderer/src/generators/api/pages/graphql/service.ts`
  - `src/renderer/src/generators/api/pages/graphql/index.tsx`
  - `src/renderer/src/generators/api/pages/graphql/operation-editor.tsx`
  - `src/renderer/src/generators/api/pages/graphql/useGraphQLOperation.ts`
- Implemented behavior:
  - Query / Mutation / Subscription editors
  - UI model for operation editing
  - sanitizer/payload mapping
  - operation-specific field handling
  - GraphQL overview/editor tabs in API Designer
  - GraphQL grouped sidebar integration

### GraphQL Phase 3 - Validation

- Implemented file:
  - `src/renderer/src/generators/api/pages/graphql/validation.ts`
- Implemented behavior:
  - GraphQL operation name validation
  - uniqueness by operation type
  - return type required
  - return mode validation
  - param validation
  - mutation input type required
  - subscription event topic required
  - save blocked on invalid form state

### GraphQL Studio Integration

- `PageWrapper.tsx` routes GraphQL pages
- `nav-data.tsx` builds GraphQL section and grouped operations
- `ApiStudioLayout.tsx` refreshes file tree when `changeStatus` flips
- `TabContext.tsx` supports GraphQL new-tab titles and `New Contract`

### DTO Visual Rename

- DTO remains the internal artifact type.
- Visible UI translations were changed to `Contract` / `Contracts`.
- New DTO tab title was adjusted to `New Contract`.

## What Was Reverted

### Local GraphQL schema generation in Horizon

- A local Horizon-side schema-only generator path was implemented during development and later removed.
- Removed concepts:
  - local `createGraphqlSchema` flow
  - preload engine binding for GraphQL schema generation
  - local main event/handler for GraphQL schema generation
  - local `SpringEngine` GraphQL schema method
  - local schema generation service
  - save-triggered local schema generation

### Current result after revert

- GraphQL manifest save still works.
- GraphQL Designer still works.
- No local `schema.graphqls` generation remains in active code.

## What Is Broken / Incomplete

### Phase 4 generator integration

- Current repo code does **not** contain an active GraphQL generation flow.
- Current repo code does **not** call `window.engine.createGraphqlSchema(...)`.
- GraphQL generation is therefore incomplete.

### Phase 4 spec vs code mismatch

- Current Phase 4 spec says GraphQL schema generation should happen after save using the engine flow.
- Current code does not implement that.
- This mismatch must be treated as active architectural debt.

### Test status

- `__tests__/graphql-manifest.service.test.ts` passes.
- `__tests__/graphql-manifest.handler.test.ts` currently fails because Jest cannot resolve the `electron` mock mapping.

### Web typecheck status

- `npm run typecheck:web` currently fails on pre-existing/non-GraphQL issues:
  - `src/renderer/src/components/monaco-editor.tsx`
  - `src/renderer/src/generators/ui/types/CardComponent.tsx`

## What Is Currently Being Worked On

- No active code change is in progress inside the repo for GraphQL generation.
- Immediate focus has shifted to:
  - commit hygiene
  - AI handoff documentation
  - preserving accurate project context for the next agent

## Current Working Assumptions

- GraphQL persistence path is finalized as:
  - `.igrpstudio/<module>/graphql/graphql.json`
- `window.graphql` is finalized as GraphQL persistence only.
- GraphQL backend generation must eventually use `window.engine`, not `window.graphql`.
- Official external GraphQL engine integration details remain `UNKNOWN`.
