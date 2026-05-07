# Phase 4: GraphQL Generator Plan

## 1. Define Generator Entry Point

Define how the existing engine/generator flow detects and processes a module GraphQL manifest.

Tasks:

- Locate `.igrpstudio/<module>/graphql/graphql.json`.
- Load the manifest for the selected module.
- Assume Phase 1 and Phase 3 validation have already succeeded.
- Keep GraphQL generation separate from UI state.
- Route generation through:
  `Renderer -> window.engine -> preload -> api-handler -> EngineFactory -> SpringEngine`.
- Trigger generation after successful GraphQL manifest save, following the same save -> engine pattern already used by DTOs, controllers, and models.
- Ensure `window.graphql` completes persistence before `window.engine.createGraphqlSchema(...)` is called.
- If needed, introduce a dedicated engine method for schema generation instead of reusing `window.graphql`.

## 2. Define Schema Operation Translation

Translate manifest operations into GraphQL schema operation blocks.

Tasks:

- Add query operations to `type Query`.
- Add mutation operations to `type Mutation`.
- Add subscription operations to `type Subscription`.
- Skip empty operation blocks only when the target GraphQL runtime allows it.
- Preserve operation names from manifest `name`.

## 3. Define Argument Translation

Translate manifest arguments into GraphQL schema arguments.

Tasks:

- Map argument `name` to GraphQL argument name.
- Map argument `type` to GraphQL type syntax.
- Apply non-null marker when `required` is true.
- Ignore UI-only metadata that is not part of schema syntax.

## 4. Define Return Type Translation

Translate `returnType` and `returnMode`.

Tasks:

- Use `returnType` as the GraphQL output type name.
- Translate `returnMode: "single"` into a single output type.
- Translate `returnMode: "list"` into a list output type.
- Apply nullability rules only when explicitly defined by the manifest or future specs.

## 5. Define Mutation Input Translation

Translate mutation input usage.

Tasks:

- Use `inputType` as the main mutation input reference.
- Use the reserved mutation argument name `input` for `inputType`.
- Preserve additional mutation `args` only when the manifest explicitly contains them.

## 6. Define Resolver Stub Generation

Generate resolver classes or files aligned with the Spring Boot backend target.

Tasks:

- Generate Query resolver stubs for query operations.
- Generate Mutation resolver stubs for mutation operations.
- Generate Subscription resolver stubs for subscription operations.
- Match method names and argument lists to schema operations.
- Include clear extension points without overwriting developer-owned logic unexpectedly.

Phase 4.1 does not implement this step. Resolver generation remains deferred until after schema-only generation is complete and validated.

## 7. Define Output Safety

Define how generated files are written.

Tasks:

- Avoid partial generation on invalid manifest.
- Report generator errors with field or operation context.
- Preserve existing REST generation output.
- Write only to controlled GraphQL output locations.
- Do not silently overwrite developer-written code.
- Prefer safe generation through new files, controlled stubs, or explicit overwrite behavior.

## 8. Define Phase 4.1 Minimal Scope

Keep the first implementation step limited to schema generation.

Tasks:

- Generate `schema.graphqls` only.
- Do not generate resolver files.
- Do not generate service files.
- Do not generate controller files.
- Do not implement runtime integration.
- If `@igrp/igrp-studio-springboot-engine` lacks GraphQL support, implement schema-only generation locally in Horizon behind `SpringEngine`.
