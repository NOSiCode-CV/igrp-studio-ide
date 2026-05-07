# Phase 1: GraphQL Manifest Plan

## 1. Define GraphQL Manifest Structure

Define the top-level JSON contract for a module GraphQL manifest.

Implementation-ready decisions:

- Use `type: "graphql"` to identify the artifact.
- Use `version` to allow future manifest migrations.
- Use `module` to bind the manifest to one iGRP module.
- Use `operations` as the initial collection of GraphQL operations.

Expected top-level fields:

- `type`
- `version`
- `module`
- `operations`

## 2. Define Operation Model

Define a shared operation model for Query, Mutation, and Subscription.

Implementation-ready decisions:

- Use `id` as the required technical identifier for persisted operations.
- Generate `id` in the Main service/persistence layer and keep it stable when `name` changes.
- Use `operationType` with values `query`, `mutation`, and `subscription`.
- Use one operations array instead of separate arrays to keep ordering, validation, and persistence simple.
- Require `name`, `returnType`, and `returnMode` for all operations.
- Require `inputType` only for mutations.
- Require `eventTopic` only for subscriptions.

Expected operation fields:

- `id`
- `operationType`
- `name`
- `comment`
- `args`
- `inputType`
- `returnType`
- `returnMode`
- `eventTopic`

## 3. Define Argument Structure

Define a reusable argument model for all operation types.

Implementation-ready decisions:

- Use `name` for the GraphQL argument name.
- Use `type` for scalar, DTO, schema, or future GraphQL type reference.
- Use `required` to represent GraphQL non-null intent.
- Allow `defaultValue` and `description` as optional metadata.

Expected argument fields:

- `name`
- `type`
- `required`
- `defaultValue`
- `description`

## 4. Define Input and Return Type References

Define type references as names, not embedded type definitions.

Implementation-ready decisions:

- `returnType` stores the output type reference as a name.
- `inputType` stores the mutation input type reference as a name.
- Argument `type` stores the parameter type reference as a name.
- Scalar references use GraphQL scalar names.
- Full resolution against DTOs, schemas, GraphQL types, or scalars belongs to Phase 3 validation and integration flows.
- Phase 1 defines the manifest contract and base persistence expectations only.
- Relations in input should prefer ID-based fields in V1.

Supported V1 scalar references:

- `ID`
- `String`
- `Int`
- `Float`
- `Boolean`

Supported return modes:

- `single`
- `list`

`returnMode` is a UI-level abstraction. Future generator work will translate it into GraphQL single or list output types.

## 5. Define File Location

Define and freeze a module-owned storage location for the manifest.

Implementation-ready decision:

```txt
igrpstudio/<module>/graphql/graphql.json
```

Persistence expectations:

- Create the `graphql` folder when missing.
- Create `graphql.json` when the module first receives GraphQL configuration.
- Read and write only the manifest for the selected module.
- Do not store cross-module GraphQL operations in one manifest.

## 6. Define CRUD Operations

Define the persistence operations required by future Renderer, Preload, and Main integration.

Required operations:

- Create manifest for a module when it does not exist.
- Read manifest by module.
- List operations by module.
- Add operation to module manifest.
- Update operation by `id`.
- Delete operation by `id`.
- Replace manifest after validation.

Contract expectations:

- All writes run Phase 1 structural validation before persistence.
- Persistence only happens after successful validation.
- Failed validation must not partially write the manifest.
- Operation deletion must affect only the selected module.
- Operation updates must preserve unrelated operations.
- Renaming an operation must not change its `id`.
- `name` must not be used as the only technical identifier for update or delete.

## 7. Define Validation Rules

Define base validation rules for manifest persistence.

Manifest validation:

- `type` must be `graphql`.
- `module` must be present and match the target module context.
- `operations` must be an array.

Operation validation:

- `id` must be present for persisted operations.
- `id` must be unique within the manifest.
- `operationType` must be lowercase and one of `query`, `mutation`, or `subscription`.
- `name` must be present.
- operation names must be unique within the manifest.
- `returnType` must be present and syntactically valid.
- `returnMode` must be `single` or `list`.
- mutation operations must include `inputType`.
- subscription operations must include `eventTopic`.

Argument validation:

- argument `name` must be present.
- argument `type` must be present and syntactically valid.
- argument names must be unique within the operation.
- `required` must be boolean.

Forbidden fields:

- HTTP status code
- REST headers
- content type
- REST request body

Validation error shape:

- `field`: target field or path.
- `message`: human-readable reason.
- `code`: concise error code or category.
