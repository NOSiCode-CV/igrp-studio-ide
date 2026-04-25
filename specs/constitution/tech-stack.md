# GraphQL Constitution Tech Stack

## Architecture Layers

### Renderer

The Renderer is the React-based visual layer of iGRP Studio. For GraphQL, it is responsible for forms, navigation, operation editors, overview screens, validation feedback, and mapping user edits into a JSON manifest shape.

The Renderer must not generate backend GraphQL code directly.

### Preload

The Preload layer is the secure bridge between Renderer and Main. GraphQL-related capabilities exposed to the UI must follow the existing bridge pattern and only expose controlled operations needed for reading, saving, validating, or triggering generation.

The Preload layer must not contain business logic. It should only expose controlled APIs for manifest manipulation and generation triggers.

### Main

The Main process owns Electron-side handlers, IO, persistence, service orchestration, and generator integration. GraphQL persistence and generation requests should align with existing handler, service, and engine patterns.

## Core Principles

- GraphQL configuration is JSON-based.
- The JSON manifest is the source of truth.
- Code creation is generator-driven.
- The UI edits declarations; it does not own generated output.
- Existing iGRP systems should be reused where appropriate, including modules, DTOs, schemas, API generator flows, and engine abstractions.
- GraphQL must fit inside the API Designer instead of introducing a parallel design environment.

The GraphQL manifest is stored per module, following a structure such as:
`igrpstudio/<module>/graphql/graphql.json`


## Backend Generation

The generator must consume the GraphQL manifest and produce backend artifacts aligned with the target backend stack.

For the Spring Boot backend, expected generated artifacts include:

- GraphQL schema files, such as `schema.graphqls`
- Query resolver stubs
- Mutation resolver stubs
- Subscription resolver stubs

Generated code should provide a functional starting point while preserving clear extension points for developers.

The engine/generator is the single responsible component for transforming the GraphQL manifest into executable backend code.
No other layer should implement code generation logic.


## Modeling Constraints

GraphQL modeling must not include REST-specific concepts such as:

- HTTP status codes
- REST headers
- content types
- REST request bodies

GraphQL operations must use GraphQL semantics:

- Query for reads
- Mutation for writes
- Subscription for event streams
- Arguments for operation parameters
- Input types for complex mutation input
- Return types and return modes for output modeling

Return types define the output structure. Return modes (single or list) are a UI-level abstraction that must be translated into GraphQL list or single types by the generator.


## V1 Constraints

Version 1 must remain simple and predictable.

- Support Query, Mutation, and minimal Subscription design.
- Require return types for operations.
- Require input types for mutations when complex input is needed.
- Require event topics for subscriptions.
- Enforce unique operation names.
- Prevent duplicate argument names.
- Prefer relation IDs in inputs for V1.
- Avoid complex nested writes in the first version.

## Architectural Constraints

GraphQL must not create a parallel architecture. It must align with existing Renderer, Preload, Main, persistence, validation, and generator logic.

Any new GraphQL-specific code should be introduced only where the existing abstraction requires a GraphQL-specific extension.
