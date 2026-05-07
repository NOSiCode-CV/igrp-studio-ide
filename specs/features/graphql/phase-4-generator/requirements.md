# Phase 4: GraphQL Generator Requirements

## Objective

Define how the generator consumes a validated module GraphQL manifest and produces backend GraphQL artifacts for the Spring Boot target.

The generator must follow the existing iGRP engine/generator pattern and must not depend on Renderer UI state.

## Scope

### Manifest Consumption

The generator must read:

```txt
.igrpstudio/<module>/graphql/graphql.json
```

Phase 4 assumes the manifest has already passed structural and reference validation. Phase 5 defines when validation is triggered before generation.

### Generation Flow

GraphQL generation must use the existing backend engine flow:

```txt
Renderer -> window.engine -> preload -> api-handler -> EngineFactory -> SpringEngine
```

`window.graphql` remains responsible only for GraphQL manifest CRUD and persistence. It must not be used for backend generation.

### Generation Trigger

Phase 4.1 follows the existing Studio backend artifact pattern.

For backend artifacts such as DTOs, controllers, and models, the Studio triggers engine generation after a successful save operation. GraphQL schema generation must follow the same pattern.

GraphQL schema generation must run only after GraphQL manifest persistence succeeds.

This is not a new generation pattern. It reuses the established Studio save -> engine flow.

If needed, a dedicated engine method may be introduced for this purpose, such as:

```txt
window.engine.createGraphqlSchema(config, ENV_TYPES.SPRING, basePath)
```

`window.graphql` remains responsible only for GraphQL manifest CRUD and persistence. `window.engine.createGraphqlSchema(...)` must be called only after persistence succeeds.

### Generated Artifacts

The generator must produce backend GraphQL artifacts including:

- `schema.graphqls`
- Query resolver stubs
- Mutation resolver stubs
- Subscription resolver stubs

For Phase 4.1, the scope is limited to generating `schema.graphqls` only.

### Schema Generation

The generator must translate manifest operations into GraphQL schema definitions:

- Query operations under `type Query`
- Mutation operations under `type Mutation`
- Subscription operations under `type Subscription`
- operation arguments into GraphQL argument syntax
- `returnType` and `returnMode` into output type syntax
- mutation `inputType` into mutation argument usage

### Resolver Generation

The generator must create resolver stubs matching generated schema operations.

Resolver methods must be predictable, compilable where possible, and safe for developers to complete manually.

## Out of Scope

- Renderer UI
- Manifest editing
- Advanced runtime business logic
- Database query implementation
- Authorization policy generation
- Federation
- Complex nested writes
- Resolver generation in Phase 4.1
- Service generation in Phase 4.1
- Controller generation in Phase 4.1
- Runtime GraphQL integration in Phase 4.1

## Constraints

- Generation must be driven by JSON manifest content.
- The generator must not infer operations from UI-only state.
- `returnMode` must translate to single or list GraphQL output.
- Resolver generation must preserve extension points for developer code.
- The generator creates files in controlled output locations and must not silently overwrite developer-written code.
- Safe generation is preferred through new files, controlled stubs, or explicit overwrite behavior.
- GraphQL generation must not modify REST endpoint generation behavior.
- Generator failures must report structured, actionable errors.
- Phase 4.1 must generate schema only and must not create resolver, service, or controller files.
- If `@igrp/igrp-studio-springboot-engine` does not provide GraphQL support, Phase 4.1 may implement schema-only generation locally in Horizon, but only behind `SpringEngine` and the existing engine flow.
