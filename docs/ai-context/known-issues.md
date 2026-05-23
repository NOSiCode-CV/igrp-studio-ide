# Known Issues

## GraphQL / Spec Inconsistency

- Phase 4 generator spec currently describes a GraphQL generation path that is not active in code.
- Current code state:
  - no active `window.engine.createGraphqlSchema(...)`
  - no active local schema generation service
- Impact:
  - docs/specs may imply more implementation than the repo currently contains

## Handler Test Failure

- File:
  - `__tests__/graphql-manifest.handler.test.ts`
- Current problem:
  - Jest cannot resolve the `electron` mock mapping for this suite
- Effect:
  - GraphQL service tests pass
  - GraphQL handler suite does not currently pass cleanly

## Web Typecheck Failure

- `npm run typecheck:web` currently fails on existing Renderer issues:
  - `src/renderer/src/components/monaco-editor.tsx`
    - unused `@ts-expect-error`
  - `src/renderer/src/generators/ui/types/CardComponent.tsx`
    - unused import
    - unused `@ts-expect-error`
- These issues are not specific to GraphQL persistence.

## Line Ending Noise

- The following files may appear modified locally without meaningful content changes:
  - `src/main/engines/SpringEngine.ts`
  - `src/main/handlers/api-handler.ts`
  - `src/main/interfaces.d.ts`
  - `src/preload/index.d.ts`
- Cause:
  - LF / CRLF normalization on Windows

## Documentation Noise

- The repo may contain unrelated local debug docs under:
  - `docs/igrp-studio-debug-report.md`
  - `docs/igrp-studio-debug-report.docx`
- These are not part of the GraphQL implementation contract.

## UI vs Browser / Runtime Notes

- The Studio runs inside Electron.
- Renderer state depends on preload APIs and IPC, not a plain browser environment.
- Some UI behavior depends on the `.igrpstudio` file tree refresh triggered by Redux `changeStatus`.
- A browser-only mental model is insufficient when debugging persistence/refresh behavior.

## Code Generation Status

- Existing DTO / Controller / Model generation uses external engine packages.
- GraphQL generation is not currently active in the repo.
- Any future GraphQL generation work must account for:
  - spec/code mismatch
  - official engine support being `UNKNOWN`
