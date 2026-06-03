# Phase 3: GraphQL Advanced Validation Plan

## 1. Define Validation Inputs

Define the data required to validate one module manifest.

Tasks:

- Load or receive the module GraphQL manifest.
- Load or receive module DTO metadata.
- Load or receive module schema/model metadata.
- Load supported GraphQL scalar definitions.
- Prepare future extension points for GraphQL type and input metadata.

## 2. Define Type Registry

Define a validation-time registry of resolvable type names.

Tasks:

- Register GraphQL scalars: `ID`, `String`, `Int`, `Float`, `Boolean`.
- Register available DTO names.
- Register available schema/model names.
- Register future GraphQL type/input names when present.
- Detect duplicate or ambiguous type names if they would make generation unsafe.

## 3. Validate Manifest Identity

Validate module ownership and manifest identity.

Tasks:

- Confirm `type: "graphql"`.
- Confirm manifest `module` matches the selected module.
- Confirm `operations` is an array.
- Reject cross-module operation storage.

## 4. Validate Operation Identity

Validate stable operation identifiers and user-facing names.

Tasks:

- Require `id` for persisted operations.
- Require unique `id` values within the manifest.
- Require operation `name`.
- Require unique operation names within the manifest.
- Confirm update and delete flows target `id`, not `name`.

## 5. Validate Operation Type Rules

Validate fields based on `operationType`.

Tasks:

- Accept only lowercase `query`, `mutation`, and `subscription`.
- Require `returnType` and `returnMode` for every operation.
- Require `inputType` for mutation.
- Require `eventTopic` for subscription.
- Reject unsupported REST-only fields.

## 6. Validate Type References

Validate that stored type names can be resolved.

Tasks:

- Resolve every `returnType`.
- Resolve mutation `inputType`.
- Resolve every argument `type`.
- Return structured errors for unknown types.
- Reject mutation custom arguments named `input`, which is reserved for the generated mutation input argument.
- Keep relation input rules V1-friendly by preferring ID-style references for input relationships.

## 7. Validate Arguments

Validate each operation argument list.

Tasks:

- Require argument `name`.
- Require argument `type`.
- Require boolean `required`.
- Reject duplicate argument names within one operation.
- Validate optional `defaultValue` against scalar type when possible.

## 8. Define Error Reporting

Define minimal structured validation errors.

Tasks:

- Include `field` with a field path such as `operations[0].returnType`.
- Include `message` with a concise reason.
- Include `code` with a stable category such as `missing_field`, `duplicate_name`, or `unknown_type`.
- Return all actionable validation errors where possible.
