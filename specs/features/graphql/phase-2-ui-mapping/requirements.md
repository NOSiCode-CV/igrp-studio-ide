# Phase 2: GraphQL UI Mapping Requirements

## Objective

Define how the GraphQL Designer UI maps user interactions into the Phase 1 module manifest without generating code or executing GraphQL operations.

The UI must behave as a declarative editor for `igrpstudio/<module>/graphql/graphql.json`.

## Scope

### Designer Entry Points

GraphQL must appear inside the existing API Designer module context, alongside current API artifacts such as endpoints, contracts, schemas, DTOs, models, and enums.

The UI must support:

- GraphQL overview for a selected module
- Query operation editor
- Mutation operation editor
- Subscription operation editor
- Tab-based editing model consistent with existing Studio editing patterns

### UI to Manifest Mapping

The UI must map fields to the Phase 1 operation contract:

- operation technical identifier -> `id`
- operation kind -> `operationType`
- operation name -> `name`
- description/comment field -> `comment`
- parameter rows -> `args`
- mutation input selector -> `inputType`
- return type selector -> `returnType`
- return cardinality selector -> `returnMode`
- subscription topic field -> `eventTopic`

The UI must preserve existing `id` values when editing operations. The UI must not generate `id`; new operation IDs are assigned by the Main service/persistence layer and are not part of editable form state.

### Field Visibility Rules

The UI must expose fields according to operation type:

- Query: `name`, `comment`, `args`, `returnType`, `returnMode`
- Mutation: `name`, `comment`, `args`, `inputType`, `returnType`, `returnMode`
- Subscription: `name`, `comment`, `args`, `returnType`, `returnMode`, `eventTopic`

Fields not valid for the selected operation type must not be persisted as empty REST-like or irrelevant properties.

### Input Sanitization

Before persistence, UI-originated values must be normalized into the manifest shape. Phase 2 performs sanitization and UI-level constraints only; canonical validation belongs to Phase 1 and Phase 3.

- trim operation names and argument names
- preserve lowercase `operationType`
- preserve only supported `returnMode` values
- remove transient UI-only state
- remove fields that are not part of the manifest contract

## Out of Scope

- Manifest storage contract already defined in Phase 1
- Advanced type validation beyond basic selection constraints
- Generator invocation
- Schema or resolver generation
- Backend execution
- Runtime GraphQL testing

## Constraints

- The UI edits the manifest; it does not generate backend code.
- The Phase 1 manifest remains the source of truth.
- The UI must not introduce REST concepts into GraphQL modeling.
- The UI must preserve operation `id` across rename and edit flows.
- The UI must fit the existing API Designer interaction style and avoid a parallel GraphQL-only application shell.
