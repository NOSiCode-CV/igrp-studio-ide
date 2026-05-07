# Decisions

## Finalized Decisions

### Metadata path

- GraphQL manifest path is:
  - `.igrpstudio/<module>/graphql/graphql.json`
- Not:
  - `igrpstudio/...`
  - `.igrp/...`

### GraphQL source of truth

- GraphQL operations are persisted as JSON manifest.
- The manifest is the source of truth.
- UI state is not the source of truth.

### GraphQL persistence channel

- `window.graphql` exists for:
  - create
  - update
  - delete
  - list
  of GraphQL operations in the manifest

- `window.graphql` must not be used for backend generation.

### Generation channel

- `window.engine` is the correct channel for code generation.
- Existing Studio generation pattern:
  - Renderer
  - `window.engine`
  - preload
  - `api-handler.ts`
  - `EngineFactory`
  - concrete engine

### GraphQL UI placement

- GraphQL is part of the API Designer.
- GraphQL is not a separate product area.
- GraphQL must reuse Studio navigation/tabs/forms patterns.

### Sidebar behavior

- Sidebar must show GraphQL semantic groups:
  - GraphQL
  - Queries
  - Mutations
  - Subscriptions
- Sidebar must not expose raw `graphql.json`.

### DTO naming

- Internal artifact type remains `dto`.
- Visible UI naming changed to `Contract`.

## Architectural Constraints

- Do not create a parallel GraphQL architecture.
- Do not bypass `.igrpstudio`.
- Do not use UI state as generation input.
- Do not expose raw GraphQL manifest as a user-facing artifact in the API tree.
- Do not mix persistence responsibilities and generation responsibilities.
- Do not attach GraphQL generation to `window.graphql`.
- Do not silently reintroduce local GraphQL generation in Horizon unless explicitly intended.

## Rules That Must Never Be Broken

### Rule 1

- GraphQL persistence must continue to use:
  - `.igrpstudio/<module>/graphql/graphql.json`

### Rule 2

- GraphQL CRUD remains behind `window.graphql`.

### Rule 3

- Backend generation remains behind `window.engine`.

### Rule 4

- Query / Mutation / Subscription modeling must remain distinct:
  - query: no `inputType`, no `eventTopic`
  - mutation: may use `inputType`, no `eventTopic`
  - subscription: may use `eventTopic`, no `inputType`

### Rule 5

- Operation identity must be based on stable `id`, not only `name`.

### Rule 6

- Invalid manifest data must not be partially written.

### Rule 7

- GraphQL must complement the existing API Designer; it must not replace or fork existing REST tooling.

## Known Uncertainties

- Official final GraphQL engine package/API: `UNKNOWN`
- Final official GraphQL generation trigger beyond current repo code: `UNKNOWN`
