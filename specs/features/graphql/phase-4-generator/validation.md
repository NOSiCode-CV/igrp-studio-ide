# Phase 4: GraphQL Generator Validation

## Automated Validation

Automated validation succeeds when a validated manifest can generate deterministic GraphQL backend artifacts.

Checks:

- Generator reads `.igrpstudio/<module>/graphql/graphql.json`.
- Query operations are emitted under `type Query`.
- Mutation operations are emitted under `type Mutation`.
- Subscription operations are emitted under `type Subscription`.
- Arguments are rendered with correct names, types, and required markers.
- `returnMode: "single"` generates a single output type.
- `returnMode: "list"` generates a list output type.
- Mutation `inputType` is represented in generated mutation schema.
- Mutation `inputType` uses the reserved generated argument name `input`.
- Invalid manifests do not produce partial output.
- Phase 4.1 generation is triggered through the engine flow, not through `window.graphql`.
- Phase 4.1 generation runs only after GraphQL manifest persistence succeeds.

Expected result:

- Generated schema matches the manifest.
- Generator output is deterministic for the same manifest.

## Manual Validation

### Generate Query Schema

Use a manifest with one query operation.

Expected result:

- `schema.graphqls` contains the operation under `type Query`.

### Generate Mutation Schema

Use a manifest with one mutation operation and an `inputType`.

Expected result:

- `schema.graphqls` contains the operation under `type Mutation`.

### Generate Subscription Schema

Use a manifest with one subscription operation and `eventTopic`.

Expected result:

- `schema.graphqls` contains the operation under `type Subscription`.

### Validate Return Mode Translation

Generate from one single-return operation and one list-return operation.

Expected result:

- Single operation renders a single output type.
- List operation renders a GraphQL list output type.

### Reject Invalid Manifest Generation

Attempt generation with unresolved type references.

Expected result:

- Generation stops before writing partial artifacts.
- Errors identify the invalid operation or field.

### Confirm Phase 4.1 Scope

Trigger GraphQL generation through the engine path after a valid manifest is available.

Expected result:

- `schema.graphqls` is generated.
- No resolver files are generated.
- No service files are generated.
- No controller files are generated.
- The manifest is saved before schema generation is triggered.
