# Phase 6: GraphQL Improvements Validation

## Automated Validation

Automated validation succeeds when post-V1 enhancements preserve the manifest-driven architecture.

Checks:

- Existing V1 manifests remain valid.
- Schema preview is derived from manifest data.
- Duplicate operation flow creates a new unique `id`.
- Type modeling enhancements do not break existing DTO or schema references.
- Nested input features are rejected unless explicitly enabled and valid.
- Large manifests remain responsive under defined performance thresholds.
- Manifest migrations preserve existing operation IDs and names.

Expected result:

- Enhancements improve authoring without breaking V1 GraphQL behavior.
- Backward compatibility is maintained or explicitly migrated.

## Manual Validation

### Preview Schema

Open schema preview for a valid manifest.

Expected result:

- Preview shows Query, Mutation, and Subscription schema derived from the manifest.
- Preview does not modify `graphql.json`.

### Duplicate Operation

Duplicate an existing operation.

Expected result:

- New operation has a new unique `id`.
- User-facing name is adjusted to avoid duplicate-name validation errors.

### Use Better Type Modeling

Create or map a GraphQL type from an existing DTO or schema.

Expected result:

- Mapping remains visible in the manifest or future compatible manifest extension.
- Generator can still resolve the referenced type.

### Configure Advanced Subscription

Add optional subscription metadata beyond `eventTopic`.

Expected result:

- Metadata is validated.
- Existing minimal subscription manifests still work.

### Test Nested Input Guardrails

Attempt to configure a nested input beyond allowed rules.

Expected result:

- Validation blocks unsupported nested input structures.
- Relation ID input remains available as the default path.
