# Phase 3: GraphQL Advanced Validation

## Automated Validation

Automated validation succeeds when a manifest can be checked against module artifact metadata before persistence or generation.

Checks:

- Valid scalar references are accepted.
- Valid DTO, schema, model, or GraphQL type references are accepted when present in module metadata.
- Unknown `returnType` values are rejected.
- Unknown mutation `inputType` values are rejected.
- Unknown argument `type` values are rejected.
- Mutation custom argument name `input` is rejected as reserved.
- Duplicate operation IDs are rejected.
- Duplicate operation names are rejected.
- Duplicate argument names are rejected per operation.
- Invalid cross-field combinations are rejected.
- Validation errors include `field`, `message`, and `code`.

Expected result:

- A valid manifest passes with no errors.
- An invalid manifest returns structured errors and is not persisted or generated.

## Manual Validation

### Validate Known Return Type

Use an operation with a `returnType` that exists in module DTO or schema metadata.

Expected result:

- Validation accepts the operation.

### Reject Unknown Return Type

Use an operation with `returnType: "MissingType"`.

Expected result:

- Validation rejects the operation with an `unknown_type` style error.

### Validate Mutation Input Type

Use a mutation with an `inputType` that exists in module DTO or input metadata.

Expected result:

- Validation accepts the mutation.

### Reject Mutation With Unknown Input Type

Use a mutation with an unknown `inputType`.

Expected result:

- Validation rejects the mutation and identifies `inputType`.

### Validate Argument Types

Use arguments with supported scalar and module artifact types.

Expected result:

- Validation accepts supported argument types and rejects unknown types.

### Validate Cross-Field Rules

Use a subscription without `eventTopic` and a mutation without `inputType`.

Expected result:

- Validation rejects both operations with field-specific structured errors.
