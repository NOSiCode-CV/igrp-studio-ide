# Phase 5: GraphQL Integration Validation

## Automated Validation

Automated validation succeeds when the complete GraphQL pipeline works without breaking existing API Designer behavior.

Checks:

- UI-mapped operation data persists to the module manifest path.
- Saved manifest reloads with stable operation IDs.
- Validation runs before save and before generation.
- Invalid manifests block persistence or generation as specified.
- Valid manifests trigger GraphQL generator output.
- Existing REST generation tests continue to pass.
- Modules without GraphQL manifests are unaffected.

Expected result:

- The full flow produces GraphQL backend artifacts only from valid manifest data.
- Existing API Designer flows remain compatible.

## Manual Validation

### Full Query Flow

Create a query in the GraphQL Designer, save it, validate it, and generate backend code.

Expected result:

- `graphql.json` is saved under the module path.
- `schema.graphqls` includes the query.
- Query resolver stub is generated.

### Full Mutation Flow

Create a mutation with input type and return type.

Expected result:

- Manifest validation passes.
- Generated schema includes the mutation.
- Mutation resolver stub is generated.

### Full Subscription Flow

Create a subscription with event topic and return type.

Expected result:

- Manifest validation passes.
- Generated schema includes the subscription.
- Subscription resolver stub is generated.

### Existing REST Compatibility

Generate an existing REST API module without GraphQL.

Expected result:

- REST output remains unchanged.
- No GraphQL files are generated unless a valid GraphQL manifest exists.

### Invalid Manifest Blocking

Use a manifest with an unknown `returnType`.

Expected result:

- Validation fails.
- Generator is not invoked for GraphQL.
- Error points to the invalid field.
