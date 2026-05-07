# Phase 5: GraphQL Integration Plan

## 1. Connect UI Save Flow to Manifest Persistence

Wire the Phase 2 UI mapping to Phase 1 persistence behavior.

Tasks:

- Save GraphQL operations into the module manifest path.
- Preserve operation `id` across edit sessions.
- Surface structured validation errors to the UI.
- Ensure invalid data is not persisted.

## 2. Connect Manifest Validation

Run validation at required integration points.

Tasks:

- Run Phase 1 structural validation before saving.
- Run Phase 1 structural validation and Phase 3 reference validation before generation.
- Use module DTO, schema, and model metadata for type resolution.
- Block generation when validation fails.

## 3. Connect Generator Invocation

Integrate GraphQL generation into the existing engine workflow.

Tasks:

- Detect whether the selected module has a GraphQL manifest.
- Invoke GraphQL generation only when a valid manifest exists.
- Keep REST generation behavior unchanged.
- Report GraphQL generation errors separately from unrelated generator errors.

## 4. Verify Backend Project Output

Confirm generated artifacts are written to the expected backend locations.

Tasks:

- Place `schema.graphqls` in the Spring Boot GraphQL resource path.
- Place resolver stubs in the expected backend package structure.
- Ensure package names and imports are compatible with generated project conventions.
- Avoid overwriting developer-owned resolver code without defined behavior.

## 5. Validate Module Compatibility

Confirm modules with and without GraphQL behave correctly.

Tasks:

- Existing modules without `graphql.json` continue to generate normally.
- Modules with GraphQL generate additional GraphQL artifacts.
- GraphQL operations reference only allowed module artifacts.

## 6. Define End-to-End Test Scenarios

Define complete flow scenarios for V1.

Tasks:

- Create module GraphQL manifest from UI.
- Save and reload the manifest.
- Validate references.
- Generate schema and resolvers.
- Run or inspect backend startup with generated GraphQL artifacts.
