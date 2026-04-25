# GraphQL Constitution Mission

## Purpose

GraphQL in iGRP Studio Horizon extends the existing API Generator with a low-code way to design GraphQL APIs visually and generate backend artifacts from declarative configuration.

The goal is not to create a separate GraphQL product inside the Studio. GraphQL must become part of the existing API design experience, aligned with modules, DTOs, schemas, persistence patterns, and generation workflows already used by the platform.

## Product Direction

The GraphQL Designer follows the iGRP low-code philosophy:

```txt
UI -> JSON Manifest -> Generator/Engine -> Backend Code
```

The Renderer provides the visual editing experience. It does not generate backend code directly. The saved JSON manifest is the source of truth, and the generator consumes that manifest to produce functional GraphQL backend artifacts.

## Source of Truth

The GraphQL manifest defines the contract between the Studio and the generator. It must describe the module-level GraphQL design, including types, inputs, operations, arguments, return types, return modes, and subscription topics.

Future agents, specs, and implementations must treat the JSON manifest as authoritative. UI state, generated files, and previews must be derived from or synchronized with this manifest.

## Integration

GraphQL must integrate with the existing iGRP API Designer instead of duplicating it. It should reuse established concepts such as modules, DTOs, schemas, validation flows, and engine integration where they fit the GraphQL model.

GraphQL types may resemble output DTOs, and GraphQL inputs may resemble input DTOs, but GraphQL semantics must remain explicit and must not be reduced to REST DTO copying.

## Relationship With REST

GraphQL complements REST in iGRP Studio. It does not replace existing REST endpoints, controllers, DTOs, or API generation flows.

The platform should allow teams to choose REST, GraphQL, or both based on application needs. GraphQL is introduced to support flexible, efficient data access for modern frontends and integrations, reducing overfetching and underfetching while preserving the existing REST capabilities.

## Non-Goals

- This feature does not aim to replace REST APIs.
- This feature does not introduce a standalone GraphQL editor disconnected from the iGRP architecture.
- This feature does not support advanced GraphQL features (e.g., federation, complex nested mutations) in the first version.
- This feature does not generate business logic automatically; it generates structure and extension points.