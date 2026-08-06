# Phase 6: GraphQL Improvements Requirements

## Objective

Define post-V1 enhancements for the GraphQL Designer after the manifest, UI mapping, validation, generator, and integration flows are stable.

This phase is intentionally flexible but must remain compatible with the V1 manifest-driven architecture.

## Scope

### UX Improvements

Improve GraphQL authoring efficiency and clarity:

- richer operation overview
- better empty states
- faster type selection
- safer rename and duplicate flows
- improved validation feedback

### Schema Preview

Provide a read-only preview of generated GraphQL schema from the current manifest.

The preview must be derived from manifest data and validation results, not from hand-written UI-only schema state.

### Advanced Subscriptions

Expand subscription modeling after the minimal V1 event topic support is validated.

Possible enhancements:

- topic suggestions
- event payload mapping
- filtering arguments
- backend event integration patterns

### Better Type Modeling

Improve GraphQL type and input modeling:

- explicit GraphQL types
- explicit GraphQL inputs
- DTO-to-GraphQL mapping helpers
- field-level include/exclude controls
- relation modeling guidance

### Optional Nested Inputs

Explore controlled nested input support after V1 relation ID patterns are stable.

Nested inputs must be opt-in and validation-driven.

### Performance Improvements

Improve responsiveness for large modules with many DTOs, schemas, and operations.

## Out of Scope

- Replacing the V1 manifest contract
- Breaking existing REST behavior
- Making GraphQL mandatory for modules
- Generator behavior that bypasses manifest validation

## Constraints

- Improvements must preserve JSON as source of truth.
- Improvements must be backward-compatible or include explicit migration rules.
- Advanced features must not make V1 operation creation harder.
- Schema preview and suggestions must remain derived from validated manifest and module artifacts.
