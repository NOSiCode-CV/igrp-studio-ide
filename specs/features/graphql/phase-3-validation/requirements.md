# Phase 3: GraphQL Advanced Validation Requirements

## Objective

Define advanced validation for GraphQL manifests by checking operation consistency against module artifacts such as DTOs, schemas, GraphQL type definitions, and supported scalars.

Phase 3 strengthens the Phase 1 contract before generator consumption.

Terminology:

- GraphQL schema file means generated `schema.graphqls`.
- iGRP schema/model means an existing module data artifact.
- DTO means an existing transport structure in the API Designer.
- GraphQL types/inputs mean GraphQL-level constructs.

## Scope

### Type Reference Validation

Validation must verify references stored as names:

- `returnType`
- `inputType`
- argument `type`

References may resolve to:

- supported GraphQL scalars
- module DTOs
- module schemas/models
- GraphQL types or inputs introduced by future specs

### Operation Validation

Validation must enforce operation-specific rules:

- Query requires a resolvable `returnType`.
- Mutation requires resolvable `inputType` and `returnType`.
- Subscription requires resolvable `returnType` and non-empty `eventTopic`.
- Argument names must be unique within the operation.
- Operation names must be unique within the manifest.
- Operation IDs must be unique and stable.
- Mutation custom arguments must not use the reserved name `input`.

### Cross-Field Validation

Validation must check relationships between fields:

- `operationType` controls required fields.
- `returnMode` controls only cardinality, not type existence.
- `inputType` must not be required for Query or Subscription.
- `eventTopic` must not be required for Query or Mutation.
- Arguments must use valid type references.

### Integration Points

Validation must be able to read or receive module artifact metadata needed to resolve references without coupling the manifest contract to UI state.

## Out of Scope

- UI rendering
- Generator output
- Runtime GraphQL execution
- Authorization behavior
- Complex nested write validation
- GraphQL federation, interfaces, and unions

## Constraints

- Validation must respect the Phase 1 manifest path and shape.
- Validation must produce structured errors with target field, message, and code or category.
- Validation must run before persistence and before generator execution.
- Validation must not mutate valid manifest content except for explicitly defined normalization steps.
- Validation must not introduce REST concepts.
