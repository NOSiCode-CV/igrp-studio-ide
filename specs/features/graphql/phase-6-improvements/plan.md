# Phase 6: GraphQL Improvements Plan

## 1. Improve Operation Overview

Enhance the GraphQL overview after V1 behavior is stable.

Tasks:

- Add clearer grouping and counts for Queries, Mutations, and Subscriptions.
- Show validation status per operation.
- Add search and filtering for large modules.
- Add duplicate operation flow that generates a new stable `id`.

## 2. Add Schema Preview

Define a read-only schema preview generated from the current manifest.

Tasks:

- Render preview from validated manifest data.
- Show Query, Mutation, and Subscription blocks.
- Highlight validation errors that block preview generation.
- Keep preview separate from persisted manifest content.

## 3. Expand Type Modeling

Define richer type and input modeling after base operation generation works.

Tasks:

- Evaluate explicit GraphQL `types` and `inputs` collections.
- Define mapping helpers from DTOs and schemas.
- Add field include/exclude controls.
- Add relation modeling options with V1-safe defaults.

## 4. Improve Subscription Modeling

Extend minimal `eventTopic` modeling.

Tasks:

- Add topic suggestions from known event patterns where available.
- Define optional payload mapping.
- Define optional filter argument behavior.
- Keep advanced subscription features optional.

## 5. Evaluate Nested Inputs

Explore nested input support under strict validation.

Tasks:

- Define allowed nesting depth.
- Define relation ownership rules.
- Define generator constraints for nested writes.
- Keep relation ID input pattern as the default.

## 6. Optimize Large Module Experience

Improve performance and maintainability.

Tasks:

- Cache type metadata where safe.
- Debounce validation in UI workflows.
- Avoid expensive full-manifest recalculation on every small edit.
- Keep persistence atomic after validation.

## 7. Define Migration Rules

Prepare future manifest evolution.

Tasks:

- Use manifest `version` for migrations.
- Define backward-compatible defaults.
- Document changes before implementation.
- Keep existing V1 manifests readable.
