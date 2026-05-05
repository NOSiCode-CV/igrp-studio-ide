# Codex Handoff

## What Codex Has Done

### GraphQL Specs

- Created GraphQL SDD structure under `specs/`
- Added:
  - constitution
  - phase 1 manifest
  - phase 2 UI mapping
  - phase 3 validation
  - phase 4 generator
  - phase 5 integration
  - phase 6 improvements

### GraphQL Manifest Implementation

- Added:
  - `src/main/types/graphql-manifest.types.ts`
  - `src/main/services/graphql/graphql-manifest.service.ts`
  - `src/main/handlers/graphql/graphql-manifest.handler.ts`
- Registered GraphQL handler from:
  - `src/main/index.ts`
- Added preload bridge methods under:
  - `window.graphql`

### GraphQL Renderer Implementation

- Added GraphQL UI under:
  - `src/renderer/src/generators/api/pages/graphql`
- Implemented:
  - overview
  - operation editor
  - mapper
  - service client
  - validation
  - hook for save/delete/load flows

### Studio Integration

- Updated:
  - `PageWrapper.tsx`
  - `ApiStudioLayout.tsx`
  - `nav-data.tsx`
  - `dropdown-sidebar.tsx`
  - `TabContext.tsx`
  - `appConstants.ts`
  - `utils/index.ts`

### DTO / Contract rename

- Updated visible translation strings so DTO is shown as `Contract`
- Updated new-tab title for DTO to `New Contract`

## Files Touched

### Main / Preload

- `src/main/constants/events.ts`
- `src/main/index.ts`
- `src/main/handlers/graphql/graphql-manifest.handler.ts`
- `src/main/services/graphql/graphql-manifest.service.ts`
- `src/main/types/graphql-manifest.types.ts`
- `src/preload/index.ts`

### Renderer

- `src/renderer/src/components/navigation/TabContext.tsx`
- `src/renderer/src/constants/appConstants.ts`
- `src/renderer/src/env.d.ts`
- `src/renderer/src/generators/api/pages/PageWrapper.tsx`
- `src/renderer/src/generators/api/pages/graphql/index.tsx`
- `src/renderer/src/generators/api/pages/graphql/mapper.ts`
- `src/renderer/src/generators/api/pages/graphql/operation-editor.tsx`
- `src/renderer/src/generators/api/pages/graphql/service.ts`
- `src/renderer/src/generators/api/pages/graphql/types.ts`
- `src/renderer/src/generators/api/pages/graphql/useGraphQLOperation.ts`
- `src/renderer/src/generators/api/pages/graphql/validation.ts`
- `src/renderer/src/layouts/ApiStudioLayout.tsx`
- `src/renderer/src/layouts/components/dropdown-sidebar.tsx`
- `src/renderer/src/layouts/components/nav-data.tsx`
- `src/renderer/src/localization/locales/en/translation.json`
- `src/renderer/src/localization/locales/pt/translation.json`
- `src/renderer/src/utils/index.ts`

### Tests

- `__tests__/graphql-manifest.service.test.ts`
- `__tests__/graphql-manifest.handler.test.ts`

### Specs

- `specs/**`

## What Must Be Reviewed First

### 1. Phase 4 reality check

- Review the current Phase 4 spec against current code.
- Current code does not have active GraphQL generation.
- Current spec discusses GraphQL generation flow after save.

### 2. GraphQL save and persistence contract

- Review:
  - `graphql-manifest.service.ts`
  - `useGraphQLOperation.ts`
  - `validation.ts`
- These are the current operational core.

### 3. Sidebar / tab behavior

- Review:
  - `nav-data.tsx`
  - `TabContext.tsx`
- GraphQL and Contract naming behavior depend on them.

## Warnings For Next Agent

### Warning 1

- Do not assume GraphQL generation is active just because Phase 4 docs exist.

### Warning 2

- Do not reintroduce the old wrong metadata path:
  - `igrpstudio/...`
- Correct path is:
  - `.igrpstudio/...`

### Warning 3

- Do not use `window.graphql` for code generation.

### Warning 4

- If you continue Phase 4, you must first decide whether the generator comes from:
  - official external engine support
  - or a new approved implementation path
- Current repo state does not settle that.

### Warning 5

- Jest handler test currently fails because of Electron mock resolution; do not assume both GraphQL test suites are green.

### Warning 6

- Web typecheck is not clean even before additional GraphQL work.
